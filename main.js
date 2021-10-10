const { app, BrowserWindow, ipcMain, ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');

// require('electron-reload')(__dirname, {
//   electron: require(`${__dirname}/node_modules/electron`)
// });

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    }
  })
  mainWindow.webContents.toggleDevTools(true)
  mainWindow.loadFile('index.html')
}
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.on('store-credentials', (channel, params) => {
  try {
    const path = './credentials.json';
    const data = getCredentialsObject(params);
    if (data.message) {
      return sendResponse(channel, 'store-response', false, data.message);
    }
    fs.writeFileSync(path, JSON.stringify(data));
    return sendResponse(channel, 'store-response', true, 'Entry added!');
  } catch (err) {
    return sendResponse(channel, 'store-response', false, err);
  }
})

ipcMain.on('get-credentials', (channel) => {
  channel.sender.send('credentials-response', {
    credentials: getCredentialsObject(),
  })
})

ipcMain.on('delete-credential', (channel, id) => {
  const credentials = getCredentialsObject();
  if (credentials && credentials.length) {
    const objWithCurrentId = credentials.filter(o => o.id !== id);
    try {
      const path = './credentials.json';
      fs.writeFileSync(path, JSON.stringify(objWithCurrentId));
      return sendResponse(channel, 'delete-response', true, 'Entry deleted!');
    } catch (err) {
      console.log(err);
      return sendResponse(channel, 'delete-response', false, err);
    }
  }
})

ipcMain.on('update-credential', (channel, data) => {
  const credentials = getCredentialsObject();
  if (credentials && credentials.length) {
    for (let cred of credentials) {
      if (cred.id === data.id) {
        cred.name = data.name;
        cred.identifier = data.identifier;
        cred.password = data.password;
        cred.updated = data.updated;
        break;
      }
    }
    try {
      const path = './credentials.json';
      fs.writeFileSync(path, JSON.stringify(credentials));
      return sendResponse(channel, 'update-response', true, 'Entry updated!');
    } catch (err) {
      console.log(err);
      return sendResponse(channel, 'update-response', false, err);
    }
  }
})

function getCredentialsObject(obj = false) {
  try {
    const path = './credentials.json';
    const file = fs.readFileSync(path, 'utf8');
    if (file) {
      const oldData = JSON.parse(file);
      if (typeof oldData === 'object') {

        // Check if already present in file
        const alreadyPresent = oldData.filter(o => {
          return o.name === obj.name &&
            o.identifier === obj.identifier &&
            o.password === obj.password
        });
        if (alreadyPresent.length) {
          return { message: 'Already added' }
        }
        if (obj) {
          oldData.push(obj);
        }
        return oldData;
      }
    }
  } catch (err) {
    console.log(err);
  }
  return obj ? [obj] : [];
}

function sendResponse(channel, type, success, message = '') {
  channel.sender.send(type, {
    success,
    message,
  })
}