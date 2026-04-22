const BASE = "http://127.0.0.1:1602"


export async function api(url, method = "GET", data = null){

const options = {
method,
headers: {}
}

if(data){

options.headers["Content-Type"] =
"application/json"

options.body = JSON.stringify(data)

}

const response = await fetch(
BASE + url,
options
)

return parseResponse(response)

}


export async function upload(url, file){

const form = new FormData()

form.append("file", file)

const res = await fetch(
BASE + url,
{
method:"POST",
body: form
}
)

return parseResponse(res)

}


async function parseResponse(response){

const contentType =
response.headers.get("content-type") || ""

let payload = null

if(contentType.includes("application/json")){
payload = await response.json()
}else{
const text = await response.text()
payload = text ? { detail: text } : {}
}

if(!response.ok){
throw new Error(
payload?.detail ||
`Request failed with status ${response.status}`
)
}

return payload

}
