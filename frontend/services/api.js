const BASE = "http://127.0.0.1:8000"


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

return response.json()

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

return res.json()

}