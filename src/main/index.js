const electron = require('electron');
const { app, BrowserWindow } = electron;
const path = require('path');
const caManager = require('./certs/ca-manager');

const ipcMain = electron.ipcMain || { handle() {} };

function registerCaHandlers() {
  ipcMain.handle('ca:get', async () => {
    const cert = caManager.getCaCertificatePem();
    return { cert };
  });

  ipcMain.handle('ca:export', async (_event, args = {}) => {
    return caManager.exportCaCertificate(args.destPath);
  });

  ipcMain.handle('ca:rotate', async () => {
    const result = caManager.rotateCa();
    return { ok: true, ...result };
  });

  ipcMain.handle('ca:trust:guidance', async () => {
    const guidance = caManager.getTrustInstallGuidance();
    return { guidance };
  });
}

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  caManager.ensureCaArtifacts();
  registerCaHandlers();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
