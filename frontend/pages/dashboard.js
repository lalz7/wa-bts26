import { api } from "../services/api.js"
import { onMessage } from "../services/websocket.js"

let currentStatus = "disconnected"

export default function dashboard(){

setTimeout(initDashboard,100)

return `

<div class="space-y-6">

<div class="header">
Dashboard
</div>

<div class="grid grid-cols-2 gap-6">

<!-- Status Card -->
<div class="card p-6 shadow-sm">

<div class="text-sm text-gray-500">
Status WhatsApp
</div>

<div id="status"
class="mt-2 badge badge-error">

Disconnected

</div>

<div class="mt-4">

<div class="text-sm text-gray-500">
Nomor Admin
</div>

<div id="admin"
class="mt-1 font-medium">

-

</div>

</div>

<button 
onclick="logout()" 
class="btn btn-error mt-4">

Logout

</button>

</div>


<!-- QR Card -->
<div class="card p-6 shadow-sm">

<div class="text-sm text-gray-500">
QR Login
</div>

<div id="qr"
class="flex justify-center items-center
h-64">

<div class="text-gray-400">
Menunggu QR...
</div>

</div>

</div>

</div>

</div>

`

}


function initDashboard(){

loadAdmin()

onMessage((data)=>{

if(data.type === "qr"){

if(currentStatus === "connected") return

document.getElementById("qr").innerHTML =
`<img src="${data.data}" class="w-56"/>`

setStatus("Scan QR","badge-warning")

}


if(data.type === "connected"){

currentStatus = "connected"

document.getElementById("qr").innerHTML =
`<div class="text-success font-medium">
WhatsApp Connected
</div>`

setStatus("Connected","badge-success")

}


if(data.type === "disconnected"){

currentStatus = "disconnected"

document.getElementById("qr").innerHTML =
`<div class="text-error">
Disconnected
</div>`

setStatus("Disconnected","badge-error")

}


if(data.type === "status"){

const statusMap = {
connected: "badge-success",
disconnected: "badge-error",
qr: "badge-warning",
reconnecting: "badge-warning"
}

currentStatus = data.data

setStatus(
capitalizeStatus(data.data),
statusMap[data.data] || "badge-success"
)

}


if(data.type === "admin"){

document.getElementById("admin").innerText =
data.data

}

})

}


async function loadAdmin(){

try{

const data = await api("/admin")

if(data?.no_hp){
document.getElementById("admin").innerText =
data.no_hp
}

}catch(err){

console.log(err)

}

}


function setStatus(text,cls){

const el = document.getElementById("status")

el.innerText = text

el.className = `mt-2 badge ${cls}`

}


window.logout = async function(){

await api("/whatsapp/logout","POST")

}


function capitalizeStatus(text){

if(!text) return "-"

return text.charAt(0).toUpperCase() +
text.slice(1)

}
