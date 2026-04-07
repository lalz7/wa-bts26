const path = require("path")

const { app, BrowserWindow } = require("electron")

const FRONTEND_URL = "http://127.0.0.1:3000"
const APP_ICON = path.join(__dirname, "assets", "icon.ico")

let mainWindow = null

function createWindow(){

    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1100,
        minHeight: 700,
        icon: APP_ICON,
        autoHideMenuBar: true,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false
        }
    })

    mainWindow.loadURL(FRONTEND_URL)
    mainWindow.maximize()

    mainWindow.on("closed", ()=>{
        mainWindow = null
    })

}

app.whenReady().then(()=>{

    createWindow()

    app.on("activate", ()=>{
        if(BrowserWindow.getAllWindows().length === 0){
            createWindow()
        }
    })

})

app.on("window-all-closed", ()=>{
    if(process.platform !== "darwin"){
        app.quit()
    }
})
