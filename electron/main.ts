import { app, BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const createWindow = () => {

    const win = new BrowserWindow({

        width: 1400,
        height: 900,

        autoHideMenuBar: true,

        webPreferences: {
            nodeIntegration: true,
        },

    });


    win.maximize();


    if (app.isPackaged) {

        // بعد تثبيت البرنامج
        win.loadFile(
            path.join(
                __dirname,
                "../dist/index.html"
            )
        );

    } else {

        // أثناء التطوير
        win.loadURL(
            "http://localhost:5173"
        );

    }



};


app.whenReady().then(() => {

    createWindow();

});