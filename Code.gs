function doGet() {
  return HtmlService.createTemplateFromFile('index').evaluate()
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .setTitle("Portal Literasi Digital Donggala");
}

// --- FUNGSI LOGIN ---
function checkLogin(username, password) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Users");
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString() == username && data[i][1].toString() == password) {
      return {
        success: true,
        role: data[i][2].toString().toLowerCase(), 
        jenjang: data[i][3] ? data[i][3].toString().toLowerCase() : "", 
        nama: data[i][4] || username,
        sekolah: data[i][5] || "Umum"
      };
    }
  }
  return { success: false };
}

// --- AMBIL DATA MATERI (Termasuk Row ID untuk Edit/Hapus) ---
function getMateriData(jenjangUser, role) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("DataMateri");
  const data = sheet.getDataRange().getValues();
  
  const result = { tk: [], sd: [], smp: [] };
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const j = row[2].toString().toLowerCase();
    if (result[j]) {
      result[j].push({ 
        judul: row[0], 
        isi: row[1], 
        link: row[3],
        row: i + 1 // Digunakan sebagai ID unik untuk Edit/Hapus
      });
    }
  }

  if (role === 'siswa') {
    const filtered = {};
    filtered[jenjangUser] = result[jenjangUser];
    return filtered;
  }
  return result;
}

// --- SIMPAN / EDIT MATERI ---
function uploadMateri(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("DataMateri");
  
  if (payload.id) {
    // Mode EDIT berdasarkan baris
    sheet.getRange(parseInt(payload.id), 1, 1, 4)
         .setValues([[payload.judul, payload.isi, payload.jenjang, payload.link]]);
    return "Materi diperbarui!";
  } else {
    // Mode TAMBAH BARU
    sheet.appendRow([payload.judul, payload.isi, payload.jenjang, payload.link, new Date()]);
    return "Materi berhasil diunggah!";
  }
}

// --- HAPUS MATERI ---
function deleteMateriOnSheet(rowId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("DataMateri");
  sheet.deleteRow(parseInt(rowId));
  return "Terhapus";
}

// --- TAMBAH PENGGUNA BARU (KHUSUS ADMIN) ---
function addNewUser(p) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Users");
  sheet.appendRow([p.user, p.pass, p.role, (p.role === 'siswa' ? 'sd' : ''), p.nama, p.sekolah]);
  return "User ditambahkan";
}

// --- AMBIL LOG AKTIVITAS (UNTUK ADMIN) ---
function getAktivitasLogs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("LogAktivitas");
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  
  return data.slice(1).reverse().map(row => ({
    nama: row[0],
    sekolah: row[1],
    jenjang: row[2],
    judul: row[3],
    durasi: row[4],
    tanggal: Utilities.formatDate(new Date(row[5]), "GMT+8", "dd/MM/yyyy HH:mm")
  }));
}

// --- CATAT DURASI BACA ---
function logDurasi(p) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("LogAktivitas");
  if(!sheet) return;
  sheet.appendRow([p.nama, p.sekolah, p.jenjang, p.judul, p.durasi, new Date()]);
}
