const CALENDARIO = {
  inicio: '2026-08-31',
  fin: '2027-07-09',
  recesoInvierno: { desde: '2026-12-21', hasta: '2027-01-05' },
  recesoSemanaSanta: { desde: '2027-03-22', hasta: '2027-04-03' },
  suspensiones: [
    '2026-09-16',
    '2026-11-02',
    '2026-11-16',
    '2026-12-25',
    '2027-01-01',
    '2027-01-06',
    '2027-02-01',
    '2027-03-15',
    '2027-05-05'
  ],
  cte: [
    '2026-09-25',
    '2026-10-30',
    '2026-11-27',
    '2027-01-29',
    '2027-02-26',
    '2027-04-30',
    '2027-05-28',
    '2027-06-25'
  ],
  jornadaConcientizacion: '2026-09-08'
};

function formatoFecha(d) {
  const a = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return a + '-' + m + '-' + dia;
}

function enRango(iso, rango) {
  return iso >= rango.desde && iso <= rango.hasta;
}

function tipoDia(iso) {
  const fecha = new Date(iso + 'T12:00:00');
  const diaSemana = fecha.getDay();
  if (diaSemana === 0 || diaSemana === 6) return { tipo: 'fin-semana', texto: 'FIN DE SEMANA' };
  if (iso < CALENDARIO.inicio || iso > CALENDARIO.fin) return { tipo: 'fuera', texto: 'FUERA DEL CICLO ESCOLAR' };
  if (enRango(iso, CALENDARIO.recesoInvierno)) return { tipo: 'vacaciones', texto: 'VACACIONES DE INVIERNO' };
  if (enRango(iso, CALENDARIO.recesoSemanaSanta)) return { tipo: 'vacaciones', texto: 'VACACIONES DE SEMANA SANTA' };
  if (CALENDARIO.suspensiones.indexOf(iso) !== -1) return { tipo: 'suspension', texto: 'SUSPENSIÓN DE LABORES' };
  if (CALENDARIO.cte.indexOf(iso) !== -1) return { tipo: 'cte', texto: 'CONSEJO TÉCNICO ESCOLAR (CTE)' };
  return { tipo: 'clase', texto: 'DÍA DE CLASE' };
}

function proximosDiasSinClase(desdeIso, cantidad) {
  const lista = [];
  const fecha = new Date(desdeIso + 'T12:00:00');
  while (lista.length < cantidad) {
    fecha.setDate(fecha.getDate() + 1);
    const iso = formatoFecha(fecha);
    const info = tipoDia(iso);
    if (info.tipo !== 'clase' && info.tipo !== 'fin-semana') {
      lista.push({ iso: iso, texto: info.texto });
    }
  }
  return lista;
}