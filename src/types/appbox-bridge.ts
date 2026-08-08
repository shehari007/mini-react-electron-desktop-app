/**
 * The contract between the Electron preload script and the renderer.
 *
 * This file is the single source of truth for both sides: `electron/preload.ts`
 * imports it with `import type` (so it is erased at build time and creates no
 * runtime coupling), and the renderer consumes the `window.appbox` global
 * declared at the bottom.
 *
 * Keep this surface small. Everything added here is a capability the sandboxed
 * renderer gains over the host, so each entry should be something the UI
 * genuinely cannot do on its own.
 */

export interface AppInfo {
  version: string;
  platform: NodeJS.Platform | string;
  electron: string;
  chrome: string;
  node: string;
}

export interface WindowState {
  maximized: boolean;
  fullScreen: boolean;
}

export interface AppBoxBridge {
  /** Always true when present — the renderer checks for the object itself to
   *  detect Electron, so this is just an explicit, readable marker. */
  readonly isElectron: true;

  /** Populated by the preload script before the renderer runs, so the title bar
   *  can branch on platform without an async round trip on first paint. */
  readonly platform: NodeJS.Platform | string;

  window: {
    minimize(): void;
    toggleMaximize(): void;
    close(): void;
    isMaximized(): Promise<boolean>;
    /** Subscribe to real window state changes. Returns an unsubscribe fn. */
    onStateChange(handler: (state: WindowState) => void): () => void;
  };

  app: {
    info(): Promise<AppInfo>;
  };

  shell: {
    /** Opens in the user's default browser. Resolves false if the URL was
     *  rejected by the main process as an unsupported scheme. */
    openExternal(url: string): Promise<boolean>;
  };

  /** Fires when the native Tools/Help menu asks the renderer to navigate.
   *  The payload is an app-relative path such as `/calculator/`. */
  onNavigate(handler: (path: string) => void): () => void;
}

declare global {
  interface Window {
    /** Present only in the Electron build; undefined on the web. */
    appbox?: AppBoxBridge;
  }
}
