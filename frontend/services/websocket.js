let socket = null
let listeners = []

let lastData = {}


export function connect(){

socket = new WebSocket(
"ws://127.0.0.1:8000/ws"
)

socket.onmessage = (e)=>{

const data = JSON.parse(e.data)

// simpan state terakhir
lastData[data.type] = data

listeners.forEach(fn=>fn(data))

}

}


export function onMessage(callback){

listeners.push(callback)

// kirim state terakhir ke page baru
Object.values(lastData)
.forEach(callback)

}


export function send(data){

if(socket && socket.readyState === 1){

socket.send(JSON.stringify(data))

}

}

connect()