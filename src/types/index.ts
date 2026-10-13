export type CatalogoTipo = '510-001' | '6000-01-001';

export interface Despacho {
  id: string;
  nombre: string;
  rfc: string;
  correo: string;
  tokenAuth: string;
  licenciaLimiteEmpleados: number;
  creadoEn: string;
}

export interface Empresa {
  id: string;
  despachoId: string;
  rfc: string;
  nombre: string;
  catalogoBase: CatalogoTipo;
  regimenFiscal: string;
  registroPatronalImss: string;
  cuentaBancoClabe?: string;
  creadoEn: string;
}

export interface Trabajador {
  id: string;
  empresaId: string;
  codigo: string; // e.g. F-001
  nombre: string;
  puesto: string;
  turno: string;
  rfc: string;
  curp: string;
  nss: string;
  salarioDiario: number;
  sbcImss: number;
  factorIntegracion: number;
  clabeBancaria: string;
  banco: string;
  tagNfcId: string;
  antiguedad: string;
  estatus: 'activo' | 'baja';
  horasExtraDobles: number;
  domingosTrabajados: number;
  diasTrabajados: number;
}

export interface MarcajeAsistencia {
  id: string;
  empresaId: string;
  trabajadorId: string;
  trabajadorNombre: string;
  tipo: 'ENTRADA' | 'SALIDA' | 'COMIDA_INICIO' | 'COMIDA_FIN';
  timestampUtc: string;
  deviceId: string;
  hashSha256: string;
  salt: string;
  esValido: boolean;
}

export interface PercepcionCalculada {
  codigoSat: string;
  concepto: string;
  fundamentoLft: string;
  unidadBase: string;
  bruto: number;
  gravadoLisr: number;
  exentoLisr: number;
}

export interface DeduccionCalculada {
  codigoSat: string;
  concepto: string;
  fundamento: string;
  monto: number;
}

export interface CalculoTrabajador {
  trabajador: Trabajador;
  percepciones: PercepcionCalculada[];
  deducciones: DeduccionCalculada[];
  totalBruto: number;
  totalGravadoLisr: number;
  totalExentoLisr: number;
  totalDeducciones: number;
  netoLiquido: number;
  retencionIsr: number;
  imssObrero: number;
  cargaPatronalImss: number;
  costoTotalEmpresa: number;
  fixGuarderiasDescuentoAplica: boolean;
}

export interface ResumenQuincena {
  folioFiscal: string;
  periodo: string;
  diasPeriodo: number;
  totalTrabajadores: number;
  totalBruto: number;
  totalNetoDispersar: number;
  totalRetencionIsr: number;
  totalRetencionImssObrero: number;
  totalCostoEmpresa: number;
  cuadreDiferencia: number;
  calculos: CalculoTrabajador[];
}

export interface AsientoContable {
  movimiento: number;
  cuenta: string;
  concepto: string;
  debe: number;
  haber: number;
  rfc: string;
  razonSocial: string;
}

export interface PolizaDiario {
  folio: string;
  fecha: string;
  concepto: string;
  catalogoTipo: CatalogoTipo;
  asientos: AsientoContable[];
  totalDebe: number;
  totalHaber: number;
  diferencia: number;
  cuadraExacto: boolean;
}
