// ---------- CONFIG ----------
const SUPABASE_URL="https://lmyizgwxxdfmwvwlvlum.supabase.co";
const API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxteWl6Z3d4eGRmbXd2d2x2bHVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2ODcwNTQsImV4cCI6MjA4ODI2MzA1NH0.7ffes53M8XXQuIAAS_80-RPqVHCI56NIyw79T3uxk2w"
const TABLE="Stock";
const supabaseClient = supabase.createClient(SUPABASE_URL, API_KEY)
let editId = null;
//login///
async function login(){

const email = document.getElementById("loginEmail").value
const password = document.getElementById("loginPassword").value

const { data, error } = await supabaseClient.auth.signInWithPassword({
email: email,
password: password
})

if(error){
alert("Login failed: " + error.message)
return
}

document.getElementById("loginScreen").style.display = "none"
document.getElementById("dashboard").style.display = "block"

loadItems()

}
async function checkSession(){

const { data, error } = await supabaseClient.auth.getSession()

if(data && data.session){
document.getElementById("loginScreen").style.display="none"
document.getElementById("dashboard").style.display="block"
loadItems()
}

}

// --- Modal Functions ---
function openModal(data = null) {
    document.getElementById("modal").style.display = "flex";
    if (data) {
        document.getElementById("modalTitle").innerText = "Edit Item";
        document.getElementById("modalItem").value = data.item_name;
        document.getElementById("modalCategory").value = data.category;
        document.getElementById("modalAvailableStock").value = data.available_stock;
        document.getElementById("modalMinStock").value = data.minimum_stock;
        document.getElementById("modalUnits").value = data.units;
        editId = data.id;
    } else {
        document.getElementById("modalTitle").innerText = "Add Item";
        document.getElementById("modalItem").value = "";
        document.getElementById("modalCategory").value = "";
       // document.getElementById("modalQty").value = "";
        document.getElementById("modalAvailableStock").value = "";
        document.getElementById("modalMinStock").value = "";
        document.getElementById("modalUnits").value = "";
        editId = null;
    }
}

function closeModal() { document.getElementById("modal").style.display = "none"; }

function showToast(msg) {
    Toastify({
        text: msg,
        duration: 2500,
        gravity: "top",
        position: "right",
        style: { background: "#00c853" }
    }).showToast();
}

// --- CRUD ---
async function loadItems(){

const search = document.getElementById("search").value || "";
const category = document.getElementById("categoryFilter").value || "";

let url = `${SUPABASE_URL}/rest/v1/${TABLE}?select=*`;

if (search) {
url += `&or=(item_name.ilike.*${search}*,category.ilike.*${search}*)`;
}

if(category){
url += `&category=eq.${category}`;
}

const res = await fetch(url,{
headers:{
apikey:API_KEY,
Authorization:`Bearer ${API_KEY}`
}
})

const data = await res.json()

renderTable(data)

}

function renderTable(data){
  const tableBody = document.getElementById("tableBody");
  tableBody.innerHTML = "";

  data.forEach(i => {

    const available = Number(i.available_stock);
    const minimum = Number(i.minimum_stock);
    const isLow = available < minimum;

    const row = document.createElement("tr");
    if(isLow) row.classList.add("low");

    row.innerHTML = `
      <td contenteditable="true" onblur="updateField('${i.id}','item_name',this.innerText)">${i.item_name}</td>

      <td contenteditable="true" onblur="updateField('${i.id}','category',this.innerText)">${i.category}</td>

      <td>
        <button class="qty-btn" onclick="changeQty('${i.id}',${available-1})">-</button>
        <span class="qty">${available}</span>
        <button class="qty-btn" onclick="changeQty('${i.id}',${available+1})">+</button>
      </td>

      <td contenteditable="true" onblur="updateField('${i.id}','minimum_stock',this.innerText)">
      ${minimum}
      </td>

      <td contenteditable="true" onblur="updateField('${i.id}','units',this.innerText)">
      ${i.units}
      </td>

      <td>${isLow ? "Low" : "OK"}</td>

      <td>
        <button class="btn-delete" onclick="deleteItem('${i.id}')">Delete</button>
      </td>
    `;

    tableBody.appendChild(row);
  });
}
//////////////////
function populateCategoryFilter(data){

const select = document.getElementById("categoryFilter")

let categories = [...new Set(data.map(i => i.category))]

select.innerHTML = `<option value="">All Categories</option>`

categories.forEach(cat=>{
const opt = document.createElement("option")
opt.value = cat
opt.textContent = cat
select.appendChild(opt)
})
}
// --- Save Item ---
async function saveItem() {
  const item_name = document.getElementById("modalItem").value.trim();
  const category = document.getElementById("modalCategory").value.trim();
  const available_stock = Number(document.getElementById("modalAvailableStock").value);
  const minimum_stock = Number(document.getElementById("modalMinStock").value);
  const units = document.getElementById("modalUnits").value.trim();

  // Validate all fields
  if(!item_name || !category || !units || isNaN(available_stock) || isNaN(minimum_stock)){
    alert("Please fill all fields correctly.");
    return;
  }

  // Only send the exact fields that exist in your table
  const payload = { item_name, category, available_stock, minimum_stock, units };

  let url = `${SUPABASE_URL}/rest/v1/${TABLE}`;
  let method = "POST";

  if(editId){
    url += `?id=eq.${editId}`;
    method = "PATCH";
  }

  const res = await fetch(url, {
    method: method,
    headers: {
      "Content-Type": "application/json",
      "apikey": API_KEY,
      "Authorization": `Bearer ${API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if(!res.ok){
    const errorData = await res.text(); // or await res.json() if JSON
    console.error("Supabase error:", errorData);
    alert("Error saving item. Check console for details.");
    return;
  }

  showToast(editId ? "Item updated" : "Item added");
  closeModal();
  loadItems();
}
// --- Edit helper ---
async function openModalById(id) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${id}`, {
        headers: { apikey: API_KEY, Authorization: `Bearer ${API_KEY}` }
    });
    const data = await res.json();
    openModal(data[0]);
}

// --- Delete ---
async function deleteItem(id) {
    if (confirm("Are you sure to delete this item?")) {
        await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${id}`, {
            method: "DELETE",
            headers: { apikey: API_KEY, Authorization: `Bearer ${API_KEY}` }
        });
        showToast("Item deleted");
        loadItems();
    }
}
//<!-------------------->
async function updateField(id, field, value){

  const payload = {}
  payload[field] = value

  await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${id}`,{
    method:"PATCH",
    headers:{
      "Content-Type":"application/json",
      apikey:API_KEY,
      Authorization:`Bearer ${API_KEY}`
    },
    body:JSON.stringify(payload)
  })

  showToast("Updated")
  loadItems()
}
async function changeQty(id,newQty){

  if(newQty < 0) newQty = 0

  await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${id}`,{
    method:"PATCH",
    headers:{
      "Content-Type":"application/json",
      apikey:API_KEY,
      Authorization:`Bearer ${API_KEY}`
    },
    body:JSON.stringify({
      available_stock:newQty
    })
  })

  loadItems()
}

// --- Send WhatsApp Low Stock ---
async function sendLowStockWhatsApp1() {
    // Fetch all items
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?select=item_name,available_stock,minimum_stock`, {
        headers: { apikey: API_KEY, Authorization: `Bearer ${API_KEY}` }
    });
    const data = await res.json();
    
    // Filter low-stock items
    const lowItems = data
        .filter(i => Number(i.available_stock) < Number(i.minimum_stock))
        .map(i => `${i.item_name} (${i.available_stock}/${i.minimum_stock})`);
    
    if(lowItems.length === 0){
        alert("✅ No low-stock items.");
        return;
    }

    // Compose WhatsApp message
    const message = `⚠️ Low Stock Alert:\n${lowItems.join("\n")}`;

    // Replace with your WhatsApp number (country code, no +)
    const phoneNumber = "917760530532"; 

    // Open WhatsApp link (WhatsApp Web or mobile app)
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
}
////////
async function sendLowStockWhatsApp(){

const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?select=item_name,available_stock,minimum_stock`,{
headers:{apikey:API_KEY,Authorization:`Bearer ${API_KEY}`}
})

const data = await res.json()

const lowStock = []
const availableStock = []

data.forEach(i=>{

const available = Number(i.available_stock)
const minimum = Number(i.minimum_stock)

if(available < minimum){
lowStock.push(`⚠️ *${i.item_name}*  (${available}/${minimum})`)
}else{
availableStock.push(`✅ *${i.item_name}*  (${available})`)
}

})

if(lowStock.length === 0 && availableStock.length === 0){
alert("No inventory data")
return
}

const message =
`📦 *INVENTORY STATUS REPORT*

━━━━━━━━━━━━━━
🚨 *LOW STOCK ITEMS*
━━━━━━━━━━━━━━

${lowStock.length ? lowStock.join("\n") : "✅ None"}

━━━━━━━━━━━━━━
📦 *AVAILABLE STOCK*
━━━━━━━━━━━━━━

${availableStock.length ? availableStock.join("\n") : "No items"}

━━━━━━━━━━━━━━
⚡ *Action Required:* Restock low items immediately.
`

const url =
`https://wa.me/?text=${encodeURIComponent(message)}`

window.open(url,"_blank")

}
async function loadCategories(){

const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?select=category`,{
headers:{
apikey:API_KEY,
Authorization:`Bearer ${API_KEY}`
}
})

const data = await res.json()

const categories = [...new Set(data.map(i => i.category))]

const select = document.getElementById("categoryFilter")

if(!select) return

select.innerHTML = `<option value="">All Categories</option>`

categories.forEach(cat=>{
const opt = document.createElement("option")
opt.value = cat
opt.textContent = cat
select.appendChild(opt)
})

}
////////////////////
async function logout(){

await supabaseClient.auth.signOut()

document.getElementById("dashboard").style.display="none"
document.getElementById("loginScreen").style.display="flex"

}
///////////////////////
async function checkSession(){

const { data } = await supabaseClient.auth.getSession()

if(data.session){
document.getElementById("loginScreen").style.display="none"
document.getElementById("dashboard").style.display="block"
loadItems()
}else{
document.getElementById("loginScreen").style.display="flex"
document.getElementById("dashboard").style.display="none"
}

}
// --- Events ---
document.addEventListener("DOMContentLoaded", () => {

checkSession()

document.getElementById("search")
.addEventListener("input", loadItems)

const categoryFilter = document.getElementById("categoryFilter")

if(categoryFilter){
categoryFilter.addEventListener("change", loadItems)
}

loadCategories()
loadItems()

})