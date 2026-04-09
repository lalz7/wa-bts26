import { api } from "../services/api.js"
import { onMessage } from "../services/websocket.js"
import { enhanceCustomSelects, refreshCustomSelect } from "../services/custom-select.js"

let logs = []
let listenersReady = false
let kelasOptions = []
let sortBy = "waktu"
let sortDir = "desc"
let refreshTimer = null
let meta = {
page: 1,
limit: 10,
total: 0,
total_pages: 1
}

export default function log(){

setTimeout(initLog,100)

return `

<div class="space-y-6">

<div class="page-hero">
<div class="page-kicker">
Delivery History
</div>

<div class="page-title">
History Blast
</div>

<div class="page-subtitle">
Lihat histori pengiriman, saring per hari atau kelas, lalu fokus ke log yang benar-benar ingin kamu cek.
</div>

<div class="page-chip-row">
<div class="page-chip">
<div class="page-chip-label">Total Hasil</div>
<div id="heroLogTotal" class="page-chip-value">0</div>
</div>

<div class="page-chip">
<div class="page-chip-label">Berhasil</div>
<div id="heroLogSuccess" class="page-chip-value">0</div>
</div>

<div class="page-chip">
<div class="page-chip-label">Gagal</div>
<div id="heroLogFailed" class="page-chip-value">0</div>
</div>

<div class="page-chip">
<div class="page-chip-label">Kelas Aktif</div>
<div id="heroLogKelas" class="page-chip-value">Semua</div>
</div>
</div>
</div>

<div class="card p-6 shadow-sm">
<div class="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
<div>
<div class="section-title">
Filter History
</div>

<div class="section-subtitle">
Gunakan filter untuk mempersempit histori pengiriman.
</div>
</div>

<div class="flex gap-2">
<button onclick="resetLogFilter()" class="btn btn-sm">
Reset
</button>

<button onclick="loadLog()" class="btn btn-sm">
Refresh
</button>
</div>
</div>

<div class="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mt-5">
<div>
<div class="text-sm text-gray-500 mb-2">
Tanggal
</div>
<input
id="filterTanggal"
type="date"
class="input w-full"
onchange="applyLogFilter()"
/>
</div>

<div>
<div class="text-sm text-gray-500 mb-2">
Kelas
</div>
<select
id="filterLogKelas"
class="select w-full"
onchange="applyLogFilter()">
<option value="all">Semua Kelas</option>
</select>
</div>

<div>
<div class="text-sm text-gray-500 mb-2">
Status
</div>
<select
id="filterStatus"
class="select w-full"
onchange="applyLogFilter()">
<option value="all">Semua Status</option>
<option value="success">Berhasil</option>
<option value="failed">Gagal</option>
</select>
</div>

<div>
<div class="text-sm text-gray-500 mb-2">
Cari
</div>
<input
id="filterSearch"
type="text"
placeholder="Nama atau kelas"
class="input w-full"
oninput="applyLogFilter()"
/>
</div>
</div>

</div>

<div class="card p-6 shadow-sm">
<div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-4">
<div>
<div class="section-title">
History Pengiriman
</div>

<div class="section-subtitle">
Klik judul kolom untuk mengubah urutan hasil.
</div>
</div>

<div class="flex flex-wrap items-center gap-3">
<div>
<div class="text-sm text-gray-500 mb-2">
Baris per Halaman
</div>
<select
id="filterLimit"
class="select w-full sm:w-36"
onchange="changeLogLimit()">
<option value="10">10</option>
<option value="20">20</option>
<option value="50">50</option>
</select>
</div>
</div>
</div>

<div id="logSummary" class="text-sm text-gray-500 mb-4">
Menyiapkan data history...
</div>

<div class="overflow-x-auto">
<table class="table">
<thead>
<tr>
<th>${renderSortHeader("waktu","Waktu")}</th>
<th>${renderSortHeader("nama","Nama")}</th>
<th>${renderSortHeader("kelas","Kelas")}</th>
<th>${renderSortHeader("status","Status")}</th>
</tr>
</thead>
<tbody id="table"></tbody>
</table>
</div>

<div class="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
<div id="pageSummary" class="text-sm text-gray-500">
Halaman 1 dari 1
</div>

<div class="flex flex-wrap gap-2">
<button onclick="changeLogPage(-1)" class="btn btn-sm">
Sebelumnya
</button>

<div id="pageNumbers" class="flex flex-wrap gap-2"></div>

<button onclick="changeLogPage(1)" class="btn btn-sm">
Berikutnya
</button>
</div>
</div>
</div>

</div>

`

}

function initLog(){

if(filterTanggal && !filterTanggal.value){
filterTanggal.value = todayString()
}

if(filterLimit){
filterLimit.value = String(meta.limit)
}

loadLog()
enhanceCustomSelects()

if(!listenersReady){
onMessage((data)=>{
if(data.type === "blast_log"){
queueLogRefresh()
}
})

listenersReady = true
}

}

async function loadLog(){

const params = buildLogParams()
const result = await api(`/log?${params.toString()}`)

logs = result.items || []
kelasOptions = result.kelas_options || []
meta = result.meta || meta

syncKelasOptions()
renderTable()

}

window.applyLogFilter = function(){
meta.page = 1
loadLog()
}

window.resetLogFilter = function(){

filterTanggal.value = todayString()
filterLogKelas.value = "all"
filterStatus.value = "all"
filterSearch.value = ""
filterLimit.value = "10"

sortBy = "waktu"
sortDir = "desc"
meta.page = 1
meta.limit = 10

loadLog()

}

window.changeLogLimit = function(){

meta.limit = Number(filterLimit.value || 10)
meta.page = 1

loadLog()

}

window.changeLogPage = function(direction){

const nextPage = meta.page + direction

if(nextPage < 1 || nextPage > meta.total_pages){
return
}

meta.page = nextPage
loadLog()

}

window.goToLogPage = function(page){

if(page < 1 || page > meta.total_pages || page === meta.page){
return
}

meta.page = page
loadLog()

}

window.sortLogBy = function(column){

if(sortBy === column){
sortDir = sortDir === "asc" ? "desc" : "asc"
}else{
sortBy = column
sortDir = column === "waktu" ? "desc" : "asc"
}

meta.page = 1

loadLog()

}

function syncKelasOptions(){

const currentValue = filterLogKelas?.value || "all"

filterLogKelas.innerHTML =
`<option value="all">Semua Kelas</option>` +
kelasOptions.map(kelas=>`
<option value="${kelas}">
${kelas}
</option>
`).join("")

filterLogKelas.value =
kelasOptions.includes(currentValue) || currentValue === "all"
? currentValue
: "all"

refreshCustomSelect(filterLogKelas)
refreshCustomSelect(filterStatus)
refreshCustomSelect(filterLimit)

}

function renderTable(){

heroLogTotal.innerText = meta.total
heroLogSuccess.innerText =
logs.filter(log=>log.status === "success").length
heroLogFailed.innerText =
logs.filter(log=>log.status !== "success").length
heroLogKelas.innerText =
filterLogKelas?.value === "all"
? "Semua"
: filterLogKelas.value

logSummary.innerText = buildSummary()
pageSummary.innerText =
`Halaman ${meta.page} dari ${meta.total_pages} - ${meta.total} total log`
renderPageNumbers()

table.innerHTML =
logs.length
? logs.map(log=>`
<tr>
<td>${formatDateTime(log.waktu || "")}</td>
<td>${log.nama || "-"}</td>
<td>${log.kelas || "-"}</td>
<td>
<span class="badge ${
log.status === "success"
? "badge-success"
: "badge-error"
}">
${capitalize(log.status || "-")}
</span>
</td>
</tr>
`).join("")
: `
<tr>
<td colspan="4" class="empty-state">
Belum ada log untuk filter ini.
</td>
</tr>
`

}

function renderPageNumbers(){

const pages = buildPageList(meta.page, meta.total_pages)

pageNumbers.innerHTML =
pages.map(page=>{
if(page === "..."){
return `<span class="page-number">...</span>`
}

return `
<button
class="page-number ${page === meta.page ? "page-number-active" : ""}"
onclick="goToLogPage(${page})">
${page}
</button>
`
}).join("")

}

function buildPageList(current,total){

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

function renderSortHeader(column,label){

const isActive = sortBy === column
const upClass =
isActive && sortDir === "asc"
? "log-sort-caret-active"
: ""

const downClass =
isActive && sortDir === "desc"
? "log-sort-caret-active"
: ""

return `
<button
class="log-sort-button ${isActive ? "log-sort-button-active" : ""}"
onclick="sortLogBy('${column}')">
<span>${label}</span>
<span class="log-sort-arrow" aria-hidden="true">
<span class="log-sort-caret ${upClass}">^</span>
<span class="log-sort-caret ${downClass}">v</span>
</span>
</button>
`

}

function buildSummary(){

const selectedDate = filterTanggal?.value || todayString()
const selectedClass = filterLogKelas?.value || "all"
const selectedStatus = filterStatus?.value || "all"

const classLabel =
selectedClass === "all"
? "semua kelas"
: `kelas ${selectedClass}`

const statusLabel =
selectedStatus === "all"
? "semua status"
: `status ${selectedStatus}`

return `${meta.total} log untuk ${formatDateLabel(selectedDate)}, ${classLabel}, ${statusLabel}.`

}

function buildLogParams(){

const params = new URLSearchParams({
sort_by: sortBy,
sort_dir: sortDir,
page: String(meta.page),
limit: String(meta.limit)
})

if(filterTanggal?.value){
params.set("tanggal", filterTanggal.value)
}

if(filterLogKelas?.value && filterLogKelas.value !== "all"){
params.set("kelas", filterLogKelas.value)
}

if(filterStatus?.value && filterStatus.value !== "all"){
params.set("status", filterStatus.value)
}

if(filterSearch?.value?.trim()){
params.set("search", filterSearch.value.trim())
}

return params

}

function todayString(){

const now = new Date()
const year = now.getFullYear()
const month = String(now.getMonth() + 1).padStart(2,"0")
const day = String(now.getDate()).padStart(2,"0")

return `${year}-${month}-${day}`

}

function formatDateTime(value){

if(!value) return "-"

const [datePart,timePart = ""] = value.split(" ")

return `${formatDateLabel(datePart)}${timePart ? ` ${timePart}` : ""}`

}

function formatDateLabel(value){

if(!value) return "-"

const [year,month,day] = value.split("-")

if(!year || !month || !day){
return value
}

return `${day}/${month}/${year}`

}

function capitalize(value){

if(!value) return "-"

return value.charAt(0).toUpperCase() +
value.slice(1)

}

function queueLogRefresh(){

if(refreshTimer){
clearTimeout(refreshTimer)
}

refreshTimer = setTimeout(()=>{
loadLog()
},350)

}
