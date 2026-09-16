/* Procesa el reporte grande fuera del hilo visual. Solo conserva los dos cursos autorizados. */
importScripts("https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js");

const CURSO_INICIAL = "MERCANCIAS PELIGROSAS BASICO 8 HORAS TALMA INICIAL 2026V2";
const CURSO_RECURRENTE = "MERCANCIAS PELIGROSAS BASICO 4 HORAS TALMA RECURRENTE 2026V2";
const norm = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();
const tipoCurso = value => {
  const key = norm(value);
  if (key === CURSO_INICIAL) return "inicial";
  if (key === CURSO_RECURRENTE) return "recurrente";
  return "";
};
const idNormal = value => String(value ?? "").replace(/\.0+$/, "").replace(/\D/g, "");
const notaNormal = value => {
  const n = Number(String(value ?? "").trim().replace("%", "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 && n <= 100 ? Math.round(n) : null;
};
const fechaClave = value => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  if (typeof value === "number" && value > 0 && value < 100000) return new Date(Date.UTC(1899, 11, 30) + value * 86400000).toISOString();
  const raw = String(value ?? "").trim();
  const dmy = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if (dmy) return `${dmy[3]}-${String(dmy[2]).padStart(2, "0")}-${String(dmy[1]).padStart(2, "0")}`;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? "0000-00-00" : parsed.toISOString();
};

self.onmessage = event => {
  try {
    const workbook = XLSX.read(event.data, { type: "array", cellDates: true, dense: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet || !sheet["!ref"]) throw new Error("El archivo no contiene una hoja válida.");
    const range = XLSX.utils.decode_range(sheet["!ref"]);
    const first = sheet[range.s.r] || [];
    const headers = new Map();
    for (let c = range.s.c; c <= range.e.c; c++) headers.set(norm(first[c]?.v), c);
    const required = ["CEDULA", "CURSO", "NOTA", "NOMBRE COMPLETO", "FECHA DE FINALIZACION DEL CURSO"];
    const missing = required.filter(name => !headers.has(name));
    if (missing.length) throw new Error(`Faltan columnas requeridas: ${missing.join(", ")}.`);
    const index = Object.fromEntries(required.map(name => [name, headers.get(name)]));
    const latest = new Map();
    let filasLeidas = 0, filasCurso = 0, notasInvalidas = 0;
    for (let r = range.s.r + 1; r <= range.e.r; r++) {
      filasLeidas++;
      const row = sheet[r] || [];
      const tipo = tipoCurso(row[index.CURSO]?.v);
      if (!tipo) continue;
      filasCurso++;
      const id = idNormal(row[index.CEDULA]?.v);
      const nota = notaNormal(row[index.NOTA]?.v);
      if (!id || nota === null) { notasInvalidas++; continue; }
      const fechaRaw = row[index["FECHA DE FINALIZACION DEL CURSO"]]?.v;
      const item = { id, tipo, nota, nombre: String(row[index["NOMBRE COMPLETO"]]?.v ?? "").trim(), fecha: String(fechaRaw ?? ""), fechaClave: fechaClave(fechaRaw) };
      const key = `${id}|${tipo}`;
      const previo = latest.get(key);
      if (!previo || item.fechaClave > previo.fechaClave || (item.fechaClave === previo.fechaClave && item.nota > previo.nota)) latest.set(key, item);
      if (filasLeidas % 25000 === 0) self.postMessage({ type: "progress", filasLeidas, total: range.e.r - range.s.r });
    }
    const records = [...latest.values()].map(({ fechaClave: _, ...item }) => item);
    self.postMessage({ type: "done", records, statistics: { filasLeidas, filasCurso, unicos: records.length, notasInvalidas } });
  } catch (error) {
    self.postMessage({ type: "error", message: error?.message || String(error) });
  }
};
