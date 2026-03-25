import { app, BrowserWindow } from 'electron';
import path from 'path';
import http from 'http';

// Отключаем проверку TLS для работы с GigaChat (самоподписанные сертификаты Сбербанка)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const PORT = 3456;

function waitForServer(port: number, retries = 40): Promise<void> {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      http
        .get(`http://localhost:${port}`, (res) => {
          res.resume();
          if (res.statusCode && res.statusCode < 500) {
            resolve();
            return;
          }
          if (attempts++ < retries) setTimeout(check, 500);
          else reject(new Error('Server did not start in time'));
        })
        .on('error', () => {
          if (attempts++ < retries) setTimeout(check, 500);
          else reject(new Error('Server did not start in time'));
        });
    };
    check();
  });
}

async function createWindow() {
  const isDev = !app.isPackaged;
  let url = 'http://localhost:3000';

  if (!isDev) {
    // В production запускаем standalone Next.js сервер в текущем процессе
    const serverDir = path.join(process.resourcesPath, 'app');
    const serverScript = path.join(serverDir, 'server.js');

    process.chdir(serverDir);
    process.env.PORT = String(PORT);
    process.env.HOSTNAME = '127.0.0.1';
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require(serverScript);

    await waitForServer(PORT);
    url = `http://localhost:${PORT}`;
  }

  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'DocChat',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  win.loadURL(url);

  if (isDev) {
    win.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
