import { api, upload } from "../services/api.js"
import { confirmDialog } from "../services/dialog.js"
import { enhanceCustomSelects, refreshCustomSelect } from "../services/custom-select.js"

let students = []
let siswaPage = 1
const siswaLimit = 10

export default function siswa(){

setTimeout(initSiswa,100)

return `

<div class="space-y-6">

<div class="page-hero">
<div class="page-kicker">
Student Data
</div>

<div class="page-title">
Data Siswa dan Invoice
</div>

<div class="page-subtitle">
Kelola daftar penerima, cocokkan invoice PDF, lalu cek data yang siap digunakan untuk blast.
</div>

<div class="siswa-hero-steps">
<div class="siswa-hero-step">
<div class="siswa-hero-step-number">1</div>
<div class="siswa-hero-step-text">Upload Excel</div>
</div>

<div class="siswa-hero-step">
<div class="siswa-hero-step-number">2</div>
<div class="siswa-hero-step-text">Upload ZIP PDF</div>
</div>

<div class="siswa-hero-step">
<div class="siswa-hero-step-number">3</div>
<div class="siswa-hero-step-text">Review Data</div>
</div>
</div>
</div>

<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
<div class="card siswa-stat-card shadow-sm">
<div class="siswa-stat-label">Total Siswa</div>
<div id="heroTotal" class="siswa-stat-value">0</div>
</div>

<div class="card siswa-stat-card shadow-sm">
<div class="siswa-stat-label">PDF Terhubung</div>
<div id="heroPdf" class="siswa-stat-value">0</div>
</div>

<div class="card siswa-stat-card shadow-sm">
<div class="siswa-stat-label">Belum Ada PDF</div>
<div id="heroMissingPdf" class="siswa-stat-value">0</div>
</div>

<div class="card siswa-stat-card shadow-sm">
<div class="siswa-stat-label">Total Kelas</div>
<div id="heroClassCount" class="siswa-stat-value">0</div>
</div>
</div>

<div class="card siswa-main-card shadow-sm">
<div class="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
<div>
<div class="section-title">
Upload Data Siswa
</div>

<div class="section-subtitle">
Masukkan file sumber terbaru sebelum mengecek hasilnya di tabel.
</div>
</div>

</div>

<div class="grid xl:grid-cols-2 gap-4 mt-5">
<div class="soft-panel siswa-upload-card">
<div>
<div>
<div class="siswa-upload-kicker">Langkah 1</div>
<div class="section-title">Upload Excel Siswa</div>
<div class="section-subtitle">Import data siswa terbaru. File ini akan menggantikan data sebelumnya.</div>
</div>
</div>

<input type="file" id="excel" class="file-input w-full mt-4" />
<div id="excelError" class="text-sm mt-2 siswa-feedback"></div>

<div class="siswa-filter-note mt-4">
Cek apakah data siswa terbaru sudah terunggah.
</div>

<div class="siswa-card-action">
<button onclick="uploadExcel()" class="btn btn-sm template-btn-accent">
Upload Excel
</button>
</div>
</div>

<div class="soft-panel siswa-upload-card">
<div>
<div>
<div class="siswa-upload-kicker">Langkah 2</div>
<div class="section-title">Upload ZIP Invoice</div>
<div class="section-subtitle">Unggah ZIP PDF agar invoice otomatis dicocokkan ke data siswa aktif.</div>
</div>
</div>

<input type="file" id="zip" class="file-input w-full mt-4" />
<div id="zipError" class="text-sm mt-2 siswa-feedback"></div>

<div class="siswa-filter-note mt-4">
Cek apakah PDF sudah cocok ke data siswa.
</div>

<div class="siswa-card-action">
<button onclick="uploadZip()" class="btn btn-sm template-btn-accent">
Upload ZIP PDF
</button>
</div>
</div>
</div>

<div class="soft-panel siswa-upload-card mt-4">
<div>
<div>
<div class="siswa-upload-kicker">Langkah 3</div>
<div class="section-title">Filter dan Pencarian</div>
<div class="section-subtitle">Cari siswa tertentu atau fokus ke kelas yang ingin kamu review sebelum memulai blast.</div>
</div>
</div>

<div class="grid md:grid-cols-[220px_minmax(0,1fr)] gap-4 mt-5">
<div>
<div class="text-sm text-gray-500 mb-2">
Kelas
</div>
<select id="filterKelas" class="select w-full siswa-select" onchange="applySiswaFilter()">
<option value="all">Semua Kelas</option>
</select>
</div>

<div>
<div class="text-sm text-gray-500 mb-2">
Cari
</div>
<input
id="filterSearch"
type="text"
placeholder="Cari nama atau no HP..."
class="input w-full siswa-input"
oninput="applySiswaFilter()"
/>
</div>
</div>

<div class="siswa-filter-note mt-4">
Gunakan filter untuk memastikan data yang muncul di tabel di bawah sudah sesuai.
</div>
</div>
</div>

<div class="card siswa-main-card shadow-sm">
<div class="siswa-data-head">
<div>
<div class="section-title">
Data Penerima
</div>

<div class="section-subtitle">
Daftar akhir siswa aktif beserta status kecocokan invoice.
</div>
</div>

<div id="siswaSummary" class="text-sm text-gray-500">
Menyiapkan data siswa...
</div>
</div>

<div class="overflow-x-auto siswa-table-wrap">
<table class="table">
<thead>
<tr>
<th>ID</th>
<th>Nama</th>
<th>Kelas</th>
<th>No HP</th>
<th>File</th>
</tr>
</thead>
<tbody id="table"></tbody>
</table>
</div>

<div class="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
<div id="siswaPageSummary" class="text-sm text-gray-500">
Halaman 1 dari 1
</div>

<div class="flex flex-wrap gap-2">
<button onclick="changeSiswaPage(-1)" class="btn btn-sm">
Sebelumnya
</button>

<div id="siswaPageNumbers" class="flex flex-wrap gap-2"></div>

<button onclick="changeSiswaPage(1)" class="btn btn-sm">
Berikutnya
</button>
</div>
</div>

<div class="siswa-data-foot">
<div class="siswa-card-action mt-4">
<button onclick="deletePdfOnly()" class="btn btn-sm siswa-btn-pdf-clear">
Hapus PDF Saja
</button>

<button onclick="deleteSiswa()" class="btn btn-sm template-btn-danger-solid">
Hapus Semua
</button>
</div>
</div>
</div>

</div>

`

}


function initSiswa(){

loadSiswa()
enhanceCustomSelects()

}


async function loadSiswa(){

try{

students = await api("/siswa")

renderSiswaOverview()
syncClassOptions()
renderTable()

}catch(err){

console.log(err)

}

}


window.applySiswaFilter = function(){

siswaPage = 1
renderTable()

}


window.changeSiswaPage = function(direction){

const totalPages = Math.max(1, Math.ceil(getFilteredStudents().length / siswaLimit))
const nextPage = siswaPage + direction

if(nextPage < 1 || nextPage > totalPages){
return
}

siswaPage = nextPage
renderTable()

}


window.goToSiswaPage = function(page){

const totalPages = Math.max(1, Math.ceil(getFilteredStudents().length / siswaLimit))

if(page < 1 || page > totalPages || page === siswaPage){
return
}

siswaPage = page
renderTable()

}


window.uploadExcel = async function(){

const file =
document.getElementById("excel").files[0]

if(!file){

excelError.innerText =
"File Excel belum dipilih"

return

}

try{

const data =
await upload("/upload/excel",file)

if(data.status === "ok"){

excelError.innerText = data.message || "Upload Excel berhasil"
zipError.innerText = ""

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
"File ZIP belum dipilih"

return

}

try{

const data =
await upload("/upload/zip",file)

if(data.status === "ok"){

zipError.innerText = data.message || "Upload ZIP berhasil"
excelError.innerText = ""

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

const confirmed = await confirmDialog({
title: "Hapus Semua Data",
message: "Semua data siswa dan invoice akan dihapus. Lanjutkan?",
variant: "danger"
})

if(!confirmed)
return

await api("/siswa","DELETE")

excelError.innerText = ""
zipError.innerText = ""

loadSiswa()

}


window.deletePdfOnly = async function(){

const confirmed = await confirmDialog({
title: "Hapus PDF Invoice",
message: "Semua PDF invoice akan dihapus, tetapi data siswa tetap disimpan.",
variant: "danger"
})

if(!confirmed)
return

await api("/siswa/pdf","DELETE")

excelError.innerText = ""
zipError.innerText = ""

loadSiswa()

}


function renderSiswaOverview(){

const connectedPdf = students.filter(s=>s.pdf).length
const missingPdf = students.length - connectedPdf
const classCount = new Set(students.map(s=>s.kelas).filter(Boolean)).size

heroTotal.innerText = students.length
heroPdf.innerText = connectedPdf
heroMissingPdf.innerText = missingPdf
heroClassCount.innerText = classCount

}


function syncClassOptions(){

const classes = [...new Set(students.map(s=>s.kelas).filter(Boolean))].sort()
const current = filterKelas?.value || "all"

filterKelas.innerHTML =
`<option value="all">Semua Kelas</option>` +
classes.map(kelas=>`
<option value="${kelas}">
${kelas}
</option>
`).join("")

filterKelas.value =
classes.includes(current) || current === "all"
? current
: "all"

refreshCustomSelect(filterKelas)

}


function renderTable(){

const filtered = getFilteredStudents()
const connectedPdf = filtered.filter(s=>s.pdf).length
const totalPages = Math.max(1, Math.ceil(filtered.length / siswaLimit))

if(siswaPage > totalPages){
siswaPage = totalPages
}

const startIndex = (siswaPage - 1) * siswaLimit
const paged = filtered.slice(startIndex, startIndex + siswaLimit)

siswaSummary.innerText =
`${filtered.length} dari ${students.length} siswa tampil, ${connectedPdf} sudah punya PDF.`

siswaPageSummary.innerText =
`Halaman ${siswaPage} dari ${totalPages} - ${filtered.length} total siswa`

renderSiswaPageNumbers(totalPages)

document.getElementById("table").innerHTML =
paged.length
? paged.map(s=>`
<tr>
<td>${s.id}</td>
<td>${s.nama}</td>
<td>${s.kelas}</td>
<td>${s.no_hp}</td>
<td class="text-sm text-gray-500">${formatPdf(s.pdf)}</td>
</tr>
`).join("")
: `
<tr>
<td colspan="5" class="empty-state">
Belum ada hasil untuk filter ini.
</td>
</tr>
`

}


function renderSiswaPageNumbers(totalPages){

const pages = buildSiswaPageList(siswaPage, totalPages)

siswaPageNumbers.innerHTML =
pages.map(page=>{
if(page === "..."){
return `<span class="page-number">...</span>`
}

return `
<button
class="page-number ${page === siswaPage ? "page-number-active" : ""}"
onclick="goToSiswaPage(${page})">
${page}
</button>
`
}).join("")

}


function buildSiswaPageList(current,total){

if(total <= 7){
return Array.from({ length: total }, (_, index)=>index + 1)
}

const pages = [1]
const start = Math.max(current - 1, 2)
const end = Math.min(current + 1, total - 1)

if(start > 2){
pages.push("...")
}

for(let page = start; page <= end; page += 1){
pages.push(page)
}

if(end < total - 1){
pages.push("...")
}

pages.push(total)

return pages

}


function getFilteredStudents(){

const selectedClass = filterKelas?.value || "all"
const query = (filterSearch?.value || "").trim().toLowerCase()

return students.filter(student=>{
const byClass =
selectedClass === "all" || student.kelas === selectedClass

const haystack =
`${student.nama || ""} ${student.no_hp || ""}`.toLowerCase()

const bySearch =
!query || haystack.includes(query)

return byClass && bySearch
})

}

function formatPdf(path){

if(!path) return "-"

const parts = path.split(/[/\\]/)

return parts[parts.length - 1]

}
