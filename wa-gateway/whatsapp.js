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

const DATA_DIR =
process.env.WA_BTS26_DATA_DIR ||
__dirname

const SESSION_DIR = path.join(DATA_DIR, "session")

let sock = null
let status = "disconnected"
let connecting = false
let commandQueue = Promise.resolve()


function getAdminNumber(){

    const id = sock?.user?.id

    if(!id) return null

    return id.split(":")[0]

}


function sendAdmin(){

    const number = getAdminNumber()

    if(!number) return

    ws.send({
        type:"admin",
        data:number
    })

}


async function connect(){

    if(connecting || sock) return

    connecting = true

    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)

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
            console.log("WhatsApp Connected")

            ws.send({
            type:"connected"
            })

            setTimeout(sendAdmin,1000)

        }

        if(connection === "close"){

            sock = null
            connecting = false

            const reason =
            lastDisconnect?.error?.output?.statusCode

            if(reason !== DisconnectReason.loggedOut){

            status = "reconnecting"
            console.log("WhatsApp Reconnecting")

            ws.send({
            type:"reconnecting"
            })

            setTimeout(connect,3000)

            }else{

            status = "disconnected"
            console.log("WhatsApp Disconnected")

            ws.send({
            type:"disconnected"
            })

            }

        }

    })

}


async function sendMessage(number,message){

    if(!sock) throw new Error("WhatsApp belum connected")

    const jid = number + "@s.whatsapp.net"

    await sock.sendMessage(jid,{
        text: message
    })

}


async function sendDocument(number,filePath){

    if(!sock) throw new Error("WhatsApp belum connected")

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

    if(fs.existsSync(SESSION_DIR)){
        fs.rmSync(SESSION_DIR,{recursive:true,force:true})
    }

    sock = null

    ws.send({
        type:"disconnected"
    })

    setTimeout(connect,2000)

}


function enqueueCommand(task){

    commandQueue = commandQueue
    .then(()=>task())
    .catch((error)=>{
        console.error("Command queue error:", error.message)
    })

    return commandQueue

}

function sendAck(commandId,status,message = null){

    if(!commandId) return

    ws.send({
        type:"gateway_ack",
        command_id: commandId,
        status,
        message
    })

}


function handleCommand(data){

    if(data.type === "send_message"){
        enqueueCommand(async()=>{
            console.log("Queue send_message:", data.number)
            try{
                await sendMessage(data.number,data.message)
                sendAck(data.command_id,"success")
            }catch(error){
                sendAck(data.command_id,"error", error.message)
                throw error
            }
        })
    }

    if(data.type === "send_document"){
        enqueueCommand(async()=>{
            console.log("Queue send_document:", data.number)
            try{
                await sendDocument(
                    data.number,
                    data.path
                )
                sendAck(data.command_id,"success")
            }catch(error){
                sendAck(data.command_id,"error", error.message)
                throw error
            }
        })
    }

    if(data.type === "logout"){
        enqueueCommand(()=>{
            console.log("Queue logout")
            return logout()
        })
    }

}


function sendStatus(){

    console.log("WhatsApp Status:", status)

    ws.send({
        type:"status",
        data:status
    })

    sendAdmin()

}


module.exports = {
    connect,
    handleCommand,
    sendStatus
}
