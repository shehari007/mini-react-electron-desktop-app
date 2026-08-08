import { app, BrowserWindow, Menu, protocol, ipcMain, shell, nativeTheme, net } from 'electron';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { buildMenu } from './menu';
import { MIME_TYPES, DEFAULT_MIME } from './mime';

const isDev = process.env.NODE_ENV === 'development';
const DEV_URL = 'http://localhost:3000';

/** Custom scheme for the packaged renderer. Registering a real scheme (rather
 *  than loading index.html over file://) gives the app a stable origin, which is
 *  what makes localStorage, history.pushState and fetch behave the same in the
 *  desktop build as they do on the web. */
const SCHEME = 'app';
const HOST = 'appbox';
const APP_ORIGIN = `${SCHEME}://${HOST}`;

/** Root of the Next.js static export (`next build` → `out/`). */
const STATIC_ROOT = path.join(app.getAppPath(), 'out');

let mainWindow: BrowserWindow | null = null;

// ─── Window state persistence ─────────────────────────────────────────────

interface WindowState {
  width: number;
  height: number;
  x?: number;
  y?: number;
  maximized: boolean;
}

const DEFAULT_STATE: WindowState = { width: 1360, height: 860, maximized: false };
const statePath = () => path.join(app.getPath('userData'), 'window-state.json');

async function loadWindowState(): Promise<WindowState> {
  try {
    const raw = await readFile(statePath(), 'utf8');
    const parsed = JSON.parse(raw) as Partial<WindowState>;
    return {
      width: typeof parsed.width === 'number' ? Math.max(parsed.width, 640) : DEFAULT_STATE.width,
      height: typeof parsed.height === 'number' ? Math.max(parsed.height, 520) : DEFAULT_STATE.height,
      x: typeof parsed.x === 'number' ? parsed.x : undefined,
      y: typeof parsed.y === 'number' ? parsed.y : undefined,
      maximized: parsed.maximized === true,
    };
  } catch {
    // First run, or a corrupted file — either way the defaults are correct.
    return DEFAULT_STATE;
  }
}

async function saveWindowState(win: BrowserWindow): Promise<void> {
  if (win.isDestroyed()) return;
  // getNormalBounds() reports the pre-maximize size, so restoring an
  // un-maximized window doesn't leave it filling the screen.
  const bounds = win.getNormalBounds();
  const state: WindowState = { ...bounds, maximized: win.isMaximized() };
  try {
    await mkdir(path.dirname(statePath()), { recursive: true });
    await writeFile(statePath(), JSON.stringify(state, null, 2), 'utf8');
  } catch {
    // Losing window geometry is not worth surfacing to the user.
  }
}

// ─── Static file protocol ─────────────────────────────────────────────────

protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

/**
 * Resolve a request pathname to a file inside the static export, mirroring how
 * a static host would serve the `trailingSlash: true` output:
 *
 *   /                     → out/index.html
 *   /calculator/          → out/calculator/index.html
 *   /calculator           → out/calculator/index.html
 *   /_next/static/x.css   → out/_next/static/x.css
 *
 * Returns null when the resolved path escapes the export root, which is the
 * path-traversal guard: `..` segments can only ever resolve outside STATIC_ROOT.
 */
function resolveStaticPath(pathname: string): string | null {
  const decoded = decodeURIComponent(pathname);
  const relative = decoded.replace(/^\/+/, '');

  let candidate = path.join(STATIC_ROOT, relative);

  const looksLikeFile = path.extname(candidate) !== '';
  if (!looksLikeFile || decoded.endsWith('/')) {
    candidate = path.join(candidate, 'index.html');
  }

  const normalized = path.normalize(candidate);
  const rootWithSep = STATIC_ROOT.endsWith(path.sep) ? STATIC_ROOT : STATIC_ROOT + path.sep;
  if (!normalized.startsWith(rootWithSep)) return null;

  return normalized;
}

/**
 * Next's static export inlines its hydration payload as <script> tags, and
 * there is no way to attach a nonce without a server — so 'unsafe-inline' is
 * required for scripts here. Everything else stays locked down: no remote
 * scripts, and network access limited to the two HTTPS APIs the app calls.
 */
const CSP = [
  "default-src 'self' " + APP_ORIGIN,
  "script-src 'self' 'unsafe-inline' " + APP_ORIGIN,
  "style-src 'self' 'unsafe-inline' " + APP_ORIGIN,
  "img-src 'self' data: blob: " + APP_ORIGIN,
  "font-src 'self' data: " + APP_ORIGIN,
  "media-src 'self' data: blob: " + APP_ORIGIN,
  "connect-src 'self' " + APP_ORIGIN + ' https://api.open-meteo.com https://geocoding-api.open-meteo.com https://open.er-api.com',
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');

function registerStaticProtocol(): void {
  protocol.handle(SCHEME, async (request) => {
    const url = new URL(request.url);

    const filePath = resolveStaticPath(url.pathname);
    if (!filePath) {
      return new Response('Forbidden', { status: 403, headers: { 'content-type': 'text/plain' } });
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] ?? DEFAULT_MIME;
    const isDocument = ext === '.html';

    const headers: Record<string, string> = { 'content-type': mime };
    if (isDocument) {
      headers['content-security-policy'] = CSP;
    } else if (filePath.includes(`${path.sep}_next${path.sep}static${path.sep}`)) {
      // Next fingerprints these filenames, so they are safe to cache forever.
      headers['cache-control'] = 'public, max-age=31536000, immutable';
    }

    try {
      // net.fetch streams the file rather than buffering it, which matters for
      // the larger chunks (mathjs, fonts) and for range requests on audio.
      const response = await net.fetch(pathToFileURL(filePath).toString());
      if (!response.ok) throw new Error(`status ${response.status}`);
      return new Response(response.body, { status: 200, headers });
    } catch {
      // Unknown route: serve Next's exported 404 page so the app shell (and its
      // "back to home" link) still renders instead of a blank Chromium error.
      if (isDocument) {
        try {
          const notFound = await readFile(path.join(STATIC_ROOT, '404.html'));
          return new Response(notFound, {
            status: 404,
            headers: { 'content-type': 'text/html', 'content-security-policy': CSP },
          });
        } catch {
          /* fall through */
        }
      }
      return new Response('Not Found', { status: 404, headers: { 'content-type': 'text/plain' } });
    }
  });
}

// ─── Window ───────────────────────────────────────────────────────────────

async function createWindow(): Promise<void> {
  const state = await loadWindowState();

  mainWindow = new BrowserWindow({
    width: state.width,
    height: state.height,
    x: state.x,
    y: state.y,
    minWidth: 640,
    minHeight: 520,
    show: false,
    // Only needed while developing: a packaged build takes its window and
    // taskbar icon from the executable that electron-builder stamps. Without
    // this, `npm run electron:dev` shows the default Electron icon.
    icon: app.isPackaged ? undefined : path.join(__dirname, '..', 'build', 'icon.png'),
    // A frameless window on Windows/Linux lets the app draw its own title bar;
    // macOS keeps its native traffic lights, inset over our header.
    frame: process.platform === 'darwin',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: process.platform === 'darwin' ? { x: 16, y: 18 } : undefined,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1c1d22' : '#fafafb',
    // Paint the frame only once the renderer has content, avoiding the white
    // flash that the old splash-screen window existed to hide.
    paintWhenInitiallyHidden: true,
    autoHideMenuBar: process.platform !== 'darwin',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // The three settings that matter: the renderer gets no Node, no direct
      // access to our main-world globals, and runs inside the OS sandbox. All
      // privileged work goes through the narrow IPC surface in preload.ts.
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      spellcheck: true,
    },
  });

  Menu.setApplicationMenu(buildMenu(mainWindow, { isDev }));

  if (isDev) {
    await mainWindow.loadURL(DEV_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    await mainWindow.loadURL(`${APP_ORIGIN}/`);
  }

  mainWindow.once('ready-to-show', () => {
    if (!mainWindow) return;
    if (state.maximized) mainWindow.maximize();
    mainWindow.show();
  });

  // Keep the renderer's window controls in sync with the real window state,
  // including changes it didn't initiate (double-click on the title bar, OS
  // snap shortcuts, the native menu).
  const emitState = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.webContents.send('window:state', {
      maximized: mainWindow.isMaximized(),
      fullScreen: mainWindow.isFullScreen(),
    });
  };
  // Registered one by one rather than in a loop: BrowserWindow.on is a set of
  // per-event overloads, so a union of event names has no matching signature.
  mainWindow.on('maximize', emitState);
  mainWindow.on('unmaximize', emitState);
  mainWindow.on('enter-full-screen', emitState);
  mainWindow.on('leave-full-screen', emitState);

  let saveTimer: NodeJS.Timeout | undefined;
  const queueSave = () => {
    if (!mainWindow) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => mainWindow && void saveWindowState(mainWindow), 400);
  };
  mainWindow.on('resize', queueSave);
  mainWindow.on('move', queueSave);

  mainWindow.on('close', () => {
    clearTimeout(saveTimer);
    if (mainWindow) void saveWindowState(mainWindow);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  nativeTheme.on('updated', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.setBackgroundColor(nativeTheme.shouldUseDarkColors ? '#1c1d22' : '#fafafb');
  });
}

// ─── IPC ──────────────────────────────────────────────────────────────────

/** Only ever hand a URL to the OS if it's a scheme we intend to support. */
function isSafeExternalUrl(value: string): boolean {
  try {
    const { protocol: p } = new URL(value);
    return p === 'https:' || p === 'http:' || p === 'mailto:';
  } catch {
    return false;
  }
}

function registerIpc(): void {
  // `sender` is used instead of the captured mainWindow so a message can only
  // ever act on the window that sent it.
  const senderWindow = (event: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent) =>
    BrowserWindow.fromWebContents(event.sender);

  ipcMain.on('window:minimize', (event) => senderWindow(event)?.minimize());

  ipcMain.on('window:toggle-maximize', (event) => {
    const win = senderWindow(event);
    if (!win) return;
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  });

  ipcMain.on('window:close', (event) => senderWindow(event)?.close());

  ipcMain.handle('window:is-maximized', (event) => senderWindow(event)?.isMaximized() ?? false);

  ipcMain.handle('app:info', () => ({
    version: app.getVersion(),
    platform: process.platform,
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  }));

  ipcMain.handle('shell:open-external', async (_event, url: unknown) => {
    if (typeof url !== 'string' || !isSafeExternalUrl(url)) return false;
    await shell.openExternal(url);
    return true;
  });
}

// ─── Lifecycle ────────────────────────────────────────────────────────────

// A second launch focuses the existing window rather than opening a duplicate.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(async () => {
    if (!isDev) registerStaticProtocol();
    registerIpc();
    await createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) void createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}

// ─── Navigation hardening ─────────────────────────────────────────────────

app.on('web-contents-created', (_event, contents) => {
  // Anything that would navigate the app frame away from our own origin is a
  // bug or an attack; send genuine external links to the system browser.
  contents.on('will-navigate', (event, url) => {
    const allowed = isDev ? url.startsWith(DEV_URL) : url.startsWith(APP_ORIGIN);
    if (allowed) return;
    event.preventDefault();
    if (isSafeExternalUrl(url)) void shell.openExternal(url);
  });

  // target="_blank" and window.open never get a Chromium window; they either
  // open in the default browser or are dropped.
  contents.setWindowOpenHandler(({ url }) => {
    if (isSafeExternalUrl(url)) void shell.openExternal(url);
    return { action: 'deny' };
  });

  // The renderer has no legitimate need for camera-adjacent permissions except
  // the QR reader's camera, so allow exactly that and refuse the rest.
  contents.session.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(permission === 'media');
  });

  contents.on('will-attach-webview', (event) => event.preventDefault());
});
