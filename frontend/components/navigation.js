export default function navigation(){

return `

<div class="bottom-nav">

<div onclick="load('dashboard')" class="nav-item">
🏠
<span>Home</span>
</div>

<div onclick="load('siswa')" class="nav-item">
👨‍🎓
<span>Siswa</span>
</div>

<div onclick="load('template')" class="nav-item">
✉️
<span>Template</span>
</div>

<div onclick="load('blast')" class="nav-item">
🚀
<span>Blast</span>
</div>

<div onclick="load('log')" class="nav-item">
📄
<span>Log</span>
</div>

</div>

`

}