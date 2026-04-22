const fs = require("fs")
const path = require("path")
const { spawn } = require("child_process")
const { app, BrowserWindow } = require("electron")

const APP_ICON = path.join(__dirname, "assets", "icon.ico")
const BACKEND_PORT = 1602
const BACKEND_HTTP_URL = `http://127.0.0.1:${BACKEND_PORT}`

let mainWindow = null
let backendProcess = null
let gatewayProcess = null

function getPaths(){
    const resourcesBase = app.isPackaged
    ? process.resourcesPath
    : path.resolve(__dirname, "..")

    return {
        frontendDir: path.join(resourcesBase, "frontend"),
        backendDir: path.join(resourcesBase, "backend"),
        gatewayDir: path.join(resourcesBase, "wa-gateway"),
        
        // Path untuk Mode Production (Installer Client)
        backendExe: path.join(
            resourcesBase,
            "backend",
            "dist",
            "wa-backend.exe"
        ),
        
        // Path untuk Mode Development (npm run dev)
        pythonExe: path.join(
            resourcesBase,
            "backend",
            "venv",
            "Scripts",
            "python.exe"
        ),
        
        gatewayScript: path.join(
            resourcesBase,
            "wa-gateway",
            "index.js"
        ),
        frontendIndex: path.join(
            resourcesBase,
            "frontend",
            "index.html"
        ),
        dataDir: path.join(
            app.getPath("userData"),
            "data"
        )
    }
}

function getChildEnv(){
    const paths = getPaths()
    fs.mkdirSync(paths.dataDir, { recursive: true })

    return {
        ...process.env,
        WA_BTS26_DATA_DIR: paths.dataDir,
        WA_BTS26_BACKEND_WS_URL: `ws://127.0.0.1:${BACKEND_PORT}/wa`
    }
}

function pipeLogs(prefix, child){
    child.stdout.on("data", (data)=>{
        console.log(`[${prefix}] ${data}`.trim())
    })
    child.stderr.on("data", (data)=>{
        console.error(`[${prefix}] ${data}`.trim())
    })
}

function showStartupError(error){
    const message = error?.message || String(error)

    mainWindow = new BrowserWindow({
        width: 900,
        height: 620,
        minWidth: 700,
        minHeight: 500,
        icon: APP_ICON,
        autoHideMenuBar: true,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false
        }
    })

    const html = `
    <html>
    <body style="font-family: Segoe UI, sans-serif; background:#f6f7fb; color:#1f2937; margin:0; display:flex; align-items:center; justify-content:center; min-height:100vh;">
      <div style="max-width:720px; background:#fff; border:1px solid #e5e7eb; border-radius:16px; padding:28px; box-shadow:0 12px 30px rgba(0,0,0,.08);">
        <h1 style="margin:0 0 12px; font-size:28px;">WA-BTS26 gagal memulai layanan</h1>
        <p style="margin:0 0 16px; line-height:1.6;">Aplikasi desktop terbuka, tetapi backend internal tidak berhasil start. Tutup aplikasi lalu coba buka lagi. Jika masih gagal, hubungi admin teknis dan kirim pesan error di bawah ini.</p>
        <pre style="white-space:pre-wrap; word-break:break-word; background:#111827; color:#f9fafb; padding:16px; border-radius:12px; font-size:13px;">${escapeHtml(message)}</pre>
      </div>
    </body>
    </html>
    `

    mainWindow.loadURL(
        "data:text/html;charset=UTF-8," +
        encodeURIComponent(html)
    )
}

function escapeHtml(text){
    return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
}

function startBackend(){
    if(backendProcess) return

    const paths = getPaths()

    if (app.isPackaged) {
        // === MODE PRODUCTION (CLIENT) ===
        // Langsung menjalankan file .exe mandiri hasil PyInstaller
        backendProcess = spawn(
            paths.backendExe,
            [], 
            {
                cwd: paths.backendDir,
                env: getChildEnv(),
                stdio: "pipe"
            }
        )
    } else {
        // === MODE DEVELOPMENT ===
        // Menjalankan Uvicorn via Python Venv untuk keperluan live-coding / npm run dev
        backendProcess = spawn(
            paths.pythonExe,
            [
                "-m",
                "uvicorn",
                "server:app",
                "--app-dir",
                paths.backendDir,
                "--host",
                "127.0.0.1",
                "--port",
                String(BACKEND_PORT)
            ],
            {
                cwd: paths.backendDir,
                env: getChildEnv(),
                stdio: "pipe"
            }
        )
    }

    pipeLogs("backend", backendProcess)

    backendProcess.on("exit", (code)=>{
        console.log(`Backend exited with code ${code}`)
        backendProcess = null
    })
}

function startGateway(){
    if(gatewayProcess) return
    const paths = getPaths()

    gatewayProcess = spawn(
        app.isPackaged ? process.execPath : "node", 
        [paths.gatewayScript],
        {
            cwd: paths.gatewayDir,
            env: {
                ...getChildEnv(),
                ELECTRON_RUN_AS_NODE: "1"
            },
            stdio: "pipe"
        }
    )

    pipeLogs("gateway", gatewayProcess)

    gatewayProcess.on("exit", (code)=>{
        console.log(`Gateway exited with code ${code}`)
        gatewayProcess = null
    })
}

async function waitForBackend(timeoutMs = 90000){
    const startedAt = Date.now()

    while(Date.now() - startedAt < timeoutMs){
        try{
            const response = await fetch(BACKEND_HTTP_URL)

            if(response.ok){
                return
            }
        }catch(err){
        }

        await new Promise((resolve)=>setTimeout(resolve, 500))
    }

    throw new Error("Backend failed to start in time")
}

function createWindow(){
    const paths = getPaths()

    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1100,
        minHeight: 700,
        icon: APP_ICON,
        autoHideMenuBar: true,
        show: false,
        backgroundColor: "#f5f7fb",
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false
        }
    })

    mainWindow.loadFile(paths.frontendIndex)

    mainWindow.once("ready-to-show", () => {
        mainWindow.maximize()
        mainWindow.show()
        mainWindow.focus()
    })

    mainWindow.on("closed", ()=>{
        mainWindow = null
    })
}

function stopChildProcesses(){
    if(gatewayProcess){
        gatewayProcess.kill()
        gatewayProcess = null
    }

    if(backendProcess){
        backendProcess.kill()
        backendProcess = null
    }
}

app.whenReady().then(async()=>{
    try{
        startBackend()
        await waitForBackend()
        startGateway()

        createWindow()
    }catch(error){
        console.error(error)
        stopChildProcesses()
        showStartupError(error)
    }

    app.on("activate", ()=>{
        if(BrowserWindow.getAllWindows().length === 0){
            if(backendProcess){
                createWindow()
            }else{
                showStartupError("Backend belum berjalan")
            }
        }
    })
})

app.on("window-all-closed", ()=>{
    stopChildProcesses()

    if(process.platform !== "darwin"){
        app.quit()
    }
})

app.on("before-quit", ()=>{
    stopChildProcesses()
})