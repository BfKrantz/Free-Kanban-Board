const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Kanban Board"
  });

  win.loadFile(path.join(__dirname, "build", "index.html"));
}

app.whenReady().then(createWindow);