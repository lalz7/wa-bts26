import { api } from "../services/api.js"
import { onMessage } from "../services/websocket.js"
import { enhanceCustomSelects, refreshCustomSelect } from "../services/custom-select.js"

let logs = []
let unsubscribeLog = null 
let kelasOptions = []
let sortBy = "waktu"
let sortDir = "desc"
let refreshTimer = null
let meta = {
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 1,
    total_success: 0,
    total_failed: 0
}

export default function log(){

    if (unsubscribeLog) {
        unsubscribeLog();
        unsubscribeLog = null;
    }

    setTimeout(initLog,100)

    return `
    <div class="space-y-6">

        <div class="card blast-hero p-6 md:p-8 shadow-sm">
            <div class="relative z-10 grid lg:grid-cols-[1.4fr,0.8fr] gap-6 items-start">
                
                <div>
                    <div class="text-xs uppercase tracking-[0.35em] text-white/70">
                        Delivery History
                    </div>

                    <div class="mt-3 text-3xl font-semibold leading-tight text-white">
                        History Blast
                    </div>

                    <div class="mt-3 text-sm text-white/80 max-w-2xl leading-6">
                         Pantau histori pengiriman yang sudah berjalan. Kamu bisa memfilter berdasarkan tanggal, kelas, atau status untuk audit data pengiriman.
                    </div>

                    <div class="mt-6 flex flex-wrap gap-3">
                        <div class="blast-hero-soft px-4 py-3 min-w-[140px]">
                            <div class="page-chip-label">Total Hasil</div>
                            <div id="heroLogTotal" class="page-chip-value">0</div>
                        </div>

                        <div class="blast-hero-soft px-4 py-3 min-w-[140px]">
                            <div class="page-chip-label">Berhasil</div>
                            <div id="heroLogSuccess" class="page-chip-value">0</div>
                        </div>

                        <div class="blast-hero-soft px-4 py-3 min-w-[140px]">
                            <div class="page-chip-label">Gagal</div>
                            <div id="heroLogFailed" class="page-chip-value">0</div>
                        </div>
                    </div>
                </div>

                <div class="blast-hero-soft p-5">
                    <div class="text-xs uppercase tracking-[0.28em] text-white/65">
                        Kelas Aktif
                    </div>

                    <div id="heroLogKelas" class="mt-3 text-2xl font-semibold text-white">
                        Semua
                    </div>

                    <div id="logSummaryHero" class="mt-2 text-sm text-white/75 leading-6">
                        Menyiapkan ringkasan data...
                    </div>
                </div>

            </div>
        </div>

        <div class="card p-6 shadow-sm">
            <div class="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                <div>
                    <div class="section-title">Filter History</div>
                    <div class="section-subtitle">Gunakan filter untuk mempersempit histori pengiriman.</div>
                </div>

                <div class="flex gap-2">
                    <button onclick="resetLogFilter()" class="btn btn-sm">Reset</button>
                    <button onclick="loadLog()" class="btn btn-sm">Refresh</button>
                </div>
            </div>

            <div class="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mt-5">
                <div>
                    <div class="text-sm text-gray-500 mb-2">Tanggal</div>
                    <input id="filterTanggal" type="date" class="input w-full" onchange="applyLogFilter()"/>
                </div>

                <div>
                    <div class="text-sm text-gray-500 mb-2">Kelas</div>
                    <select id="filterLogKelas" class="select w-full" onchange="applyLogFilter()">
                        <option value="all">Semua Kelas</option>
                    </select>
                </div>

                <div>
                    <div class="text-sm text-gray-500 mb-2">Status</div>
                    <select id="filterStatus" class="select w-full" onchange="applyLogFilter()">
                        <option value="all">Semua Status</option>
                        <option value="success">Berhasil</option>
                        <option value="failed">Gagal</option>
                    </select>
                </div>

                <div>
                    <div class="text-sm text-gray-500 mb-2">Cari</div>
                    <input id="filterSearch" type="text" placeholder="Nama atau kelas" class="input w-full" oninput="applyLogFilter()"/>
                </div>
            </div>
        </div>

        <div class="card p-6 shadow-sm">
            <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-4">
                <div>
                    <div class="section-title">History Pengiriman</div>
                    <div class="section-subtitle">Klik judul kolom untuk mengubah urutan hasil.</div>
                </div>

                <div class="flex flex-wrap items-center gap-3">
                    <div>
                        <div class="text-sm text-gray-500 mb-2">Baris per Halaman</div>
                        <select id="filterLimit" class="select w-full sm:w-36" onchange="changeLogLimit()">
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                        </select>
                    </div>
                </div>
            </div>

            <div id="logSummary" class="text-sm text-gray-500 mb-4">Menyiapkan data...</div>

            <div class="overflow-x-auto siswa-table-wrap">
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
                <div id="pageSummary" class="text-sm text-gray-500">Halaman 1 dari 1</div>

                <div class="flex flex-wrap gap-2">
                    <button onclick="changeLogPage(-1)" class="btn btn-sm">Sebelumnya</button>
                    <div id="pageNumbers" class="flex flex-wrap gap-2"></div>
                    <button onclick="changeLogPage(1)" class="btn btn-sm">Berikutnya</button>
                </div>
            </div>
        </div>

    </div>
    `
}

/* --- LOGIKA --- */

function initLog(){
    if(document.getElementById("filterTanggal") && !filterTanggal.value){
        filterTanggal.value = todayString()
    }
    if(document.getElementById("filterLimit")){
        filterLimit.value = String(meta.limit)
    }

    loadLog()
    enhanceCustomSelects()

    unsubscribeLog = onMessage((data)=>{
        if(data.type === "blast_log") queueLogRefresh()
    })
}

async function loadLog(){
    const params = buildLogParams()
    const result = await api(`/log?${params.toString()}`)

    logs = result.items || []
    kelasOptions = result.kelas_options || []
    meta = result.meta || meta
    meta.total_success = result.total_success || 0
    meta.total_failed = result.total_failed || 0

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
    if(nextPage < 1 || nextPage > meta.total_pages) return
    meta.page = nextPage
    loadLog()
}

window.goToLogPage = function(page){
    if(page < 1 || page > meta.total_pages || page === meta.page) return
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
    const currentValue = document.getElementById("filterLogKelas")?.value || "all"
    filterLogKelas.innerHTML = `<option value="all">Semua Kelas</option>` +
        kelasOptions.map(kelas=>`<option value="${kelas}">${kelas}</option>`).join("")

    filterLogKelas.value = kelasOptions.includes(currentValue) || currentValue === "all" ? currentValue : "all"

    refreshCustomSelect(filterLogKelas)
    refreshCustomSelect(filterStatus)
}

function renderTable(){
    // Update Hero & Summary
    if(document.getElementById("heroLogTotal")) heroLogTotal.innerText = meta.total
    if(document.getElementById("heroLogSuccess")) heroLogSuccess.innerText = meta.total_success
    if(document.getElementById("heroLogFailed")) heroLogFailed.innerText = meta.total_failed
    if(document.getElementById("heroLogKelas")) heroLogKelas.innerText = filterLogKelas?.value === "all" ? "Semua" : filterLogKelas.value
    if(document.getElementById("logSummaryHero")) logSummaryHero.innerText = buildSummary()
    if(document.getElementById("logSummary")) logSummary.innerText = buildSummary()
    if(document.getElementById("pageSummary")) pageSummary.innerText = `Halaman ${meta.page} dari ${meta.total_pages} - ${meta.total} total log`

    renderPageNumbers()

    // Table Render
    document.getElementById("table").innerHTML = logs.length ? logs.map(log=>`
        <tr>
            <td class="time-cell">${formatDateTime(log.waktu || "")}</td>
            <td>${log.nama || "-"}</td>
            <td>${log.kelas || "-"}</td>
            <td>
                <span class="badge ${log.status === "success" ? "badge-success" : "badge-error"}">
                    ${getStatusLabel(log.status)}
                </span>
            </td>
        </tr>
    `).join("") : `<tr><td colspan="4" class="empty-state">Tidak ada data.</td></tr>`
}

function renderPageNumbers(){
    const pages = buildPageList(meta.page, meta.total_pages)
    document.getElementById("pageNumbers").innerHTML = pages.map(page=>{
        if(page === "...") return `<span class="page-number">...</span>`
        return `<button class="page-number ${page === meta.page ? "page-number-active" : ""}" onclick="goToLogPage(${page})">${page}</button>`
    }).join("")
}

function buildPageList(current,total){
    if(total <= 7) return Array.from({ length: total }, (_, index)=>index + 1)
    const pages = [1]
    const start = Math.max(current - 1, 2)
    const end = Math.min(current + 1, total - 1)
    if(start > 2) pages.push("...")
    for(let page = start; page <= end; page += 1) pages.push(page)
    if(end < total - 1) pages.push("...")
    pages.push(total)
    return pages
}

// REVISI: Header Sorting dengan Indikator Visual
function renderSortHeader(column,label){
    const isActive = sortBy === column
    const isAsc = sortDir === "asc"
    
    return `
    <button class="log-sort-button ${isActive ? "log-sort-button-active" : ""}" onclick="sortLogBy('${column}')">
        <span>${label}</span>
        <span class="sort-indicator">
            <span class="sort-indicator-up ${isActive && isAsc ? 'active' : ''}">▲</span>
            <span class="sort-indicator-down ${isActive && !isAsc ? 'active' : ''}">▼</span>
        </span>
    </button>`
}

function buildSummary(){
    const selectedDate = document.getElementById("filterTanggal")?.value || todayString()
    const selectedClass = document.getElementById("filterLogKelas")?.value || "all"
    return `${meta.total} log ditemukan untuk filter ini.`
}

function buildLogParams(){
    const params = new URLSearchParams({ sort_by: sortBy, sort_dir: sortDir, page: String(meta.page), limit: String(meta.limit) })
    if(document.getElementById("filterTanggal")?.value) params.set("tanggal", filterTanggal.value)
    if(document.getElementById("filterLogKelas")?.value && filterLogKelas.value !== "all") params.set("kelas", filterLogKelas.value)
    if(document.getElementById("filterStatus")?.value && filterStatus.value !== "all") params.set("status", filterStatus.value)
    if(document.getElementById("filterSearch")?.value?.trim()) params.set("search", filterSearch.value.trim())
    return params
}

function todayString(){
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`
}

// REVISI: Format Tanggal baru Jam (DD/MM/YYYY HH:MM:SS)
function formatDateTime(value){
    if(!value) return "-"
    const [datePart, timePart = ""] = value.split(" ")
    return `${formatDateLabel(datePart)} ${timePart}`
}

function formatDateLabel(value){
    if(!value) return "-"
    const [year,month,day] = value.split("-")
    if(!year || !month || !day) return value
    return `${day}/${month}/${year}`
}

function queueLogRefresh(){
    if(refreshTimer) clearTimeout(refreshTimer)
    refreshTimer = setTimeout(()=>loadLog(), 350)
}

function getStatusLabel(status) {
    const map = { success: "Berhasil", failed: "Gagal" };
    return map[status] || (status ? status.charAt(0).toUpperCase() + status.slice(1) : "-");
}