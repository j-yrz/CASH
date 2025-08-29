/* ===================== */
/* BAGIAN 1 – Inisialisasi & Helper (FULL) */
/* ===================== */

const dateInput = document.getElementById("dateInput");
dateInput.value = new Date().toISOString().slice(0,10);

let members = JSON.parse(localStorage.getItem("members")) || [];
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
transactions = transactions.map(t => ({
  ...t,
  amount: Number(t.amount)||0,
  edited: t.edited||false,
  editHistory: t.editHistory||[]
}));

const memberSelect = document.getElementById("memberSelect");
const filterMember = document.getElementById("filterMember");
const amountInput = document.getElementById("amountInput");
const btnDeleteSelected = document.getElementById("btnDeleteSelected");
const tooltipDiv = document.getElementById("editTooltip");

amountInput.addEventListener("input", function(e){
  let cursorPos = this.selectionStart;
  let value = this.value.replace(/\D/g,'');
  this.value = value? Number(value).toLocaleString("id-ID"):"";
  this.setSelectionRange(cursorPos,cursorPos);
});

function formatRupiah(angka){ return "Rp "+angka.toLocaleString("id-ID"); }
function parseRupiah(str){ return Number(str.replace(/[^0-9]/g,""))||0; }

function saveData(){ 
  localStorage.setItem("transactions", JSON.stringify(transactions));
  localStorage.setItem("members", JSON.stringify(members));
}

function renderMembers(){
  memberSelect.innerHTML = '<option value="" disabled selected>Pilih anggota</option>';
  members.forEach(m=>{
    memberSelect.innerHTML += `<option value="${m}">${m}</option>`;
  });
  memberSelect.innerHTML += `<option value="+">+ Tambah Anggota</option>`;
  memberSelect.innerHTML += `<option value="-">- Hapus Anggota</option>`;

  const editMember = document.getElementById("editMember");
  if(editMember){
    editMember.innerHTML = "";
    members.forEach(m => editMember.innerHTML += `<option value="${m}">${m}</option>`);
  }

  filterMember.innerHTML = '<option value="all">Semua Anggota</option>';
  members.forEach(m => filterMember.innerHTML += `<option value="${m}">${m}</option>`);
}

function memberOptionChange(){
  const val = memberSelect.value;
  if(val === "+"){
    const name = prompt("Masukkan nama anggota baru:").trim();
    if(name && !members.includes(name)) {
      members.push(name);
      saveData(); renderMembers();
    }
  } else if(val === "-"){
    if(members.length===0){ alert("Tidak ada anggota tersisa!"); return; }
    const name = prompt(`Pilih anggota untuk dihapus:\n${members.join(", ")}`);
    if(name && members.includes(name)){
      if(confirm(`Hapus anggota "${name}" dari daftar?`)){
        members = members.filter(m => m!==name);
        saveData(); renderMembers();
      }
    }
  }
}

function renderChart(){
  const incomeTotal = transactions.filter(t=>t.type==="pemasukan").reduce((a,b)=>a+b.amount,0);
  const expenseTotal = transactions.filter(t=>t.type==="pengeluaran").reduce((a,b)=>a+b.amount,0);
  const total = incomeTotal + expenseTotal || 1;
  document.querySelector(".incomeBar").style.width = (incomeTotal/total*100)+"%";
  document.querySelector(".expenseBar").style.width = (expenseTotal/total*100)+"%";
}

/* ===================== */
/* Fungsi lihat riwayat edit saat klik (diedit) */
/* ===================== */
function showEditHistory(index){
  const t = transactions[index];
  if(!t.editHistory || t.editHistory.length===0) {
    alert("Belum ada riwayat edit.");
    return;
  }
  let msg = "Riwayat Edit:\n\n";
  t.editHistory.forEach(h=>{
    msg += `${h.date}\n`;
    h.changes.forEach(c => msg += `- ${c}\n`);
    msg += "\n";
  });
  alert(msg);
}
/* ===================== */
/* BAGIAN 2 – Fungsi Transaksi & Modal Edit (FULL) */
/* ===================== */

function addTransaction(){
  const date = dateInput.value;
  const desc = document.getElementById("descInput").value.trim();
  const amount = parseRupiah(document.getElementById("amountInput").value);
  const member = memberSelect.value;
  const source = document.getElementById("sourceInput").value.trim();
  const type = document.getElementById("typeInput").value;

  if(!desc || amount <= 0){
    alert("Isi semua field dengan benar!");
    return;
  }

  transactions.push({
    date,
    desc,
    amount,
    type,
    member: (member==="+"||member==="-")?"":member,
    source,
    edited:false,
    editHistory:[]
  });

  saveData();
  renderTable();

  document.getElementById("descInput").value = "";
  document.getElementById("amountInput").value = "";
  document.getElementById("sourceInput").value = "";
  document.getElementById("typeInput").value = "pemasukan";
  memberSelect.value = "";
}

function deleteSelected(){
  const checked = document.querySelectorAll(".rowCheckbox:checked");
  if(checked.length === 0){ alert("Tidak ada transaksi terpilih!"); return; }

  if(confirm(`Hapus ${checked.length} transaksi terpilih?`)){
    const indexes = Array.from(checked).map(c=>Number(c.dataset.index)).sort((a,b)=>b-a);
    indexes.forEach(i=>transactions.splice(i,1));
    saveData();
    renderTable();
    document.getElementById("selectAll").checked=false;
  }
}

function toggleSelectAll(cb){
  document.querySelectorAll(".rowCheckbox").forEach(c => c.checked = cb.checked);
  updateDeleteSelectedButton();
}

function updateDeleteSelectedButton(){
  const anyChecked = document.querySelectorAll(".rowCheckbox:checked").length > 0;
  btnDeleteSelected.style.display = anyChecked ? "inline-block" : "none";
}

/* ===================== */
/* Modal Edit            */
/* ===================== */
function openEditModal(i){
  const t = transactions[i];
  const modal = document.getElementById("editModal");
  modal.style.display = "block";
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Edit Transaksi</h3>
      <input type="date" id="editDate" value="${t.date}">
      <input type="text" id="editDesc" placeholder="Deskripsi" value="${t.desc}">
      <input type="text" id="editAmount" placeholder="Jumlah" value="${t.amount.toLocaleString("id-ID")}">
      <select id="editMember"></select>
      <input type="text" id="editSource" placeholder="Sumber Dana" value="${t.source}">
      <select id="editType">
        <option value="pemasukan" ${t.type==="pemasukan"?"selected":""}>Pemasukan</option>
        <option value="pengeluaran" ${t.type==="pengeluaran"?"selected":""}>Pengeluaran</option>
      </select>
      <button onclick="saveEdit(${i})">Simpan</button>
      <button onclick="closeModal()">Batal</button>
    </div>
  `;

  const editMember = document.getElementById("editMember");
  editMember.innerHTML = "";
  members.forEach(m => editMember.innerHTML += `<option value="${m}" ${t.member===m?"selected":""}>${m}</option>`);
}

function closeModal(){
  document.getElementById("editModal").style.display = "none";
}

function saveEdit(i){
  const t = transactions[i];
  const oldData = {...t};
  t.date = document.getElementById("editDate").value;
  t.desc = document.getElementById("editDesc").value.trim();
  t.amount = parseRupiah(document.getElementById("editAmount").value);
  t.member = document.getElementById("editMember").value;
  t.source = document.getElementById("editSource").value.trim();
  t.type = document.getElementById("editType").value;
  t.edited = true;

  // Catat riwayat edit
  const changes = [];
  if(oldData.date !== t.date) changes.push(`Tanggal: ${oldData.date} → ${t.date}`);
  if(oldData.desc !== t.desc) changes.push(`Deskripsi: ${oldData.desc} → ${t.desc}`);
  if(oldData.amount !== t.amount) changes.push(`Jumlah: ${formatRupiah(oldData.amount)} → ${formatRupiah(t.amount)}`);
  if(oldData.member !== t.member) changes.push(`Anggota: ${oldData.member} → ${t.member}`);
  if(oldData.source !== t.source) changes.push(`Sumber: ${oldData.source} → ${t.source}`);
  if(oldData.type !== t.type) changes.push(`Tipe: ${oldData.type} → ${t.type}`);
  if(changes.length>0){
    t.editHistory.push({date: new Date().toLocaleString(), changes});
  }

  saveData();
  renderTable();
  closeModal();
}
/* ===================== */
/* BAGIAN 3 – RenderTable, Tooltip, Filter, Export, Init (FULL) */
/* ===================== */

function renderTable(filtered=[]){
  const table = document.getElementById("transactionTable");
  table.innerHTML = "";
  let totalIncome=0, totalExpense=0;
  const data = filtered.length ? filtered : transactions;

  data.forEach((t,i)=>{
    if(t.type==="pemasukan") totalIncome+=t.amount;
    else totalExpense+=t.amount;

    const statusHTML = t.edited
      ? `<span class="statusCell" onclick="showEditHistory(${i})">(diedit)</span>`
      : "";

    table.innerHTML += `
      <tr>
        <td><input type="checkbox" class="rowCheckbox" data-index="${i}" onchange="updateDeleteSelectedButton()"></td>
        <td>${i+1}</td>
        <td>${t.date}</td>
        <td>${t.desc}</td>
        <td>${t.member||""}</td>
        <td>${t.source||""}</td>
        <td>${t.type==="pemasukan"?formatRupiah(t.amount):""}</td>
        <td>${t.type==="pengeluaran"?formatRupiah(t.amount):""}</td>
        <td>${statusHTML}</td>
        <td><button class="aksi-btn" onclick="openEditModal(${i})">✏️</button></td>
      </tr>`;
  });

  document.getElementById("totalIncome").innerText = formatRupiah(totalIncome);
  document.getElementById("totalExpense").innerText = formatRupiah(totalExpense);
  document.getElementById("balance").innerText = formatRupiah(totalIncome - totalExpense);
  renderChart();
  updateDeleteSelectedButton();
}

/* ===================== */
/* Tooltip detail edit hover (optional) */
/* ===================== */
function showTooltip(e, index){
  const t = transactions[index];
  if(!t.editHistory || t.editHistory.length===0) return;

  let html = "<strong>Riwayat Edit:</strong><br>";
  t.editHistory.forEach((h,i)=>{
    html += `<em>${h.date}</em><br>`;
    h.changes.forEach(c=>{
      html += `&nbsp;&nbsp;- ${c}<br>`;
    });
  });

  tooltipDiv.innerHTML = html;
  tooltipDiv.style.display = "block";
  tooltipDiv.style.opacity = "1";
  const rect = e.target.getBoundingClientRect();
  tooltipDiv.style.top = rect.bottom + window.scrollY + 5 + "px";
  tooltipDiv.style.left = rect.left + window.scrollX + "px";
}

function hideTooltip(){
  tooltipDiv.style.opacity = "0";
  setTimeout(()=>tooltipDiv.style.display="none", 300);
}

/* ===================== */
/* Filter dan Export     */
/* ===================== */
function applyFilter(){
  let fMember = filterMember.value;
  let fType = document.getElementById("filterType").value;
  let filtered = transactions.filter(t=>{
    return (fMember==="all" || t.member===fMember) && (fType==="all" || t.type===fType);
  });
  renderTable(filtered);
}

function exportExcel(){
  let csv = "Tanggal,Deskripsi,Anggota,Sumber Dana,Pemasukan,Pengeluaran\n";
  transactions.forEach(t=>{
    csv += `${t.date},${t.desc},${t.member||""},${t.source||""},${t.type==="pemasukan"?t.amount:""},${t.type==="pengeluaran"?t.amount:""}\n`;
  });
  let blob = new Blob([csv], { type: "text/csv" });
  let url = window.URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url;
  a.download = "laporan_keuangan.csv";
  a.click();
}

/* ===================== */
/* Init                  */
/* ===================== */
renderMembers();
renderTable();
