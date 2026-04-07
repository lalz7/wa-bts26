import { api, upload } from "../services/api.js"

export default function siswa(){

setTimeout(initSiswa,100)

return `

<div class="space-y-6">

<div class="page-hero">
<div class="page-kicker">
Student Data
</div>

<div class="page-title">
Kelola Data Siswa dan Invoice
</div>

<div class="page-subtitle">
Upload data Excel dan invoice ZIP untuk menyiapkan target broadcast. Semua data siswa aktif akan tampil di tabel utama.
</div>

<div class="page-chip-row">
<div class="page-chip">
<div class="page-chip-label">Total Data</div>
<div id="heroTotal" class="page-chip-value">0</div>
</div>

<div class="page-chip">
<div class="page-chip-label">PDF Terhubung</div>
<div id="heroPdf" class="page-chip-value">0</div>
</div>
</div>
</div>


<div class="grid xl:grid-cols-2 gap-6">

<div class="card p-6 shadow-sm">
<div class="section-title">
Upload Excel
</div>

<div class="section-subtitle">
Gunakan file sumber siswa terbaru sebelum upload invoice.
</div>

<input 
type="file"
id="excel"
class="file-input w-full mt-4"
/>

<button 
onclick="uploadExcel()" 
class="btn btn-primary mt-4">
Upload Excel
</button>

<div 
id="excelError" 
class="text-error mt-2 text-sm">

</div>

</div>


<div class="card p-6 shadow-sm">
<div class="section-title">
Upload ZIP Invoice
</div>

<div class="section-subtitle">
ZIP akan diekstrak dan dicocokkan ke siswa berdasarkan nama file invoice.
</div>

<input 
type="file"
id="zip"
class="file-input w-full mt-4"
/>

<button 
onclick="uploadZip()" 
class="btn btn-primary mt-4">
Upload ZIP
</button>

<div 
id="zipError" 
class="text-error mt-2 text-sm">

</div>

</div>

</div>


<div class="card p-6 shadow-sm">

<div class="flex justify-between items-center mb-4">

<div>
<div class="section-title">
Data Siswa
</div>

<div class="section-subtitle">
Daftar target aktif yang siap digunakan untuk blast.
</div>
</div>

<button 
onclick="deleteSiswa()" 
class="btn btn-error btn-sm">

Hapus Semua

</button>

</div>

<div class="overflow-x-auto">

<table class="table table-zebra">

<thead>

<tr>
<th>ID</th>
<th>Nama</th>
<th>Kelas</th>
<th>No HP</th>
<th>PDF</th>
</tr>

</thead>

<tbody id="table"></tbody>

</table>

</div>

</div>

</div>

`

}


function initSiswa(){

loadSiswa()

}


async function loadSiswa(){

try{

const data = await api("/siswa")

heroTotal.innerText = data.length
heroPdf.innerText = data.filter(s=>s.pdf).length

document.getElementById("table").innerHTML =
data.length
? data.map(s=>`

<tr>
<td>${s.id}</td>
<td>${s.nama}</td>
<td>${s.kelas}</td>
<td>${s.no_hp}</td>
<td>${formatPdf(s.pdf)}</td>
</tr>

`).join("")
: `
<tr>
<td colspan="5" class="empty-state">
Belum ada data siswa. Upload Excel terlebih dahulu.
</td>
</tr>
`

}catch(err){

console.log(err)

}

}


window.uploadExcel = async function(){

const file =
document.getElementById("excel").files[0]

if(!file){

excelError.innerText =
"File belum dipilih"

return

}

try{

const data =
await upload("/upload/excel",file)

if(data.status === "ok"){

excelError.innerText = data.message || ""

loadSiswa()

}else{

excelError.innerText =
data.detail || "Upload gagal"

}

}catch(err){

excelError.innerText = err.message

}

}


window.uploadZip = async function(){

const file =
document.getElementById("zip").files[0]

if(!file){

zipError.innerText =
"File belum dipilih"

return

}

try{

const data =
await upload("/upload/zip",file)

if(data.status === "ok"){

zipError.innerText = ""

loadSiswa()

}else{

zipError.innerText =
data.detail || "Upload gagal"

}

}catch(err){

zipError.innerText = err.message

}

}


window.deleteSiswa = async function(){

if(!confirm("Hapus semua data siswa?"))
return

await api("/siswa","DELETE")

loadSiswa()

}

function formatPdf(path){

if(!path) return "-"

const parts = path.split(/[/\\]/)

return parts[parts.length - 1]

}
