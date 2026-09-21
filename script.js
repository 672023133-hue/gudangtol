// ==========================================
// 0. KONFIGURASI AUTHENTICATION & LOGIN
// ==========================================

const VALID_USER = {
  username: "gudang_operasional",
  password: "123456",
  nama: "Petugas Gudang Operasional",
  role: "Administrator Gudang",
  avatar: "GO"
};

document.addEventListener("DOMContentLoaded", () => {
  initAuth();
  checkAuthSession();
});

function initAuth() {
  const formLogin = document.getElementById("formLogin");
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("loginPassword");

  if (formLogin) {
    formLogin.addEventListener("submit", handleLogin);
  }

  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";
      togglePassword.textContent = isPassword ? "🙈" : "👁️";
    });
  }
}

function checkAuthSession() {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  if (isLoggedIn) {
    showMainApp();
  } else {
    showLoginPage();
  }
}

function handleLogin(event) {
  if (event) event.preventDefault();

  const u = document.getElementById("loginUsername")?.value.trim();
  const p = document.getElementById("loginPassword")?.value;

  hideError();

  if (!u || !p) {
    showError("Username dan password wajib diisi.");
    return;
  }

  if (u === VALID_USER.username && p === VALID_USER.password) {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userName", VALID_USER.nama);
    localStorage.setItem("userRole", VALID_USER.role);
    localStorage.setItem("userAvatar", VALID_USER.avatar);

    showMainApp();
  } else {
    showError("Username atau password salah.");
  }
}

function handleLogout() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userName");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userAvatar");

  showLoginPage();
}

function showMainApp() {
  const loginPage = document.getElementById("loginPage");
  const mainApp = document.getElementById("appMain");

  if (loginPage) loginPage.style.display = "none";
  if (mainApp) mainApp.style.display = "flex";

  const nameEl = document.getElementById("userDisplayName");
  const roleEl = document.getElementById("userRoleDisplay");
  const avatarEl = document.getElementById("userAvatar");

  if (nameEl) nameEl.textContent = localStorage.getItem("userName") || VALID_USER.nama;
  if (roleEl) roleEl.textContent = localStorage.getItem("userRole") || VALID_USER.role;
  if (avatarEl) avatarEl.textContent = localStorage.getItem("userAvatar") || VALID_USER.avatar;

  if (typeof renderAll === "function") {
    renderAll();
  }
}

function showLoginPage() {
  const loginPage = document.getElementById("loginPage");
  const mainApp = document.getElementById("appMain");
  const formLogin = document.getElementById("formLogin");

  if (loginPage) loginPage.style.display = "flex";
  if (mainApp) mainApp.style.display = "none";
  if (formLogin) formLogin.reset();

  hideError();
}

function showError(message) {
  const errBox = document.getElementById("loginError");
  if (errBox) {
    errBox.textContent = message;
    errBox.style.display = "block";
  }
}

function hideError() {
  const errBox = document.getElementById("loginError");
  if (errBox) {
    errBox.textContent = "";
    errBox.style.display = "none";
  }
}
// ==========================================
// 1. INITIALIZATION & NAVIGASI HALAMAN
// ==========================================

let daftarBarang = JSON.parse(localStorage.getItem('daftarBarang')) || [];
let riwayatLaporan = JSON.parse(localStorage.getItem('riwayatLaporan')) || [];
let aktivitasDashboard = JSON.parse(localStorage.getItem('aktivitasDashboard')) || [];

let tempPOItems = [];
let tempMutasiItems = JSON.parse(localStorage.getItem('tempMutasiItems')) || [];
let lastProcessedMutasi = null;

document.addEventListener('DOMContentLoaded', () => {
  const today = getTodayDateString();
  if (document.getElementById('tglPO')) document.getElementById('tglPO').value = today;
  if (document.getElementById('tglMutasi')) document.getElementById('tglMutasi').value = today;

  checkAuthSession();
});

function renderAll() {
  renderTabelBarang();
  populateSelectBarang();
  updateDashboard();
  renderTabelLaporan();
  renderTabelPO();
  renderTabelMutasi();
  renderRiwayatStock();
}

function simpanData() {
  localStorage.setItem('daftarBarang', JSON.stringify(daftarBarang));
  localStorage.setItem('riwayatLaporan', JSON.stringify(riwayatLaporan));
  localStorage.setItem('aktivitasDashboard', JSON.stringify(aktivitasDashboard));
}

function showPage(pageId, el) {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));

  const targetPage = document.getElementById(pageId);
  if (targetPage) targetPage.classList.add('active');

  document.querySelectorAll('.sidebar .nav').forEach(item => item.classList.remove('active'));

  if (el) {
    el.classList.add('active');
  } else {
    const navs = document.querySelectorAll('.sidebar .nav');
    const indexMap = { 'dashboard': 0, 'master': 1, 'masuk': 2, 'keluar': 3, 'mutasi': 4, 'riwayatStock': 5, 'laporan': 6 };
    if (navs[indexMap[pageId]]) navs[indexMap[pageId]].classList.add('active');
  }

  if (pageId === 'dashboard') updateDashboard();
  if (pageId === 'laporan') renderTabelLaporan();
  if (pageId === 'keluar' || pageId === 'master') filterDaftarBarang();
  if (pageId === 'riwayatStock') renderRiwayatStock();
}

// ==========================================
// 2. HELPER FUNCTIONS
// ==========================================

function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getTodayDateString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function catatAktivitasDashboard(tipe, detail) {
  aktivitasDashboard.unshift({
    tanggal: getTodayDateString(),
    tipe,
    detail,
    waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  });
  if (aktivitasDashboard.length > 15) aktivitasDashboard.pop();
  simpanData();
}

function filterTable(inputEl, tableId) {
  if (!inputEl) return;
  const filter = inputEl.value.toLowerCase();
  const rows = document.querySelectorAll(`#${tableId} tbody tr`);
  rows.forEach(row => {
    const text = row.innerText.toLowerCase();
    row.style.display = text.includes(filter) ? '' : 'none';
  });
}

// ==========================================
// 3. MASTER BARANG (INPUT, EDIT, HAPUS & TABEL)
// ==========================================

function tambahBarangBaru(e) {
  if (e) e.preventDefault();

  const nama = document.getElementById('namaBarangBaru')?.value.trim();
  const satuan = document.getElementById('satuanBarangBaru')?.value || 'Unit';
  const stokAwal = parseInt(document.getElementById('stokBarangBaru')?.value, 10) || 0;
  const minStok = parseInt(document.getElementById('minStokBarangBaru')?.value, 10) || 5;

  if (!nama) {
    alert('Nama barang wajib diisi!');
    return;
  }

  const ada = daftarBarang.some(b => b.nama.toLowerCase() === nama.toLowerCase());
  if (ada) {
    alert('Barang dengan nama tersebut sudah terdaftar!');
    return;
  }

  daftarBarang.push({
    nama,
    satuan,
    stokAwal: stokAwal,
    stok: stokAwal,
    minStok: minStok
  });

  catatAktivitasDashboard('Barang Baru', `${nama} (${stokAwal} ${satuan})`);
  simpanData();
  renderAll();

  document.getElementById('formBarangBaru')?.reset();
  alert(`Barang "${nama}" berhasil disimpan!`);
}

function editBarang(index) {
  const item = daftarBarang[index];
  if (!item) return;

  const namaBaru = prompt('Masukkan Nama Barang Baru:', item.nama);
  if (namaBaru === null) return;
  const namaTrimmed = namaBaru.trim();
  if (!namaTrimmed) {
    alert('Nama barang tidak boleh kosong!');
    return;
  }

  if (namaTrimmed.toLowerCase() !== item.nama.toLowerCase()) {
    const ada = daftarBarang.some((b, i) => i !== index && b.nama.toLowerCase() === namaTrimmed.toLowerCase());
    if (ada) {
      alert('Nama barang tersebut sudah digunakan oleh barang lain!');
      return;
    }
  }

  const minStokBaru = prompt('Masukkan Stok Minimal Baru:', item.minStok);
  if (minStokBaru === null) return;
  const minStokParsed = parseInt(minStokBaru, 10);

  const namaLama = item.nama;
  item.nama = namaTrimmed;
  item.minStok = isNaN(minStokParsed) ? item.minStok : Math.max(0, minStokParsed);

  if (namaLama !== namaTrimmed) {
    riwayatLaporan.forEach(r => {
      if (r.namaBarang && r.namaBarang.toLowerCase() === namaLama.toLowerCase()) {
        r.namaBarang = namaTrimmed;
      }
    });
  }

  catatAktivitasDashboard('Edit Barang', `Memperbarui data ${namaTrimmed}`);
  simpanData();
  renderAll();
  alert(`Data barang "${namaTrimmed}" berhasil diperbarui!`);
}

function renderTabelBarang() {
  const masterTbody = document.querySelector('#masterTable tbody');

  if (daftarBarang.length === 0) {
    const emptyHtml = '<tr><td colspan="6" style="text-align:center; color:#888; padding:12px;">Belum ada data barang.</td></tr>';
    if (masterTbody) masterTbody.innerHTML = emptyHtml;
    filterDaftarBarang();
    return;
  }

  const htmlMaster = daftarBarang.map((item, index) => {
    const isKritis = item.stok <= item.minStok;
    const statusBadge = item.stok === 0
      ? '<span style="color:#dc2626; font-weight:bold;">❌ Habis</span>'
      : isKritis
      ? '<span style="color:#d97706; font-weight:bold;">⚠️ Mau Habis</span>'
      : '<span style="color:#16a34a; font-weight:bold;">✅ Aman</span>';

    return `
      <tr>
        <td><b>${escapeHtml(item.nama)}</b></td>
        <td>${escapeHtml(item.satuan)}</td>
        <td><b>${item.stok}</b></td>
        <td>${item.minStok}</td>
        <td>${statusBadge}</td>
        <td>
          <button style="padding:4px 8px; font-size:11px; background-color:#2563eb; color:white; border:none; border-radius:4px; cursor:pointer; margin-right:4px;" onclick="editBarang(${index})">Edit</button>
          <button style="padding:4px 8px; font-size:11px; background-color:#dc2626; color:white; border:none; border-radius:4px; cursor:pointer;" onclick="hapusBarang(${index})">Hapus</button>
        </td>
      </tr>
    `;
  }).join('');

  if (masterTbody) masterTbody.innerHTML = htmlMaster;
  filterDaftarBarang();
  populateSelectBarang();
}

function filterDaftarBarang() {
  const statusFilter = document.getElementById('filterStatusStok')?.value || 'all';
  const keyword = document.getElementById('searchDaftarBarang')?.value.toLowerCase().trim() || '';
  const tbody = document.querySelector('#tabelDaftarBarang tbody');

  if (!tbody) return;

  const filtered = daftarBarang
    .map((item, originalIndex) => ({ ...item, originalIndex }))
    .filter(item => {
      const matchSearch = item.nama.toLowerCase().includes(keyword);
      let matchStatus = true;

      if (statusFilter === 'low') matchStatus = item.stok <= item.minStok && item.stok > 0;
      else if (statusFilter === 'out') matchStatus = item.stok === 0;
      else if (statusFilter === 'safe') matchStatus = item.stok > item.minStok;

      return matchSearch && matchStatus;
    });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#888; padding:12px;">Tidak ada data yang sesuai filter.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(item => {
    const isKritis = item.stok <= item.minStok;
    const statusBadge = item.stok === 0
      ? '<span style="color:#dc2626; font-weight:bold;">❌ Habis</span>'
      : isKritis
      ? '<span style="color:#d97706; font-weight:bold;">⚠️ Mau Habis</span>'
      : '<span style="color:#16a34a; font-weight:bold;">✅ Aman</span>';

    return `
      <tr>
        <td><b>${escapeHtml(item.nama)}</b></td>
        <td>${escapeHtml(item.satuan)}</td>
        <td><b>${item.stok}</b></td>
        <td>${item.minStok}</td>
        <td>${statusBadge}</td>
        <td>
          <button style="padding:4px 8px; font-size:11px; background-color:#2563eb; color:white; border:none; border-radius:4px; cursor:pointer; margin-right:4px;" onclick="editBarang(${item.originalIndex})">Edit</button>
          <button style="padding:4px 8px; font-size:11px; background-color:#dc2626; color:white; border:none; border-radius:4px; cursor:pointer;" onclick="hapusBarang(${item.originalIndex})">Hapus</button>
        </td>
      </tr>
    `;
  }).join('');
}

function hapusBarang(index) {
  const item = daftarBarang[index];
  if (!item) return;

  if (confirm(`Apakah Anda yakin ingin menghapus "${item.nama}"?`)) {
    daftarBarang.splice(index, 1);
    catatAktivitasDashboard('Hapus Barang', `${item.nama} dihapus dari sistem.`);
    simpanData();
    renderAll();
  }
}

function populateSelectBarang() {
  const selectPO = document.getElementById('selectBarangPO');
  const selectMutasi = document.getElementById('selectBarangMutasi');

  const optionsHTML = '<option value="" disabled selected>-- Pilih Barang Terdaftar --</option>' +
    daftarBarang.map(b => `<option value="${escapeHtml(b.nama)}" data-satuan="${escapeHtml(b.satuan)}" data-stok="${b.stok}">${escapeHtml(b.nama)} (Stok: ${b.stok} ${b.satuan})</option>`).join('');

  if (selectPO) selectPO.innerHTML = optionsHTML;
  if (selectMutasi) selectMutasi.innerHTML = optionsHTML;
}

// ==========================================
// 4. MODAL & PURCHASE ORDER (PO MASUK)
// ==========================================

function bukaModalQty() {
  const select = document.getElementById('selectBarangPO');
  const namaBarang = select?.value;

  if (!namaBarang) {
    alert('Silakan pilih barang terlebih dahulu!');
    return;
  }

  const barang = daftarBarang.find(b => b.nama.toLowerCase() === namaBarang.toLowerCase());
  if (!barang) return;

  if (document.getElementById('modalItemTitle')) document.getElementById('modalItemTitle').innerText = barang.nama;
  if (document.getElementById('modalSubName')) document.getElementById('modalSubName').innerText = barang.satuan;
  if (document.getElementById('modalMainName')) document.getElementById('modalMainName').innerText = barang.nama;
  if (document.getElementById('modalInStock')) document.getElementById('modalInStock').innerText = `${barang.stok} ${barang.satuan}`;
  if (document.getElementById('inputModalQty')) document.getElementById('inputModalQty').value = 1;

  const modal = document.getElementById('modalQty');
  if (modal) modal.style.display = 'flex';
}

function tutupModalQty() {
  const modal = document.getElementById('modalQty');
  if (modal) modal.style.display = 'none';
}

function tambahKeDaftarPO() {
  const select = document.getElementById('selectBarangPO');
  const namaBarang = select?.value;
  const qtyInput = parseInt(document.getElementById('inputModalQty')?.value, 10) || 0;

  if (!namaBarang || qtyInput <= 0) {
    alert('Jumlah barang harus lebih dari 0!');
    return;
  }

  const barang = daftarBarang.find(b => b.nama.toLowerCase() === namaBarang.toLowerCase());
  if (!barang) return;

  const existingIndex = tempPOItems.findIndex(i => i.nama.toLowerCase() === namaBarang.toLowerCase());
  if (existingIndex > -1) {
    tempPOItems[existingIndex].qty += qtyInput;
  } else {
    tempPOItems.push({
      nama: barang.nama,
      stokSistem: barang.stok,
      qty: qtyInput
    });
  }

  renderTabelPO();
  tutupModalQty();
}

function renderTabelPO() {
  const tbody = document.querySelector('#tabelItemPO tbody');
  if (!tbody) return;

  if (tempPOItems.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#888; padding:12px;">Belum ada item ditambahkan.</td></tr>';
    return;
  }

  tbody.innerHTML = tempPOItems.map((item, index) => `
    <tr>
      <td><b>${escapeHtml(item.nama)}</b></td>
      <td>${item.stokSistem}</td>
      <td><b style="color:#16a34a;">+${item.qty}</b></td>
      <td><button class="btn secondary" style="padding:4px 8px; font-size:11px;" onclick="hapusItemPO(${index})">Hapus</button></td>
    </tr>
  `).join('');
}

function hapusItemPO(index) {
  tempPOItems.splice(index, 1);
  renderTabelPO();
}

function simpanPO() {
  const tglPO = document.getElementById('tglPO')?.value;

  if (!tglPO) {
    alert('Tanggal PO wajib diisi!');
    return;
  }

  if (tempPOItems.length === 0) {
    alert('Daftar item PO masih kosong!');
    return;
  }

  tempPOItems.forEach(item => {
    const barang = daftarBarang.find(b => b.nama.toLowerCase() === item.nama.toLowerCase());
    if (barang) {
      barang.stok += item.qty;
    }

    riwayatLaporan.unshift({
      tanggal: tglPO,
      tipe: 'PO',
      namaBarang: item.nama,
      qty: item.qty,
      keterangan: 'PO Masuk'
    });

    catatAktivitasDashboard('PO Masuk', `${item.nama} (+${item.qty})`);
  });

  simpanData();
  tempPOItems = [];
  renderAll();

  alert('Transaksi PO berhasil disimpan dan stok telah diperbarui!');
}

// ==========================================
// 5. MUTASI BARANG (TAMBAH, DRAFT, PROSES, CETAK)
// ==========================================

function tambahItemMutasi(e) {
  if (e) e.preventDefault();

  const select = document.getElementById('selectBarangMutasi');
  const namaBarang = select?.value;
  const qty = parseInt(document.getElementById('qtyMutasi')?.value, 10) || 0;
  const ket = document.getElementById('ketMutasi')?.value.trim() || '';
  const tgl = document.getElementById('tglMutasi')?.value || getTodayDateString();
  const tujuan = document.getElementById('tujuanMutasi')?.value || '';

  if (!namaBarang || qty <= 0 || !tujuan) {
    alert('Pilih barang, tujuan gerbang tol, dan masukkan jumlah yang valid!');
    return;
  }

  const barang = daftarBarang.find(b => b.nama.toLowerCase() === namaBarang.toLowerCase());
  if (!barang) return;

  const existingTempQty = tempMutasiItems
    .filter(i => i.nama.toLowerCase() === barang.nama.toLowerCase())
    .reduce((acc, i) => acc + i.qty, 0);

  if (qty + existingTempQty > barang.stok) {
    alert(`Stok tidak mencukupi! Stok fisik ${barang.nama} saat ini: ${barang.stok} (Sisa tersedia: ${barang.stok - existingTempQty})`);
    return;
  }

  tempMutasiItems.push({
    nama: barang.nama,
    satuan: barang.satuan,
    qty: qty,
    tgl: tgl,
    tujuan: tujuan,
    ket: ket
  });

  renderTabelMutasi();
  if (document.getElementById('qtyMutasi')) document.getElementById('qtyMutasi').value = '';
  if (document.getElementById('ketMutasi')) document.getElementById('ketMutasi').value = '';
}

function renderTabelMutasi() {
  const tbody = document.querySelector('#tabelDaftarMutasi tbody');
  if (!tbody) return;

  if (tempMutasiItems.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#888; padding:12px;">Belum ada item ditambahkan ke mutasi.</td></tr>';
    return;
  }

  tbody.innerHTML = tempMutasiItems.map((item, index) => `
    <tr>
      <td><b>${escapeHtml(item.nama)}</b></td>
      <td>${escapeHtml(item.tujuan)}</td>
      <td><b style="color:#dc2626;">-${item.qty}</b></td>
      <td>${escapeHtml(item.satuan)}</td>
      <td>${item.tgl}</td>
      <td><button class="btn secondary" style="padding:4px 8px; font-size:11px;" onclick="hapusItemMutasi(${index})">Hapus</button></td>
    </tr>
  `).join('');
}

function hapusItemMutasi(index) {
  tempMutasiItems.splice(index, 1);
  localStorage.setItem('tempMutasiItems', JSON.stringify(tempMutasiItems));
  renderTabelMutasi();
}

function simpanDraftMutasi() {
  if (tempMutasiItems.length === 0) {
    alert('Belum ada item mutasi untuk disimpan!');
    return;
  }
  localStorage.setItem('tempMutasiItems', JSON.stringify(tempMutasiItems));
  alert('💾 Draft mutasi berhasil disimpan sementara (stok belum dipotong).');
}

function prosesMutasi() {
  if (tempMutasiItems.length === 0) {
    alert('Belum ada item mutasi yang akan diproses!');
    return;
  }

  const jabPenyerah = document.getElementById('jabatanPenyerah')?.value.trim() || '';
  const namaPenyerah = document.getElementById('namaPenyerah')?.value.trim() || '';
  const nikPenyerahVal = document.getElementById('nikPenyerah')?.value.trim();
  const nikPenyerah = nikPenyerahVal ? `NIK. ${nikPenyerahVal}` : '';

  const jabPenerima = document.getElementById('jabatanPenerima')?.value.trim() || '';
  const namaPenerimaVal = document.getElementById('namaPenerima')?.value.trim() || '';
  const nikPenerimaVal = document.getElementById('nikPenerima')?.value.trim();
  const nikPenerimaTeks = nikPenerimaVal ? `NIK. ${nikPenerimaVal}` : '';

  lastProcessedMutasi = {
    items: [...tempMutasiItems],
    penyerah: { jabatan: jabPenyerah, nama: namaPenyerah, nik: nikPenyerah },
    penerima: { jabatan: jabPenerima, nama: namaPenerimaVal, nik: nikPenerimaTeks }
  };

  tempMutasiItems.forEach(item => {
    const barang = daftarBarang.find(b => b.nama.toLowerCase() === item.nama.toLowerCase());
    if (barang) {
      barang.stok = Math.max(0, barang.stok - item.qty);
    }

    riwayatLaporan.unshift({
      tanggal: item.tgl,
      tipe: 'Keluar',
      namaBarang: item.nama,
      qty: item.qty,
      tujuan: item.tujuan,
      penyerah: namaPenyerah || 'OFFICER',
      penerima: namaPenerimaVal || 'CSS',
      keterangan: item.ket || `Mutasi ke ${item.tujuan}`
    });

    catatAktivitasDashboard('Mutasi Keluar', `${item.nama} (${item.qty} ${item.satuan}) -> ${item.tujuan}`);
  });

  simpanData();
  tempMutasiItems = [];
  localStorage.removeItem('tempMutasiItems');
  renderAll();

  alert('⚡ Mutasi berhasil DIPROSES! Stok barang resmi berkurang.');
}

// Helper untuk mencegah error jika escapeHtml belum didefinisikan global
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function cetakTandaTerima() {
  let itemsToPrint = [];
  let jabPenyerah = '', namaPenyerah = '', nikPenyerah = '';
  let jabPenerima = '', namaPenerimaVal = '', nikPenerimaTeks = '';
  let gtTujuanGlobal = '';

  // 1. Ambil data dengan Safe Navigation & Deteksi GT Tujuan
  if (typeof tempMutasiItems !== 'undefined' && tempMutasiItems.length > 0) {
    itemsToPrint = tempMutasiItems;
    
    jabPenyerah = document.getElementById('jabatanPenyerah')?.value?.trim() || 'Senior Officer Transaksi';
    namaPenyerah = document.getElementById('namaPenyerah')?.value?.trim() || '';
    const nikP = document.getElementById('nikPenyerah')?.value?.trim();
    nikPenyerah = nikP ? `NIK. ${nikP}` : '';

    jabPenerima = document.getElementById('jabatanPenerima')?.value?.trim() || 'Customer Service Supervisor';
    namaPenerimaVal = document.getElementById('namaPenerima')?.value?.trim() || '';
    const nikPen = document.getElementById('nikPenerima')?.value?.trim();
    nikPenerimaTeks = nikPen ? `NIK. ${nikPen}` : '';

    // Ambil input GT dari form
    gtTujuanGlobal = document.getElementById('gtTujuan')?.value?.trim() 
                  || document.getElementById('tujuan')?.value?.trim() 
                  || document.getElementById('gt')?.value?.trim() 
                  || '';

  } else if (typeof lastProcessedMutasi !== 'undefined' && lastProcessedMutasi?.items?.length > 0) {
    itemsToPrint = lastProcessedMutasi.items;
    
    jabPenyerah = lastProcessedMutasi.penyerah?.jabatan || 'Senior Officer Transaksi';
    namaPenyerah = lastProcessedMutasi.penyerah?.nama || '';
    const nikP = lastProcessedMutasi.penyerah?.nik || '';
    nikPenyerah = nikP ? (nikP.startsWith('NIK.') ? nikP : `NIK. ${nikP}`) : '';

    jabPenerima = lastProcessedMutasi.penerima?.jabatan || 'Customer Service Supervisor';
    namaPenerimaVal = lastProcessedMutasi.penerima?.nama || '';
    const nikPen = lastProcessedMutasi.penerima?.nik || '';
    nikPenerimaTeks = nikPen ? (nikPen.startsWith('NIK.') ? nikPen : `NIK. ${nikPen}`) : '';

    gtTujuanGlobal = lastProcessedMutasi.gt || lastProcessedMutasi.tujuan || '';

  } else {
    alert('Tidak ada data mutasi untuk dicetak!');
    return;
  }

  // 2. Format Teks Keterangan Simpel ("Telah diserahkan Ke GT...")
  let kets = itemsToPrint.map(item => {
    const lokasiGT = item.gt || item.tujuan || gtTujuanGlobal;
    let namaGT = '...';
    
    if (lokasiGT) {
      namaGT = lokasiGT.toUpperCase().startsWith('GT') ? lokasiGT : `GT ${lokasiGT}`;
    }

    let text = `Telah diserahkan Ke ${escapeHtml(namaGT)}`;
    if (item.ket) text += ` (${escapeHtml(item.ket)})`;
    return text;
  });
  let keteranganText = kets.join('<br><br>');

  // 3. Generasi Baris Tabel
  const maxRows = Math.max(13, itemsToPrint.length);
  let itemRowsHTML = '';

  for (let i = 0; i < maxRows; i++) {
    const item = itemsToPrint[i];
    const no = i + 1;

    itemRowsHTML += `<tr>`;
    itemRowsHTML += `<td style="text-align:center;">${no}</td>`;

    if (item) {
      itemRowsHTML += `<td>${escapeHtml(item.nama)}</td>`;
      itemRowsHTML += `<td style="text-align:center;">${escapeHtml(item.qty)}</td>`;
      itemRowsHTML += `<td style="text-align:center;">${escapeHtml(item.satuan)}</td>`;
    } else {
      itemRowsHTML += `<td></td><td></td><td></td>`;
    }

    if (i === 0) {
      itemRowsHTML += `
        <td rowspan="${maxRows}" style="vertical-align: middle; text-align: center; padding: 15px; font-weight: bold; font-size: 12px; line-height: 1.5;">
          ${keteranganText}
        </td>
      `;
    }

    itemRowsHTML += `</tr>`;
  }

  // 4. Iframe Tersembunyi
  let printIframe = document.getElementById('cetakFrame');
  if (!printIframe) {
    printIframe = document.createElement('iframe');
    printIframe.id = 'cetakFrame';
    printIframe.style.position = 'fixed';
    printIframe.style.right = '0';
    printIframe.style.bottom = '0';
    printIframe.style.width = '0px';
    printIframe.style.height = '0px';
    printIframe.style.border = '0px';
    document.body.appendChild(printIframe);
  }

  const iframeDoc = printIframe.contentWindow.document;

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <base href="${window.location.href}">
      <title>TANDA TERIMA BARANG</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 10mm 12mm;
        }
        * { 
          box-sizing: border-box; 
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body { 
          font-family: Arial, Helvetica, sans-serif; 
          margin: 0; 
          padding: 10px 5px; 
          color: #000;
          background-color: #fff;
        }

        .header-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          position: relative;
        }

        .logo-img {
          height: 48px;
          width: auto;
          object-fit: contain;
        }

        .title {
          font-size: 18px;
          font-weight: bold;
          text-align: center;
          position: absolute;
          left: 0;
          right: 0;
          pointer-events: none;
          letter-spacing: 0.5px;
        }

        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 25px; 
          page-break-inside: auto;
        }
        tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
        th, td { 
          border: 1px solid #000; 
          padding: 5px 8px; 
          font-size: 12px; 
          height: 24px; 
        }
        th { 
          background-color: #b8cce4 !important; 
          text-align: center; 
          font-weight: bold; 
          color: #000;
        }

        .ttd-container { 
          display: flex; 
          justify-content: space-around; 
          margin-top: 25px; 
          margin-bottom: 10px;
          page-break-inside: avoid;
        }
        .ttd-box { 
          text-align: center; 
          width: 250px; 
          font-size: 12px;
        }
        .ttd-jabatan {
          font-weight: bold;
          margin-top: 2px;
        }
        .ttd-space { 
          height: 70px; 
        }
        .ttd-nama {
          font-weight: normal;
        }
      </style>
    </head>
    <body>
      <div class="header-container">
        <img src="logo-jasamarga.jpeg" class="logo-img" alt="Jasa Marga Tollroad Operator">
        <div class="title">TANDA TERIMA BARANG</div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 40px;">No</th>
            <th style="width: 220px;">Uraian</th>
            <th style="width: 65px;">Volume</th>
            <th style="width: 65px;">Satuan</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          ${itemRowsHTML}
        </tbody>
      </table>

      <div class="ttd-container">
        <div class="ttd-box">
          <div>Diterima Oleh</div>
          <div class="ttd-jabatan">${escapeHtml(jabPenerima)}</div>
          <div class="ttd-space"></div>
          <div class="ttd-nama">(${escapeHtml(namaPenerimaVal)})</div>
          <div>${escapeHtml(nikPenerimaTeks)}</div>
        </div>

        <div class="ttd-box">
          <div>Diserahkan Oleh</div>
          <div class="ttd-jabatan">${escapeHtml(jabPenyerah)}</div>
          <div class="ttd-space"></div>
          <div class="ttd-nama">(${escapeHtml(namaPenyerah)})</div>
          <div>${escapeHtml(nikPenyerah)}</div>
        </div>
      </div>
    </body>
    </html>
  `);
  iframeDoc.close();

  // 5. Trigger Cetak
  const img = iframeDoc.querySelector('.logo-img');
  const doPrint = () => {
    printIframe.contentWindow.focus();
    printIframe.contentWindow.print();
  };

  if (img) {
    if (img.complete) {
      doPrint();
    } else {
      img.onload = doPrint;
      img.onerror = doPrint;
    }
  } else {
    doPrint();
  }
}
// ==========================================
// 6. RIWAYAT STOCK (FORMAT PAS 13 KOLOM)
// ==========================================

function populateSelectRiwayatBarang() {
  const select = document.getElementById('selectBarangRiwayat');
  if (!select) return;

  const currentValue = select.value;
  let optionsHTML = '<option value="">-- Semua Barang --</option>';
  optionsHTML += daftarBarang.map(b => `<option value="${escapeHtml(b.nama)}">${escapeHtml(b.nama)}</option>`).join('');
  
  select.innerHTML = optionsHTML;

  if (currentValue !== undefined && currentValue !== null) {
    select.value = currentValue;
  }
}

function renderRiwayatStock() {
  populateSelectRiwayatBarang();

  const selectBarang = document.getElementById('selectBarangRiwayat');
  const tbody = document.querySelector('#tabelRiwayatStock tbody');
  if (!tbody) return;

  const filterNama = selectBarang?.value;

  if (daftarBarang.length === 0) {
    tbody.innerHTML = '<tr><td colspan="13" style="text-align:center; padding:15px; color:#888;">Belum ada data barang terdaftar.</td></tr>';
    return;
  }

  const targetBarangList = filterNama 
    ? daftarBarang.filter(b => b.nama.toLowerCase() === filterNama.toLowerCase())
    : daftarBarang;

  let htmlRows = '';
  let no = 1;

  targetBarangList.forEach(barang => {
    const riwayatBarang = riwayatLaporan
      .filter(r => (r.namaBarang || '').toLowerCase() === barang.nama.toLowerCase())
      .slice()
      .reverse();

    let runningStock = barang.stokAwal !== undefined ? barang.stokAwal : barang.stok;

    // Baris STOCK AWAL
    htmlRows += `
      <tr style="background-color: #f8fafc;">
        <td>${no++}</td>
        <td><b>${escapeHtml(barang.nama)}</b></td>
        <td>${escapeHtml(barang.satuan)}</td>
        <td><b>${runningStock}</b></td>
        <td>-</td>
        <td>0</td>
        <td>-</td>
        <td>0</td>
        <td>-</td>
        <td><b style="color: #0284c7;">${runningStock}</b></td>
        <td>-</td>
        <td>-</td>
        <td><span style="font-weight:bold; color:#16a34a;">STOCK AWAL</span></td>
      </tr>
    `;

    // Baris Transaksi PO / Mutasi
    riwayatBarang.forEach(item => {
      let tglPO = '-';
      let qtyPO = '-';
      let tglMutasi = '-';
      let qtyKeluar = '-';
      let tujuanGT = '-';
      let penyerah = item.penyerah || '-';
      let penerima = item.penerima || '-';

      const stockSebelum = runningStock;

      if (item.tipe === 'PO' || item.tipe === 'Masuk') {
        tglPO = item.tanggal;
        qtyPO = `<span style="color:#16a34a; font-weight:bold;">+${item.qty}</span>`;
        runningStock += parseInt(item.qty, 10);
      } else {
        tglMutasi = item.tanggal;
        qtyKeluar = `<span style="color:#dc2626; font-weight:bold;">-${item.qty}</span>`;
        tujuanGT = escapeHtml(item.tujuan || 'GT TOL');
        runningStock -= parseInt(item.qty, 10);
      }

      htmlRows += `
        <tr>
          <td>${no++}</td>
          <td>${escapeHtml(barang.nama)}</td>
          <td>${escapeHtml(barang.satuan)}</td>
          <td>${stockSebelum}</td>
          <td>${tglPO}</td>
          <td>${qtyPO}</td>
          <td>${tglMutasi}</td>
          <td>${qtyKeluar}</td>
          <td>${tujuanGT}</td>
          <td><b style="color: #0284c7;">${runningStock}</b></td>
          <td>${escapeHtml(penyerah)}</td>
          <td>${escapeHtml(penerima)}</td>
          <td>${escapeHtml(item.keterangan || '')}</td>
        </tr>
      `;
    });
  });

  tbody.innerHTML = htmlRows || '<tr><td colspan="13" style="text-align:center; padding:15px; color:#888;">Tidak ada riwayat transaksi.</td></tr>';
}

// ==========================================
// 7. DASHBOARD & LAPORAN STOK
// ==========================================

function updateDashboard() {
  const cards = document.querySelectorAll('#dashboard .cards .card .num');
  const hariIni = getTodayDateString();
  const bulanIni = hariIni.substring(0, 7);

  const jmlKritis = daftarBarang.filter(b => b.stok <= b.minStok).length;
  if (cards[0]) cards[0].innerHTML = `${jmlKritis} <span style="font-size: 13px; font-weight: normal; color: #778397;">Item</span>`;

  if (cards[1]) cards[1].innerText = daftarBarang.length;

  const totalPOBulanIni = riwayatLaporan.filter(r => (r.tipe === 'PO' || r.tipe === 'Masuk') && r.tanggal && r.tanggal.startsWith(bulanIni)).length;
  if (cards[2]) cards[2].innerText = totalPOBulanIni;

  const tbodyKritis = document.querySelector('#dashboard .panel tbody');
  if (tbodyKritis) {
    const listKritis = daftarBarang.filter(b => b.stok <= b.minStok);
    if (listKritis.length === 0) {
      tbodyKritis.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#16a34a; padding:12px;">✅ Semua stok barang dalam kondisi aman.</td></tr>';
    } else {
      tbodyKritis.innerHTML = listKritis.map(item => `
        <tr>
          <td><b>${escapeHtml(item.nama)}</b></td>
          <td>${escapeHtml(item.satuan)}</td>
          <td><b style="color:#dc2626;">${item.stok}</b></td>
          <td>${item.minStok}</td>
          <td><span style="color:#a42d2d; font-weight:bold;">⚠️ Butuh PO</span></td>
          <td><button class="btn" style="padding:4px 8px; font-size:11px;" onclick="showPage('masuk')">+ PO</button></td>
        </tr>
      `).join('');
    }
  }

  const panels = document.querySelectorAll('#dashboard .panel tbody');
  const tbodyAktivitas = panels.length > 1 ? panels[1] : null;
  if (tbodyAktivitas) {
    if (aktivitasDashboard.length === 0) {
      tbodyAktivitas.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#888; padding:12px;">Belum ada aktivitas.</td></tr>';
    } else {
      tbodyAktivitas.innerHTML = aktivitasDashboard.slice(0, 5).map(act => `
        <tr>
          <td>${act.tanggal} ${act.waktu}</td>
          <td><b>${escapeHtml(act.tipe)}</b></td>
          <td>${escapeHtml(act.detail)}</td>
        </tr>
      `).join('');
    }
  }
}

function renderTabelLaporan(tglMulai = null, tglSelesai = null) {
  const tbody = document.querySelector('#tabelLaporan tbody');
  if (!tbody) return;

  if (daftarBarang.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:#888; padding:15px;">Belum ada data barang.</td></tr>';
    return;
  }

  const today = getTodayDateString();

  tbody.innerHTML = daftarBarang.map(item => {
    const namaItem = item.nama.toLowerCase();

    const totalPO = riwayatLaporan
      .filter(r => {
        const matchBarang = (r.namaBarang || '').toLowerCase() === namaItem;
        const matchTipe = (r.tipe === 'PO' || r.tipe === 'Masuk');
        let matchTanggal = true;
        
        if (tglMulai && r.tanggal < tglMulai) matchTanggal = false;
        if (tglSelesai && r.tanggal > tglSelesai) matchTanggal = false;

        return matchBarang && matchTipe && matchTanggal;
      })
      .reduce((sum, r) => sum + (parseInt(r.qty, 10) || 0), 0);

    const totalKeluar = riwayatLaporan
      .filter(r => {
        const matchBarang = (r.namaBarang || '').toLowerCase() === namaItem;
        const matchTipe = (r.tipe === 'Keluar' || r.tipe === 'Mutasi');
        let matchTanggal = true;

        if (tglMulai && r.tanggal < tglMulai) matchTanggal = false;
        if (tglSelesai && r.tanggal > tglSelesai) matchTanggal = false;

        return matchBarang && matchTipe && matchTanggal;
      })
      .reduce((sum, r) => sum + (parseInt(r.qty, 10) || 0), 0);

    const stokAwal = item.stokAwal !== undefined ? item.stokAwal : item.stok;
    const minStok = item.minStok !== undefined ? item.minStok : 5;

    return `
      <tr>
        <td style="padding: 10px;">${today}</td>
        <td style="padding: 10px;"><b>${escapeHtml(item.nama)}</b></td>
        <td style="padding: 10px;">${escapeHtml(item.satuan)}</td>
        <td style="padding: 10px; text-align: center;">${stokAwal}</td>
        <td style="padding: 10px; text-align: center; color:#d97706; font-weight:bold;">${minStok}</td>
        <td style="padding: 10px; text-align: center; color:#16a34a; font-weight:bold;">${totalPO}</td>
        <td style="padding: 10px; text-align: center; color:#dc2626; font-weight:bold;">${totalKeluar}</td>
        <td style="padding: 10px; text-align: center; font-weight:bold; background-color:#f8fafc;">${item.stok}</td>
      </tr>
    `;
  }).join('');
}

function filterLaporanTanggal() {
  const tglMulai = document.getElementById('tglMulaiLaporan')?.value;
  const tglSelesai = document.getElementById('tglSelesaiLaporan')?.value;

  if (!tglMulai && !tglSelesai) {
    alert('Pilih tanggal mulai atau tanggal selesai terlebih dahulu!');
    return;
  }

  renderTabelLaporan(tglMulai, tglSelesai);
}

function resetFilterLaporan() {
  if (document.getElementById('tglMulaiLaporan')) document.getElementById('tglMulaiLaporan').value = '';
  if (document.getElementById('tglSelesaiLaporan')) document.getElementById('tglSelesaiLaporan').value = '';
  renderTabelLaporan();
}

// ==========================================
// 8. EXPORT EXCEL (SheetJS / CSV Fallback)
// ==========================================

function exportLaporanExcel() {
  exportTableToExcel('tabelLaporan', `Laporan_Stok_${getTodayDateString()}`);
}

function exportDaftarBarangExcel() {
  exportTableToExcel('tabelDaftarBarang', `Daftar_Barang_${getTodayDateString()}`);
}

function exportTableToExcel(tableId, filename) {
  const table = document.getElementById(tableId);
  if (!table) return;

  if (typeof XLSX !== 'undefined') {
    const wb = XLSX.utils.table_to_book(table, { sheet: "Sheet1" });
    XLSX.writeFile(wb, `${filename}.xlsx`);
  } else {
    let csv = [];
    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
      const cols = row.querySelectorAll('td, th');
      const rowData = Array.from(cols).map(col => `"${col.innerText.replace(/"/g, '""')}"`);
      csv.push(rowData.join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csv.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}