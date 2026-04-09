let activeDropdown = null

function ensureGlobalListeners(){

if(window.__customSelectReady){
return
}

document.addEventListener("click",(event)=>{
const target = event.target

if(activeDropdown && !activeDropdown.contains(target)){
closeDropdown(activeDropdown)
}
})

document.addEventListener("keydown",(event)=>{
if(event.key === "Escape" && activeDropdown){
closeDropdown(activeDropdown)
}
})

window.__customSelectReady = true

}

export function enhanceCustomSelects(root = document){

ensureGlobalListeners()

const selects = root.querySelectorAll("select")

selects.forEach(select=>{
if(select.dataset.customSelect === "disabled"){
return
}

if(select.nextElementSibling?.classList?.contains("custom-select")){
refreshCustomSelect(select)
return
}

createCustomSelect(select)
})

}

export function refreshCustomSelect(target){

const select =
typeof target === "string"
? document.querySelector(target)
: target

if(!select){
return
}

const wrapper = select.nextElementSibling

if(!wrapper?.classList?.contains("custom-select")){
createCustomSelect(select)
return
}

renderCustomSelect(select, wrapper)

}

function createCustomSelect(select){

const wrapper = document.createElement("div")
wrapper.className = "custom-select"

const trigger = document.createElement("button")
trigger.type = "button"
trigger.className = "custom-select-trigger"

const label = document.createElement("span")
label.className = "custom-select-label"

const chevron = document.createElement("span")
chevron.className = "custom-select-chevron"
chevron.innerHTML = `
<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
<path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`

trigger.append(label, chevron)

const menu = document.createElement("div")
menu.className = "custom-select-menu"

wrapper.append(trigger, menu)
select.classList.add("native-select-hidden")
select.insertAdjacentElement("afterend", wrapper)

trigger.addEventListener("click",()=>{
if(wrapper.classList.contains("custom-select-open")){
closeDropdown(wrapper)
return
}

if(activeDropdown && activeDropdown !== wrapper){
closeDropdown(activeDropdown)
}

wrapper.classList.add("custom-select-open")
activeDropdown = wrapper
})

renderCustomSelect(select, wrapper)

}

function renderCustomSelect(select, wrapper){

const label = wrapper.querySelector(".custom-select-label")
const menu = wrapper.querySelector(".custom-select-menu")
const selectedOption = select.options[select.selectedIndex]

label.textContent =
selectedOption?.textContent?.trim() ||
select.options[0]?.textContent?.trim() ||
"Pilih"

menu.innerHTML = Array.from(select.options).map(option=>{
const isSelected = option.value === select.value
const disabledAttr = option.disabled ? "disabled" : ""
const stateClass = [
"custom-select-option",
isSelected ? "custom-select-option-active" : "",
option.disabled ? "custom-select-option-disabled" : ""
].filter(Boolean).join(" ")

return `
<button
type="button"
class="${stateClass}"
data-value="${escapeHtml(option.value)}"
${disabledAttr}>
${escapeHtml(option.textContent.trim())}
</button>
`
}).join("")

menu.querySelectorAll(".custom-select-option").forEach(button=>{
button.addEventListener("click",()=>{
if(button.disabled){
return
}

const nextValue = button.dataset.value ?? ""

if(select.value !== nextValue){
select.value = nextValue
select.dispatchEvent(new Event("change", { bubbles: true }))
}

renderCustomSelect(select, wrapper)
closeDropdown(wrapper)
})
})

}

function closeDropdown(wrapper){

wrapper.classList.remove("custom-select-open")

if(activeDropdown === wrapper){
activeDropdown = null
}

}

function escapeHtml(value){

return String(value)
.replaceAll("&","&amp;")
.replaceAll("<","&lt;")
.replaceAll(">","&gt;")
.replaceAll('"',"&quot;")

}
