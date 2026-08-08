import { contextBridge, ipcRenderer } from 'electron';
import type { IpcRendererEvent } from 'electron';

import type { AppBoxBridge, AppInfo, WindowState } from '../src/types/appbox-bridge';

/**
 * The only bridge between the sandboxed renderer and the host.
 *
 * Nothing from Electron or Node is forwarded wholesale — each method wraps one
 * specific IPC channel, and listeners are wrapped so the renderer receives only
 * the payload and never the `IpcRendererEvent` (which exposes `sender` and would
 * hand the page a way back into the IPC layer).
 */

function subscribe<T>(channel: string, handler: (payload: T) => void): () => void {
  const listener = (_event: IpcRendererEvent, payload: T) => handler(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.off(channel, listener);
}

const bridge: AppBoxBridge = {
  isElectron: true,
  platform: process.platform,

  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    toggleMaximize: () => ipcRenderer.send('window:toggle-maximize'),
    close: () => ipcRenderer.send('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:is-maximized') as Promise<boolean>,
    onStateChange: (handler: (state: WindowState) => void) => subscribe('window:state', handler),
  },

  app: {
    info: () => ipcRenderer.invoke('app:info') as Promise<AppInfo>,
  },

  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url) as Promise<boolean>,
  },

  onNavigate: (handler: (path: string) => void) => subscribe('navigate', handler),
};

contextBridge.exposeInMainWorld('appbox', bridge);
