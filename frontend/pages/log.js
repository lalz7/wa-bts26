import { api } from "../services/api.js"
import { onMessage } from "../services/websocket.js"

let logs = []

export default function log(){

setTimeout(initLog,100)

return `

<div class="space-y-6">

<div class="header">
Riwayat Blast
</div>

<div class="card p-6">

<div class="flex justify-between mb-3">

<div class="text-sm text-gray-500">
Log Pengiriman
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

table.innerHTML =
logs.map(l=>`

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

}