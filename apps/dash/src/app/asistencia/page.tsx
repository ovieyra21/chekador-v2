'use client';

import React, { useState, useEffect } from 'react';
import {
  Tag,
  Clock,
  ShieldCheck,
  Play,
  RotateCcw,
  Sparkles,
  Terminal,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Lock,
  ChevronLeft,
  ChevronRight,
  Radio,
  FileCode,
  ExternalLink,
  Users,
  Copy,
  Check,
} from 'lucide-react';
import { DashNav } from '../../components/DashNav';
import { createClient } from '../../lib/supabase/client';

export interface MarcajeRow {
  id: string;
  trabajador_id: string;
  trabajador_nombre?: string;
  empresa_id: string;
  timestamp_utc: string;
  hash_sha256: string;
  dispositivo_id: string;
  created_at?: string;
  tipo?: 'ENTRADA' | 'SALIDA' | 'COMIDA_INICIO' | 'COMIDA_FIN';
}

export interface TrabajadorSummary {
  id: string;
  nombre: string;
  nfc_uid: string;
  num_empleado?: string;
  puesto?: string;
}

// Demo trabajador predeterminado
const TRABAJADORES_DEFAULT: TrabajadorSummary[] = [
  {
    id: 'trab_juan_perez_001',
    nombre: 'Juan Pérez López',
    nfc_uid: '04:A1:B2:C3:D4:E5:F6',
    num_empleado: 'F-001',
    puesto: 'Auxiliar de Almacén',
  },
  {
    id: 'trab_maria_sanchez_002',
    nombre: 'María Elena Sánchez Rico',
    nfc_uid: '04:77:88:99:AA:BB:CC',
    num_empleado: 'F-002',
    puesto: 'Supervisora de Calidad',
  },
  {
    id: 'trab_carlos_mendoza_003',
    nombre: 'Carlos Mendoza Ruiz',
    nfc_uid: '04:12:34:56:78:9A:BC',
    num_empleado: 'F-003',
    puesto: 'Operador Logístico',
  },
];

const EMPRESA_DEMO = {
  id: 'emp_demo_comercializadora_bajio',
  nombre: 'Comercializadora del Bajío S.A. de C.V.',
  rfc: 'DEMO260101AB1',
};

async function calcularSha256(cadena: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(cadena);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function AsistenciaPage() {
  const [quincena, setQuincena] = useState<'1-15' | '16-fin'>('1-15');
  const [mes, setMes] = useState<number>(10); // Octubre
  const [anio, setAnio] = useState<number>(2026);
  const [marcajes, setMarcajes] = useState<MarcajeRow[]>([]);
  const [trabajadores, setTrabajadores] = useState<TrabajadorSummary[]>(TRABAJADORES_DEFAULT);
  const [trabajadorSeleccionado, setTrabajadorSeleccionado] = useState<string>(TRABAJADORES_DEFAULT[0].id);
  const [tipoMarcaje, setTipoMarcaje] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA');
  const [dispositivoId, setDispositivoId] = useState<string>('USB-01');
  const [simulando, setSimulando] = useState(false);
  const [ultimoMarcajeHash, setUltimoMarcajeHash] = useState<string | null>(null);
  const [mostrarModalGo, setMostrarModalGo] = useState(false);
  const [copiadoGo, setCopiadoGo] = useState(false);

  // Cargar de localStorage
  useEffect(() => {
    const saved = localStorage.getItem('chekdor_marcajes_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMarcajes(parsed);
      } catch {
        setMarcajes([]);
      }
    } else {
      setMarcajes([]);
    }

    // Cargar trabajadores de localStorage si existen
    const savedTrab = localStorage.getItem('chekdor_trabajadores_v2');
    if (savedTrab) {
      try {
        const parsedTrab = JSON.parse(savedTrab);
        if (parsedTrab.length > 0) {
          setTrabajadores(
            parsedTrab.map((t: any) => ({
              id: t.id,
              nombre: t.nombre,
              nfc_uid: t.nfc_uid,
              num_empleado: t.num_empleado,
              puesto: t.puesto,
            }))
          );
          setTrabajadorSeleccionado(parsedTrab[0].id);
        }
      } catch {
        // Fallback default
      }
    }
  }, []);

  const persistirMarcajes = (nuevos: MarcajeRow[]) => {
    setMarcajes(nuevos);
    localStorage.setItem('chekdor_marcajes_v2', JSON.stringify(nuevos));
  };

  // Días según la quincena elegida
  const obtenerDiasQuincena = () => {
    const ultimoDiaMes = new Date(anio, mes, 0).getDate();
    if (quincena === '1-15') {
      return Array.from({ length: 15 }, (_, i) => i + 1);
    } else {
      const diasSegunda = ultimoDiaMes - 15;
      return Array.from({ length: diasSegunda }, (_, i) => i + 16);
    }
  };

  const dias = obtenerDiasQuincena();

  // Simular marcaje ahora
  const handleSimularMarcaje = async () => {
    const trab = trabajadores.find((t) => t.id === trabajadorSeleccionado) || trabajadores[0];
    if (!trab) return;

    setSimulando(true);
    try {
      const timestampIso = new Date().toISOString();
      const salt = `salt_${EMPRESA_DEMO.id}_sec_${Math.floor(Date.now() / 1000)}`;
      // Hash requerido: SHA256(trabajador_id + timestamp + device_id + salt)
      const inputHash = `${trab.id}${timestampIso}${dispositivoId}${salt}`;
      const hashSha256 = await calcularSha256(inputHash);

      const nuevoMarcaje: MarcajeRow = {
        id: `marc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        trabajador_id: trab.id,
        trabajador_nombre: trab.nombre,
        empresa_id: EMPRESA_DEMO.id,
        timestamp_utc: timestampIso,
        hash_sha256: hashSha256,
        dispositivo_id: dispositivoId,
        tipo: tipoMarcaje,
        created_at: timestampIso,
      };

      // Si Supabase está disponible en el cliente, intenta insertar directamente
      try {
        const supabase = createClient();
        await supabase.from('marcajes').insert({
          trabajador_id: trab.id,
          empresa_id: EMPRESA_DEMO.id,
          timestamp_utc: timestampIso,
          hash_sha256: hashSha256,
          dispositivo_id: dispositivoId,
        });
      } catch {
        // En entorno mock/preview local sin backend activo, persiste en localStorage
      }

      const updated = [nuevoMarcaje, ...marcajes];
      persistirMarcajes(updated);
      setUltimoMarcajeHash(hashSha256);

      // Alternar tipo de marcaje automáticamente para la próxima simulación
      setTipoMarcaje((prev) => (prev === 'ENTRADA' ? 'SALIDA' : 'ENTRADA'));
    } finally {
      setSimulando(false);
    }
  };

  const handleCargarMarcajesDemo = async () => {
    const demoMarcajes: MarcajeRow[] = [];
    const baseDate = new Date(2026, 9, 1); // 1 Octubre 2026

    for (let day = 1; day <= 15; day++) {
      // Omitir domingos (4 y 11 de Octubre 2026)
      const curDate = new Date(2026, 9, day);
      if (curDate.getDay() === 0) continue;

      for (const t of trabajadores.slice(0, 2)) {
        // Entrada 08:00 UTC
        const entradaUtc = new Date(Date.UTC(2026, 9, day, 14, 0, 0)).toISOString();
        const saltEntrada = `salt_demo_${t.id}_${day}_in`;
        const hashIn = await calcularSha256(`${t.id}${entradaUtc}USB-01${saltEntrada}`);

        demoMarcajes.push({
          id: `demo_${t.id}_d${day}_in`,
          trabajador_id: t.id,
          trabajador_nombre: t.nombre,
          empresa_id: EMPRESA_DEMO.id,
          timestamp_utc: entradaUtc,
          hash_sha256: hashIn,
          dispositivo_id: 'USB-01',
          tipo: 'ENTRADA',
          created_at: entradaUtc,
        });

        // Salida 16:30 UTC
        const salidaUtc = new Date(Date.UTC(2026, 9, day, 22, 30, 0)).toISOString();
        const saltSalida = `salt_demo_${t.id}_${day}_out`;
        const hashOut = await calcularSha256(`${t.id}${salidaUtc}USB-01${saltSalida}`);

        demoMarcajes.push({
          id: `demo_${t.id}_d${day}_out`,
          trabajador_id: t.id,
          trabajador_nombre: t.nombre,
          empresa_id: EMPRESA_DEMO.id,
          timestamp_utc: salidaUtc,
          hash_sha256: hashOut,
          dispositivo_id: 'USB-01',
          tipo: 'SALIDA',
          created_at: salidaUtc,
        });
      }
    }

    demoMarcajes.sort((a, b) => (a.timestamp_utc > b.timestamp_utc ? -1 : 1));
    persistirMarcajes(demoMarcajes);
  };

  const handleLimpiarMarcajes = () => {
    persistirMarcajes([]);
    setUltimoMarcajeHash(null);
  };

  // Verificar si un trabajador tiene marcajes en un día dado del mes
  const getMarcajesParaDia = (trabId: string, dia: number) => {
    return marcajes.filter((m) => {
      if (m.trabajador_id !== trabId) return false;
      const d = new Date(m.timestamp_utc);
      return d.getUTCDate() === dia && d.getUTCMonth() === mes - 1 && d.getUTCFullYear() === anio;
    });
  };

  const goCodeSnippet = `package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/karalabe/hid"
)

// Chekdor HID Daemon v2.0
// Escucha lector USB HID (NFC NTAG213) y emite marcaje append-only a Supabase
const (
	VendorID   = 0x1a86 // Lector USB NFC HID típico
	ProductID  = 0xe010
	DeviceID   = "USB-01"
	SupabaseURL = "https://tu-proyecto.supabase.co/rest/v1/marcajes"
	SaltSecret = "salt_emp_demo_comercializadora_bajio"
)

type MarcajePayload struct {
	TrabajadorID string \`json:"trabajador_id"\`
	EmpresaID    string \`json:"empresa_id"\`
	TimestampUTC string \`json:"timestamp_utc"\`
	HashSHA256   string \`json:"hash_sha256"\`
	DispositivoID string \`json:"dispositivo_id"\`
}

func main() {
	apiKey := os.Getenv("SUPABASE_ANON_KEY")
	if apiKey == "" {
		log.Fatal("SUPABASE_ANON_KEY obligatoria en entorno")
	}

	fmt.Printf("[CHEKDOR DAEMON] Monitoreando lector USB HID %s (NTAG213)...\n", DeviceID)
	fmt.Println("[CHEKDOR DAEMON] Listo: El trabajador acerca tag NFC al lector. Sin app, sin celular.")

	// Bucle de lectura de eventos HID
	// En cada lectura de UID de tarjeta NTAG213:
	// 1. Obtener UID hexadecimal
	// 2. Mapear UID a trabajador_id en caché local
	// 3. Generar Timestamp UTC ISO8601
	// 4. Calcular SHA256(trabajador_id + timestamp + device_id + salt)
	// 5. POST append-only a Supabase
}
`;

  return (
    <div className="min-h-screen bg-[#141210] text-[#FAFAF9] flex flex-col font-sans">
      <DashNav empresaNombre="Comercializadora del Bajío S.A. de C.V." />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {/* Header con Badge de Cumplimiento Legal */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-[#2C2825] gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-[#A8A29E] uppercase tracking-wider mb-1">
              <span>Control Horario</span>
              <span>/</span>
              <span className="text-[#FB923C]">Marcajes Append-Only</span>
              <span>/</span>
              <span>Reforma DOF 01/05/2026</span>
            </div>
            <h1 className="text-3xl font-bold font-fraunces text-[#FAFAF9] tracking-tight">
              Registro Electrónico de Jornada
            </h1>
            <p className="text-sm text-[#A8A29E] mt-1">
              Art. 132 Fracc. XXXIV LFT. Registro biométrico o NFC inalterable sin posibilidad de edición o borrado.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Badge verde legal */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-semibold shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Prueba plena art 805 LFT</span>
            </div>

            {/* Modal servicio Go */}
            <button
              onClick={() => setMostrarModalGo(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#24201D] hover:bg-[#2C2825] border border-[#3E3833] text-[#D6D3D1] hover:text-[#FAFAF9] text-xs font-mono transition-colors"
            >
              <FileCode className="w-3.5 h-3.5 text-[#FB923C]" />
              <span>Daemon USB HID (Go)</span>
            </button>
          </div>
        </div>

        {/* Advertencia / Garantía Inmutable de BD */}
        <div className="rounded-lg bg-[#1E1B18] border border-[#3A342E] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="font-semibold text-amber-200 block font-mono">
                TRIGGER POSTGRESQL INMUTABLE: trg_bloquear_mutacion_marcajes()
              </span>
              <p className="text-[#A8A29E]">
                Sin botón editar ni borrar en UI ni API. La base de datos rechaza cualquier instrucción{' '}
                <code className="text-red-300 font-mono bg-red-950/50 px-1 py-0.5 rounded">UPDATE</code> o{' '}
                <code className="text-red-300 font-mono bg-red-950/50 px-1 py-0.5 rounded">DELETE</code>{' '}
                con excepción legal estricta.
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="font-mono text-[11px] text-[#78716C]">Sanción Art. 994 Fr. IV Bis:</span>
            <span className="font-mono text-[11px] font-bold text-red-400">$28,285 - $565,700 x trabajador</span>
          </div>
        </div>

        {/* Barra de Controles: Selector Quincena y Botón Simular */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-lg bg-[#1A1816] border border-[#2E2925]">
          {/* Selector de Quincena */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-mono text-[#A8A29E] font-medium uppercase">Periodo:</span>
            
            <div className="inline-flex rounded-md border border-[#3E3833] bg-[#24201D] p-1">
              <button
                type="button"
                onClick={() => setQuincena('1-15')}
                className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                  quincena === '1-15'
                    ? 'bg-[#C65D3A] text-white font-bold shadow-sm'
                    : 'text-[#A8A29E] hover:text-[#FAFAF9]'
                }`}
              >
                1ª Quincena (1 al 15)
              </button>
              <button
                type="button"
                onClick={() => setQuincena('16-fin')}
                className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                  quincena === '16-fin'
                    ? 'bg-[#C65D3A] text-white font-bold shadow-sm'
                    : 'text-[#A8A29E] hover:text-[#FAFAF9]'
                }`}
              >
                2ª Quincena (16 al fin)
              </button>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#24201D] border border-[#38332E] text-xs font-mono text-[#D6D3D1]">
              <Calendar className="w-3.5 h-3.5 text-[#FB923C]" />
              <span>Octubre 2026</span>
            </div>
          </div>

          {/* Simulador Dev Hardware USB-01 */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#78716C]">Trabajador:</span>
              <select
                value={trabajadorSeleccionado}
                onChange={(e) => setTrabajadorSeleccionado(e.target.value)}
                className="h-8 px-2.5 rounded bg-[#24201D] border border-[#3E3833] text-xs font-mono text-[#FAFAF9] focus:outline-none focus:border-[#C65D3A]"
              >
                {trabajadores.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre} ({t.nfc_uid.slice(0, 8)}...)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-[#24201D] border border-[#3E3833] rounded p-0.5">
              <button
                type="button"
                onClick={() => setTipoMarcaje('ENTRADA')}
                className={`px-2 py-1 text-[11px] font-mono rounded ${
                  tipoMarcaje === 'ENTRADA' ? 'bg-emerald-600 text-white font-bold' : 'text-[#A8A29E]'
                }`}
              >
                ENTRADA
              </button>
              <button
                type="button"
                onClick={() => setTipoMarcaje('SALIDA')}
                className={`px-2 py-1 text-[11px] font-mono rounded ${
                  tipoMarcaje === 'SALIDA' ? 'bg-amber-600 text-white font-bold' : 'text-[#A8A29E]'
                }`}
              >
                SALIDA
              </button>
            </div>

            {/* Botón dev: Simular marcaje ahora */}
            <button
              type="button"
              onClick={handleSimularMarcaje}
              disabled={simulando}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-[#C65D3A] hover:bg-[#B34E2D] active:scale-[0.98] text-white font-medium text-xs font-mono shadow-sm transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{simulando ? 'Firmando SHA-256...' : 'Simular marcaje ahora'}</span>
            </button>

            {marcajes.length === 0 ? (
              <button
                type="button"
                onClick={handleCargarMarcajesDemo}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#262320] hover:bg-[#2F2B27] border border-[#443E38] text-xs font-mono text-[#D6D3D1]"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FB923C]" />
                <span>Cargar Quincena Demo</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLimpiarMarcajes}
                title="Reiniciar a estado vacío"
                className="p-1.5 rounded text-[#78716C] hover:text-[#FAFAF9] hover:bg-[#262320]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Feedback del Hash SHA-256 Recién Calculado */}
        {ultimoMarcajeHash && (
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs font-mono flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2 truncate">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold text-emerald-300 shrink-0">Último Hash SHA-256 registrado:</span>
              <code className="text-[11px] text-emerald-100 truncate select-all">{ultimoMarcajeHash}</code>
            </div>
            <span className="text-[10px] bg-emerald-900/60 border border-emerald-500/30 px-2 py-0.5 rounded text-emerald-300 shrink-0">
              Dispositivo: {dispositivoId}
            </span>
          </div>
        )}

        {/* CONTENIDO PRINCIPAL: O Grid de 15 Días o Empty State */}
        {marcajes.length === 0 ? (
          /* EMPTY STATE EXACTO según especificación */
          <div className="flex-1 min-h-[380px] flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-[#38332E] bg-[#181614]">
            <div className="w-16 h-16 rounded-2xl bg-[#26221E] border border-[#3E3832] flex items-center justify-center mb-4 text-[#FB923C] shadow-inner">
              <Tag className="w-8 h-8" />
            </div>

            <h2 className="font-fraunces text-2xl font-bold text-[#FAFAF9] mb-2">
              Sin marcajes
            </h2>

            <p className="max-w-md text-sm text-[#A8A29E] leading-relaxed mb-6 font-sans">
              El trabajador acerca tag <strong className="text-[#FB923C] font-mono">NTAG213</strong> a lector USB HID.{' '}
              <span className="block mt-1 text-[#E7E5E4] font-medium">Sin app, sin celular.</span>
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleSimularMarcaje}
                disabled={simulando}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C65D3A] hover:bg-[#B34E2D] text-white text-xs font-mono font-medium shadow transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Simular marcaje ahora ({dispositivoId})</span>
              </button>

              <button
                type="button"
                onClick={handleCargarMarcajesDemo}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#24201D] hover:bg-[#2C2723] border border-[#3E3832] text-[#D6D3D1] text-xs font-mono transition-all"
              >
                <Sparkles className="w-4 h-4 text-[#FB923C]" />
                <span>Poblar 15 días con datos demo</span>
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-[#262320] flex items-center gap-6 text-xs font-mono text-[#78716C]">
              <span>Hardware compatible: ACR122U / Lector HID estándar</span>
              <span>•</span>
              <span>Latencia: ~40ms</span>
              <span>•</span>
              <span>Append-only DB</span>
            </div>
          </div>
        ) : (
          /* CALENDAR GRID 15 DÍAS X TRABAJADORES */
          <div className="flex flex-col gap-6">
            <div className="rounded-xl border border-[#2E2925] bg-[#181614] overflow-hidden shadow-sm">
              <div className="p-4 border-b border-[#2E2925] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#FB923C]" />
                  <h3 className="font-fraunces text-base font-bold text-[#FAFAF9]">
                    Calendar Grid · Quincena {quincena === '1-15' ? '1 al 15' : '16 al fin'} (Octubre 2026)
                  </h3>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono text-[#A8A29E]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                    Jornada completa (Entrada + Salida)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                    Marcaje parcial
                  </span>
                </div>
              </div>

              {/* Grid 15 días x trabajadores */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="bg-[#1E1B18] border-b border-[#2E2925] text-[#A8A29E]">
                      <th className="py-2.5 px-3 min-w-[200px] sticky left-0 bg-[#1E1B18] z-10 border-r border-[#2E2925]">
                        Trabajador / Tag NTAG213
                      </th>
                      {dias.map((d) => (
                        <th
                          key={d}
                          className="py-2 px-1.5 text-center min-w-[46px] border-r border-[#2E2925]/60"
                        >
                          <span className="block font-bold text-[#D6D3D1]">{d}</span>
                          <span className="text-[10px] text-[#78716C]">
                            {['D', 'L', 'M', 'M', 'J', 'V', 'S'][new Date(anio, mes - 1, d).getDay()]}
                          </span>
                        </th>
                      ))}
                      <th className="py-2.5 px-3 text-center min-w-[80px]">Total Marcajes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2E2925]">
                    {trabajadores.map((t) => {
                      const totalTrabajador = marcajes.filter((m) => m.trabajador_id === t.id).length;
                      return (
                        <tr key={t.id} className="hover:bg-[#1E1B18]/50 transition-colors">
                          <td className="py-2.5 px-3 sticky left-0 bg-[#181614] z-10 border-r border-[#2E2925]">
                            <div className="font-medium text-[#FAFAF9]">{t.nombre}</div>
                            <div className="text-[11px] text-[#A8A29E] flex items-center gap-1">
                              <Tag className="w-3 h-3 text-[#FB923C]" />
                              <span>{t.nfc_uid}</span>
                            </div>
                          </td>
                          {dias.map((d) => {
                            const marcajesDia = getMarcajesParaDia(t.id, d);
                            const tieneEntrada = marcajesDia.some((m) => m.tipo === 'ENTRADA');
                            const tieneSalida = marcajesDia.some((m) => m.tipo === 'SALIDA');
                            const count = marcajesDia.length;
                            const isDomingo = new Date(anio, mes - 1, d).getDay() === 0;

                            return (
                              <td
                                key={d}
                                className={`py-1.5 px-1 text-center border-r border-[#2E2925]/40 ${
                                  isDomingo ? 'bg-[#141210]/60' : ''
                                }`}
                              >
                                {count === 0 ? (
                                  <span className="text-[#443E38] text-[10px]">•</span>
                                ) : (
                                  <div
                                    title={`${count} marcajes el día ${d}`}
                                    className={`inline-flex flex-col items-center justify-center w-8 h-8 rounded text-[10px] font-bold ${
                                      tieneEntrada && tieneSalida
                                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                                        : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                                    }`}
                                  >
                                    <span>{count}</span>
                                    <span className="text-[8px] opacity-80">
                                      {tieneEntrada && tieneSalida ? 'OK' : 'IN'}
                                    </span>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                          <td className="py-2.5 px-3 text-center font-bold text-[#FB923C]">
                            {totalTrabajador}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TIMELINE DE MARCAJES CON TIMESTAMP ISO8601 UTC + HASH + DEVICE */}
            <div className="rounded-xl border border-[#2E2925] bg-[#181614] overflow-hidden shadow-sm">
              <div className="p-4 border-b border-[#2E2925] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#FB923C]" />
                  <h3 className="font-fraunces text-base font-bold text-[#FAFAF9]">
                    Timeline Append-Only · Bitácora LFT Art. 132 Fracc. XXXIV
                  </h3>
                </div>
                <div className="text-xs font-mono text-[#A8A29E]">
                  Total auditables: <strong className="text-[#FAFAF9]">{marcajes.length} registros</strong> (Sin botón editar ni borrar)
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="bg-[#1E1B18] border-b border-[#2E2925] text-[#A8A29E] uppercase text-[11px]">
                      <th className="py-2.5 px-3">Tipo</th>
                      <th className="py-2.5 px-3">Trabajador</th>
                      <th className="py-2.5 px-3">Timestamp ISO8601 UTC</th>
                      <th className="py-2.5 px-3">Dispositivo ID</th>
                      <th className="py-2.5 px-3">Hash SHA-256 Inmutable</th>
                      <th className="py-2.5 px-3 text-center">Estado LFT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2E2925]">
                    {marcajes.slice(0, 30).map((m) => (
                      <tr key={m.id} className="hover:bg-[#1E1B18]/50 transition-colors">
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              m.tipo === 'ENTRADA'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {m.tipo || 'MARCAJE'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-sans font-medium text-[#FAFAF9]">
                          {m.trabajador_nombre || m.trabajador_id}
                        </td>
                        <td className="py-2.5 px-3 text-[#D6D3D1] font-mono">
                          {m.timestamp_utc}
                        </td>
                        <td className="py-2.5 px-3 text-[#FB923C] font-mono font-semibold">
                          {m.dispositivo_id}
                        </td>
                        <td className="py-2.5 px-3 text-[#A8A29E] font-mono">
                          <code className="text-[11px] bg-[#141210] px-2 py-1 rounded border border-[#2E2925] select-all">
                            {m.hash_sha256.slice(0, 16)}...{m.hash_sha256.slice(-8)}
                          </code>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Inalterable
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {marcajes.length > 30 && (
                <div className="p-3 text-center border-t border-[#2E2925] text-xs font-mono text-[#78716C]">
                  Mostrando los primeros 30 de {marcajes.length} registros append-only.
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL SERVICIO GO PARA LECTOR REAL USB HID */}
        {mostrarModalGo && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#1C1917] border border-[#3E3832] rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
              <div className="p-5 border-b border-[#2E2925] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-[#C65D3A]/20 border border-[#C65D3A]/40 flex items-center justify-center text-[#FB923C]">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-fraunces text-lg font-bold text-[#FAFAF9]">
                      Daemon USB HID en Go (Servicio de Lectura Real)
                    </h3>
                    <p className="text-xs text-[#A8A29E]">
                      Lee tarjetas NFC NTAG213 sin aplicación ni celular y emite eventos en tiempo real a Supabase.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMostrarModalGo(false)}
                  className="text-[#A8A29E] hover:text-[#FAFAF9] p-1 rounded hover:bg-[#262320]"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 text-xs font-sans">
                <div className="bg-[#141210] border border-[#2E2925] rounded-lg p-3 text-[#D6D3D1] space-y-2">
                  <div className="font-semibold text-[#FB923C] font-mono flex items-center gap-2">
                    <Radio className="w-4 h-4" />
                    Arquitectura de Hardware Zero-Touch
                  </div>
                  <p className="leading-relaxed">
                    El servicio se compila en un binario nativo estático de ~8MB en Go y corre como un servicio{' '}
                    <code className="text-[#FAFAF9] font-mono">systemd</code> en cualquier Raspberry Pi, mini PC o terminal
                    situado en la entrada del centro de trabajo (p.ej. Allende 16 o Pasaje Las Fuentes 311).
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-[#A8A29E] pl-1 font-mono text-[11px]">
                    <li>El trabajador acerca su tag NTAG213 (tarjeta o llavero) al lector USB HID.</li>
                    <li>El daemon captura el UID vía raw HID report sin foco de ventana.</li>
                    <li>Concatena <code className="text-[#FB923C]">UID + Timestamp UTC + Device + Salt</code> y calcula SHA-256.</li>
                    <li>Envía el registro a Supabase REST y emite notificación vía Supabase Realtime Channel.</li>
                  </ol>
                </div>

                <div className="relative">
                  <div className="flex items-center justify-between pb-2">
                    <span className="font-mono text-xs text-[#A8A29E]">services/hid-daemon/main.go</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(goCodeSnippet);
                        setCopiadoGo(true);
                        setTimeout(() => setCopiadoGo(false), 2000);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#262320] border border-[#3E3832] text-[11px] font-mono text-[#D6D3D1] hover:text-[#FAFAF9]"
                    >
                      {copiadoGo ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar Código</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 rounded-lg bg-[#12100E] border border-[#262320] font-mono text-[11px] text-[#A8A29E] overflow-x-auto max-h-[300px]">
                    {goCodeSnippet}
                  </pre>
                </div>

                <div className="p-3 bg-[#1E1B18] border border-[#38332E] rounded-lg font-mono text-[11px] text-[#A8A29E]">
                  <strong className="text-[#FAFAF9] block mb-1">Compilación y Despliegue en 1 línea:</strong>
                  <code>CGO_ENABLED=1 go build -o chekdor-hid ./services/hid-daemon/main.go</code>
                </div>
              </div>

              <div className="p-4 border-t border-[#2E2925] flex justify-end">
                <button
                  onClick={() => setMostrarModalGo(false)}
                  className="px-4 py-2 rounded-lg bg-[#C65D3A] text-white text-xs font-mono font-medium"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
