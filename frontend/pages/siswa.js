import { api, upload } from "../services/api.js"

export default function siswa(){

setTimeout(initSiswa,100)

return `

<div class="space-y-6">

<div class="header">
Data Siswa
</div>


<div class="grid grid-cols-2 gap-6">

<!-- Upload Excel -->
<div class="card p-6 shadow-sm">

<div class="text-sm text-gray-500">
Upload Excel
</div>

<input 
type="file"
id="excel"
class="file-input w-full mt-3"
/>

<button 
onclick="uploadExcel()" 
class="btn btn-primary mt-3">

Upload Excel

</button>

<div 
id="excelError" 
class="text-error mt-2 text-sm">

</div>

</div>


<!-- Upload ZIP -->
<div class="card p-6 shadow-sm">

<div class="text-sm text-gray-500">
Upload ZIP Invoice
</div>

<input 
type="file"
id="zip"
class="file-input w-full mt-3"
/>

<button 
onclick="uploadZip()" 
class="btn btn-primary mt-3">

Upload ZIP

</button>

<div 
id="zipError" 
class="text-error mt-2 text-sm">

</div>

</div>

</div>


<!-- Table Card -->
<div class="card p-6 shadow-sm">

<div class="flex justify-between items-center mb-4">

<div class="text-lg font-medium">
Data Siswa
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

document.getElementById("table").innerHTML =
data.map(s=>`

<tr>
<td>${s.id}</td>
<td>${s.nama}</td>
<td>${s.kelas}</td>
<td>${s.no_hp}</td>
<td>${formatPdf(s.pdf)}</td>
</tr>

`).join("")

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

excelError.innerText = ""

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