import { api } from "../services/api.js"
import { onMessage } from "../services/websocket.js"
import { confirmDialog } from "../services/dialog.js"

let currentStatus = "disconnected"
let unsubscribeWhatsApp = null

export default function whatsapp(){
if (unsubscribeWhatsApp) {
    unsubscribeWhatsApp();
    unsubscribeWhatsApp = null;
}

setTimeout(initWhatsApp,100)

return `

<div class="space-y-6">

<div class="page-hero">
<div class="page-kicker">
WhatsApp
</div>

<div class="page-title">
Koneksi WhatsApp Admin
</div>

<div class="page-subtitle">
Pastikan akun WhatsApp admin tersambung agar pengiriman blast dan invoice bisa berjalan dengan aman.
</div>
</div>

<div class="wa-shell">

<div class="card wa-compact-card shadow-sm">
<div class="wa-info-stack">
<div>
<div class="wa-card-title">
Status Koneksi
</div>

<div class="wa-card-subtitle">
Pantau status akun admin, nomor yang aktif, dan kondisi gateway sebelum mulai broadcast.
</div>
</div>

<div class="flex items-center justify-between gap-3 mt-4">
<div id="status" class="badge badge-error">
Disconnected
</div>

<div class="text-sm text-gray-500">
Realtime
</div>
</div>

<div class="wa-status-grid">
<div class="wa-mini-card">
<div class="wa-mini-label">
Nomor Admin
</div>
<div id="admin" class="wa-mini-value">
-
</div>
</div>

<div class="wa-mini-card">
<div class="wa-mini-label">
Gateway
</div>
<div id="gatewayInfo" class="wa-mini-value">
Belum terhubung
</div>
</div>
</div>

<div class="grid gap-3 mt-auto">
<button onclick="load('blast')" class="btn">
Ke Halaman Blast
</button>

<button onclick="logout()" class="btn wa-logout-btn">
Logout
</button>
</div>
</div>
</div>

<div class="card wa-compact-card shadow-sm">
<div class="wa-card-title">
QR Login
</div>

<div class="wa-card-subtitle">
Scan QR disini saat akun belum tersambung atau ketika sesi WhatsApp perlu login ulang.
</div>

<div id="qr" class="wa-qr-box flex justify-center items-center mt-4">
<div class="wa-qr-placeholder text-center">
<div class="wa-qr-placeholder-title">
Menunggu QR
</div>

<div class="wa-qr-placeholder-text">
QR akan muncul otomatis setelah gateway siap dan akun perlu proses login.
</div>
</div>
</div>
</div>

</div>

</div>

`

}


function initWhatsApp(){

loadAdmin()
unsubscribeWhatsApp = onMessage((data)=>{

if(data.type === "qr"){

if(currentStatus === "connected") return

document.getElementById("qr").innerHTML =
`<div class="wa-qr-frame">
<img src="${data.data}" class="wa-qr-image"/>
</div>`

setStatus("Scan QR","badge-warning")

}


if(data.type === "connected"){

currentStatus = "connected"

document.getElementById("qr").innerHTML =
`<div class="wa-qr-state text-center">
<div class="wa-qr-state-title text-success">
WhatsApp Connected
</div>
<div class="wa-qr-state-text">
Akun admin sudah aktif dan siap dipakai untuk proses blast.
</div>
</div>`

document.getElementById("gatewayInfo").innerText =
"Terhubung"

setStatus("Connected","badge-success")

}


if(data.type === "disconnected"){

currentStatus = "disconnected"
document.getElementById("admin").innerText = "-"

document.getElementById("qr").innerHTML =
`<div class="wa-qr-state text-center">
<div class="wa-qr-state-title text-error">
Disconnected
</div>
<div class="wa-qr-state-text">
Sesi admin belum aktif. Hubungkan ulang agar pengiriman bisa digunakan kembali.
</div>
</div>`

document.getElementById("gatewayInfo").innerText =
"Belum terhubung"

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

if(data.data === "disconnected" || data.data === "reconnecting"){
document.getElementById("admin").innerText = "-"
}

setStatus(
capitalizeStatus(data.data),
statusMap[data.data] || "badge-success"
)

document.getElementById("gatewayInfo").innerText =
capitalizeStatus(data.data)

}


if(data.type === "admin"){

document.getElementById("admin").innerText =
data.data || "-"

}

})

}


async function loadAdmin(){

try{

const data = await api("/admin")

if(data?.no_hp){
document.getElementById("admin").innerText =
data.no_hp
}else{
document.getElementById("admin").innerText = "-"
}

}catch(err){

console.log(err)

}

}


function setStatus(text,cls){

const el = document.getElementById("status")

el.innerText = text
el.className = `badge ${cls}`

}


window.logout = async function(){

const confirmed = await confirmDialog({
title: "Logout WhatsApp",
message: "Sesi WhatsApp admin akan diputus dan mungkin perlu scan QR lagi untuk masuk ulang.",
variant: "danger"
})

if(!confirmed){
return
}

await api("/whatsapp/logout","POST")
document.getElementById("admin").innerText = "-"

}


function capitalizeStatus(text){

if(!text) return "-"

return text.charAt(0).toUpperCase() +
text.slice(1)

}