import { app, Menu, shell, type BrowserWindow, type MenuItemConstructorOptions } from 'electron';

import { CATEGORIES, TOOLS } from '../src/lib/tools';

const REPO_URL = 'https://github.com/shehari007/mini-react-electron-desktop-app';
const SITE_URL = 'https://appbox.msyb.dev';

/**
 * The native application menu.
 *
 * Tool navigation is generated from the same registry the sidebar uses, so a new
 * entry in `src/lib/tools.ts` appears in the desktop menu automatically. Rather
 * than loading a URL (which would discard renderer state), menu items send the
 * path over IPC and let the Next router handle it as a client-side navigation.
 */
export function buildMenu(win: BrowserWindow, opts: { isDev: boolean }): Menu {
  const isMac = process.platform === 'darwin';

  const go = (path: string) => () => win.webContents.send('navigate', path);

  const toolsMenu: MenuItemConstructorOptions = {
    label: 'Tools',
    submenu: [
      { label: 'Home', accelerator: 'CmdOrCtrl+Shift+H', click: go('/') },
      { type: 'separator' },
      {
        label: 'Search all tools…',
        accelerator: 'CmdOrCtrl+K',
        // The palette is a renderer concern; forwarding a synthetic navigation
        // to `?palette=1` lets the shell open it without a second IPC channel.
        click: go('/?palette=1'),
      },
      { type: 'separator' },
      ...CATEGORIES.map((category): MenuItemConstructorOptions => ({
        label: category.label,
        submenu: TOOLS.filter((t) => t.category === category.id).map(
          (tool): MenuItemConstructorOptions => ({
            label: tool.name,
            click: go(`/${tool.slug}/`),
          }),
        ),
      })),
    ],
  };

  const template: MenuItemConstructorOptions[] = [
    // macOS convention puts the app menu first; Windows and Linux have no
    // equivalent, so it is omitted entirely there.
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          } satisfies MenuItemConstructorOptions,
        ]
      : []),

    {
      label: 'File',
      submenu: [
        { label: 'New Window', accelerator: 'CmdOrCtrl+N', enabled: false },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },

    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac
          ? ([
              { role: 'pasteAndMatchStyle' },
              { role: 'delete' },
              { role: 'selectAll' },
            ] satisfies MenuItemConstructorOptions[])
          : ([{ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' }] satisfies MenuItemConstructorOptions[])),
      ],
    },

    toolsMenu,

    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        // Chromium only binds CmdOrCtrl+- for zoom out; the numpad variant is a
        // separate accelerator that users on full keyboards expect to work.
        { role: 'zoomIn', accelerator: 'CmdOrCtrl+numadd', visible: false },
        { role: 'zoomOut' },
        { role: 'zoomOut', accelerator: 'CmdOrCtrl+numsub', visible: false },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(opts.isDev
          ? ([{ type: 'separator' }, { role: 'toggleDevTools' }] satisfies MenuItemConstructorOptions[])
          : []),
      ],
    },

    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? ([{ type: 'separator' }, { role: 'front' }] satisfies MenuItemConstructorOptions[])
          : ([{ role: 'close' }] satisfies MenuItemConstructorOptions[])),
      ],
    },

    {
      role: 'help',
      submenu: [
        { label: 'About AppBox', click: go('/about/') },
        { type: 'separator' },
        { label: 'Website', click: () => void shell.openExternal(SITE_URL) },
        { label: 'Source Code', click: () => void shell.openExternal(REPO_URL) },
        { label: 'Report an Issue', click: () => void shell.openExternal(`${REPO_URL}/issues/new`) },
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}
