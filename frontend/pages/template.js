import { api } from "../services/api.js"

let templates = []
let selectedId = null
let mode = "create"

export default function template(){

setTimeout(initTemplate,100)

return `

<div class="space-y-6">

<div class="page-hero">
<div class="page-kicker">
Message Template
</div>

<div class="page-title">
Kelola Template Broadcast
</div>

<div class="page-subtitle">
Simpan beberapa format pesan, lihat preview isinya, lalu tandai satu template aktif untuk dipakai pada proses blast berikutnya.
</div>

<div class="page-chip-row">
<div class="page-chip">
<div class="page-chip-label">Total Template</div>
<div id="heroTemplateCount" class="page-chip-value">0</div>
</div>

<div class="page-chip">
<div class="page-chip-label">Template Aktif</div>
<div id="heroActiveTemplate" class="page-chip-value">Belum dipilih</div>
</div>
</div>
</div>

<div class="card p-6">

<div class="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4 mb-4">

<div>
<div class="section-title">
Daftar Template
</div>

<div class="section-subtitle">
Pilih template untuk preview, edit, atau jadikan template aktif.
</div>
</div>

<div class="flex gap-2">

<button onclick="createTemplate()" class="btn btn-primary btn-sm">
Tambah
</button>

<button onclick="editTemplate()" class="btn btn-warning btn-sm">
Edit
</button>

<button onclick="deleteTemplate()" class="btn btn-error btn-sm">
Hapus
</button>

</div>

</div>

<select 
id="templateSelect"
class="select w-full"
onchange="previewTemplate()">
</select>

<textarea
id="preview"
class="textarea w-full mt-4 h-40"
readonly>
</textarea>

<div class="mt-4 flex flex-wrap items-center gap-3">

<button 
onclick="setActiveTemplate()" 
class="btn btn-primary">
Gunakan untuk Blast
</button>

<span 
id="activeTemplate"
class="text-sm text-gray-500">
</span>

</div>

</div>



<!-- MODAL -->
<div id="templateModal" class="modal">

<div class="modal-box">

<h3 class="font-bold mb-3">
Template Pesan
</h3>

<input
id="judul"
placeholder="Judul"
class="input w-full"
/>

<textarea
id="isi"
placeholder="Isi pesan"
class="textarea w-full mt-3 h-32">
</textarea>

<div class="modal-action">

<button onclick="saveTemplate()" 
class="btn btn-primary">
Simpan
</button>

<button onclick="closeTemplate()" 
class="btn">
Batal
</button>

</div>

</div>

</div>

</div>

`
}

async function initTemplate(){

await loadTemplate()

}

async function loadTemplate(){

templates = await api("/template")

heroTemplateCount.innerText = templates.length

templateSelect.innerHTML =
templates.length
? templates.map(t=>`
<option value="${t.id}">
${t.judul}
</option>
`).join("")
: `<option value="">Belum ada template</option>`

if(templates.length){

const active =
localStorage.getItem("template")

selectedId = active && templates.find(t=>t.id == active)
? active
: templates[0].id

templateSelect.value = selectedId
previewTemplate()

}

updateActiveTemplateLabel()

}

window.previewTemplate = function(){

selectedId = templateSelect.value

const t =
templates.find(
t=>t.id == selectedId
)

preview.value = t?.isi || ""

}

window.createTemplate = function(){

mode = "create"

judul.value = ""
isi.value = ""

templateModal.classList.add("modal-open")

}

window.editTemplate = function(){

if(!selectedId){
return
}

mode = "edit"

const t =
templates.find(
t=>t.id == selectedId
)

judul.value = t.judul
isi.value = t.isi

templateModal.classList.add("modal-open")

}

window.deleteTemplate = async function(){

if(!selectedId) return

if(!confirm("Hapus template?")) return

await api(`/template/${selectedId}`,"DELETE")

loadTemplate()

}

window.closeTemplate = function(){

templateModal.classList.remove("modal-open")

}

window.saveTemplate = async function(){

if(mode === "edit"){

await api(`/template/${selectedId}`,"PUT",{
judul:judul.value,
isi:isi.value
})

}else{

await api("/template","POST",{
judul:judul.value,
isi:isi.value
})

}

closeTemplate()

loadTemplate()

}

window.setActiveTemplate = function(){

if(!selectedId) return

localStorage.setItem(
"template",
selectedId
)

activeTemplate.innerText =
"Template aktif tersimpan"

updateActiveTemplateLabel()

}


function updateActiveTemplateLabel(){

const active =
localStorage.getItem("template")

if(!active){
activeTemplate.innerText = "Belum ada template aktif"
heroActiveTemplate.innerText = "Belum dipilih"
return
}

const current =
templates.find(t=>t.id == active)

activeTemplate.innerText =
current
? `Aktif: ${current.judul}`
: "Template aktif tersimpan"

heroActiveTemplate.innerText =
current?.judul || "Template aktif tersimpan"

}
