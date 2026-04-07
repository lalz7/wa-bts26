import { api } from "../services/api.js"
import { onMessage } from "../services/websocket.js"

let currentStatus = "disconnected"

export default function dashboard(){

setTimeout(initDashboard,100)

return `

<div class="space-y-6">

<div class="page-hero">
<div class="page-kicker">
Operational Overview
</div>

<div class="page-title">
Dashboard WhatsApp Gateway
</div>

<div class="page-subtitle">
Pantau status koneksi, cek nomor admin aktif, dan tangani login WhatsApp dari satu halaman yang lebih ringkas.
</div>

<div class="page-chip-row">
<div class="page-chip">
<div class="page-chip-label">Status Saat Ini</div>
<div id="heroStatus" class="page-chip-value">Disconnected</div>
</div>

<div class="page-chip">
<div class="page-chip-label">Nomor Admin</div>
<div id="heroAdmin" class="page-chip-value">-</div>
</div>
</div>
</div>

<div class="grid xl:grid-cols-[0.9fr,1.1fr] gap-6">

<div class="card p-6 shadow-sm">
<div class="section-title">
Status WhatsApp
</div>

<div class="section-subtitle">
Status koneksi realtime dari gateway dan sesi admin aktif.
</div>

<div class="soft-panel mt-5">
<div id="status"
class="badge badge-error">
Disconnected
</div>

<div class="mt-4">
<div class="text-sm text-gray-500">
Nomor Admin
</div>

<div id="admin"
class="mt-2 text-lg font-semibold">
-
</div>
</div>
</div>

<div class="mt-5 flex flex-wrap gap-3">
<button onclick="logout()" class="btn btn-error">
Logout
</button>

<button onclick="load('blast')" class="btn">
Ke Halaman Blast
</button>
</div>

</div>


<div class="card p-6 shadow-sm">
<div class="section-title">
QR Login
</div>

<div class="section-subtitle">
Scan QR hanya saat status belum terhubung.
</div>

<div id="qr"
class="soft-panel mt-5 flex justify-center items-center h-72">
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

document.getElementById("heroAdmin").innerText =
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

document.getElementById("heroAdmin").innerText =
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

document.getElementById("heroStatus").innerText = text

}


window.logout = async function(){

await api("/whatsapp/logout","POST")

}


function capitalizeStatus(text){

if(!text) return "-"

return text.charAt(0).toUpperCase() +
text.slice(1)

}
