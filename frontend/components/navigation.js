export default function navigation(){

return `

<div class="bottom-nav">

<div onclick="load('whatsapp')" class="nav-item">
<div class="nav-icon">
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
<g transform="translate(0.18 0)">
<path d="M12 4.1a8 8 0 0 0-6.8 12.2L4.4 20l3.9-1A8 8 0 1 0 12 4.1Z"></path>
</g>
<path d="M9.75 8.75c.1-.2.24-.29.43-.29h.49c.14 0 .27.08.35.21l.76 1.66c.08.16.05.34-.07.47l-.53.59c-.11.12-.12.29-.04.42.48.79 1.15 1.46 1.94 1.94.13.08.3.07.42-.04l.59-.53c.13-.12.31-.15.47-.07l1.66.76c.13.08.21.21.21.35v.49c0 .19-.09.33-.29.43-.53.21-1.07.23-1.64.06-1-.3-1.99-.94-2.95-1.91-.97-.96-1.61-1.95-1.91-2.95-.17-.57-.15-1.11.06-1.64Z"></path>
</svg>
</div>
<span>WhatsApp</span>
</div>

<div onclick="load('template')" class="nav-item">
<div class="nav-icon">
<svg class="nav-icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
<rect x="4" y="6" width="16" height="12" rx="2"></rect>
<path d="m5 7 7 6 7-6"></path>
</svg>
</div>
<span>Template</span>
</div>

<div onclick="load('siswa')" class="nav-item">
<div class="nav-icon">
<svg class="nav-icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
<path d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"></path>
<path d="M5 19.2c1.3-2.6 3.8-4.2 7-4.2s5.7 1.6 7 4.2"></path>
</svg>
</div>
<span>Siswa</span>
</div>

<div onclick="load('blast')" class="nav-item">
<div class="nav-icon">
<svg class="nav-icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
<path d="M13 3 6 14h5l-1 7 8-12h-5V3Z"></path>
</svg>
</div>
<span>Blast</span>
</div>

<div onclick="load('log')" class="nav-item">
<div class="nav-icon">
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
<path d="M20 12a8 8 0 1 1-2.34-5.66"></path>
<path d="M20 5v5h-5"></path>
<path d="M12 8v4l2.5 1.5"></path>
</svg>
</div>
<span>History</span>
</div>

</div>

`

}
