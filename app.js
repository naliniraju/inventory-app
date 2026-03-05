// ---------- CONFIG ----------
const SUPABASE_URL="https://lmyizgwxxdfmwvwlvlum.supabase.co";
const API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxteWl6Z3d4eGRmbXd2d2x2bHVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2ODcwNTQsImV4cCI6MjA4ODI2MzA1NH0.7ffes53M8XXQuIAAS_80-RPqVHCI56NIyw79T3uxk2w"
const TABLE="Stock";

let editId = null;

// --- Modal Functions ---
function openModal(data=null){
  document.getElementById("modal").style.display="flex";
  if(data){
    document.getElementById("modalTitle").innerText="Edit Item";
    document.getElementById("modalItem").value = data.item_name;
    document.getElementById("modalCategory").value = data.category;
    document.getElementById("modalQty").value = data.quantity;
    document.getElementById("modalAvailableStock").value = data.available_stoc;
    document.getElementById("modalMinStock").value = data.minimum_sto;
    document.getElementById("modalUnits").value = data.units;
    editId = data.id;
  } else {
    document.getElementById("modalTitle").innerText="Add Item";
    document.getElementById("modalItem").value = "";
    document.getElementById("modalCategory").value = "";
    document.getElementById("modalQty").value = "";
    document.getElementById("modalAvailableStock").value = "";
    document.getElementById("modalMinStock").value = "";
    document.getElementById("modalUnits").value = "";
    editId = null;
  }
}

function closeModal(){document.getElementById("modal").style.display="none";}
function showToast(msg){Toastify({text:msg,duration:2500,gravity:"top",position:"right",style:{background:"#00c853"}}).showToast();}

// --- CRUD ---
async function loadItems(){
  const search=document.getElementById("search").value || "";
  let url=`${SUPABASE_URL}/rest/v1/${TABLE}?select=*`;
  if(search) url+=`&item_name=ilike.*${search}*`;

  const res = await fetch(url, {
    headers: {apikey: API_KEY, Authorization: `Bearer ${API_KEY}`}
  });
  const data = await res.json();
  renderTable(data);
}

function renderTable(data){
  const tableBody = document.getElementById("tableBody");
  tableBody.innerHTML = "";
  data.forEach(i=>{
    const status = i.available_stock <= i.minimum_sto ? "<span class='low'>Low</span>" : "OK";
    const row = document.createElement("tr");
    if(i.available_stock <= i.minimum_sto) row.classList.add("low");
    row.innerHTML = `
      <td>${i.item_name}</td>
      <td>${i.category}</td>
      <td>${i.quantity}</td>
      <td>${i.available_stock}</td>
      <td>${i.minimum_stock}</td>
      <td>${i.units}</td>
      <td>${status}</td>
      <td>
        <button class="btn-edit" onclick='openModal(${JSON.stringify(i)})'>Edit</button>
        <button class="btn-delete" onclick="deleteItem('${i.id}')">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

async function saveItem(){
  const item_name = document.getElementById("modalItem").value;
  const category = document.getElementById("modalCategory").value;
  const quantity = Number(document.getElementById("modalQty").value);
  const available_stock = Number(document.getElementById("modalAvailableStock").value);
  const minimum_stock = Number(document.getElementById("modalMinStock").value);
  const units = document.getElementById("modalUnits").value;

  if(editId){
    await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${editId}`, {
      method:"PATCH",
      headers:{"Content-Type":"application/json", apikey:API_KEY, Authorization:`Bearer ${API_KEY}`},
      body: JSON.stringify({item_name, category, quantity, available_stock, minimum_stock, units})
    });
    showToast("Item updated");
  } else {
    await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
      method:"POST",
      headers:{"Content-Type":"application/json", apikey:API_KEY, Authorization:`Bearer ${API_KEY}`},
      body: JSON.stringify({item_name, category, quantity, available_stock, minimum_stock, units})
    });
    showToast("Item added");
  }
  closeModal();
  loadItems();
}

async function deleteItem(id){
  if(confirm("Are you sure to delete this item?")){
    await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${id}`,{
      method:"DELETE",
      headers:{apikey:API_KEY, Authorization:`Bearer ${API_KEY}`}
    });
    showToast("Item deleted");
    loadItems();
  }
}

// --- Low Stock Email Placeholder ---
function sendLowStockEmail(){
  alert("For frontend-only version, sending email requires a backend (Supabase Edge Functions or Firebase Functions).");
}

// --- Events ---
document.getElementById("search").addEventListener("input", loadItems);
document.addEventListener("DOMContentLoaded", loadItems);