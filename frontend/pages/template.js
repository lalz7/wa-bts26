import { api } from "../services/api.js"

let templates = []
let selectedId = null
let mode = "create"

export default function template(){

setTimeout(initTemplate,100)

return `

<div class="space-y-6">

<div class="header">
Template Pesan
</div>

<div class="card p-6">

<div class="flex justify-between mb-3">

<div class="text-sm text-gray-500">
Daftar Template
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
class="textarea w-full mt-3 h-36"
readonly>
</textarea>

<div class="mt-3">

<button 
onclick="setActiveTemplate()" 
class="btn btn-primary">
Gunakan untuk Blast
</button>

<span 
id="activeTemplate"
class="ml-3 text-sm text-gray-500">
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

const active =
localStorage.getItem("template")

if(active){

activeTemplate.innerText =
"Template aktif tersimpan"

}

}

async function loadTemplate(){

templates = await api("/template")

templateSelect.innerHTML =
templates.map(t=>`
<option value="${t.id}">
${t.judul}
</option>
`).join("")

if(templates.length){

selectedId = templates[0].id
previewTemplate()

}

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

localStorage.setItem(
"template",
selectedId
)

activeTemplate.innerText =
"Template aktif tersimpan"

}