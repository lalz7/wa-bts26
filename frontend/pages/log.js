import { api } from "../services/api.js"
import { onMessage } from "../services/websocket.js"

let logs = []

export default function log(){

setTimeout(initLog,100)

return `

<div class="space-y-6">

<div class="page-hero">
<div class="page-kicker">
Delivery History
</div>

<div class="page-title">
Riwayat Blast
</div>

<div class="page-subtitle">
Lihat histori pengiriman terbaru, jumlah sukses dan gagal, lalu refresh bila ingin sinkronkan data dari backend.
</div>

<div class="page-chip-row">
<div class="page-chip">
<div class="page-chip-label">Total Log</div>
<div id="heroLogTotal" class="page-chip-value">0</div>
</div>

<div class="page-chip">
<div class="page-chip-label">Success</div>
<div id="heroLogSuccess" class="page-chip-value">0</div>
</div>

<div class="page-chip">
<div class="page-chip-label">Failed</div>
<div id="heroLogFailed" class="page-chip-value">0</div>
</div>
</div>
</div>

<div class="card p-6">

<div class="flex justify-between mb-3">

<div>
<div class="section-title">
Log Pengiriman
</div>

<div class="section-subtitle">
Riwayat terbaru akan muncul otomatis saat blast berjalan.
</div>
</div>

<button 
onclick="loadLog()" 
class="btn btn-sm">
Refresh
</button>

</div>

<div class="overflow-x-auto">

<table class="table">

<thead>

<tr>
<th>ID</th>
<th>Nama</th>
<th>Kelas</th>
<th>Status</th>
<th>Waktu</th>
</tr>

</thead>

<tbody id="table"></tbody>

</table>

</div>

</div>

</div>

`

}

function initLog(){

loadLog()

onMessage((data)=>{

if(data.type === "blast_log"){

logs.unshift(data.data)

renderTable()

}

})

}

async function loadLog(){

logs = await api("/log")

renderTable()

}

function renderTable(){

heroLogTotal.innerText = logs.length
heroLogSuccess.innerText =
logs.filter(l=>l.status === "success").length
heroLogFailed.innerText =
logs.filter(l=>l.status !== "success").length

table.innerHTML =
logs.length
? logs.map(l=>`

<tr>

<td>${l.id || ""}</td>
<td>${l.nama}</td>
<td>${l.kelas}</td>

<td>
<span class="badge ${
l.status === "success"
? "badge-success"
: "badge-error"
}">
${l.status}
</span>
</td>

<td>${l.waktu || ""}</td>

</tr>

`).join("")
: `
<tr>
<td colspan="5" class="empty-state">
Belum ada riwayat blast.
</td>
</tr>
`

}
