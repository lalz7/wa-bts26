export function confirmDialog({
title = "Konfirmasi",
message = "Lanjutkan aksi ini?",
variant = "default"
} = {}){

return new Promise((resolve)=>{

const overlay = document.createElement("div")
overlay.className = "confirm-overlay"

overlay.innerHTML = `
<div class="confirm-dialog">
<div class="confirm-icon">!</div>
<div class="confirm-title">${escapeHtml(title)}</div>
<div class="confirm-message">${escapeHtml(message)}</div>
<div class="confirm-actions">
<button class="btn btn-sm confirm-cancel">Batal</button>
<button class="btn btn-sm ${variant === "danger" ? "confirm-danger" : "template-btn-accent"} confirm-ok">Lanjutkan</button>
</div>
</div>
`

document.body.appendChild(overlay)

const close = (value)=>{
overlay.remove()
resolve(value)
}

overlay.querySelector(".confirm-cancel")
.addEventListener("click", ()=>close(false))

overlay.querySelector(".confirm-ok")
.addEventListener("click", ()=>close(true))

overlay.addEventListener("click", (event)=>{
if(event.target === overlay){
close(false)
}
})

})

}


export function alertDialog({
title = "Informasi",
message = "Periksa kembali langkah ini.",
variant = "info"
} = {}){

return new Promise((resolve)=>{

const overlay = document.createElement("div")
overlay.className = "confirm-overlay"

overlay.innerHTML = `
<div class="confirm-dialog">
<div class="confirm-icon ${variant === "danger" ? "confirm-icon-danger" : "confirm-icon-info"}">
${variant === "danger" ? "!" : "i"}
</div>
<div class="confirm-title">${escapeHtml(title)}</div>
<div class="confirm-message">${escapeHtml(message)}</div>
<div class="confirm-actions">
<button class="btn btn-sm ${variant === "danger" ? "confirm-danger" : "template-btn-accent"} confirm-ok">Mengerti</button>
</div>
</div>
`

document.body.appendChild(overlay)

const close = ()=>{
overlay.remove()
resolve(true)
}

overlay.querySelector(".confirm-ok")
.addEventListener("click", close)

overlay.addEventListener("click", (event)=>{
if(event.target === overlay){
close()
}
})

})

}


function escapeHtml(text){

return String(text)
.replaceAll("&","&amp;")
.replaceAll("<","&lt;")
.replaceAll(">","&gt;")
.replaceAll('"',"&quot;")

}
