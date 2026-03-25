"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
// Отключаем проверку TLS для работы с GigaChat (самоподписанные сертификаты Сбербанка)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const PORT = 3456;
function waitForServer(port, retries = 40) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const check = () => {
            http_1.default
                .get(`http://localhost:${port}`, (res) => {
                res.resume();
                if (res.statusCode && res.statusCode < 500) {
                    resolve();
                    return;
                }
                if (attempts++ < retries)
                    setTimeout(check, 500);
                else
                    reject(new Error('Server did not start in time'));
            })
                .on('error', () => {
                if (attempts++ < retries)
                    setTimeout(check, 500);
                else
                    reject(new Error('Server did not start in time'));
            });
        };
        check();
    });
}
async function createWindow() {
    const isDev = !electron_1.app.isPackaged;
    let url = 'http://localhost:3000';
    if (!isDev) {
        // В production запускаем standalone Next.js сервер в текущем процессе
        const serverDir = path_1.default.join(process.resourcesPath, 'app');
        const serverScript = path_1.default.join(serverDir, 'server.js');
        process.chdir(serverDir);
        process.env.PORT = String(PORT);
        process.env.HOSTNAME = '127.0.0.1';
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require(serverScript);
        await waitForServer(PORT);
        url = `http://localhost:${PORT}`;
    }
    const win = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 900,
        minHeight: 600,
        title: 'DocChat',
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            contextIsolation: true,
        },
    });
    win.loadURL(url);
    if (isDev) {
        win.webContents.openDevTools();
    }
}
electron_1.app.whenReady().then(createWindow);
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
