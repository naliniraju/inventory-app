const SUPABASE_URL="https://lmyizgwxxdfmwvwlvlum.supabase.co"
const API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxteWl6Z3d4eGRmbXd2d2x2bHVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2ODcwNTQsImV4cCI6MjA4ODI2MzA1NH0.7ffes53M8XXQuIAAS_80-RPqVHCI56NIyw79T3uxk2w"

const TABLE="Stock"

async function loadItems(){

const search=document.getElementById("search").value

let url=`${SUPABASE_URL}/rest/v1/${TABLE}?select=*`

if(search){
url+=`&item_name=ilike.*${search}*`
}

const res=await fetch(url,{
headers:{
apikey:API_KEY,
Authorization:`Bearer ${API_KEY}`
}
})

const data=await res.json()

let html=""

data.forEach(i=>{

let status=i.available_stoc<=i.minimum_sto
? "<span class='low'>Low</span>"
: "OK"

html+=`
<tr>
<td>${i.item_name}</td>
<td>${i.category}</td>
<td>${i.quantity}</td>
<td>${i.available_stoc}</td>
<td>${i.minimum_sto}</td>
<td>${i.units}</td>
<td>${status}</td>
<td><button onclick="deleteItem(${i.id})">Delete</button></td>
</tr>
`

})

document.getElementById("tableBody").innerHTML=html

}

async function addItem(){

const item_name=document.getElementById("item_name").value
const category=document.getElementById("category").value
const quantity=document.getElementById("quantity").value
const available_stoc=document.getElementById("available_stoc").value
const minimum_sto=document.getElementById("minimum_sto").value
const units=document.getElementById("units").value

await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`,{

method:"POST",

headers:{
"Content-Type":"application/json",
apikey:API_KEY,
Authorization:`Bearer ${API_KEY}`
},

body:JSON.stringify({
item_name,
category,
quantity,
available_stoc,
minimum_sto,
units
})

})

loadItems()

}

async function deleteItem(id){

await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${id}`,{

method:"DELETE",

headers:{
apikey:API_KEY,
Authorization:`Bearer ${API_KEY}`
}

})

loadItems()

}

loadItems()