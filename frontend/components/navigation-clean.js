export default function navigation(){

return `

<div class="bottom-nav">

<div onclick="load('dashboard')" class="nav-item">
<div class="nav-icon">
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
<path d="M3 10.5 12 3l9 7.5"></path>
<path d="M5 9.5V20a1 1 0 0 0 1 1h4.5v-6h3v6H18a1 1 0 0 0 1-1V9.5"></path>
</svg>
</div>
<span>Home</span>
</div>

<div onclick="load('siswa')" class="nav-item">
<div class="nav-icon">
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
<path d="M12 6.5 4 10l8 3.5L20 10 12 6.5Z"></path>
<path d="M7 11.4V15c0 1.9 2.5 3.5 5 3.5s5-1.6 5-3.5v-3.6"></path>
<path d="M20 10v4"></path>
</svg>
</div>
<span>Siswa</span>
</div>

<div onclick="load('template')" class="nav-item">
<div class="nav-icon">
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
<rect x="4" y="6" width="16" height="12" rx="2"></rect>
<path d="m5 7 7 6 7-6"></path>
</svg>
</div>
<span>Template</span>
</div>

<div onclick="load('blast')" class="nav-item">
<div class="nav-icon">
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
<path d="M13 3 6 14h5l-1 7 8-12h-5V3Z"></path>
</svg>
</div>
<span>Blast</span>
</div>

<div onclick="load('log')" class="nav-item">
<div class="nav-icon">
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
<path d="M8 3.5h6l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 7 19V5A1.5 1.5 0 0 1 8.5 3.5Z"></path>
<path d="M14 3.5V8h4"></path>
<path d="M9.5 12h5"></path>
<path d="M9.5 15h5"></path>
</svg>
</div>
<span>Log</span>
</div>

</div>

`

}
