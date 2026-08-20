/*********************************************************************
  En tu hoja de cálculo entra a Extensiones > Apps Script,
  borra el código anterior y pega ESTE archivo completo.
  Después: Implementar > Administrar implementaciones > lápiz >
  Versión: Nueva versión > Implementar. La URL queda igual.
  No necesitas crear las pestañas "Asistencias", "Config",
  "Notificaciones" ni "Calificaciones": el código las crea solas.
*********************************************************************/

const SPREADSHEET_ID = '1mB7u7dUvLh6DuJHukbLfWyd-Ne1nFfT6K3rS_RomiZo';
const SHEET_NAME = 'Respuestas';
const ASISTENCIA_SHEET = 'Asistencias';
const CONFIG_SHEET = 'Config';
const NOTIF_SHEET = 'Notificaciones';
const CALIF_SHEET = 'Calificaciones';

function doPost(e) {
  try {
    const datos = JSON.parse(e.postData.contents);
    if (datos.accion === 'asistencia') {
      return guardarAsistencia(datos);
    }
    if (datos.accion === 'config_guardar') {
      return guardarConfigMaestro(datos);
    }
    if (datos.accion === 'notificacion') {
      return guardarNotificacion(datos);
    }
    if (datos.accion === 'notificacion_borrar') {
      return borrarNotificacion(datos);
    }
    if (datos.accion === 'calificacion') {
      return guardarCalificacion(datos);
    }
    return guardarFicha(datos);
  } catch (error) {
    return respuesta({ ok: false, error: String(error) });
  }
}

function guardarFicha(datos) {
  const hoja = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const cabeceras = [
    'Fecha',
    'Código del alumno',
    'Alumno ap. paterno',
    'Alumno ap. materno',
    'Alumno nombre(s)',
    'Grado',
    'Fecha de nacimiento',
    'Lugar de nacimiento',
    'Estado',
    'Municipio',
    'Colonia',
    'Calle',
    'Número',
    'Referencia',
    'Información adicional',
    'Mamá ap. paterno',
    'Mamá ap. materno',
    'Mamá nombre(s)',
    'Mamá teléfono',
    'Mamá celular',
    'Mamá ocupación',
    'Papá ap. paterno',
    'Papá ap. materno',
    'Papá nombre(s)',
    'Papá teléfono',
    'Papá celular',
    'Papá ocupación',
    'Emergencia ap. paterno',
    'Emergencia ap. materno',
    'Emergencia nombre(s)',
    'Emergencia parentesco',
    'Emergencia tel 1',
    'Emergencia tel 2',
    'Emergencia tel 3'
  ];
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(cabeceras);
  }
  hoja.appendRow([
    datos.fecha || '',
    datos.codigo || '',
    datos.alumno_ap || '',
    datos.alumno_am || '',
    datos.alumno_nombres || '',
    datos.grado || '',
    datos.nacimiento || '',
    datos.nacimiento_estado || '',
    datos.estado || '',
    datos.municipio || '',
    datos.colonia || '',
    datos.calle || '',
    datos.numero || '',
    datos.referencia || '',
    datos.adicional || '',
    datos.mama_ap || '',
    datos.mama_am || '',
    datos.mama_nombres || '',
    datos.mama_tel || '',
    datos.mama_cel || '',
    datos.mama_ocupacion || '',
    datos.papa_ap || '',
    datos.papa_am || '',
    datos.papa_nombres || '',
    datos.papa_tel || '',
    datos.papa_cel || '',
    datos.papa_ocupacion || '',
    datos.emergencia_ap || '',
    datos.emergencia_am || '',
    datos.emergencia_nombres || '',
    datos.emergencia_parentesco || '',
    datos.emergencia_tel_1 || '',
    datos.emergencia_tel_2 || '',
    datos.emergencia_tel_3 || ''
  ]);
  return respuesta({ ok: true });
}

function obtenerHojaAsistencias() {
  const libro = SpreadsheetApp.openById(SPREADSHEET_ID);
  let hoja = libro.getSheetByName(ASISTENCIA_SHEET);
  if (!hoja) {
    hoja = libro.insertSheet(ASISTENCIA_SHEET);
    hoja.appendRow(['Fecha', 'Código alumno', 'Alumno', 'Grado', 'Estado', 'Maestro']);
  }
  return hoja;
}

function guardarAsistencia(datos) {
  const hoja = obtenerHojaAsistencias();
  const fecha = normalizarFechaISO(datos.fecha);
  const grado = String(datos.grado || '');
  const celdas = hoja.getDataRange().getValues();
  const filasABorrar = [];
  for (let fila = celdas.length - 1; fila > 0; fila--) {
    if (String(celdas[fila][0]) === fecha && String(celdas[fila][3]) === grado) {
      filasABorrar.push(fila + 1);
    }
  }
  filasABorrar.sort(function (a, b) { return b - a; });
  filasABorrar.forEach(function (numeroFila) {
    hoja.deleteRow(numeroFila);
  });
  (datos.registros || []).forEach(function (registro) {
    if (!registro.estado) return;
    hoja.appendRow([
      fecha,
      registro.codigo || '',
      registro.nombre || '',
      grado,
      registro.estado,
      datos.maestro || ''
    ]);
  });
  return respuesta({ ok: true });
}

function obtenerHojaConfig() {
  const libro = SpreadsheetApp.openById(SPREADSHEET_ID);
  let hoja = libro.getSheetByName(CONFIG_SHEET);
  if (!hoja) {
    hoja = libro.insertSheet(CONFIG_SHEET);
    hoja.appendRow(['Código maestro', 'Nombre', 'Asesoría', 'Grados', 'Materias', 'Actualizado']);
  }
  return hoja;
}

function guardarConfigMaestro(datos) {
  const hoja = obtenerHojaConfig();
  const codigo = String(datos.codigo || '').trim().toUpperCase();
  if (!codigo) {
    return respuesta({ ok: false, error: 'Falta el código' });
  }
  const grados = JSON.stringify(datos.grados || []);
  const materias = JSON.stringify(datos.materias || {});
  const celdas = hoja.getDataRange().getValues();
  let filaEncontrada = -1;
  for (let fila = 1; fila < celdas.length; fila++) {
    if (String(celdas[fila][0]) === codigo) {
      filaEncontrada = fila + 1;
      break;
    }
  }
  const filaNueva = [
    codigo,
    datos.nombre || '',
    datos.asesoria || '',
    grados,
    materias,
    new Date().toLocaleString()
  ];
  if (filaEncontrada === -1) {
    hoja.appendRow(filaNueva);
  } else {
    hoja.getRange(filaEncontrada, 1, 1, filaNueva.length).setValues([filaNueva]);
  }
  return respuesta({ ok: true });
}

function leerConfigMaestro(codigo) {
  codigo = String(codigo || '').trim().toUpperCase();
  const libro = SpreadsheetApp.openById(SPREADSHEET_ID);
  const hoja = libro.getSheetByName(CONFIG_SHEET);
  if (!hoja) {
    return respuesta({ ok: true, config: null });
  }
  const celdas = hoja.getDataRange().getValues();
  for (let fila = celdas.length - 1; fila > 0; fila--) {
    if (String(celdas[fila][0]) === codigo) {
      return respuesta({
        ok: true,
        config: {
          asesoria: String(celdas[fila][2] || ''),
          grados: parsearJson(String(celdas[fila][3] || ''), []),
          materias: parsearJson(String(celdas[fila][4] || ''), {})
        }
      });
    }
  }
  return respuesta({ ok: true, config: null });
}

function parsearJson(texto, porDefecto) {
  try {
    return JSON.parse(texto);
  } catch (error) {
    return porDefecto;
  }
}

function obtenerHojaNotificaciones() {
  const libro = SpreadsheetApp.openById(SPREADSHEET_ID);
  let hoja = libro.getSheetByName(NOTIF_SHEET);
  if (!hoja) {
    hoja = libro.insertSheet(NOTIF_SHEET);
    hoja.appendRow(['Fecha', 'Maestro', 'Grado', 'Mensaje', 'Código alumno']);
  } else {
    // asegurar que exista la 5ª columna
    if (hoja.getLastColumn() < 5) {
      hoja.getRange(1, 5).setValue('Código alumno');
    }
  }
  return hoja;
}

function fechaLargaEnEspanol() {
  const ahora = new Date();
  const dias = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
  const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
  let horas = ahora.getHours();
  const minutos = String(ahora.getMinutes()).padStart(2, '0');
  const meridiano = horas >= 12 ? 'P.M.' : 'A.M.';
  horas = horas % 12;
  if (horas === 0) {
    horas = 12;
  }
  return dias[ahora.getDay()] + ' ' + ahora.getDate() + ' DE ' + meses[ahora.getMonth()] +
    ' DE ' + ahora.getFullYear() + ', ' + horas + ':' + minutos + ' ' + meridiano;
}

function guardarNotificacion(datos) {
  const hoja = obtenerHojaNotificaciones();
  hoja.appendRow([
    fechaLargaEnEspanol(),
    datos.maestro || '',
    datos.grado || '',
    datos.mensaje || '',
    datos.codigo || ''
  ]);
  return respuesta({ ok: true });
}

function leerNotificaciones(grado) {
  const libro = SpreadsheetApp.openById(SPREADSHEET_ID);
  const hoja = libro.getSheetByName(NOTIF_SHEET);
  if (!hoja) {
    return respuesta({ ok: true, notificaciones: [] });
  }
  const celdas = hoja.getDataRange().getValues();
  const lista = [];
  for (let fila = 1; fila < celdas.length; fila++) {
    if (String(celdas[fila][2]) === grado) {
      lista.push({
        fila: fila,
        fecha: String(celdas[fila][0] || ''),
        maestro: String(celdas[fila][1] || ''),
        mensaje: String(celdas[fila][3] || ''),
        codigo: String(celdas[fila][4] || '')
      });
    }
  }
  lista.reverse();
  return respuesta({ ok: true, notificaciones: lista });
}

function borrarNotificacion(datos) {
  const fila = parseInt(datos.fila, 10);
  const hoja = obtenerHojaNotificaciones();
  if (!fila || fila < 2 || fila > hoja.getLastRow()) {
    return respuesta({ ok: false, error: 'Aviso no encontrado' });
  }
  hoja.deleteRow(fila);
  return respuesta({ ok: true });
}

function obtenerHojaCalificaciones() {
  const libro = SpreadsheetApp.openById(SPREADSHEET_ID);
  let hoja = libro.getSheetByName(CALIF_SHEET);
  if (!hoja) {
    hoja = libro.insertSheet(CALIF_SHEET);
    hoja.appendRow(['Fecha', 'Código alumno', 'Alumno', 'Grado', 'Campo formativo', 'Nota', 'Maestro']);
  }
  return hoja;
}

function normalizarFechaISO(valor) {
  const texto = String(valor || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    return texto;
  }
  const f = new Date(texto);
  if (isNaN(f.getTime())) {
    return texto;
  }
  const a = f.getFullYear();
  const m = String(f.getMonth() + 1).padStart(2, '0');
  const d = String(f.getDate()).padStart(2, '0');
  return a + '-' + m + '-' + d;
}

function guardarCalificacion(datos) {
  const hoja = obtenerHojaCalificaciones();
  const fecha = normalizarFechaISO(datos.fecha);
  const grado = String(datos.grado || '');
  const campo = String(datos.campo || '');
  const celdas = hoja.getDataRange().getValues();
  const filasABorrar = [];
  for (let fila = celdas.length - 1; fila > 0; fila--) {
    if (String(celdas[fila][0]) === fecha &&
      String(celdas[fila][3]) === grado &&
      String(celdas[fila][4]) === campo) {
      filasABorrar.push(fila + 1);
    }
  }
  filasABorrar.sort(function (a, b) { return b - a; });
  filasABorrar.forEach(function (numeroFila) {
    hoja.deleteRow(numeroFila);
  });
  (datos.registros || []).forEach(function (registro) {
    const nota = String(registro.nota || '').trim().replace(',', '.');
    const numero = Number(nota);
    if (!isFinite(numero) || numero < 0 || numero > 10) return;
    hoja.appendRow([
      fecha,
      registro.codigo || '',
      registro.nombre || '',
      grado,
      campo,
      String(numero),
      datos.maestro || ''
    ]);
  });
  return respuesta({ ok: true });
}

function leerCalificacionesAlumno(codigo) {
  codigo = String(codigo || '').trim().toUpperCase();
  const libro = SpreadsheetApp.openById(SPREADSHEET_ID);
  const hoja = libro.getSheetByName(CALIF_SHEET);
  if (!hoja) {
    return respuesta({ ok: true, calificaciones: [] });
  }
  const celdas = hoja.getDataRange().getValues();
  const lista = [];
  for (let fila = 1; fila < celdas.length; fila++) {
    if (String(celdas[fila][1]).trim().toUpperCase() === codigo) {
      const nota = Number(String(celdas[fila][5] || '').trim().replace(',', '.'));
      if (!isFinite(nota)) continue;
      lista.push({
        fecha: normalizarFechaISO(String(celdas[fila][0] || '')),
        grado: String(celdas[fila][3] || ''),
        campo: String(celdas[fila][4] || ''),
        nota: String(nota),
        maestro: String(celdas[fila][6] || '')
      });
    }
  }
  lista.reverse();
  return respuesta({ ok: true, calificaciones: lista });
}

function leerCalificacionesDia(grado, fecha, campo) {
  const libro = SpreadsheetApp.openById(SPREADSHEET_ID);
  const hoja = libro.getSheetByName(CALIF_SHEET);
  if (!hoja) {
    return respuesta({ ok: true, registros: [] });
  }
  const celdas = hoja.getDataRange().getValues();
  const registros = [];
  for (let fila = 1; fila < celdas.length; fila++) {
    if (String(celdas[fila][0]) === fecha &&
      String(celdas[fila][3]) === grado &&
      String(celdas[fila][4]) === campo) {
      registros.push({
        codigo: String(celdas[fila][1] || ''),
        nota: String(celdas[fila][5] || '')
      });
    }
  }
  return respuesta({ ok: true, registros: registros });
}

function leerCalificacionesGrado(grado) {
  const libro = SpreadsheetApp.openById(SPREADSHEET_ID);
  const hoja = libro.getSheetByName(CALIF_SHEET);
  if (!hoja) {
    return respuesta({ ok: true, calificaciones: [] });
  }
  const celdas = hoja.getDataRange().getValues();
  const lista = [];
  for (let fila = 1; fila < celdas.length; fila++) {
    if (String(celdas[fila][3]) === grado) {
      const nota = Number(String(celdas[fila][5] || '').trim().replace(',', '.'));
      if (!isFinite(nota)) continue;
      lista.push({
        fecha: normalizarFechaISO(String(celdas[fila][0] || '')),
        codigo: String(celdas[fila][1] || ''),
        nombre: String(celdas[fila][2] || ''),
        grado: String(celdas[fila][3] || ''),
        campo: String(celdas[fila][4] || ''),
        nota: String(nota),
        maestro: String(celdas[fila][6] || '')
      });
    }
  }
  lista.reverse();
  return respuesta({ ok: true, calificaciones: lista });
}

function historialAlumno(codigo) {
  codigo = String(codigo || '').trim().toUpperCase();
  const libro = SpreadsheetApp.openById(SPREADSHEET_ID);
  const asistencias = [];
  const calificaciones = [];
  let hoja = libro.getSheetByName(ASISTENCIA_SHEET);
  if (hoja) {
    const celdas = hoja.getDataRange().getValues();
    for (let fila = 1; fila < celdas.length; fila++) {
      if (String(celdas[fila][1]).trim().toUpperCase() === codigo) {
        asistencias.push({
          fecha: normalizarFechaISO(String(celdas[fila][0] || '')),
          estado: String(celdas[fila][4] || '')
        });
      }
    }
  }
  hoja = libro.getSheetByName(CALIF_SHEET);
  if (hoja) {
    const celdas = hoja.getDataRange().getValues();
    for (let fila = 1; fila < celdas.length; fila++) {
      if (String(celdas[fila][1]).trim().toUpperCase() === codigo) {
        const nota = Number(String(celdas[fila][5] || '').trim().replace(',', '.'));
        if (!isFinite(nota)) continue;
        calificaciones.push({
          fecha: normalizarFechaISO(String(celdas[fila][0] || '')),
          campo: String(celdas[fila][4] || ''),
          nota: String(nota)
        });
      }
    }
  }
  asistencias.reverse();
  calificaciones.reverse();
  return respuesta({ ok: true, asistencias: asistencias, calificaciones: calificaciones });
}

function respuesta(objeto) {
  return ContentService
    .createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    const accion = String(e.parameter.accion || 'buscar');
    if (accion === 'lista') {
      return listarAlumnos(String(e.parameter.grado || ''));
    }
    if (accion === 'alumnos_todos') {
      return listarAlumnosTodos();
    }
    if (accion === 'asistencias_grado') {
      return leerAsistenciasGrado(String(e.parameter.grado || ''));
    }
    if (accion === 'asistencias') {
      return leerAsistencias(String(e.parameter.grado || ''), String(e.parameter.fecha || ''));
    }
    if (accion === 'config_leer') {
      return leerConfigMaestro(String(e.parameter.codigo || ''));
    }
    if (accion === 'notificaciones') {
      return leerNotificaciones(String(e.parameter.grado || ''));
    }
    if (accion === 'calificaciones') {
      return leerCalificacionesAlumno(String(e.parameter.codigo || ''));
    }
    if (accion === 'historial') {
      return historialAlumno(String(e.parameter.codigo || ''));
    }
    if (accion === 'calificaciones_grado') {
      return leerCalificacionesGrado(String(e.parameter.grado || ''));
    }
    if (accion === 'calificaciones_dia') {
      return leerCalificacionesDia(
        String(e.parameter.grado || ''),
        String(e.parameter.fecha || ''),
        String(e.parameter.campo || '')
      );
    }
    return buscarPorCodigo(String(e.parameter.codigo || ''));
  } catch (error) {
    return respuesta({ ok: false, error: String(error) });
  }
}

function buscarPorCodigo(codigo) {
  codigo = codigo.trim().toUpperCase();
  if (!codigo) {
    return respuesta({ ok: false, error: 'Falta el código' });
  }
  const hoja = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const celdas = hoja.getDataRange().getValues();
  const cabeceras = celdas[0];
  for (let fila = celdas.length - 1; fila > 0; fila--) {
    if (String(celdas[fila][1]).trim().toUpperCase() === codigo) {
      const registro = {};
      cabeceras.forEach(function (columna, indice) {
        registro[columna] = celdas[fila][indice];
      });
      return respuesta({ ok: true, datos: registro });
    }
  }
  return respuesta({ ok: false, error: 'No encontrado' });
}

function listarAlumnos(grado) {
  const hoja = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const celdas = hoja.getDataRange().getValues();
  const alumnos = [];
  for (let fila = 1; fila < celdas.length; fila++) {
    if (String(celdas[fila][5]) === grado) {
      const ap = String(celdas[fila][2] || '');
      const am = String(celdas[fila][3] || '');
      const nombres = String(celdas[fila][4] || '');
      alumnos.push({
        codigo: String(celdas[fila][1] || ''),
        nombre: [ap, am, nombres].filter(Boolean).join(' ')
      });
    }
  }
  return respuesta({ ok: true, alumnos: alumnos });
}

function listarAlumnosTodos() {
  const hoja = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const celdas = hoja.getDataRange().getValues();
  const cabeceras = celdas[0];
  const alumnos = [];
  for (let fila = 1; fila < celdas.length; fila++) {
    const codigo = String(celdas[fila][1] || '').trim();
    if (!codigo) continue;
    const registro = { codigo: codigo };
    cabeceras.forEach(function (columna, indice) {
      registro[columna] = celdas[fila][indice];
    });
    alumnos.push(registro);
  }
  return respuesta({ ok: true, alumnos: alumnos });
}

function leerAsistenciasGrado(grado) {
  const libro = SpreadsheetApp.openById(SPREADSHEET_ID);
  const hoja = libro.getSheetByName(ASISTENCIA_SHEET);
  if (!hoja) {
    return respuesta({ ok: true, asistencias: [] });
  }
  const celdas = hoja.getDataRange().getValues();
  const lista = [];
  for (let fila = 1; fila < celdas.length; fila++) {
    if (String(celdas[fila][3]) === grado) {
      lista.push({
        fecha: normalizarFechaISO(String(celdas[fila][0] || '')),
        codigo: String(celdas[fila][1] || ''),
        nombre: String(celdas[fila][2] || ''),
        estado: String(celdas[fila][4] || ''),
        maestro: String(celdas[fila][5] || '')
      });
    }
  }
  lista.reverse();
  return respuesta({ ok: true, asistencias: lista });
}

function leerAsistencias(grado, fecha) {
  const libro = SpreadsheetApp.openById(SPREADSHEET_ID);
  const hoja = libro.getSheetByName(ASISTENCIA_SHEET);
  if (!hoja) {
    return respuesta({ ok: true, registros: [] });
  }
  const celdas = hoja.getDataRange().getValues();
  const registros = [];
  for (let fila = 1; fila < celdas.length; fila++) {
    if (String(celdas[fila][0]) === fecha && String(celdas[fila][3]) === grado) {
      registros.push({
        codigo: String(celdas[fila][1] || ''),
        estado: String(celdas[fila][4] || '')
      });
    }
  }
  return respuesta({ ok: true, registros: registros });
}