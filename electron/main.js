const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const isDev = process.env.NODE_ENV === "development";

let mainWindow;
let sessionActive = false;
let forceQuit = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#0A0A0A",
    titleBarStyle: "hiddenInset",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "../public/favicon.ico"),
  });

  // Load app
  const startUrl = isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "../build/index.html")}`;

  mainWindow.loadURL(startUrl);

  // ── Intercept window close ──────────────────────────────────
  mainWindow.on("close", async (e) => {
    if (forceQuit || !sessionActive) return; // allow normal close

    e.preventDefault();

    const { response } = await dialog.showMessageBox(mainWindow, {
      type: "warning",
      title: "⚠️ Active Session",
      message: "Session is currently active.",
      detail:
        "Closing now will log an APP_EXIT violation and mark your session as BROKEN.\n\nAre you sure?",
      buttons: ["Stay & Keep Studying", "Exit (Log Violation)"],
      defaultId: 0,
      cancelId: 0,
    });

    if (response === 1) {
      // Tell renderer to log violation, then quit
      mainWindow.webContents.send("app-exit-violation");
      // Give renderer 2s to write to Firestore before hard quit
      setTimeout(() => {
        forceQuit = true;
        mainWindow.close();
      }, 2000);
    }
  });

  // ── Intercept minimize ──────────────────────────────────────
  mainWindow.on("minimize", () => {
    if (sessionActive) {
      mainWindow.webContents.send("app-minimized");
    }
  });

  // ── Intercept blur (switched away) ──────────────────────────
  mainWindow.on("blur", () => {
    if (sessionActive) {
      mainWindow.webContents.send("app-blurred");
    }
  });

  mainWindow.on("focus", () => {
    mainWindow.webContents.send("app-focused");
  });
}

// ── IPC: Session state from renderer ────────────────────────
ipcMain.on("session-active", (_, active) => {
  sessionActive = active;
});

// ── IPC: Renderer finished logging violation, safe to quit ──
ipcMain.on("violation-logged", () => {
  forceQuit = true;
  if (mainWindow) mainWindow.close();
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
