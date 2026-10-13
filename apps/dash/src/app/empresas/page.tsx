'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building, Plus, ArrowRight, Shield, CheckCircle2, AlertCircle, X, Sparkles, RotateCcw } from 'lucide-react';
import { DashNav } from '../../components/DashNav';

interface EmpresaItem {
  id: string;
  rfc: string;
  nombre: string;
  catalogo_base: '510-001' | '6000-01-001';
  created_at: string;
}

const RFC_REGEX = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-V1-9][A-Z1-9][0-9A]$/;

export default function EmpresasPage() {
  const router = useRouter();
  const [empresas, setEmpresas] = useState<EmpresaItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  
  // 3 campos requeridos para el alta de nueva empresa
  const [rfc, setRfc] = useState('');
  const [nombre, setNombre] = useState('');
  const [catalogoBase, setCatalogoBase] = useState<'510-001' | '6000-01-001'>('510-001');

  const [errorRfc, setErrorRfc] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [notificacion, setNotificacion] = useState<string | null>(null);

  // Inicializar estado vacío al arrancar desde 0
  useEffect(() => {
    const saved = localStorage.getItem('chekdor_empresas_v2');
    if (saved) {
      try {
        setEmpresas(JSON.parse(saved));
      } catch {
        setEmpresas([]);
      }
    } else {
      setEmpresas([]);
    }
  }, []);

  const persistirEmpresas = (nuevas: EmpresaItem[]) => {
    setEmpresas(nuevas);
    localStorage.setItem('chekdor_empresas_v2', JSON.stringify(nuevas));
  };

  const validarRfcLocal = (valor: string) => {
    const v = valor.toUpperCase().trim();
    setRfc(v);
    if (!v) {
      setErrorRfc(null);
      return false;
    }
    if (!RFC_REGEX.test(v)) {
      setErrorRfc('RFC inválido. Persona Moral (12) o Física (13) según formato SAT (Ej: CBA240101AB1)');
      return false;
    }
    setErrorRfc(null);
    return true;
  };

  const handleCrearEmpresa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarRfcLocal(rfc)) {
      return;
    }
    if (!nombre.trim()) {
      return;
    }

    setGuardando(true);
    setTimeout(() => {
      const nueva: EmpresaItem = {
        id: `emp_${Date.now()}`,
        rfc: rfc.trim().toUpperCase(),
        nombre: nombre.trim(),
        catalogo_base: catalogoBase,
        created_at: new Date().toISOString(),
      };

      const listaActualizada = [...empresas, nueva];
      persistirEmpresas(listaActualizada);
      setShowModal(false);
      setRfc('');
      setNombre('');
      setCatalogoBase('510-001');
      setGuardando(false);
      setNotificacion(`Empresa cliente ${nueva.nombre} creada con éxito.`);
      setTimeout(() => setNotificacion(null), 4000);
    }, 250);
  };

  const handleCargarDemo = () => {
    const demoEmpresa: EmpresaItem = {
      id: 'e0000000-0000-0000-0000-000000000001',
      rfc: 'DEMO260101AB1',
      nombre: 'Comercializadora del Bajío S.A. de C.V.',
      catalogo_base: '510-001',
      created_at: new Date().toISOString(),
    };

    const yaExiste = empresas.some((e) => e.rfc === demoEmpresa.rfc);
    if (!yaExiste) {
      const lista = [...empresas, demoEmpresa];
      persistirEmpresas(lista);
    }
    setNotificacion('Empresa demo Comercializadora del Bajío cargada.');
    setTimeout(() => setNotificacion(null), 3000);
  };

  const handleVaciarEmpresas = () => {
    persistirEmpresas([]);
    localStorage.removeItem('chekdor_trabajadores_v2');
    setNotificacion('Tabla de empresas reiniciada a estado vacío.');
    setTimeout(() => setNotificacion(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#1C1917] text-[#FAFAF9]">
      <DashNav despachoNombre="Sánchez & Asociados S.C." />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner de Notificación */}
        {notificacion && (
          <div className="mb-6 p-3 bg-emerald-950/60 border border-emerald-800 rounded text-emerald-300 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{notificacion}</span>
          </div>
        )}

        {/* SI TABLA VACÍA: EMPTY STATE ESPECÍFICO */}
        {empresas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-xl mx-auto">
            {/* Icon Building */}
            <div className="w-20 h-20 rounded-2xl bg-[#292524] border border-[#44403C] flex items-center justify-center mb-6 shadow-xl">
              <Building className="w-10 h-10 text-[#C65D3A]" />
            </div>

            {/* Título Fraunces 600 28px */}
            <h1
              className="font-fraunces font-semibold text-[28px] text-[#FAFAF9] leading-tight mb-3"
              style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 600, fontSize: '28px' }}
            >
              Aún no tienes empresas cliente
            </h1>

            {/* Subtitle */}
            <p className="text-[15px] text-[#A8A29E] leading-relaxed mb-8 max-w-md">
              Crea tu primera empresa para empezar. Usa demo Comercializadora del Bajío
            </p>

            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
              {/* Botón + Nueva empresa cliente #C65D3A */}
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-white font-medium text-sm rounded-lg shadow-lg hover:brightness-110 active:brightness-95 transition-all"
                style={{ backgroundColor: '#C65D3A' }}
              >
                <Plus className="w-4 h-4" />
                <span>+ Nueva empresa cliente</span>
              </button>

              {/* Botón Demo Comercializadora del Bajío */}
              <button
                type="button"
                onClick={handleCargarDemo}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#292524] hover:bg-[#322E2B] text-[#D6D3D1] border border-[#44403C] text-sm font-medium rounded-lg transition-colors"
              >
                <Sparkles className="w-4 h-4 text-[#FB923C]" />
                <span>Cargar demo Bajío</span>
              </button>
            </div>

            {/* Tarjeta Explicativa de Arquitectura RLS */}
            <div className="mt-12 p-4 bg-[#23201D] border border-[#3A3531] rounded-lg text-left text-xs font-mono text-[#A8A29E] w-full">
              <div className="flex items-center gap-2 text-[#FAFAF9] mb-1 font-semibold">
                <Shield className="w-3.5 h-3.5 text-[#C65D3A]" />
                <span>Aislamiento RLS en Base de Datos</span>
              </div>
              <p>
                Cada empresa cliente posee su propia partición lógica. Los trabajadores, registros biométricos de
                jornada y cuentas contables jamás cruzan los linderos de otra razón social.
              </p>
            </div>
          </div>
        ) : (
          /* VISTA CON TABLA DE EMPRESAS */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#383330]">
              <div>
                <h1 className="font-fraunces font-semibold text-[26px] text-[#FAFAF9]">
                  Empresas Cliente del Despacho
                </h1>
                <p className="text-xs text-[#A8A29E] font-mono mt-0.5">
                  Partición multi-tenant activa • {empresas.length} {empresas.length === 1 ? 'empresa registrada' : 'empresas registradas'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleVaciarEmpresas}
                  title="Reiniciar a estado vacío para probar el onboarding desde 0"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#262320] hover:bg-[#302B27] text-[#A8A29E] hover:text-[#FAFAF9] border border-[#3D3733] text-xs font-mono rounded-lg transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Vaciar tabla</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-white text-xs font-medium font-mono rounded-lg shadow hover:brightness-110 transition-all"
                  style={{ backgroundColor: '#C65D3A' }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Nueva empresa cliente</span>
                </button>
              </div>
            </div>

            {/* Grid / Tabla de Empresas */}
            <div className="bg-[#24211E] border border-[#3A3531] rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[15px]">
                  <thead>
                    <tr className="border-b border-[#383330] bg-[#1E1B18] text-[#A8A29E] font-mono text-xs">
                      <th className="py-3 px-4">RFC SAT</th>
                      <th className="py-3 px-4">Razón Social</th>
                      <th className="py-3 px-4">Catálogo Base</th>
                      <th className="py-3 px-4">Fecha Registro</th>
                      <th className="py-3 px-4 text-right">Padrón Laboral</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#332E2B]">
                    {empresas.map((emp) => (
                      <tr key={emp.id} className="hover:bg-[#2A2623] transition-colors group">
                        <td className="py-3.5 px-4 font-mono font-semibold text-[#FB923C] text-sm">
                          {emp.rfc}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[#FAFAF9]">
                          {emp.nombre}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#1C1917] border border-[#443E3A] text-[#D6D3D1]">
                            {emp.catalogo_base}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-[#78716C]">
                          {new Date(emp.created_at).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => router.push(`/trabajadores?empresa_id=${emp.id}&rfc=${emp.rfc}&nombre=${encodeURIComponent(emp.nombre)}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2E2925] hover:bg-[#C65D3A] text-[#D6D3D1] hover:text-white rounded-md text-xs font-mono transition-colors group-hover:border-[#C65D3A] border border-[#443E3A]"
                          >
                            <span>Ver Trabajadores</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODAL / FORM NUEVA EMPRESA: SOLO 3 CAMPOS RFC, NOMBRE, CATÁLOGO BASE */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#24211E] border border-[#443E3A] rounded-xl w-full max-w-lg p-6 shadow-2xl relative">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-[#A8A29E] hover:text-[#FAFAF9]"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-7 h-7 rounded-md bg-[#C65D3A]/20 border border-[#C65D3A]/50 flex items-center justify-center text-[#C65D3A]">
                  <Building className="w-4 h-4" />
                </div>
                <h2 className="font-fraunces font-semibold text-xl text-[#FAFAF9]">
                  Alta de Empresa Cliente
                </h2>
              </div>
              <p className="text-xs text-[#A8A29E] font-mono mb-6">
                Completa únicamente los 3 datos requeridos para la póliza y timbrado.
              </p>

              <form onSubmit={handleCrearEmpresa} className="space-y-4">
                {/* CAMPO 1: RFC */}
                <div>
                  <label className="block text-xs font-mono text-[#D6D3D1] mb-1.5">
                    1. RFC de la Empresa (12 o 13 caracteres)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={13}
                    value={rfc}
                    onChange={(e) => validarRfcLocal(e.target.value)}
                    placeholder="Ej. CBA240101AB1"
                    className="w-full px-3.5 py-2.5 bg-[#1C1917] border border-[#443E3A] rounded-lg text-sm font-mono text-[#FAFAF9] tracking-wider uppercase focus:outline-none focus:border-[#C65D3A]"
                  />
                  {errorRfc && (
                    <p className="mt-1 text-xs text-rose-400 font-mono flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errorRfc}</span>
                    </p>
                  )}
                </div>

                {/* CAMPO 2: NOMBRE */}
                <div>
                  <label className="block text-xs font-mono text-[#D6D3D1] mb-1.5">
                    2. Nombre o Razón Social
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Comercializadora del Bajío S.A. de C.V."
                    className="w-full px-3.5 py-2.5 bg-[#1C1917] border border-[#443E3A] rounded-lg text-sm text-[#FAFAF9] focus:outline-none focus:border-[#C65D3A]"
                  />
                </div>

                {/* CAMPO 3: CATÁLOGO BASE (510-001 vs 6000-01-001) */}
                <div>
                  <label className="block text-xs font-mono text-[#D6D3D1] mb-1.5">
                    3. Catálogo Base Contable CONTPAQi®
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`cursor-pointer p-3 rounded-lg border flex flex-col transition-all ${
                        catalogoBase === '510-001'
                          ? 'border-[#C65D3A] bg-[#2E2824] text-white'
                          : 'border-[#3D3733] bg-[#1C1917] text-[#A8A29E] hover:border-[#524A45]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="catalogoBase"
                        value="510-001"
                        checked={catalogoBase === '510-001'}
                        onChange={() => setCatalogoBase('510-001')}
                        className="sr-only"
                      />
                      <span className="font-mono font-semibold text-sm text-[#FB923C]">
                        510-001
                      </span>
                      <span className="text-[11px] mt-1 text-[#D6D3D1]">
                        Estándar Despachos (3 niveles con guiones)
                      </span>
                    </label>

                    <label
                      className={`cursor-pointer p-3 rounded-lg border flex flex-col transition-all ${
                        catalogoBase === '6000-01-001'
                          ? 'border-[#C65D3A] bg-[#2E2824] text-white'
                          : 'border-[#3D3733] bg-[#1C1917] text-[#A8A29E] hover:border-[#524A45]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="catalogoBase"
                        value="6000-01-001"
                        checked={catalogoBase === '6000-01-001'}
                        onChange={() => setCatalogoBase('6000-01-001')}
                        className="sr-only"
                      />
                      <span className="font-mono font-semibold text-sm text-[#FB923C]">
                        6000-01-001
                      </span>
                      <span className="text-[11px] mt-1 text-[#D6D3D1]">
                        NIF Corporativo SAT (Agrupador 4 dígitos)
                      </span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#383330]">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-xs font-mono text-[#A8A29E] hover:text-[#FAFAF9]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando}
                    className="px-5 py-2.5 text-white font-medium text-xs font-mono rounded-lg transition-all shadow hover:brightness-110 disabled:opacity-50"
                    style={{ backgroundColor: '#C65D3A' }}
                  >
                    {guardando ? 'Guardando en Postgres...' : 'Registrar Empresa'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
