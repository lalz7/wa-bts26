const WebSocket = require("ws")

const BACKEND_WS_URL =
process.env.WA_BTS26_BACKEND_WS_URL ||
"ws://127.0.0.1:1602/wa"

let socket = null

function connect(){

    socket = new WebSocket(BACKEND_WS_URL)

socket.on("open",()=>{
    console.log("Connected to backend")

    require("./whatsapp").sendStatus()
})

    socket.on("message",(data)=>{
        const message = JSON.parse(data)
        require("./whatsapp").handleCommand(message)
    })

    socket.on("close",()=>{
        console.log("Disconnected from backend")
        setTimeout(connect,3000)
    })

    socket.on("error",(err)=>{
        console.log("Waiting backend...")
    })

}

function send(data){

    if(socket && socket.readyState === 1){
        socket.send(JSON.stringify(data))
    }

}

module.exports = {
    connect,
    send
}
