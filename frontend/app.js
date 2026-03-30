import dashboard from "./pages/dashboard.js"
import siswa from "./pages/siswa.js"
import template from "./pages/template.js"
import blast from "./pages/blast.js"
import log from "./pages/log.js"

import layout from "./components/layout.js"

function load(page){

window.currentPage = page

let content = ""

if(page === "dashboard")
content = dashboard()

if(page === "siswa")
content = siswa()

if(page === "template")
content = template()

if(page === "blast")
content = blast()

if(page === "log")
content = log()

document.getElementById("app").innerHTML =
layout(content)

setTimeout(activeMenu,50)

}

function activeMenu(){

document.querySelectorAll(".nav-item")
.forEach(el=>el.classList.remove("nav-active"))

const map = {
dashboard:0,
siswa:1,
template:2,
blast:3,
log:4
}

const index = map[currentPage]

if(index !== undefined){
document.querySelectorAll(".nav-item")[index]
.classList.add("nav-active")
}

}

window.load = load

load("dashboard")