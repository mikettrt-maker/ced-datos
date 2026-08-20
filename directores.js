const DIRECTOR = {
  codigo: 'CED-26-ZX7QR4',
  nombre: 'DIRECCIÓN'
};

function directorPorCodigo(codigo) {
  return DIRECTOR && DIRECTOR.codigo === codigo ? DIRECTOR : null;
}