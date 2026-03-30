import { api } from "../services/api.js"
import { onMessage } from "../services/websocket.js"

let siswa = []
let templateAktif = null

export default function blast(){

setTimeout(initBlast,100)

return `

<div class="space-y-6">

<div class="header">
Blast WhatsApp
</div>


<!-- TEMPLATE AKTIF -->
<div class="card p-6">

<div class="text-sm text-gray-500 mb-2">
Template Digunakan
</div>

<div id="templateName"
class="font-medium">
-
</div>

<textarea
id="preview"
class="textarea w-full mt-3 h-32"
readonly>
</textarea>

</div>


<!-- FILTER -->
<div class="card p-6">

<div class="text-sm text-gray-500 mb-3">
Filter Blast
</div>

<select 
id="filterKelas"
class="select"
onchange="filterData()">
<option value="all">
Semua Kelas
</option>
</select>

<div class="mt-2 text-sm">
Total : <span id="total">0</span>
</div>

</div>


<!-- TABLE -->
<div class="card p-6">

<div class="text-sm text-gray-500 mb-3">
Data Blast
</div>

<div class="overflow-x-auto">

<table class="table">

<thead>
<tr>
<th>ID</th>
<th>Nama</th>
<th>Kelas</th>
<th>No HP</th>
</tr>
</thead>

<tbody id="table"></tbody>

</table>

</div>

</div>


<!-- ACTION -->
<div class="card p-6">

<div class="flex gap-2">

<button 
onclick="startBlast()" 
class="btn btn-primary">

Mulai Blast

</button>

<button 
onclick="retryBlast()" 
class="btn btn-warning">

Retry Gagal

</button>

</div>

</div>


<!-- PROGRESS -->
<div class="card p-6">

<div class="text-sm mb-2">
Progress
</div>

<progress 
id="progress"
class="progress w-full"
value="0"
max="100">
</progress>

<div id="stat" class="mt-2 text-sm">
-
</div>

</div>


</div>

`

}


async function initBlast(){

loadTemplate()
loadSiswa()

onMessage((data)=>{

if(data.type === "blast_progress"){

const percent =
(data.current/data.total)*100

progress.value = percent

stat.innerHTML = `
Total : ${data.total} |
Success : ${data.success} |
Failed : ${data.failed}
`

}

})

}


async function loadTemplate(){

const id =
localStorage.getItem("template")

if(!id) return

const data =
await api("/template")

templateAktif =
data.find(t=>t.id == id)

if(templateAktif){

templateName.innerText =
templateAktif.judul

preview.value =
templateAktif.isi

}

}


async function loadSiswa(){

siswa = await api("/siswa")

renderTable(siswa)

loadKelas()

}


function loadKelas(){

const kelas = [...new Set(
siswa.map(s=>s.kelas)
)]

filterKelas.innerHTML =
`<option value="all">Semua Kelas</option>` +
kelas.map(k=>`

<option value="${k}">
${k}
</option>

`).join("")

}


window.filterData = function(){

const kelas = filterKelas.value

if(kelas === "all"){

renderTable(siswa)
return

}

const filtered =
siswa.filter(
s=>s.kelas === kelas
)

renderTable(filtered)

}


function renderTable(data){

table.innerHTML =
data.map(s=>`

<tr>
<td>${s.id}</td>
<td>${s.nama}</td>
<td>${s.kelas}</td>
<td>${s.no_hp}</td>
</tr>

`).join("")

total.innerText = data.length

}


window.startBlast = async function(){

const templateId =
localStorage.getItem("template")

await api("/blast/start","POST",{
template_id:templateId,
kelas:filterKelas.value
})

}


window.retryBlast = async function(){

await api("/blast/retry","POST")

}