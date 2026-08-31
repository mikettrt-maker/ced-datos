const MAESTROS = [
  { codigo: 'CED-26-QZV46P', nombre: 'PROF. MIGUEL' },
  { codigo: 'CED-26-T8X4RJ', nombre: 'PROFA. BETUKY' },
  { codigo: 'CED-26-QG9YJY', nombre: 'PROF. ALE' },
  { codigo: 'CED-26-DA2RW5', nombre: 'PROFA. NANCY' },
  { codigo: 'CED-26-QN9387', nombre: 'PROFA. EVELYN' },
  { codigo: 'CED-26-AFS5BF', nombre: 'PROFA. JOHANY' }
];

function maestroPorCodigo(codigo) {
  return MAESTROS.find(function (m) {
    return m.codigo === codigo;
  });
}