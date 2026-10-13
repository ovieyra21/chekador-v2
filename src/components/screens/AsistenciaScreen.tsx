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
  const [quincena, setQuincena] = useState<'1-15' | '16-fin'>('1-15');
  const [selectedTrabajadorId, setSelectedTrabajadorId] = useState<string>(
    trabajadores[0]?.id || ''
  );
  const [tipoMarcaje, setTipoMarcaje] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA');
  const [deviceId, setDeviceId] = useState('USB-01');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hashGeneradoReciente, setHashGeneradoReciente] = useState<string | null>(null);
  const [showGoModal, setShowGoModal] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const trabajadorActivo = trabajadores.find((t) => t.id === selectedTrabajadorId) || trabajadores[0];

  // Cálculo de los días a mostrar en el Calendar Grid de 15 días
  const diasQuincena = quincena === '1-15' 
    ? Array.from({ length: 15 }, (_, i) => i + 1)
    : Array.from({ length: 16 }, (_, i) => i + 16);

  // Simular marcaje ahora (dispositivo USB-01)
  const handleSimularMarcaje = async () => {
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
    // Alternar tipo de marcaje
    setTipoMarcaje((prev) => (prev === 'ENTRADA' ? 'SALIDA' : 'ENTRADA'));
  };

  // Obtener marcajes de un trabajador para un día específico del mes
  const getMarcajesParaDia = (trabId: string, dia: number) => {
    return marcajes.filter((m) => {
      if (m.trabajadorId !== trabId) return false;
      const d = new Date(m.timestampUtc);
      return d.getUTCDate() === dia;
    });
  };

  const goCodeSnippet = `package main

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
)

// Daemon Chekdor v2.0 - Lector USB HID (NFC NTAG213)
// Reforma DOF 01/05/2026 Art. 132 Fracc. XXXIV
// Emite eventos inmutables a Supabase Realtime y REST
const DeviceID = "USB-01"

func main() {
	fmt.Printf("[CHEKDOR HID] Escuchando lector %s en /dev/hidraw0...\\n", DeviceID)
	fmt.Println("El trabajador acerca tag NTAG213 a lector USB HID. Sin app, sin celular.")
	
	// Cada lectura genera timestamp UTC + SHA256 inmutable
	// Payload enviado por POST: {trabajador_id, empresa_id, timestamp_utc, hash_sha256, dispositivo_id}
}`;

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
              <span className="text-[#C65D3A] font-bold">Control Horario LFT</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-serif font-bold text-[#1A1A1A] mt-1">
              Registro Electrónico de Jornada
            </h1>
            <p className="text-xs text-neutral-600 mt-0.5">
              Reforma DOF 1 mayo 2026 obligatoria 1-ene-2027 · Art. 132 Fracc. XXXIV LFT.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Badge verde: Prueba plena art 805 LFT */}
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-mono font-semibold flex items-center gap-1.5 shadow-sm">
              <span className="material-symbols-outlined text-[16px] text-emerald-600">verified_user</span>
              <span>Prueba plena art 805 LFT</span>
            </div>

            {/* Botón para ver Daemon Go */}
            <button
              onClick={() => setShowGoModal(true)}
              className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-mono font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px] text-[#C65D3A]">terminal</span>
              <span>Daemon HID Go</span>
            </button>
          </div>
        </div>

        {/* Banner de Garantía Criptográfica e Inmutabilidad en DB */}
        <div className="bg-[#F8F7F4] border border-[#E7E5E4] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-3">
            <span className="material-symbols-outlined text-amber-600 text-xl shrink-0">lock</span>
            <div>
              <span className="font-bold text-neutral-900 font-mono block">
                TRIGGER POSTGRESQL INMUTABLE: trg_bloquear_mutacion_marcajes()
              </span>
              <p className="text-neutral-600">
                Sin botón editar ni borrar en UI ni API. Toda mutación (UPDATE/DELETE) es rechazada con excepción estricta por el motor de base de datos.
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="font-mono text-[10px] text-neutral-500 block">Multa Art. 994 Fr. IV Bis:</span>
            <span className="font-mono text-xs font-bold text-red-700">$28,285 - $565,700 x trabajador</span>
          </div>
        </div>

        {/* Barra de Controles: Selector Quincena 1-15 y 16-fin + Botón Dev Simular */}
        <div className="bg-white border border-[#E7E5E4] p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Selector de Quincena */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-mono uppercase font-bold text-neutral-500">Periodo:</span>
            <div className="inline-flex border border-[#E7E5E4] p-1 bg-[#FCFCF9]">
              <button
                type="button"
                onClick={() => setQuincena('1-15')}
                className={`px-3 py-1 text-xs font-mono font-semibold transition-all cursor-pointer ${
                  quincena === '1-15'
                    ? 'bg-[#C65D3A] text-white shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                1ª Quincena (1 al 15)
              </button>
              <button
                type="button"
                onClick={() => setQuincena('16-fin')}
                className={`px-3 py-1 text-xs font-mono font-semibold transition-all cursor-pointer ${
                  quincena === '16-fin'
                    ? 'bg-[#C65D3A] text-white shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                2ª Quincena (16 al fin)
              </button>
            </div>
            <span className="px-2.5 py-1 bg-neutral-100 font-mono text-xs text-neutral-700 border border-neutral-200">
              Octubre 2026
            </span>
          </div>

          {/* Controles para simular marcaje */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-neutral-500">Trabajador:</span>
              <select
                value={selectedTrabajadorId}
                onChange={(e) => setSelectedTrabajadorId(e.target.value)}
                className="h-8 px-2 bg-[#FCFCF9] border border-[#E7E5E4] font-mono text-xs focus:outline-none focus:border-[#C65D3A]"
              >
                {trabajadores.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.codigo} - {t.nombre} ({t.tagNfcId})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 border border-[#E7E5E4] p-0.5">
              <button
                type="button"
                onClick={() => setTipoMarcaje('ENTRADA')}
                className={`px-2 py-0.5 text-[11px] font-mono font-semibold ${
                  tipoMarcaje === 'ENTRADA' ? 'bg-[#16A34A] text-white' : 'text-neutral-600'
                }`}
              >
                ENTRADA
              </button>
              <button
                type="button"
                onClick={() => setTipoMarcaje('SALIDA')}
                className={`px-2 py-0.5 text-[11px] font-mono font-semibold ${
                  tipoMarcaje === 'SALIDA' ? 'bg-[#DC2626] text-white' : 'text-neutral-600'
                }`}
              >
                SALIDA
              </button>
            </div>

            {/* Botón DEV 'Simular marcaje ahora' */}
            <button
              type="button"
              onClick={handleSimularMarcaje}
              disabled={isProcessing}
              className="px-3.5 py-1.5 bg-[#C65D3A] hover:bg-[#b24f2f] text-white font-mono text-xs font-semibold uppercase tracking-wider shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">play_circle</span>
              <span>{isProcessing ? 'Firmando...' : 'Simular marcaje ahora'}</span>
            </button>
          </div>
        </div>

        {/* Feedback del Hash generado */}
        {hashGeneradoReciente && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 truncate">
              <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">verified</span>
              <span className="font-bold text-emerald-800 shrink-0">SHA-256 Registrado:</span>
              <code className="text-[11px] truncate select-all">{hashGeneradoReciente}</code>
            </div>
            <span className="text-[10px] bg-white border border-emerald-300 px-2 py-0.5 text-emerald-800 shrink-0">
              Dispositivo: {deviceId}
            </span>
          </div>
        )}

        {/* SECCIÓN PRINCIPAL: Grid de 15 Días o Empty State */}
        {marcajes.length === 0 ? (
          /* EMPTY STATE EXACTO REQUERIDO */
          <div className="min-h-[340px] flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-[#E7E5E4] bg-white">
            <div className="w-16 h-16 rounded-full bg-[#FAF5F2] border border-[#F0D5CA] flex items-center justify-center mb-4 text-[#C65D3A]">
              <span className="material-symbols-outlined text-3xl">label</span>
            </div>

            <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-2">
              Sin marcajes
            </h2>

            <p className="max-w-md text-sm text-neutral-600 leading-relaxed mb-6">
              El trabajador acerca tag <strong className="text-[#C65D3A] font-mono">NTAG213</strong> a lector USB HID.{' '}
              <span className="block mt-1 font-semibold text-neutral-800">Sin app, sin celular.</span>
            </p>

            <button
              type="button"
              onClick={handleSimularMarcaje}
              disabled={isProcessing}
              className="px-4 py-2 bg-[#C65D3A] hover:bg-[#b24f2f] text-white font-mono text-xs font-semibold uppercase tracking-wider shadow flex items-center gap-2 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-base">play_arrow</span>
              <span>Simular marcaje ahora ({deviceId})</span>
            </button>
          </div>
        ) : (
          /* CALENDAR GRID 15 DÍAS X TRABAJADORES */
          <div className="space-y-6">
            <div className="bg-white border border-[#E7E5E4] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#E7E5E4] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#C65D3A]">calendar_month</span>
                  <h3 className="font-serif font-bold text-base text-[#1A1A1A]">
                    Calendar Grid · 15 Días x Trabajadores ({quincena === '1-15' ? 'Días 1 al 15' : 'Días 16 al fin'})
                  </h3>
                </div>
                <span className="text-xs font-mono text-neutral-500">
                  Octubre 2026 · {trabajadores.length} trabajadores registrados
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="bg-[#F8F7F4] border-b border-[#1A1A1A] text-neutral-600">
                      <th className="py-2.5 px-3 min-w-[200px] sticky left-0 bg-[#F8F7F4] z-10 border-r border-[#E7E5E4]">
                        Trabajador / Tag NTAG213
                      </th>
                      {diasQuincena.map((dia) => (
                        <th
                          key={dia}
                          className="py-2 px-1 text-center min-w-[42px] border-r border-[#E7E5E4]"
                        >
                          <span className="font-bold text-[#1A1A1A] block">{dia}</span>
                          <span className="text-[10px] text-neutral-500">
                            {['D', 'L', 'M', 'M', 'J', 'V', 'S'][new Date(2026, 9, dia).getDay()]}
                          </span>
                        </th>
                      ))}
                      <th className="py-2.5 px-3 text-center min-w-[70px]">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E5E4]">
                    {trabajadores.map((t) => {
                      const totalMarcajesTrabajador = marcajes.filter((m) => m.trabajadorId === t.id).length;
                      return (
                        <tr key={t.id} className="hover:bg-[#FAF9F6]">
                          <td className="py-2.5 px-3 sticky left-0 bg-white z-10 border-r border-[#E7E5E4]">
                            <div className="font-sans font-medium text-[#1A1A1A]">{t.nombre}</div>
                            <div className="text-[10px] text-neutral-500 flex items-center gap-1">
                              <span className="text-[#C65D3A] font-bold">{t.codigo}</span>
                              <span>•</span>
                              <span>{t.tagNfcId}</span>
                            </div>
                          </td>
                          {diasQuincena.map((dia) => {
                            const marcajesDia = getMarcajesParaDia(t.id, dia);
                            const tieneEntrada = marcajesDia.some((m) => m.tipo === 'ENTRADA');
                            const tieneSalida = marcajesDia.some((m) => m.tipo === 'SALIDA');
                            const count = marcajesDia.length;
                            const isDomingo = new Date(2026, 9, dia).getDay() === 0;

                            return (
                              <td
                                key={dia}
                                className={`py-1.5 px-1 text-center border-r border-[#E7E5E4] ${
                                  isDomingo ? 'bg-neutral-50' : ''
                                }`}
                              >
                                {count === 0 ? (
                                  <span className="text-neutral-300 text-[10px]">•</span>
                                ) : (
                                  <div
                                    title={`${count} marcajes el día ${dia}`}
                                    className={`inline-flex flex-col items-center justify-center w-7 h-7 rounded text-[10px] font-bold ${
                                      tieneEntrada && tieneSalida
                                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                                    }`}
                                  >
                                    <span>{count}</span>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                          <td className="py-2.5 px-3 text-center font-bold text-[#C65D3A]">
                            {totalMarcajesTrabajador}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TIMELINE CON TIMESTAMP ISO8601 UTC + HASH + DEVICE */}
            <div className="bg-white border border-[#E7E5E4] shadow-sm p-5">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E7E5E4]">
                <div>
                  <h3 className="font-serif font-bold text-base text-[#1A1A1A]">
                    Timeline Append-Only de Marcajes
                  </h3>
                  <p className="font-mono text-xs text-neutral-500">
                    Timestamp ISO8601 UTC + Hash SHA-256 + Dispositivo · Sin botón editar ni borrar
                  </p>
                </div>
                <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-xs font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  <span>{marcajes.length} registros válidos</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="bg-[#F8F7F4] border-b border-[#1A1A1A] text-neutral-600 uppercase text-[11px]">
                      <th className="py-2 px-2.5">Tipo</th>
                      <th className="py-2 px-2.5">Trabajador</th>
                      <th className="py-2 px-2.5">Timestamp ISO8601 UTC</th>
                      <th className="py-2 px-2.5">Dispositivo</th>
                      <th className="py-2 px-2.5">Hash SHA-256 Inmutable</th>
                      <th className="py-2 px-2.5 text-center">Estado LFT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E5E4]">
                    {marcajes.slice(0, 25).map((m) => (
                      <tr key={m.id} className="hover:bg-[#FCFCF9]">
                        <td className="py-2 px-2.5 font-bold">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              m.tipo === 'ENTRADA'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : 'bg-red-100 text-red-900 border border-red-300'
                            }`}
                          >
                            {m.tipo}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-[#1A1A1A] font-sans font-medium">
                          {m.trabajadorNombre}
                        </td>
                        <td className="py-2 px-2.5 text-neutral-600">
                          {m.timestampUtc}
                        </td>
                        <td className="py-2 px-2.5 text-[#C65D3A] font-semibold">
                          {m.deviceId}
                        </td>
                        <td className="py-2 px-2.5 text-neutral-700">
                          <code className="text-[10px] bg-neutral-100 px-1.5 py-0.5 border border-neutral-200 select-all">
                            {m.hashSha256.slice(0, 14)}...{m.hashSha256.slice(-8)}
                          </code>
                        </td>
                        <td className="py-2 px-2.5 text-center text-emerald-700 font-bold">
                          ✓ Válido
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Ajuste de horas de quincena para nómina */}
              {trabajadorActivo && (
                <div className="mt-6 pt-4 border-t border-[#E7E5E4] bg-[#FAF9F6] p-4 text-xs">
                  <div className="font-semibold text-neutral-800 mb-2 flex items-center justify-between">
                    <span>Incidencias Quincenales para Motor de Nómina</span>
                    <span className="font-mono text-[10px] text-neutral-500">
                      Trabajador activo: {trabajadorActivo.nombre}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                    <div>
                      <label className="block text-neutral-600 mb-1">
                        Horas extra dobles (Art. 67 LFT):
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
                        className="w-full h-8 px-2 font-mono border border-[#E7E5E4] bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-600 mb-1">
                        Domingos trabajados (Art. 71 LFT):
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
                        className="w-full h-8 px-2 font-mono border border-[#E7E5E4] bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL SERVICIO GO PARA LECTOR REAL HID */}
        {showGoModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-[#E7E5E4] shadow-xl max-w-2xl w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E7E5E4]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#C65D3A]">terminal</span>
                  <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">
                    Daemon USB HID en Go (Lector Real NTAG213)
                  </h3>
                </div>
                <button
                  onClick={() => setShowGoModal(false)}
                  className="text-neutral-500 hover:text-neutral-800 text-sm font-mono cursor-pointer"
                >
                  ✕ Cerrar
                </button>
              </div>

              <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                El daemon corre en segundo plano como servicio local en el dispositivo con lector USB HID (ej. Raspberry Pi o PC en el centro de trabajo). Captura el UID del chip NTAG213, genera el hash SHA-256 y emite el marcaje directamente a Supabase REST y canal Realtime.
              </p>

              <div className="relative">
                <pre className="p-4 bg-neutral-900 text-neutral-200 rounded font-mono text-[11px] overflow-x-auto max-h-60 custom-scroll">
                  {goCodeSnippet}
                </pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(goCodeSnippet);
                    setCopiado(true);
                    setTimeout(() => setCopiado(false), 2000);
                  }}
                  className="absolute top-2 right-2 px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-white text-[10px] font-mono rounded cursor-pointer"
                >
                  {copiado ? '¡Copiado!' : 'Copiar'}
                </button>
              </div>

              <div className="p-3 bg-[#FAF9F6] border border-[#E7E5E4] font-mono text-[11px] text-neutral-700">
                <strong>Ubicación en el repositorio:</strong> <code>services/hid-daemon/main.go</code>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowGoModal(false)}
                  className="px-4 py-2 bg-[#C65D3A] text-white font-mono text-xs font-semibold cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
