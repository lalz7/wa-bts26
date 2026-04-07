import { api } from "../services/api.js"
import { onMessage } from "../services/websocket.js"

let siswa = []
let templateAktif = null
let listenersReady = false
let currentRunId = null
let runStartedAt = null
let resetTimer = null
let selectedKelas = "all"
let studentStatuses = {}
let activityItems = []
let latestProgress = null
let activeStudentId = null

export default function blast(){

setTimeout(initBlast,100)

return `

<div class="space-y-6">

<div class="card blast-hero p-6 md:p-8 shadow-sm">
<div class="relative z-10 grid lg:grid-cols-[1.4fr,0.8fr] gap-6 items-start">

<div>
<div class="text-xs uppercase tracking-[0.35em] text-white/70">
Broadcast Center
</div>

<div id="heroTitle" class="mt-3 text-3xl font-semibold leading-tight">
Siap memulai blast WhatsApp
</div>

<div id="heroSubtitle" class="mt-3 text-sm text-white/80 max-w-2xl leading-6">
Pilih kelas target, cek daftar penerima, lalu mulai blast. Sistem akan mengirim bertahap dengan delay acak dan auto retry di akhir antrean.
</div>

<div class="mt-6 flex flex-wrap gap-3">
<div class="blast-hero-soft rounded-2xl px-4 py-3 min-w-[150px]">
<div class="text-xs text-white/70">Template Aktif</div>
<div id="templateName" class="mt-1 text-sm font-medium">-</div>
</div>

<div class="blast-hero-soft rounded-2xl px-4 py-3 min-w-[150px]">
<div class="text-xs text-white/70">Status Proses</div>
<div id="heroStatus" class="mt-1 text-sm font-medium">Menunggu mulai</div>
</div>

<div class="blast-hero-soft rounded-2xl px-4 py-3 min-w-[150px]">
<div class="text-xs text-white/70">Estimasi Sisa</div>
<div id="estimate" class="mt-1 text-sm font-medium">-</div>
</div>
</div>
</div>

<div class="blast-hero-soft rounded-3xl p-5">
<div class="text-xs uppercase tracking-[0.28em] text-white/65">
Progress Batch
</div>

<div id="heroMetric" class="mt-3 text-4xl font-semibold">
0%
</div>

<div id="progressMeta" class="mt-2 text-sm text-white/75 leading-6">
Belum ada blast berjalan.
</div>

<progress
id="progress"
class="progress w-full mt-5 h-3"
value="0"
max="100">
</progress>
</div>

</div>
</div>

<div class="space-y-6">

<div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
<div class="blast-stat-card shadow-sm">
<div class="text-xs uppercase tracking-[0.24em] text-gray-400">
Target
</div>
<div id="statTotal" class="blast-stat-value">0</div>
</div>

<div class="blast-stat-card shadow-sm">
<div class="text-xs uppercase tracking-[0.24em] text-gray-400">
Diproses
</div>
<div id="statProcessed" class="blast-stat-value">0</div>
</div>

<div class="blast-stat-card shadow-sm">
<div class="text-xs uppercase tracking-[0.24em] text-gray-400">
Berhasil
</div>
<div id="statSuccess" class="blast-stat-value text-green-600">0</div>
</div>

<div class="blast-stat-card shadow-sm">
<div class="text-xs uppercase tracking-[0.24em] text-gray-400">
Final Gagal
</div>
<div id="statFailed" class="blast-stat-value text-red-500">0</div>
</div>
</div>

<div class="card p-6 shadow-sm">
<div class="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
<div>
<div class="text-sm text-gray-500">
Data Blast
</div>
<div class="mt-1 text-lg font-medium">
Daftar siswa dan status pengiriman
</div>
</div>

<div class="flex flex-col sm:flex-row sm:items-center gap-3 xl:justify-end">
<select
id="filterKelas"
class="select w-full sm:w-52"
onchange="filterData()">
<option value="all">
Semua Kelas
</option>
</select>

<div class="text-sm text-gray-500">
Total: <span id="total">0</span>
</div>

<button
id="startButton"
onclick="startBlast()"
class="btn btn-primary w-full sm:w-auto">
Mulai Blast
</button>
</div>
</div>

<div id="tableSummary" class="text-sm text-gray-500 mt-5">
Belum ada status pengiriman.
</div>

<div class="overflow-x-auto mt-5">
<table class="table">
<thead>
<tr>
<th>ID</th>
<th>Nama</th>
<th>Kelas</th>
<th>No HP</th>
<th>Status</th>
</tr>
</thead>

<tbody id="table"></tbody>

</table>
</div>
</div>

<div class="card p-6 shadow-sm">
<div class="flex items-center justify-between gap-4">
<div>
<div class="text-sm text-gray-500">
Live Activity
</div>
<div class="mt-1 text-lg font-medium">
Aktivitas terbaru
</div>
</div>

<div id="activityCounter" class="text-sm text-gray-500">
0 event
</div>
</div>

<div id="activityFeed" class="blast-feed mt-5">
<div class="text-sm text-gray-400">
Aktivitas akan muncul saat blast dimulai.
</div>
</div>
</div>

<div id="blastModal" class="modal">
<div class="modal-box">

<h3 class="font-bold text-lg">
Proses Blast Selesai
</h3>

<div id="blastModalBody" class="py-4 text-sm leading-6">
-
</div>

<div class="modal-action">
<button onclick="closeBlastModal()" class="btn btn-primary">
Tutup
</button>
</div>

</div>
</div>

</div>

`

}


async function initBlast(){

loadTemplate()
loadSiswa()
renderActivityFeed()

if(!listenersReady){
onMessage((data)=>{

if(data.type === "blast_started"){
currentRunId = data.run_id
runStartedAt = Date.now()
selectedKelas = filterKelas?.value || "all"

setStartButtonState(true)

resetProgressState({
keepRun: true,
note: "Sistem sedang menyiapkan batch pengiriman."
})

studentStatuses = {}
activityItems = []
activeStudentId = null

appendActivity({
status: "info",
title: "Blast dimulai",
description: "Sistem mulai menyusun antrean dan mengirim secara bertahap."
})

setProgressData({
total: data.total || 0,
success: 0,
failed: 0,
current: 0,
phase: "prepare",
retry_pending: 0
})

renderTable(getFilteredSiswa())
}

if(data.type === "blast_progress"){
if(!currentRunId || data.run_id !== currentRunId){
return
}

setProgressData(data)
}

if(data.type === "blast_log"){
handleBlastLog(data.data)
}

if(data.type === "blast_done"){
if(!currentRunId || data.run_id !== currentRunId){
return
}

setStartButtonState(false)

setProgressData({
...(latestProgress || {}),
total: data.total || latestProgress?.total || 0,
success: data.success || 0,
failed: data.failed || 0,
current: data.total || latestProgress?.current || 0,
phase: "done",
retry_pending: 0
})

appendActivity({
status: data.failed > 0 ? "failed" : "success",
title: "Blast selesai",
description: `${data.success || 0} berhasil, ${data.failed || 0} gagal final, ${data.retried || 0} masuk auto retry.`
})

showBlastResult(data)
resetProgressLater()
}

if(data.type === "blast_error"){
setStartButtonState(false)
alert(data.message || "Blast gagal dijalankan")
resetProgressState()
}

})

listenersReady = true
}

}


async function loadTemplate(){

const id = localStorage.getItem("template")

if(!id) return

const data = await api("/template")

templateAktif = data.find(t=>t.id == id)

if(templateAktif){
templateName.innerText = templateAktif.judul
}

}


async function loadSiswa(){

siswa = await api("/siswa")

renderTable(getFilteredSiswa())
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

filterKelas.value = selectedKelas

}


window.filterData = function(){

selectedKelas = filterKelas.value
renderTable(getFilteredSiswa())

}


function getFilteredSiswa(){

if(selectedKelas === "all"){
return siswa
}

return siswa.filter(s=>s.kelas === selectedKelas)

}


function renderTable(data){

table.innerHTML =
data.map(s=>{
const status = studentStatuses[s.id] || "pending"
const statusMap = getStatusDisplay(status)
const rowClass = getRowClass(s.id, status)

return `
<tr class="${rowClass}">
<td>${s.id}</td>
<td>${s.nama}</td>
<td>${s.kelas}</td>
<td>${s.no_hp}</td>
<td>
<span class="badge ${statusMap.badgeClass}">
${statusMap.label}
</span>
</td>
</tr>
`
}).join("")

if(!data.length){
table.innerHTML = `
<tr>
<td colspan="5" class="text-center text-gray-400 py-8">
Belum ada data siswa pada filter ini.
</td>
</tr>
`
}

total.innerText = data.length

const successCount =
data.filter(s=>studentStatuses[s.id] === "success").length

const failedCount =
data.filter(s=>studentStatuses[s.id] === "failed").length

tableSummary.innerText =
successCount || failedCount
? `${successCount} berhasil, ${failedCount} gagal pada tampilan saat ini`
: "Belum ada status pengiriman."

}


window.startBlast = async function(){

const templateId = localStorage.getItem("template")

if(!templateId){
alert("Pilih template aktif terlebih dahulu")
return
}

resetProgressState({
keepRun: false,
note: "Menyiapkan blast..."
})

await api("/blast/start","POST",{
template_id:templateId,
kelas:filterKelas.value
})

}


window.closeBlastModal = function(){
blastModal.classList.remove("modal-open")
}


function setProgressData(data){

latestProgress = data

const totalValue = Number(data.total || 0)
const currentValue = Number(data.current || 0)
const successValue = Number(data.success || 0)
const failedValue = Number(data.failed || 0)
const percentValue = totalValue > 0
? Math.min((currentValue / totalValue) * 100, 100)
: 0

progress.value = percentValue

heroMetric.innerText = `${Math.round(percentValue)}%`
heroTitle.innerText = buildHeroTitle(totalValue, currentValue, data.phase)
heroSubtitle.innerText = buildHeroSubtitle(data.phase, totalValue, currentValue)
heroStatus.innerText = getHeroStatus(data.phase)
progressMeta.innerText =
`${currentValue} dari ${totalValue} target sudah diproses`

statTotal.innerText = totalValue
statProcessed.innerText = currentValue
statSuccess.innerText = successValue
statFailed.innerText = failedValue

estimate.innerText = formatEstimate(totalValue, currentValue)
}


function buildHeroTitle(total,current,phase){

if(phase === "done"){
return "Blast selesai diproses"
}

if(phase === "retry"){
return "Auto retry sedang merapikan nomor yang gagal"
}

if(current <= 0){
return `Siap mengirim ke ${total} siswa`
}

return `Sedang mengirim ke ${total} siswa`

}


function buildHeroSubtitle(phase,total,current){

if(phase === "done"){
return "Semua target sudah melalui proses utama dan auto retry. Kamu bisa cek ringkasan hasil di bawah atau lihat log lengkap."
}

if(phase === "retry"){
return "Nomor yang gagal di putaran pertama sedang dicoba ulang otomatis di akhir antrean agar alur tetap rapi."
}

if(current <= 0){
return "Batch siap dijalankan. Sistem akan mengirim bertahap dengan delay acak agar tetap aman."
}

return `${current} target sudah diproses dari total ${total}. Aktivitas terbaru akan terus muncul secara realtime.`

}


function getHeroStatus(phase){

if(phase === "done") return "Selesai"
if(phase === "retry") return "Auto Retry"
if(phase === "prepare") return "Menyiapkan"
if(phase === "initial") return "Mengirim"

return "Menunggu mulai"

}


function formatEstimate(total,current){

if(!runStartedAt || total <= 0 || current <= 0){
return "-"
}

const elapsedMs = Date.now() - runStartedAt
const avgMs = elapsedMs / current
const remaining = Math.max(total - current, 0)
const remainingMs = avgMs * remaining

if(remaining === 0){
return "Selesai"
}

const minutes = Math.floor(remainingMs / 60000)
const seconds = Math.ceil((remainingMs % 60000) / 1000)

if(minutes <= 0){
return `${seconds} detik lagi`
}

return `${minutes} menit ${seconds} detik lagi`

}


function handleBlastLog(item){

if(!item || !item.id){
return
}

studentStatuses[item.id] = item.status
activeStudentId = item.id

appendActivity({
status: item.status,
title: `${item.nama} (${item.kelas})`,
description:
item.status === "success"
? "Pesan berhasil dikirim."
: "Pengiriman gagal pada percobaan ini."
})

renderTable(getFilteredSiswa())

}


function appendActivity(item){

activityItems.unshift({
...item,
time: new Date().toLocaleTimeString("id-ID", {
hour: "2-digit",
minute: "2-digit",
second: "2-digit"
})
})

activityItems = activityItems.slice(0,8)

renderActivityFeed()

}


function renderActivityFeed(){

activityCounter.innerText = `${activityItems.length} event`

if(!activityItems.length){
activityFeed.innerHTML = `
<div class="text-sm text-gray-400">
Aktivitas akan muncul saat blast dimulai.
</div>
`
return
}

activityFeed.innerHTML =
activityItems.map(item=>`
<div class="blast-feed-item">
<div class="blast-feed-dot ${item.status}"></div>
<div class="flex-1 min-w-0">
<div class="flex items-center justify-between gap-3">
<div class="font-medium text-sm text-gray-800">${item.title}</div>
<div class="text-xs text-gray-400 whitespace-nowrap">${item.time}</div>
</div>
<div class="mt-1 text-sm text-gray-500 leading-6">
${item.description}
</div>
</div>
</div>
`).join("")

}


function getStatusDisplay(status){

if(status === "success"){
return {
label: "Berhasil",
badgeClass: "badge-success"
}
}

if(status === "failed"){
return {
label: "Gagal",
badgeClass: "badge-error"
}
}

if(status === "sending"){
return {
label: "Diproses",
badgeClass: "badge-warning"
}
}

return {
label: "Menunggu",
badgeClass: "badge-warning"
}

}


function getRowClass(id,status){

if(id === activeStudentId){
return "blast-row-active"
}

if(status === "success"){
return "blast-row-success"
}

if(status === "failed"){
return "blast-row-failed"
}

return ""

}


function resetProgressState(options = {}){

if(resetTimer){
clearTimeout(resetTimer)
resetTimer = null
}

if(!options.keepRun){
currentRunId = null
runStartedAt = null
latestProgress = null
activeStudentId = null
studentStatuses = {}
activityItems = []
renderActivityFeed()
renderTable(getFilteredSiswa())
}

if(!options.keepRun){
setStartButtonState(false)
}

progress.value = 0
heroMetric.innerText = "0%"
heroTitle.innerText = "Siap memulai blast WhatsApp"
heroSubtitle.innerText =
"Pilih kelas target, cek daftar penerima, lalu mulai blast. Sistem akan mengirim bertahap dengan delay acak dan auto retry di akhir antrean."
heroStatus.innerText = "Menunggu mulai"
progressMeta.innerText = "Belum ada blast berjalan."
estimate.innerText = "-"

statTotal.innerText = "0"
statProcessed.innerText = "0"
statSuccess.innerText = "0"
statFailed.innerText = "0"

tableSummary.innerText = "Belum ada status pengiriman."

}


function setStartButtonState(isRunning){

if(typeof startButton === "undefined" || !startButton){
return
}

startButton.disabled = isRunning
startButton.innerText = isRunning
? "Blast Berjalan..."
: "Mulai Blast"

}


function resetProgressLater(){

resetTimer = setTimeout(()=>{
resetProgressState()
},4500)

}


function showBlastResult(data){

blastModalBody.innerHTML = `
<div class="text-base font-medium">
Blast selesai diproses.
</div>
<div class="mt-3">Total target: ${data.total || 0}</div>
<div>Berhasil: ${data.success || 0}</div>
<div>Gagal final: ${data.failed || 0}</div>
<div>Masuk auto retry: ${data.retried || 0}</div>
`

blastModal.classList.add("modal-open")

}
