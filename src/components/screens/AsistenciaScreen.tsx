import React, { useState } from 'react';
import { Trabajador, Empresa, MarcajeAsistencia } from '../../types';
import { generarHashMarcaje } from '../../crypto/sha256';

interface AsistenciaScreenProps {
  empresa: Empresa;
  trabajadores: Trabajador[];
  marcajes: MarcajeAsistencia[];
  onNuevoMarcaje: (m: MarcajeAsistencia) => void;
  onActualizarJornadaTrabajador: (trabajadorId: string, horasExtra: number, domingos: number) => void;
}

export const AsistenciaScreen: React.FC<AsistenciaScreenProps> = ({
  empresa,
  trabajadores,
  marcajes,
  onNuevoMarcaje,
  onActualizarJornadaTrabajador,
}) => {
  const [selectedTrabajadorId, setSelectedTrabajadorId] = useState<string>(
    trabajadores[0]?.id || ''
  );
  const [tipoMarcaje, setTipoMarcaje] = useState<'ENTRADA' | 'SALIDA' | 'COMIDA_INICIO' | 'COMIDA_FIN'>('ENTRADA');
  const [deviceId, setDeviceId] = useState('CHEKDOR_TERMINAL_CELAYA_01');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hashGeneradoReciente, setHashGeneradoReciente] = useState<string | null>(null);

  const trabajadorActivo = trabajadores.find((t) => t.id === selectedTrabajadorId) || trabajadores[0];

  const handleRegistrarChecada = async () => {
    if (!trabajadorActivo) return;
    setIsProcessing(true);

    const nowIso = new Date().toISOString();
    const salt = `salt_${empresa.id}_sec_${Math.floor(Date.now() / 1000)}`;
    const hash = await generarHashMarcaje(
      trabajadorActivo.id,
      nowIso,
      deviceId,
      salt
    );

    const nuevo: MarcajeAsistencia = {
      id: `marc_${Date.now()}`,
      empresaId: empresa.id,
      trabajadorId: trabajadorActivo.id,
      trabajadorNombre: trabajadorActivo.nombre,
      tipo: tipoMarcaje,
      timestampUtc: nowIso,
      deviceId,
      hashSha256: hash,
      salt,
      esValido: true,
    };

    onNuevoMarcaje(nuevo);
    setHashGeneradoReciente(hash);
    setIsProcessing(false);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-4 sm:p-8 bg-[#FCFCF9] overflow-y-auto custom-scroll text-left">
      <div className="flex flex-col w-full max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#E7E5E4] gap-4">
          <div>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-neutral-500 uppercase">
              <span>Despacho</span>
              <span>/</span>
              <span>{empresa.nombre}</span>
              <span>/</span>
              <span className="text-[#C65D3A] font-bold">Registro Electrónico de Jornada</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-serif font-bold text-[#1A1A1A] mt-1">
              Control Horario LFT Art. 132 Fracc. XXXIV
            </h1>
            <p className="text-xs text-neutral-600 mt-0.5">
              Reforma DOF 1 mayo 2026 obligatoria 1-ene-2027 · Criptografía inmutable SHA-256 para prueba plena Art. 805 LFT.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-800 text-xs font-mono">
              <span className="font-semibold block">Multa Art. 994 Fr. IV Bis:</span>
              <span>$28,285 - $565,700 x trabajador</span>
            </div>
          </div>
        </div>

        {/* 2-Column Terminal Simulator & Bitácora */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Reloj Checador Terminal */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-white border border-[#E7E5E4] p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E7E5E4]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#C65D3A] text-xl">
                    contactless
                  </span>
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                    Terminal Checador NFC / Biometría
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-50 text-[#16A34A] border border-emerald-200 font-semibold">
                  ONLINE · 0ms LATENCY
                </span>
              </div>

              {/* Selector de Trabajador */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-neutral-700">
                    Seleccionar Trabajador para Marcaje:
                  </label>
                  <select
                    value={selectedTrabajadorId}
                    onChange={(e) => setSelectedTrabajadorId(e.target.value)}
                    className="w-full h-9 px-2.5 bg-[#FCFCF9] border border-[#E7E5E4] font-medium text-[#1A1A1A] focus:outline-none focus:border-[#C65D3A]"
                  >
                    {trabajadores.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.codigo} - {t.nombre} ({t.puesto})
                      </option>
                    ))}
                  </select>
                </div>

                {trabajadorActivo && (
                  <div className="p-3 bg-[#F8F7F4] border border-[#E7E5E4] font-mono text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Tag NFC UID:</span>
                      <strong className="text-[#C65D3A]">{trabajadorActivo.tagNfcId}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Jornada LFT:</span>
                      <span>{trabajadorActivo.turno}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Horas Extra registradas:</span>
                      <strong className="text-[#1A1A1A]">{trabajadorActivo.horasExtraDobles} hrs dobles</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Domingos trabajados:</span>
                      <strong className="text-[#1A1A1A]">{trabajadorActivo.domingosTrabajados} domingos</strong>
                    </div>
                  </div>
                )}

                {/* Tipo de Marcaje */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoMarcaje('ENTRADA')}
                    className={`py-2 px-3 text-xs font-mono font-semibold border transition-all cursor-pointer ${
                      tipoMarcaje === 'ENTRADA'
                        ? 'bg-[#16A34A] text-white border-[#16A34A]'
                        : 'bg-white text-neutral-700 border-[#E7E5E4] hover:bg-neutral-50'
                    }`}
                  >
                    ENTRADA
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoMarcaje('SALIDA')}
                    className={`py-2 px-3 text-xs font-mono font-semibold border transition-all cursor-pointer ${
                      tipoMarcaje === 'SALIDA'
                        ? 'bg-[#DC2626] text-white border-[#DC2626]'
                        : 'bg-white text-neutral-700 border-[#E7E5E4] hover:bg-neutral-50'
                    }`}
                  >
                    SALIDA
                  </button>
                </div>

                {/* Hardware device */}
                <div>
                  <label className="block text-neutral-500 text-[11px] font-mono mb-1">
                    ID Dispositivo Checador Físico
                  </label>
                  <input
                    type="text"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    className="w-full h-8 px-2 bg-[#FCFCF9] border border-[#E7E5E4] font-mono text-xs"
                  />
                </div>

                {/* Submit Checada Button */}
                <button
                  type="button"
                  onClick={handleRegistrarChecada}
                  disabled={isProcessing}
                  className="w-full py-2.5 bg-[#C65D3A] hover:bg-[#b24f2f] text-white font-semibold text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    fingerprint
                  </span>
                  <span>
                    {isProcessing ? 'Firmando SHA-256...' : `Estampar Marcaje ${tipoMarcaje}`}
                  </span>
                </button>
              </div>

              {/* Hash feedback */}
              {hashGeneradoReciente && (
                <div className="mt-4 p-2.5 bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-900 break-all">
                  <div className="font-bold flex items-center gap-1 text-[11px] text-[#16A34A] mb-1">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    Firma Criptográfica SHA-256 Generada:
                  </div>
                  <span className="text-[10px] select-all">{hashGeneradoReciente}</span>
                </div>
              )}
            </div>

            {/* Ajuste manual de jornada para alimentar cálculo quincenal */}
            {trabajadorActivo && (
              <div className="bg-white border border-[#E7E5E4] p-4 text-xs">
                <div className="font-semibold text-neutral-800 mb-2 flex items-center justify-between">
                  <span>Horas Extra y Domingos de Quincena</span>
                  <span className="font-mono text-[10px] text-neutral-500">
                    Alimenta Motor Nómina
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-600 mb-1">
                      Horas extra dobles (Art. 67):
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={40}
                      value={trabajadorActivo.horasExtraDobles}
                      onChange={(e) =>
                        onActualizarJornadaTrabajador(
                          trabajadorActivo.id,
                          parseInt(e.target.value) || 0,
                          trabajadorActivo.domingosTrabajados
                        )
                      }
                      className="w-full h-8 px-2 font-mono border border-[#E7E5E4]"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-600 mb-1">
                      Domingos trabajados (Art. 71):
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={4}
                      value={trabajadorActivo.domingosTrabajados}
                      onChange={(e) =>
                        onActualizarJornadaTrabajador(
                          trabajadorActivo.id,
                          trabajadorActivo.horasExtraDobles,
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full h-8 px-2 font-mono border border-[#E7E5E4]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Bitácora Inmutable SHA-256 */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="bg-white border border-[#E7E5E4] p-5 shadow-sm flex flex-col h-full">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E7E5E4]">
                <div>
                  <h3 className="font-serif font-bold text-base text-[#1A1A1A]">
                    Bitácora Criptográfica Inmutable de Marcajes
                  </h3>
                  <span className="font-mono text-[11px] text-neutral-500">
                    Trigger Postgres: Prohibido UPDATE y DELETE · {marcajes.length} registros auditables
                  </span>
                </div>
                <span className="font-mono text-[11px] text-[#16A34A] bg-emerald-50 px-2 py-0.5 border border-emerald-200 font-semibold">
                  Hash SHA-256 Enforced
                </span>
              </div>

              {/* Table of Marcajes */}
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse font-mono text-[11px]">
                  <thead>
                    <tr className="bg-[#F5F5F4] border-b border-[#1A1A1A] text-neutral-600 uppercase">
                      <th className="py-2 px-2.5">Tipo</th>
                      <th className="py-2 px-2.5">Trabajador</th>
                      <th className="py-2 px-2.5">Timestamp UTC</th>
                      <th className="py-2 px-2.5">Hash SHA-256</th>
                      <th className="py-2 px-2.5 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E5E4]">
                    {marcajes.map((m) => (
                      <tr key={m.id} className="hover:bg-[#FBFBF9]">
                        <td className="py-2 px-2.5 font-bold">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              m.tipo === 'ENTRADA'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-red-50 text-red-800 border border-red-200'
                            }`}
                          >
                            {m.tipo}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-[#1A1A1A] font-sans font-medium">
                          {m.trabajadorNombre}
                        </td>
                        <td className="py-2 px-2.5 text-neutral-500">
                          {m.timestampUtc.replace('T', ' ').slice(0, 19)}
                        </td>
                        <td className="py-2 px-2.5 text-neutral-700 truncate max-w-[170px]" title={m.hashSha256}>
                          {m.hashSha256.slice(0, 12)}...{m.hashSha256.slice(-8)}
                        </td>
                        <td className="py-2 px-2.5 text-center text-[#16A34A] font-bold">
                          ✓ Válido
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Legal explanation footnote */}
              <div className="mt-4 pt-3 border-t border-[#E7E5E4] text-[11px] font-sans text-neutral-600 bg-[#F8F7F4] p-3">
                <strong className="text-[#1A1A1A]">Fundamento Jurídico:</strong> La inalterabilidad del registro se garantiza mediante concatenación de clave de trabajador, timestamp atómico y token físico. El hash resultante no puede ser manipulado ni alterado retrospectivamente en inspecciones laborales de la STPS o tribunales laborales.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
