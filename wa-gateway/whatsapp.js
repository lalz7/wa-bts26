const {
default: makeWASocket,
useMultiFileAuthState,
fetchLatestBaileysVersion,
DisconnectReason
} = require("@whiskeysockets/baileys")

const P = require("pino")
const QRCode = require("qrcode")
const fs = require("fs")
const path = require("path")

const ws = require("./websocket")

let sock = null
let status = "disconnected"
let connecting = false


async function connect(){

    if(connecting || sock) return

    connecting = true

    const { state, saveCreds } = await useMultiFileAuthState("session")

    const { version } = await fetchLatestBaileysVersion()

    sock = makeWASocket({
        version,
        auth: state,
        logger: P({level:"silent"}),
        browser:["WA-BTS26","Chrome","1.0"]
    })

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", async(update)=>{

        const { connection, qr, lastDisconnect } = update

        if(qr){

            const qrImage = await QRCode.toDataURL(qr)

            status = "qr"

            ws.send({
                type:"qr",
                data:qrImage
            })

        }


        if(connection === "open"){

            status = "connected"

            ws.send({
            type:"connected"
            })

            setTimeout(()=>{

            const number = sock.user?.id?.split(":")[0]

            if(number){

            ws.send({
            type:"admin",
            data:number
            })

            }

            },1000)

        }

        if(connection === "close"){

            sock = null
            connecting = false

            const reason =
            lastDisconnect?.error?.output?.statusCode

            if(reason !== DisconnectReason.loggedOut){

            status = "reconnecting"

            ws.send({
            type:"reconnecting"
            })

            setTimeout(connect,3000)

            }else{

            status = "disconnected"

            ws.send({
            type:"disconnected"
            })

            }

        }

    })

}


async function sendMessage(number,message){

    if(!sock) return

    const jid = number + "@s.whatsapp.net"

    await sock.sendMessage(jid,{
        text: message
    })

}


async function sendDocument(number,filePath){

    if(!sock) return

    const jid = number + "@s.whatsapp.net"

    const buffer = fs.readFileSync(filePath)

    const filename = path.basename(filePath)

    await sock.sendMessage(jid,{
        document: buffer,
        mimetype:"application/pdf",
        fileName: filename
    })

}


async function logout(){

    if(!sock) return

    await sock.logout()

    if(fs.existsSync("session")){
        fs.rmSync("session",{recursive:true,force:true})
    }

    sock = null

    ws.send({
        type:"disconnected"
    })

    setTimeout(connect,2000)

}


function handleCommand(data){

    if(data.type === "send_message"){
        sendMessage(data.number,data.message)
    }

    if(data.type === "send_document"){
        sendDocument(
            data.number,
            data.path
        )
    }

    if(data.type === "logout"){
        logout()
    }

}


function sendStatus(){

    ws.send({
        type:"status",
        data:status
    })

}


module.exports = {
    connect,
    handleCommand,
    sendStatus
}