const websocket = require("./websocket")
const whatsapp = require("./whatsapp")

console.log("WA Gateway Starting...")

websocket.connect()

setTimeout(()=>{
    whatsapp.connect()
},2000)