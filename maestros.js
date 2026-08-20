const MAESTROS = [
  { codigo: 'CED-26-QZV46P', nombre: 'PROF. MIGUEL' },
  { codigo: 'CED-26-T8X4RJ', nombre: 'PROFA. MARÍA' },
  { codigo: 'CED-26-QG9YJY', nombre: 'PROF. JOSÉ' },
  { codigo: 'CED-26-DA2RW5', nombre: 'PROFA. LAURA' },
  { codigo: 'CED-26-QN9387', nombre: 'PROF. CARLOS' },
  { codigo: 'CED-26-AFS5BF', nombre: 'PROFA. DIANA' }
];

function maestroPorCodigo(codigo) {
  return MAESTROS.find(function (m) {
    return m.codigo === codigo;
  });
}