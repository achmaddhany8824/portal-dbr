function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Definisi skema tabel dan header kolom
  const schemas = {
    'observations': ['id', 'pertemuan', 'waktu', 'aktivitas', 'hlt', 'alt', 'created_at'],
    'validation_sessions': ['id', 'validator_name', 'institution', 'date', 'scores', 'comment', 'conclusion', 'created_at'],
    'task_analysis_sessions': ['id', 'total_students', 'results', 'qualitative_analysis', 'created_at'],
    'interview_sessions': ['id', 'student_code', 'date', 'topic', 'critical_moments', 'hlt_alignment', 'deviation_note', 'notes', 'created_at'],
    'evaluation_sessions': ['id', 'student_id', 'test_type', 'question_id', 'scores', 'total_score', 'notes', 'created_at']
  };

  // Membuat sheet jika belum ada dan menambahkan header
  for (const table in schemas) {
    let sheet = ss.getSheetByName(table);
    if (!sheet) {
      sheet = ss.insertSheet(table);
      sheet.appendRow(schemas[table]);
      // Format header menjadi bold
      sheet.getRange("A1:Z1").setFontWeight("bold");
      sheet.getRange("A1:Z1").setBackground("#f3f4f6");
    }
  }
}

function doGet(e) {
  // CORS Headers ditangani otomatis oleh ContentService di GAS
  const action = e.parameter.action;
  const table = e.parameter.table;

  if (action === 'getCounts') {
    return handleGetCounts();
  }

  if (!table) return errorResponse("Parameter 'table' tidak ditemukan");

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(table);
  if (!sheet) return errorResponse("Tabel/Sheet tidak ditemukan");

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return successResponse([]); // Kosong (hanya header)

  const headers = data[0];
  const rows = data.slice(1);

  const result = rows.map(row => {
    let obj = {};
    headers.forEach((header, index) => {
      let val = row[index];
      // Parse kembali string JSON menjadi object (untuk kolom scores, results, dll)
      try {
        if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
          val = JSON.parse(val);
        }
      } catch(err) {}
      obj[header] = val;
    });
    return obj;
  });

  // Urutkan berdasarkan created_at descending (terbaru di atas)
  result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return successResponse(result);
}

function handleGetCounts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tables = ['observations', 'validation_sessions', 'task_analysis_sessions', 'interview_sessions', 'evaluation_sessions'];
  let counts = {};

  tables.forEach(table => {
    const sheet = ss.getSheetByName(table);
    if (sheet) {
      // Kurangi 1 untuk baris header
      counts[table] = Math.max(0, sheet.getLastRow() - 1);
    } else {
      counts[table] = 0;
    }
  });

  return successResponse(counts);
}

function doPost(e) {
  try {
    // Parsing payload. Menggunakan text/plain dari frontend untuk menghindari CORS preflight OPTIONS
    const payload = JSON.parse(e.postData.contents);
    const table = payload.table;
    const data = payload.data;

    if (!table || !data) return errorResponse("Table atau data tidak lengkap");

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(table);
    if (!sheet) return errorResponse("Tabel/Sheet tidak ditemukan");

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const newRow = [];

    // Generate ID dan created_at jika belum ada
    if (!data.id) data.id = Utilities.getUuid();
    if (!data.created_at) data.created_at = new Date().toISOString();

    headers.forEach(header => {
      let val = data[header];
      // Ubah object/array menjadi string JSON agar bisa disimpan di sel Spreadsheet
      if (typeof val === 'object' && val !== null) {
        val = JSON.stringify(val);
      }
      newRow.push(val !== undefined ? val : "");
    });

    sheet.appendRow(newRow);

    return successResponse(data);
  } catch (err) {
    return errorResponse(err.toString());
  }
}

function successResponse(data) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(msg) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}
