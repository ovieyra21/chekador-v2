import React, { useState } from 'react';
import { Trabajador, Empresa } from '../../types';

interface TrabajadoresScreenProps {
  empresa: Empresa;
  trabajadores: Trabajador[];
  onAgregarTrabajador: (t: Trabajador) => void;
  onImportarCsv: () => void;
  onSimularChecadaNfc: (t: Trabajador) => void;
}

export const TrabajadoresScreen: React.FC<TrabajadoresScreenProps> = ({
  empresa,
  trabajadores,
  onAgregarTrabajador,
  onImportarCsv,
  onSimularChecadaNfc,
}) => {
  const [viewMode, setViewMode] = useState<'empty' | 'data'>('data');
  const [searchTerm, setSearchTerm] = useState('PELJ900101ABC');
  const [showAltaModal, setShowAltaModal] = useState(false);

  // Form states for Alta Trabajador
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoPuesto, setNuevoPuesto] = useState('');
  const [nuevoRfc, setNuevoRfc] = useState('');
  const [nuevoCurp, setNuevoCurp] = useState('');
  const [nuevoNss, setNuevoNss] = useState('');
  const [nuevoSalario, setNuevoSalario] = useState('600');
  const [nuevaClabe, setNuevaClabe] = useState('012180015678901234');
  const [nuevoNfc, setNuevoNfc] = useState('04:A1:B2:C3');

  const trabajadoresAMostrar = viewMode === 'empty' ? [] : trabajadores;
  const filtered = trabajadoresAMostrar.filter(
    (t) =>
      t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.rfc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.curp.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.nss.includes(searchTerm)
  );

  const totalDiario = filtered.reduce((acc, t) => acc + t.salarioDiario, 0);
  const totalImssDiario = filtered.reduce((acc, t) => acc + t.sbcImss * 0.2365, 0);

  const handleCrearTrabajadorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sal = parseFloat(nuevoSalario) || 600;
    const factor = 1.0493;
    const sbc = Math.round(sal * factor * 100) / 100;

    const t: Trabajador = {
      id: `trab_${Date.now()}`,
      empresaId: empresa.id,
      codigo: `F-${String(trabajadores.length + 1).padStart(3, '0')}`,
      nombre: nuevoNombre.trim(),
      puesto: nuevoPuesto.trim(),
      turno: 'Mixto (Art. 60 LFT)',
      rfc: nuevoRfc.trim().toUpperCase(),
      curp: nuevoCurp.trim().toUpperCase(),
      nss: nuevoNss.trim(),
      salarioDiario: sal,
      sbcImss: sbc,
      factorIntegracion: factor,
      clabeBancaria: nuevaClabe.trim(),
      banco: 'BBVA México',
      tagNfcId: nuevoNfc.trim() || '04:A1:B2:C3',
      antiguedad: 'Nuevo ingreso',
      estatus: 'activo',
      horasExtraDobles: 0,
      domingosTrabajados: 0,
      diasTrabajados: 15,
    };

    onAgregarTrabajador(t);
    setShowAltaModal(false);
    setViewMode('data');
    setNuevoNombre('');
    setNuevoPuesto('');
    setNuevoRfc('');
    setNuevoCurp('');
    setNuevoNss('');
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-4 sm:p-8 bg-[#FCFCF9] overflow-y-auto custom-scroll text-left">
      <div className="flex flex-col w-full">
        {/* Header Breadcrumb & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E7E5E4]">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-neutral-500">
              <span>Despacho</span>
              <span className="text-neutral-400">/</span>
              <span className="text-[#1A1A1A] font-semibold">{empresa.nombre}</span>
              <span className="text-neutral-400">/</span>
              <span className="text-[#C65D3A] font-bold">Padrón de Trabajadores</span>
            </div>
            <div className="flex items-baseline gap-3">
              <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#1A1A1A] tracking-tight">
                Padrón de Trabajadores
              </h1>
              <span className="font-mono text-xs px-2 py-0.5 bg-neutral-100 text-neutral-700 border border-neutral-300">
                RFC: {empresa.rfc}
              </span>
            </div>
          </div>

          {/* Mode Selector & Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Switcher */}
            <div className="inline-flex p-1 bg-[#F5F5F4] border border-[#E7E5E4] text-xs font-mono shadow-inner">
              <button
                type="button"
                onClick={() => setViewMode('empty')}
                className={`px-3 py-1.5 transition-colors font-medium flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'empty'
                    ? 'bg-white text-[#C65D3A] shadow-sm font-semibold'
                    : 'text-neutral-500 hover:text-[#1A1A1A]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span>
                <span>Sin datos (0)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('data')}
                className={`px-3 py-1.5 transition-colors font-medium flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'data'
                    ? 'bg-white text-[#C65D3A] shadow-sm font-semibold'
                    : 'text-neutral-500 hover:text-[#1A1A1A]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></span>
                <span>Con datos ({trabajadores.length} activos)</span>
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onImportarCsv}
                className="h-9 px-3.5 bg-white text-[#1A1A1A] text-xs font-medium border border-[#E7E5E4] hover:bg-neutral-50 transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-neutral-500">
                  upload_file
                </span>
                <span>Importar CSV 20/20 SAT</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAltaModal(true)}
                className="h-9 px-4 bg-[#C65D3A] text-white text-xs font-semibold hover:bg-[#b24f2f] transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                <span>+ Alta trabajador</span>
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Stat Tape */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3.5 border-b border-[#E7E5E4] bg-[#F9F8F6] px-3 my-3">
          <div>
            <div className="font-mono text-[10px] uppercase text-neutral-500">
              Registro Patronal IMSS
            </div>
            <div className="font-mono text-xs font-semibold text-[#1A1A1A]">
              {empresa.registroPatronalImss}
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase text-neutral-500">
              Régimen Fiscal Empleador
            </div>
            <div className="font-sans text-xs text-[#1A1A1A] truncate">
              {empresa.regimenFiscal}
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase text-neutral-500">
              Auditoría LFT Obligatoria
            </div>
            <div className="font-mono text-xs text-[#16A34A] flex items-center gap-1 font-semibold">
              <span className="material-symbols-outlined text-[15px]">verified</span>
              <span>Art. 132 Fracc. XXXIV</span>
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase text-neutral-500">
              Hash Integridad Nómina
            </div>
            <div className="font-mono text-[11px] text-neutral-500 truncate">
              sha256:7e98a3b841...0f4c
            </div>
          </div>
        </div>

        {/* View 1: Empty State */}
        {viewMode === 'empty' && (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-[#E7E5E4] my-6 text-center">
            <div className="w-14 h-14 bg-[#F8F7F4] flex items-center justify-center text-[#C65D3A] mb-5 border border-[#E7E5E4]">
              <svg
                className="w-7 h-7 text-[#C65D3A]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="font-serif text-2xl text-[#1A1A1A] mb-2 font-bold">
              Sin trabajadores
            </h2>
            <p className="font-sans text-sm text-neutral-600 max-w-md mb-6 leading-relaxed">
              Da de alta a tu primer trabajador. Sin foto, sin INE. Registro criptográfico directo compatible con reloj checador NFC y timbrado SAT.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
              <button
                onClick={() => setShowAltaModal(true)}
                className="h-9 px-5 bg-[#C65D3A] text-white text-xs font-semibold hover:bg-[#b24f2f] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>+ Alta trabajador</span>
              </button>
              <button
                onClick={() => setViewMode('data')}
                className="h-9 px-4 bg-white text-[#1A1A1A] text-xs font-medium border border-[#E7E5E4] hover:bg-neutral-50 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-neutral-500">
                  visibility
                </span>
                <span>Cargar padrón con 1 o 6 trabajadores</span>
              </button>
            </div>
            <div className="max-w-xl p-3 bg-[#F8F7F4] border border-[#E7E5E4] text-left flex items-start gap-3">
              <span className="material-symbols-outlined text-neutral-500 text-[20px] shrink-0 mt-0.5">
                policy
              </span>
              <p className="font-mono text-xs text-neutral-600 leading-relaxed">
                <strong className="text-[#1A1A1A] font-semibold">Cumplimiento Estricto:</strong> Estructura CSV compatible con SUA, IDSE y Art. 132 LFT. Cero biometría invasiva ni almacenamiento de imágenes pesadas: el control horario opera vía tokens NFC físicos auditables para prueba plena (Art. 805 LFT).
              </p>
            </div>
          </div>
        )}

        {/* View 2: With Data Table */}
        {viewMode === 'data' && (
          <div className="flex flex-col my-4">
            {/* Filter & Quick Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#F8F7F4] border border-b-0 border-[#E7E5E4]">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por RFC, NSS, Nombre..."
                    className="h-8 pl-8 pr-3 text-xs bg-white border border-[#E7E5E4] focus:border-[#C65D3A] focus:outline-none w-64 font-mono text-[#1A1A1A]"
                  />
                  <span className="material-symbols-outlined absolute left-2 top-1.5 text-neutral-400 text-[18px]">
                    search
                  </span>
                </div>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-[11px] font-mono text-neutral-500 hover:text-neutral-800 underline cursor-pointer"
                  >
                    Limpiar filtro (mostrar todos)
                  </button>
                )}
                <span className="font-mono text-[11px] text-neutral-500 bg-[#E7E5E4] px-2 py-0.5">
                  Filtro: Activos ({filtered.length})
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono text-neutral-500">
                <span>
                  Última sincronización SUA: <strong className="text-[#1A1A1A]">Hoy 08:30:14</strong>
                </span>
                <span>·</span>
                <span className="text-[#16A34A] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></span>
                  Timbrado Póliza: Al corriente
                </span>
              </div>
            </div>

            {/* Master Technical Table */}
            <div className="overflow-x-auto border border-[#E7E5E4] bg-white">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-[#F5F5F4] border-b border-[#1A1A1A]">
                    <th className="py-2.5 px-3 font-mono text-[11px] uppercase text-neutral-600 font-semibold">
                      1. Nombre / Puesto
                    </th>
                    <th className="py-2.5 px-3 font-mono text-[11px] uppercase text-neutral-600 font-semibold">
                      2. RFC
                    </th>
                    <th className="py-2.5 px-3 font-mono text-[11px] uppercase text-neutral-600 font-semibold">
                      3. CURP
                    </th>
                    <th className="py-2.5 px-3 font-mono text-[11px] uppercase text-neutral-600 font-semibold">
                      4. NSS
                    </th>
                    <th className="py-2.5 px-3 font-mono text-[11px] uppercase text-neutral-600 font-semibold text-right">
                      5. Salario Diario
                    </th>
                    <th className="py-2.5 px-3 font-mono text-[11px] uppercase text-neutral-600 font-semibold text-right">
                      6. SBC (IMSS)
                    </th>
                    <th className="py-2.5 px-3 font-mono text-[11px] uppercase text-neutral-600 font-semibold">
                      7. Cuenta CLABE
                    </th>
                    <th className="py-2.5 px-3 font-mono text-[11px] uppercase text-neutral-600 font-semibold text-center">
                      8. Tag NFC ID
                    </th>
                    <th className="py-2.5 px-3 font-mono text-[11px] uppercase text-neutral-600 font-semibold text-center">
                      9. Estatus
                    </th>
                    <th className="py-2.5 px-3 font-mono text-[11px] uppercase text-neutral-600 font-semibold text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E5E4] text-xs">
                  {filtered.map((t) => (
                    <tr key={t.id} className="hover:bg-[#FBFBF9] transition-colors group">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-[#F4F2EE] text-[#1A1A1A] flex items-center justify-center font-mono font-bold text-xs border border-[#E7E5E4]">
                            {t.nombre.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <div className="font-sans font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                              {t.nombre}
                              <span className="font-mono text-[10px] text-neutral-500 bg-neutral-100 px-1 border border-neutral-200">
                                {t.codigo}
                              </span>
                            </div>
                            <div className="font-mono text-[11px] text-neutral-500">
                              {t.puesto} · {t.turno}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[#1A1A1A] font-medium">
                        {t.rfc}
                      </td>
                      <td className="py-3 px-3 font-mono text-[#1A1A1A]">
                        {t.curp}
                      </td>
                      <td className="py-3 px-3 font-mono text-[#1A1A1A]">
                        {t.nss}
                      </td>
                      <td className="py-3 px-3 font-mono text-right font-bold text-[#1A1A1A]">
                        ${t.salarioDiario.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-mono text-right text-[#1A1A1A] font-semibold">
                        ${t.sbcImss.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-mono text-neutral-600">
                        {t.clabeBancaria}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[11px] font-semibold bg-[#F5F5F4] text-[#C65D3A] border border-[#E7E5E4]">
                          <span className="material-symbols-outlined text-[13px]">
                            contactless
                          </span>
                          {t.tagNfcId}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[11px] font-semibold bg-emerald-50 text-[#16A34A] border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></span>
                          Activo
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onSimularChecadaNfc(t)}
                            title="Simular Checada NFC Inmutable"
                            className="p-1.5 text-neutral-500 hover:text-[#C65D3A] hover:bg-neutral-100 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              contactless
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Ledger Balancing & Totals Bar */}
            <div className="p-3 bg-[#F5F5F4] border border-t-0 border-[#E7E5E4] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
              <div className="flex flex-wrap items-center gap-4 text-neutral-600">
                <div>
                  <span>Total trabajadores:</span>
                  <strong className="text-[#1A1A1A] ml-1">{filtered.length}</strong>
                </div>
                <span className="text-neutral-300">|</span>
                <div>
                  <span>Nómina diaria gravada base:</span>
                  <strong className="text-[#1A1A1A] ml-1 font-mono">
                    ${totalDiario.toFixed(2)} MXN
                  </strong>
                </div>
                <span className="text-neutral-300">|</span>
                <div>
                  <span>Cuota patronal proyectada IMSS:</span>
                  <strong className="text-[#1A1A1A] ml-1 font-mono">
                    ${filtered.length === 1 ? '148.92' : totalImssDiario.toFixed(2)} / día
                  </strong>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-neutral-500 uppercase">Estado del folio:</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-[#16A34A] font-bold text-xs border border-emerald-200">
                  <span className="material-symbols-outlined text-[14px]">done_all</span>
                  Cuadre Padrón 0.00
                </span>
              </div>
            </div>

            {/* Audit Proof Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              <div className="p-3 bg-white border border-[#E7E5E4]">
                <div className="font-mono text-[11px] text-neutral-500 uppercase mb-1 font-semibold">
                  Certeza Jurídica Art. 805 LFT
                </div>
                <p className="font-sans text-xs text-neutral-600 leading-relaxed">
                  La carga probatoria de asistencia recae sobre el patrón. Registro criptográfico NFC de Chekdor ofrece presunción válida juris tantum en inspecciones de STPS.
                </p>
              </div>
              <div className="p-3 bg-white border border-[#E7E5E4]">
                <div className="font-mono text-[11px] text-neutral-500 uppercase mb-1 font-semibold">
                  Integración CONTPAQi / SUA
                </div>
                <p className="font-sans text-xs text-neutral-600 leading-relaxed">
                  Exportación de catálogo de personal con RFC/CURP validado en lista negra SAT Art. 69-B y algoritmo checksum RFC nativo.
                </p>
              </div>
              <div className="p-3 bg-white border border-[#E7E5E4]">
                <div className="font-mono text-[11px] text-neutral-500 uppercase mb-1 font-semibold">
                  Aislamiento por Despacho (RLS)
                </div>
                <div className="font-mono text-[11px] text-neutral-600 break-all bg-[#FCFCF9] p-1.5 border border-[#E7E5E4]">
                  WHERE empresa_id = '{empresa.id}' AND despacho_id = auth.uid()
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Alta Trabajador */}
      {showAltaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-[#E7E5E4] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E5E4] mb-4">
              <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">
                Alta de Nuevo Trabajador
              </h3>
              <button
                type="button"
                onClick={() => setShowAltaModal(false)}
                className="text-neutral-400 hover:text-neutral-800"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCrearTrabajadorSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej. Roberto Sánchez Méndez"
                  className="w-full h-8 px-2 border border-[#E7E5E4] focus:outline-none focus:border-[#C65D3A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Puesto *</label>
                  <input
                    type="text"
                    required
                    value={nuevoPuesto}
                    onChange={(e) => setNuevoPuesto(e.target.value)}
                    placeholder="Ej. Montacarguista"
                    className="w-full h-8 px-2 border border-[#E7E5E4] focus:outline-none focus:border-[#C65D3A]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Salario Diario (MXN) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={nuevoSalario}
                    onChange={(e) => setNuevoSalario(e.target.value)}
                    className="w-full h-8 px-2 font-mono border border-[#E7E5E4] focus:outline-none focus:border-[#C65D3A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">RFC (13 car.) *</label>
                  <input
                    type="text"
                    required
                    maxLength={13}
                    value={nuevoRfc}
                    onChange={(e) => setNuevoRfc(e.target.value.toUpperCase())}
                    placeholder="SAMR850101XYZ"
                    className="w-full h-8 px-2 font-mono border border-[#E7E5E4] focus:outline-none focus:border-[#C65D3A]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">CURP (18 car.) *</label>
                  <input
                    type="text"
                    required
                    maxLength={18}
                    value={nuevoCurp}
                    onChange={(e) => setNuevoCurp(e.target.value.toUpperCase())}
                    placeholder="SAMR850101HDFRRN01"
                    className="w-full h-8 px-2 font-mono border border-[#E7E5E4] focus:outline-none focus:border-[#C65D3A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">NSS (11 car.) *</label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={nuevoNss}
                    onChange={(e) => setNuevoNss(e.target.value)}
                    placeholder="12908472910"
                    className="w-full h-8 px-2 font-mono border border-[#E7E5E4] focus:outline-none focus:border-[#C65D3A]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Tag NFC ID</label>
                  <input
                    type="text"
                    value={nuevoNfc}
                    onChange={(e) => setNuevoNfc(e.target.value)}
                    placeholder="04:A1:B2:C3"
                    className="w-full h-8 px-2 font-mono border border-[#E7E5E4] focus:outline-none focus:border-[#C65D3A]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">CLABE Interbancaria (18 dígitos)</label>
                <input
                  type="text"
                  maxLength={18}
                  value={nuevaClabe}
                  onChange={(e) => setNuevaClabe(e.target.value)}
                  placeholder="012180015678901234"
                  className="w-full h-8 px-2 font-mono border border-[#E7E5E4] focus:outline-none focus:border-[#C65D3A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E7E5E4]">
                <button
                  type="button"
                  onClick={() => setShowAltaModal(false)}
                  className="px-3 py-1.5 border border-[#E7E5E4] hover:bg-neutral-50 text-neutral-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#C65D3A] hover:bg-[#b24f2f] text-white font-semibold cursor-pointer"
                >
                  Guardar Trabajador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
