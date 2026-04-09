import { api } from "../services/api.js"
import { confirmDialog } from "../services/dialog.js"
import { enhanceCustomSelects, refreshCustomSelect } from "../services/custom-select.js"

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
Kelola Template Pesan
</div>

<div class="page-subtitle">
Kelola template pesan dan pilih satu template aktif untuk blast.
</div>
</div>

<div class="card template-main-card shadow-sm">
<div class="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-3">
<div>
<div class="section-title">
Template Pesan
</div>

<div class="section-subtitle">
Pilih, kelola, dan tandai template aktif untuk blast.
</div>
</div>

<div class="template-toolbar">
<button onclick="createTemplate()" class="btn btn-sm template-btn-primary">
Tambah
</button>

<button onclick="editTemplate()" class="btn btn-sm template-btn-warning-solid">
Edit
</button>

<button onclick="deleteTemplate()" class="btn btn-sm template-btn-danger-solid">
Hapus
</button>
</div>
</div>

<div class="template-meta-row mt-3">
<div class="template-meta-left">
<div class="template-meta-pill">
Total: <span id="heroTemplateCount" class="font-medium text-gray-700">0</span>
</div>

<div class="template-meta-pill">
Aktif: <span id="heroActiveTemplate" class="font-medium text-gray-700">Belum dipilih</span>
</div>
</div>
</div>

<div class="mt-3">
<select 
id="templateSelect"
class="select w-full template-select"
onchange="previewTemplate()">
</select>
</div>

<textarea
id="preview"
class="textarea w-full mt-3 template-preview"
readonly>
</textarea>

<div class="template-footer mt-3">
<button onclick="setActiveTemplate()" class="btn btn-sm template-btn-accent">
Gunakan Template
</button>
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
class="textarea w-full mt-3 h-28">
</textarea>

<div class="mt-3">
<div class="text-sm text-gray-500">
Placeholder
</div>

<div class="flex flex-wrap gap-2 mt-2">
<button type="button" onclick="insertToken('nama')" class="token-chip">
${"${nama}"}
</button>

<button type="button" onclick="insertToken('kelas')" class="token-chip">
${"${kelas}"}
</button>
</div>
</div>

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
enhanceCustomSelects()

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

}else{

selectedId = null
templateSelect.value = ""
preview.value = ""
localStorage.removeItem("template")

}

updateActiveTemplateLabel()
refreshCustomSelect(templateSelect)

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

if(!t){
return
}

judul.value = t.judul
isi.value = t.isi

templateModal.classList.add("modal-open")

}

window.deleteTemplate = async function(){

if(!selectedId) return

const confirmed = await confirmDialog({
title: "Hapus Template",
message: "Template yang dipilih akan dihapus dari daftar.",
variant: "danger"
})

if(!confirmed) return

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

updateActiveTemplateLabel()

}

window.insertToken = function(token){

const field = document.getElementById("isi")

if(!field){
return
}

const placeholder = `\${${token}}`
const start = field.selectionStart ?? field.value.length
const end = field.selectionEnd ?? field.value.length

field.value =
field.value.slice(0, start) +
placeholder +
field.value.slice(end)

field.focus()

const nextPos = start + placeholder.length
field.setSelectionRange(nextPos, nextPos)

}

function updateActiveTemplateLabel(){

const active =
localStorage.getItem("template")

if(!active){
heroActiveTemplate.innerText = "Belum dipilih"
return
}

const current =
templates.find(t=>t.id == active)

heroActiveTemplate.innerText =
current?.judul || "Belum dipilih"

}
