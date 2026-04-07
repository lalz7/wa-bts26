import navigation from "./navigation-clean.js"

export default function layout(content){

return `

<div class="main-content">

${content}

</div>

${navigation()}

`

}
