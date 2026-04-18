const { contextBridge, ipcRenderer } = require("electron");

// Expose safe IPC methods to renderer
contextBridge.exposeInMainWorld("electronAPI", {
  // Renderer → Main
  setSessionActive: (active) => ipcRenderer.send("session-active", active),
  violationLogged: () => ipcRenderer.send("violation-logged"),

  // Main → Renderer (listeners)
  onAppExitViolation: (cb) => ipcRenderer.on("app-exit-violation", cb),
  onAppMinimized: (cb) => ipcRenderer.on("app-minimized", cb),
  onAppBlurred: (cb) => ipcRenderer.on("app-blurred", cb),
  onAppFocused: (cb) => ipcRenderer.on("app-focused", cb),

  // Cleanup
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
