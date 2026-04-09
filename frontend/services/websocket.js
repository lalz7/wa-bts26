let socket = null
let listeners = []

let lastData = {}
let reconnectTimer = null
let manuallyClosed = false


export function connect(){

if(socket &&
(
socket.readyState === WebSocket.OPEN ||
socket.readyState === WebSocket.CONNECTING
)){
return
}

socket = new WebSocket(
"ws://127.0.0.1:8000/ws"
)

socket.onopen = ()=>{
if(reconnectTimer){
clearTimeout(reconnectTimer)
reconnectTimer = null
}
}

socket.onmessage = (e)=>{

const data = JSON.parse(e.data)

// simpan state terakhir
lastData[data.type] = data

listeners.forEach(fn=>fn(data))

}

socket.onclose = ()=>{

socket = null

if(manuallyClosed) return

reconnectTimer = setTimeout(()=>{
connect()
},2000)

}

socket.onerror = ()=>{
if(socket){
socket.close()
}
}

}


export function onMessage(callback){

listeners.push(callback)

Object.values(lastData)
.forEach(callback)

return () => {
    listeners = listeners.filter(fn => fn !== callback);
};

}


export function send(data){

if(socket && socket.readyState === 1){

socket.send(JSON.stringify(data))

}

}

connect()