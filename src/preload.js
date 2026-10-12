const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  cfg: () => ipcRenderer.invoke('cfg:get'),
  pickKey: () => ipcRenderer.invoke('pick-key'),
  run: (o) => ipcRenderer.invoke('run', o),
  stop: () => ipcRenderer.send('stop'),
  onLog: (f) => ipcRenderer.on('log', (_e, m) => f(m)),
  onProgress: (f) => ipcRenderer.on('progress', (_e, p) => f(p)),
});
