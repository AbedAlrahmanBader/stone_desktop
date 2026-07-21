import { app, BrowserWindow } from "electron";


const createWindow = () => {

    const win = new BrowserWindow({

        width: 1400,
        height: 900,

        autoHideMenuBar: true,

        webPreferences: {
            nodeIntegration: true,
        },

    });


    // تكبير النافذة على كامل الشاشة
    win.maximize();


    win.loadURL(
        "http://localhost:5173"
    );

};


app.whenReady().then(() => {

    createWindow();

});