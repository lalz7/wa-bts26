import { api } from "../services/api.js"
import { onMessage } from "../services/websocket.js"
import { alertDialog } from "../services/dialog.js"
import { enhanceCustomSelects, refreshCustomSelect } from "../services/custom-select.js"

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
let currentWhatsAppStatus = "disconnected"

export default function blast(){

setTimeout(initBlast,100)

return `
<div class="space-y-6">

    <div class="card blast-hero p-6 md:p-8 shadow-sm">
        <div class="relative z-10 grid lg:grid-cols-[1.4fr,0.8fr] gap-6 items-start">
            <div>
                <div class="text-xs uppercase tracking-[0.35em] text-white/70">Broadcast Center</div>
                <div id="heroTitle" class="mt-3 text-3xl font-semibold leading-tight text-white">Siap memulai blast WhatsApp</div>
                <div id="heroSubtitle" class="mt-3 text-sm text-white/80 max-w-2xl leading-6">
                    Pilih kelas target, cek daftar penerima, lalu mulai blast. Sistem akan mengirim bertahap dengan delay acak dan auto retry di akhir antrean.
                </div>
                
                <div class="mt-6 flex flex-wrap gap-3">
                    <div class="blast-hero-soft px-4 py-3 min-w-[150px]">
                        <div class="page-chip-label">Template Aktif</div>
                        <div id="templateName" class="page-chip-value">-</div>
                    </div>
                    <div class="blast-hero-soft px-4 py-3 min-w-[150px]">
                        <div class="page-chip-label">Status Proses</div>
                        <div id="heroStatus" class="page-chip-value">-</div>
                    </div>
                    <div class="blast-hero-soft px-4 py-3 min-w-[150px]">
                        <div class="page-chip-label">Estimasi Sisa</div>
                        <div id="estimate" class="page-chip-value">-</div>
                    </div>
                </div>
            </div>

            <div class="blast-hero-soft p-5">
                <div class="text-xs uppercase tracking-[0.28em] text-white/65">Progress Batch</div>
                <div id="heroMetric" class="mt-3 text-4xl font-semibold text-white">0%</div>
                <div id="progressMeta" class="mt-2 text-sm text-white/75 leading-6">Belum ada antrean berjalan.</div>
                <progress id="progress" class="progress w-full mt-5 h-3" value="0" max="100"></progress>
            </div>
        </div>
    </div>

    <div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div class="card siswa-stat-card shadow-sm">
            <div class="siswa-stat-label">Total Target</div>
            <div id="statTotal" class="siswa-stat-value">0</div>
        </div>
        <div class="card siswa-stat-card shadow-sm">
            <div class="siswa-stat-label">Diproses</div>
            <div id="statProcessed" class="siswa-stat-value">0</div>
        </div>
        <div class="card siswa-stat-card shadow-sm text-green-600">
            <div class="siswa-stat-label">Berhasil</div>
            <div id="statSuccess" class="siswa-stat-value font-bold">0</div>
        </div>
        <div class="card siswa-stat-card shadow-sm text-red-500">
            <div class="siswa-stat-label">Gagal Final</div>
            <div id="statFailed" class="siswa-stat-value font-bold">0</div>
        </div>
    </div>

    <div class="card siswa-main-card shadow-sm">
        <div class="grid xl:grid-cols-2 gap-4">
            <div class="soft-panel siswa-upload-card flex flex-col justify-between">
                <div>
                    <div class="siswa-upload-kicker">Langkah 1</div>
                    <div class="section-title">Filter Target</div>
                    <div class="section-subtitle">Pilih kelompok siswa yang ingin dikirimi pesan.</div>
                    
                    <div class="mt-5">
                        <div class="text-sm text-gray-500 mb-2">Pilih Kelas</div>
                        <select id="filterKelas" class="select w-full siswa-select" onchange="filterData()">
                            <option value="all">Semua Kelas</option>
                        </select>
                    </div>
                </div>
                <div class="siswa-filter-note mt-4">Pastikan data siswa di kelas ini sudah benar.</div>
            </div>

            <div class="soft-panel siswa-upload-card flex flex-col justify-between">
                <div>
                    <div class="siswa-upload-kicker">Langkah 2</div>
                    <div class="section-title">Mulai Pengiriman</div>
                    <div class="section-subtitle">Pastikan WhatsApp Admin sudah terhubung di tab koneksi.</div>
                </div>
                
                <div>
                    <div class="siswa-card-action mt-6">
                        <button id="startButton" onclick="startBlast()" class="btn template-btn-accent min-w-[180px]">
                            Mulai Blast Sekarang
                        </button>
                    </div>
                    <div class="siswa-filter-note mt-4">Pesan akan dikirim secara bertahap.</div>
                </div>
            </div>
        </div>
    </div>

    <div class="card siswa-main-card shadow-sm">
        <div class="siswa-data-head">
            <div class="flex items-center justify-between">
                <div>
                    <div class="section-title">Real-time Monitor</div>
                    <div class="section-subtitle">Daftar penerima beserta status pengiriman saat ini.</div>
                </div>
                <div id="tableSummary" class="text-sm text-gray-500">
                    Menyiapkan monitor...
                </div>
            </div>
        </div>
        
        <div class="overflow-x-auto mt-5 siswa-table-wrap">
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

    <div class="card siswa-main-card shadow-sm">
        <div class="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
                <div class="section-title">Live Activity</div>
                <div class="section-subtitle">Log sistem pengiriman terbaru secara realtime.</div>
            </div>
            <div id="activityCounter" class="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">0 event</div>
        </div>
        <div id="activityFeed" class="blast-feed mt-5">
            <div class="text-sm text-gray-400">Menunggu aktivitas blast dimulai...</div>
        </div>
    </div>

    <div id="blastModal" class="modal">
        <div class="modal-box">
            <h3 class="font-bold text-lg">Proses Blast Selesai</h3>
            <div id="blastModalBody" class="py-4 text-sm leading-6">-</div>
            <div class="modal-action">
                <button onclick="closeBlastModal()" class="btn btn-primary">Tutup</button>
            </div>
        </div>
    </div>

</div>
`
}

/* --- LOGIKA FITUR --- */

async function initBlast(){
    loadTemplate()
    loadSiswa()
    renderActivityFeed()
    enhanceCustomSelects()

    if(!listenersReady){
        onMessage((data)=>{
            if(data.type === "blast_started"){
                currentRunId = data.run_id
                runStartedAt = Date.now()
                selectedKelas = filterKelas?.value || "all"
                setStartButtonState(true)
                resetProgressState({ keepRun: true, note: "Sistem sedang menyiapkan batch pengiriman." })
                studentStatuses = {}
                activityItems = []
                activeStudentId = null
                appendActivity({ status: "info", title: "Blast dimulai", description: "Sistem mulai menyusun antrean pengiriman." })
                setProgressData({ total: data.total || 0, success: 0, failed: 0, current: 0, phase: "prepare" })
                renderTable(getFilteredSiswa())
            }
            if(data.type === "connected") currentWhatsAppStatus = "connected"
            if(data.type === "disconnected") currentWhatsAppStatus = "disconnected"
            if(data.type === "status") currentWhatsAppStatus = data.data || "disconnected"
            if(data.type === "reconnecting") currentWhatsAppStatus = "reconnecting"
            
            if(data.type === "blast_progress"){
                if(!currentRunId || data.run_id !== currentRunId) return
                setProgressData(data)
            }
            if(data.type === "blast_log"){
                handleBlastLog(data.data)
            }
            if(data.type === "blast_done"){
                if(!currentRunId || data.run_id !== currentRunId) return
                setStartButtonState(false)
                setProgressData({ ...(latestProgress || {}), total: data.total, success: data.success, failed: data.failed, current: data.total, phase: "done" })
                appendActivity({ status: data.failed > 0 ? "failed" : "success", title: "Blast selesai", description: `${data.success} berhasil, ${data.failed} gagal.` })
                showBlastResult(data)
                resetActivityLater()
            }
            if(data.type === "blast_error"){
                setStartButtonState(false)
                alertDialog({ title: "Blast Gagal Dijalankan", message: data.message, variant: "danger" })
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
    if(templateAktif) templateName.innerText = templateAktif.judul
}

async function loadSiswa(){
    siswa = await api("/siswa")
    renderTable(getFilteredSiswa())
    loadKelas()
}

function loadKelas(){
    const kelas = [...new Set(siswa.map(s=>s.kelas))]
    filterKelas.innerHTML = `<option value="all">Semua Kelas</option>` + kelas.map(k=>`<option value="${k}">${k}</option>`).join("")
    filterKelas.value = selectedKelas
    refreshCustomSelect(filterKelas)
}

window.filterData = function(){
    selectedKelas = filterKelas.value
    renderTable(getFilteredSiswa())
}

function getFilteredSiswa(){
    return selectedKelas === "all" ? siswa : siswa.filter(s=>s.kelas === selectedKelas)
}

function renderTable(data){
    table.innerHTML = data.map(s=>{
        const status = studentStatuses[s.id] || "pending"
        const statusMap = getStatusDisplay(status)
        const rowClass = getRowClass(s.id, status)
        return `
        <tr class="${rowClass}">
            <td class="text-gray-500">${s.id}</td>
            <td class="font-medium text-gray-900">${s.nama}</td>
            <td>${s.kelas}</td>
            <td class="text-gray-600">${s.no_hp}</td>
            <td><span class="badge ${statusMap.badgeClass} font-bold">${statusMap.label.toUpperCase()}</span></td>
        </tr>`
    }).join("")
    
    if(!data.length) table.innerHTML = `<tr><td colspan="5" class="text-center py-8">Belum ada data siswa.</td></tr>`
    
    const successCount = data.filter(s=>studentStatuses[s.id] === "success").length
    const failedCount = data.filter(s=>studentStatuses[s.id] === "failed").length
    tableSummary.innerText = successCount || failedCount ? `${successCount} berhasil, ${failedCount} gagal.` : "Belum ada status pengiriman."
}

window.startBlast = async function(){
    const templateId = localStorage.getItem("template")
    if(currentWhatsAppStatus !== "connected"){
        await alertDialog({ title: "WhatsApp Belum Terhubung", message: "Login atau scan QR terlebih dahulu.", variant: "danger" })
        return
    }
    if(!templateId){
        await alertDialog({ title: "Template Belum Dipilih", message: "Pilih template aktif terlebih dahulu." })
        return
    }
    if(!siswa.length){
        await alertDialog({ title: "Data Siswa Kosong", message: "Upload data siswa terlebih dahulu." })
        return
    }

    resetProgressState({ keepRun: false, note: "Menyiapkan blast..." })
    try {
        await api("/blast/start","POST",{ template_id:templateId, kelas:filterKelas.value })
    } catch(err) {
        await alertDialog({ title: "Gagal Dimulai", message: err.message, variant: "danger" })
        resetProgressState()
    }
}

function setProgressData(data){
    latestProgress = data
    const totalV = Number(data.total || 0)
    const currentV = Number(data.current || 0)
    const percentV = totalV > 0 ? Math.min((currentV / totalV) * 100, 100) : 0
    
    progress.value = percentV
    heroMetric.innerText = `${Math.round(percentV)}%`
    heroTitle.innerText = buildHeroTitle(totalV, currentV, data.phase)
    heroSubtitle.innerText = buildHeroSubtitle(data.phase, totalV, currentV)
    heroStatus.innerText = getHeroStatus(data.phase)
    progressMeta.innerText = `${currentV} dari ${totalV} target sudah diproses`
    
    statTotal.innerText = totalV
    statProcessed.innerText = currentV
    statSuccess.innerText = data.success || 0
    statFailed.innerText = data.failed || 0
    estimate.innerText = formatEstimate(totalV, currentV)
}

function buildHeroTitle(total, current, phase){
    if(phase === "done") return "Blast selesai diproses"
    if(phase === "retry") return "Auto retry sedang berjalan"
    return current <= 0 ? `Siap mengirim ke ${total} siswa` : `Sedang mengirim ke ${total} siswa`
}

function buildHeroSubtitle(phase, total, current){
    if(phase === "done") return "Semua target sudah melalui proses utama dan auto retry. Kamu bisa cek ringkasan hasil di bawah atau lihat log lengkap di page history."
    if(phase === "retry") return "Nomor yang gagal di putaran pertama sedang dicoba ulang otomatis di akhir antrean agar alur tetap rapi."
    if(current <= 0) return "Pilih kelas target, cek daftar penerima, lalu mulai blast. Sistem akan mengirim bertahap dengan delay acak dan auto retry di akhir antrean."
    return `${current} target sudah diproses dari total ${total}. Aktivitas terbaru akan terus muncul secara realtime.`
}

function getHeroStatus(phase){
    if(phase === "done") return "Selesai"; if(phase === "retry") return "Auto Retry"; if(phase === "prepare") return "Menyiapkan"; return "Mengirim"
}

function formatEstimate(total, current){
    if(!runStartedAt || total <= 0 || current <= 0) return "-"
    const elapsed = Date.now() - runStartedAt
    const remaining = Math.max(total - current, 0)
    const remainingMs = (elapsed / current) * remaining
    if(remaining === 0) return "Selesai"
    const min = Math.floor(remainingMs / 60000), sec = Math.ceil((remainingMs % 60000) / 1000)
    return min <= 0 ? `${sec} detik lagi` : `${min} menit ${sec} detik lagi`
}

function handleBlastLog(item){
    if(!item || !item.id) return
    studentStatuses[item.id] = item.status
    activeStudentId = item.id
    
    // REVISI: Nama tidak lagi dipaksa kapital semua
    appendActivity({ 
        status: item.status, 
        title: `${item.nama} (${item.kelas})`, 
        description: item.status === "success" ? "Pesan berhasil dikirim ke tujuan." : "Gagal terkirim pada percobaan ini." 
    })
    renderTable(getFilteredSiswa())
}

function appendActivity(item){
    activityItems.unshift({ ...item, time: new Date().toLocaleTimeString("id-ID") })
    activityItems = activityItems.slice(0, 8)
    renderActivityFeed()
}

function renderActivityFeed(){
    activityCounter.innerText = `${activityItems.length} event`
    if(!activityItems.length){ activityFeed.innerHTML = `<div class="text-sm text-gray-400">Menunggu aktivitas blast dimulai...</div>`; return; }
    
    activityFeed.innerHTML = activityItems.map(item=>`
        <div class="blast-feed-item">
            <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                    <div class="blast-feed-dot bg-${getActivityColor(item.status)}"></div>
                    <div class="font-medium text-sm text-gray-800">${item.title}</div>
                </div>
                <div class="text-xs text-gray-400 font-mono">${item.time}</div>
            </div>
            <div class="text-xs text-gray-500 mt-1 pl-4">
                ${item.description}
            </div>
        </div>
    `).join("")
}

function getActivityColor(status){
    if(status === "success") return "green-500"
    if(status === "failed") return "red-500"
    if(status === "sending") return "blue-500"
    return "gray-400"
}

function getStatusDisplay(status){
    if(status === "success") return { label: "Berhasil", badgeClass: "badge-success" }
    if(status === "failed") return { label: "Gagal", badgeClass: "badge-error" }
    return { label: status === "sending" ? "Diproses" : "Menunggu", badgeClass: "badge-warning" }
}

function getRowClass(id, status){
    if(id === activeStudentId) return "blast-row-active"
    if(status === "success") return "blast-row-success"; if(status === "failed") return "blast-row-failed"; return ""
}

function resetProgressState(options = {}){
    if(resetTimer) { clearTimeout(resetTimer); resetTimer = null }
    if(!options.keepRun){
        currentRunId = null; runStartedAt = null; latestProgress = null; activeStudentId = null;
        studentStatuses = {}; activityItems = []; renderActivityFeed(); renderTable(getFilteredSiswa())
        setStartButtonState(false)
    }
    progress.value = 0; heroMetric.innerText = "0%"; heroStatus.innerText = "-"; estimate.innerText = "-"
    statTotal.innerText = "0"; statProcessed.innerText = "0"; statSuccess.innerText = "0"; statFailed.innerText = "0"
}

function setStartButtonState(isRunning){
    if(!startButton) return
    startButton.disabled = isRunning
    startButton.innerText = isRunning ? "Blast Berjalan..." : "Mulai Blast Sekarang"
}

function resetActivityLater(){
    resetTimer = setTimeout(()=>{ activityItems = []; renderActivityFeed() }, 60000)
}

function showBlastResult(data){
    blastModalBody.innerHTML = `
        <div class="grid grid-cols-2 gap-3 mt-2">
            <div class="p-3 bg-green-50 rounded-xl"><div class="text-xs uppercase text-green-600 font-bold">Berhasil</div><div class="text-xl font-bold">${data.success}</div></div>
            <div class="p-3 bg-red-50 rounded-xl"><div class="text-xs uppercase text-red-600 font-bold">Gagal Final</div><div class="text-xl font-bold">${data.failed}</div></div>
        </div>
        <div class="mt-4 p-3 bg-blue-50 text-blue-700 rounded-xl text-xs">Antrean retry: ${data.retried} pesan.</div>`
    blastModal.classList.add("modal-open")
}

window.closeBlastModal = function(){ blastModal.classList.remove("modal-open") }