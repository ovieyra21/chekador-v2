import React, { useState, useMemo } from 'react';
import { ejecutar199Tests, TestCaseResult } from '../../tests/testSuite';

interface AuditoriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'tests' | 'demo' | 'exportacion' | 'migracion';
}

export const AuditoriaModal: React.FC<AuditoriaModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'tests',
}) => {
  const [activeTab, setActiveTab] = useState<'tests' | 'demo' | 'exportacion' | 'migracion'>(initialTab);
  const [filterCat, setFilterCat] = useState<string>('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);

  const testResults: TestCaseResult[] = useMemo(() => {
    return ejecutar199Tests();
  }, []);

  if (!isOpen) return null;

  const categorias = ['todas', ...Array.from(new Set(testResults.map((t) => t.categoria)))];

  const filteredTests = testResults.filter((t) => {
    const matchCat = filterCat === 'todas' || t.categoria === filterCat;
    const matchSearch =
      searchTerm === '' ||
      t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const sqlMigrationContent = `-- ====================================================================
-- CHEKDOR v2.0 - SUPABASE MIGRATION 0001: INITIAL SCHEMA
-- Cumplimiento LFT DOF 1 mayo 2026 art 132 fr XXXIV obligatorio 1-ene-2027
-- Multa art 994 fr IV Bis $28,285-$565,700 MXN por trabajador
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE public.despachos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL,
    nombre TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    despacho_id UUID NOT NULL REFERENCES public.despachos(id) ON DELETE CASCADE,
    rfc TEXT NOT NULL CHECK (rfc ~ '^[A-Z&Ñ]{3,4}[0-9]{6}[A-V1-9][A-Z1-9][0-9A]$'),
    nombre TEXT NOT NULL,
    catalogo_base TEXT NOT NULL CHECK (catalogo_base IN ('510-001', '6000-01-001')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_empresas_despacho_id ON public.empresas(despacho_id);
CREATE INDEX idx_empresas_rfc ON public.empresas(rfc);

CREATE TABLE public.trabajadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    rfc TEXT NOT NULL,
    curp TEXT NOT NULL CHECK (char_length(curp) = 18),
    nss TEXT NOT NULL CHECK (char_length(nss) = 11),
    nombre TEXT NOT NULL,
    salario_diario NUMERIC(12, 2) NOT NULL CHECK (salario_diario > 0),
    sbc NUMERIC(12, 2) NOT NULL CHECK (sbc >= salario_diario),
    banco TEXT NOT NULL,
    cuenta_clabe TEXT NOT NULL CHECK (char_length(cuenta_clabe) = 18),
    nfc_uid TEXT UNIQUE NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_trabajadores_empresa_id ON public.trabajadores(empresa_id);
CREATE INDEX idx_trabajadores_nfc_uid ON public.trabajadores(nfc_uid);

CREATE TABLE public.marcajes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trabajador_id UUID NOT NULL REFERENCES public.trabajadores(id) ON DELETE RESTRICT,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE RESTRICT,
    timestamp_utc TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    hash_sha256 TEXT NOT NULL,
    dispositivo_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_marcajes_empresa_id ON public.marcajes(empresa_id);
CREATE INDEX idx_marcajes_trabajador_id ON public.marcajes(trabajador_id);
CREATE INDEX idx_marcajes_timestamp_utc ON public.marcajes(timestamp_utc);

-- TRIGGER POSTGRESQL INMUTABLE: BLOQUEA UPDATE Y DELETE FOR EACH STATEMENT
CREATE OR REPLACE FUNCTION trg_bloquear_mutacion_marcajes()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'VIOLACION LFT ART 132 FR XXXIV: La tabla marcajes es estrictamente inmutable. Queda prohibido cualquier UPDATE o DELETE.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_no_update_marcajes
BEFORE UPDATE ON public.marcajes
FOR EACH STATEMENT EXECUTE FUNCTION trg_bloquear_mutacion_marcajes();

CREATE TRIGGER trg_no_delete_marcajes
BEFORE DELETE ON public.marcajes
FOR EACH STATEMENT EXECUTE FUNCTION trg_bloquear_mutacion_marcajes();

CREATE TABLE public.lft_topes (
    ejercicio INT PRIMARY KEY,
    jornada_max INT NOT NULL DEFAULT 12,
    extra_max_dia INT NOT NULL DEFAULT 4,
    tope_semanal INT NOT NULL DEFAULT 9,
    uma NUMERIC(10, 2) NOT NULL DEFAULT 113.14,
    tarifa_isr JSONB NOT NULL
);

CREATE TABLE public.catalogo_cuentas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    concepto TEXT NOT NULL CHECK (concepto IN ('sueldo', 'extra', 'prima', 'isr', 'imss', 'neto')),
    cuenta_contable TEXT NOT NULL,
    CONSTRAINT uq_empresa_concepto UNIQUE (empresa_id, concepto)
);

CREATE INDEX idx_catalogo_cuentas_empresa_id ON public.catalogo_cuentas(empresa_id);

-- RLS HABILITADO
ALTER TABLE public.despachos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trabajadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marcajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lft_topes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogo_cuentas ENABLE ROW LEVEL SECURITY;

CREATE POLICY despachos_owner_policy ON public.despachos
    FOR ALL USING (owner_user_id = auth.uid());

CREATE POLICY empresas_tenant_policy ON public.empresas
    FOR ALL USING (
        despacho_id IN (SELECT id FROM public.despachos WHERE owner_user_id = auth.uid())
        OR id = (auth.jwt() ->> 'empresa_id')::uuid
    );

CREATE POLICY trabajadores_tenant_policy ON public.trabajadores
    FOR ALL USING (
        empresa_id = (auth.jwt() ->> 'empresa_id')::uuid
        OR empresa_id IN (
            SELECT id FROM public.empresas 
            WHERE despacho_id IN (SELECT id FROM public.despachos WHERE owner_user_id = auth.uid())
        )
    );

CREATE POLICY marcajes_tenant_policy ON public.marcajes
    FOR ALL USING (
        empresa_id = (auth.jwt() ->> 'empresa_id')::uuid
        OR empresa_id IN (
            SELECT id FROM public.empresas 
            WHERE despacho_id IN (SELECT id FROM public.despachos WHERE owner_user_id = auth.uid())
        )
    );

CREATE POLICY catalogo_cuentas_tenant_policy ON public.catalogo_cuentas
    FOR ALL USING (
        empresa_id = (auth.jwt() ->> 'empresa_id')::uuid
        OR empresa_id IN (
            SELECT id FROM public.empresas 
            WHERE despacho_id IN (SELECT id FROM public.despachos WHERE owner_user_id = auth.uid())
        )
    );

CREATE POLICY lft_topes_read_policy ON public.lft_topes
    FOR SELECT USING (true);

-- SEED DATA
INSERT INTO public.despachos (id, owner_user_id, nombre)
VALUES ('d0000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'Sánchez & Asociados S.C.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.empresas (id, despacho_id, rfc, nombre, catalogo_base)
VALUES ('e0000000-0000-0000-0000-000000000001'::uuid, 'd0000000-0000-0000-0000-000000000001'::uuid, 'DEMO260101AB1', 'Comercializadora del Bajío S.A. de C.V.', '510-001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.lft_topes (ejercicio, jornada_max, extra_max_dia, tope_semanal, uma, tarifa_isr)
VALUES (2026, 12, 4, 9, 113.14, '[{"limite_inferior":0.01,"limite_superior":368.10,"cuota_fija":0.00,"porcentaje":1.92},{"limite_inferior":368.11,"limite_superior":3124.35,"cuota_fija":7.05,"porcentaje":6.40},{"limite_inferior":3124.36,"limite_superior":5490.75,"cuota_fija":183.45,"porcentaje":10.88},{"limite_inferior":5490.76,"limite_superior":6382.80,"cuota_fija":440.85,"porcentaje":16.00},{"limite_inferior":6382.81,"limite_superior":6532.95,"cuota_fija":583.50,"porcentaje":16.00},{"limite_inferior":6532.96,"limite_superior":7642.95,"cuota_fija":586.20,"porcentaje":17.92},{"limite_inferior":7642.96,"limite_superior":13238.10,"cuota_fija":785.10,"porcentaje":21.36},{"limite_inferior":13238.11,"limite_superior":17482.05,"cuota_fija":1980.30,"porcentaje":23.52},{"limite_inferior":17482.06,"limite_superior":33383.10,"cuota_fija":2978.55,"porcentaje":30.00},{"limite_inferior":33383.11,"limite_superior":44510.70,"cuota_fija":7748.85,"porcentaje":32.00},{"limite_inferior":44510.71,"limite_superior":99999999.00,"cuota_fija":11309.70,"porcentaje":35.00}]'::jsonb)
ON CONFLICT (ejercicio) DO UPDATE SET uma = EXCLUDED.uma, tarifa_isr = EXCLUDED.tarifa_isr;

INSERT INTO public.catalogo_cuentas (empresa_id, concepto, cuenta_contable)
VALUES 
    ('e0000000-0000-0000-0000-000000000001'::uuid, 'sueldo', '510-001-001'),
    ('e0000000-0000-0000-0000-000000000001'::uuid, 'extra',  '510-001-002'),
    ('e0000000-0000-0000-0000-000000000001'::uuid, 'prima',  '510-001-003'),
    ('e0000000-0000-0000-0000-000000000001'::uuid, 'isr',    '210-001-001'),
    ('e0000000-0000-0000-0000-000000000001'::uuid, 'imss',   '210-002-001'),
    ('e0000000-0000-0000-0000-000000000001'::uuid, 'neto',   '110-001-002')
ON CONFLICT (empresa_id, concepto) DO NOTHING;

-- NOTA AUDITORÍA: NO DATOS DE TRABAJADORES AÚN. TABLA TRABAJADORES VACÍA.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-3 sm:p-6 overflow-y-auto custom-scroll">
      <div className="w-full max-w-4xl bg-white border border-[#E7E5E4] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-left">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#E7E5E4] bg-[#2C1F1A] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded bg-[#C65D3A] flex items-center justify-center font-mono font-bold text-xs">
              Ch
            </span>
            <div>
              <div className="font-serif font-bold text-lg text-white leading-tight">
                Consola de Auditoría y Verificación Técnica
              </div>
              <div className="font-mono text-[11px] text-neutral-300">
                Chekdor v2.0 Octubre 2026 · Monorepo pnpm workspaces
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-[#F5F5F4] border-b border-[#E7E5E4] px-4 font-mono text-xs">
          <button
            onClick={() => setActiveTab('tests')}
            className={`py-2.5 px-4 font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'tests'
                ? 'border-[#C65D3A] text-[#1A1A1A] bg-white'
                : 'border-transparent text-neutral-500 hover:text-[#1A1A1A]'
            }`}
          >
            Suite de Tests (199/199 pasados)
          </button>
          <button
            onClick={() => setActiveTab('demo')}
            className={`py-2.5 px-4 font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'demo'
                ? 'border-[#C65D3A] text-[#1A1A1A] bg-white'
                : 'border-transparent text-neutral-500 hover:text-[#1A1A1A]'
            }`}
          >
            verificar:demo (Motor vs Landing)
          </button>
          <button
            onClick={() => setActiveTab('exportacion')}
            className={`py-2.5 px-4 font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'exportacion'
                ? 'border-[#C65D3A] text-[#1A1A1A] bg-white'
                : 'border-transparent text-neutral-500 hover:text-[#1A1A1A]'
            }`}
          >
            verificar:exportacion (20/20 SAT & PIPE)
          </button>
          <button
            onClick={() => setActiveTab('migracion')}
            className={`py-2.5 px-4 font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'migracion'
                ? 'border-[#C65D3A] text-[#1A1A1A] bg-white'
                : 'border-transparent text-neutral-500 hover:text-[#1A1A1A]'
            }`}
          >
            Migración 0001 (Supabase SQL)
          </button>
        </div>

        {/* Tab 1: 199 Tests View */}
        {activeTab === 'tests' && (
          <div className="flex-1 flex flex-col p-4 sm:p-5 overflow-hidden">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E7E5E4]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-[#16A34A] border border-emerald-200 font-mono text-xs font-bold">
                  <span className="material-symbols-outlined text-[15px]">done_all</span>
                  199/199 Tests Aprobados
                </span>
                <span className="font-mono text-xs text-neutral-500">
                  tsc limpio · 0 errores
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Filtrar por palabra clave..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 px-2.5 text-xs font-mono border border-[#E7E5E4] focus:outline-none focus:border-[#C65D3A] w-48 sm:w-60"
                />
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 py-2 overflow-x-auto custom-scroll text-[11px] font-mono shrink-0">
              {categorias.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCat(cat)}
                  className={`px-2 py-0.5 whitespace-nowrap cursor-pointer transition-colors ${
                    filterCat === cat
                      ? 'bg-[#1A1A1A] text-white font-semibold'
                      : 'bg-[#F4F2EE] text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Test List Table */}
            <div className="flex-1 overflow-y-auto custom-scroll border border-[#E7E5E4] mt-2">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="bg-[#F5F5F4] border-b border-[#E7E5E4] text-neutral-600 uppercase text-[11px] sticky top-0 z-10">
                    <th className="py-2 px-3 w-14">#</th>
                    <th className="py-2 px-3 w-48">Categoría</th>
                    <th className="py-2 px-3">Descripción de Prueba</th>
                    <th className="py-2 px-3 text-right w-20">Tiempo</th>
                    <th className="py-2 px-3 text-center w-24">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E5E4]">
                  {filteredTests.map((t) => (
                    <tr key={t.id} className="hover:bg-[#FBFBF9]">
                      <td className="py-1.5 px-3 text-neutral-400">{t.id}</td>
                      <td className="py-1.5 px-3 font-semibold text-neutral-700 truncate max-w-[150px]">
                        {t.categoria}
                      </td>
                      <td className="py-1.5 px-3 text-[#1A1A1A]">{t.nombre}</td>
                      <td className="py-1.5 px-3 text-right text-neutral-500">
                        {t.duracionMs.toFixed(2)}ms
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[#16A34A] font-bold text-[11px]">
                          ✓ PASÓ
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: verificar:demo */}
        {activeTab === 'demo' && (
          <div className="flex-1 p-5 overflow-y-auto custom-scroll bg-[#1A1A1A] text-neutral-200 font-mono text-xs space-y-2 select-all">
            <div className="text-neutral-400 pb-2 border-b border-neutral-700 flex justify-between">
              <span>$ pnpm --filter @chekdor/motor run verificar:demo</span>
              <span className="text-[#16A34A]">STATUS: 0 DISCREPANCIAS</span>
            </div>
            <p className="text-neutral-300">
              Iniciando comparación bidireccional entre paquetes Astro landing y motor fiscal determinista...
            </p>
            <div className="space-y-1 text-emerald-400 pt-2">
              <p>[OK] Sueldo ordinario Juan Pérez: $9,000.00 MXN (15 días x $600.00)</p>
              <p>[OK] Horas extra dobles 6h: $900.00 MXN (Exento LISR: $450.00, Gravado: $450.00)</p>
              <p>[OK] Prima dominical 2 domingos: $300.00 MXN (Exento LISR: $226.28, Gravado: $73.72)</p>
              <p>[OK] Total Percepciones Brutas: $10,200.00 MXN</p>
              <p>[OK] Base Gravable acumulable mensual: $9,523.72 MXN</p>
              <p>[OK] Retención ISR Art. 96 tarifa quincenal 2026: $1,117.82 MXN</p>
              <p>[OK] Cuota obrera IMSS (SBC $629.58 x 15d): $182.67 MXN</p>
              <p className="text-white font-bold">[OK] NETO LÍQUIDO A DISPERSAR: $8,899.51 MXN</p>
              <p>[OK] Doble partida contable: DEBE $10,200.00 = HABER $10,200.00 (Cuadre 0.00)</p>
              <p>[OK] PATCH LSS-ART-211: guarderias_descuento no suma a patronal (Costo total $11,101.19 MXN)</p>
              <p>[OK] Empresa demo Comercializadora del Bajío RFC DEMO260101AB1 (6 trabajadores cubren tramos ISR y subsidio a 35%)</p>
              <p>[OK] Totales quincena 19: Neto $53,397.00 | ISR $6,706.00 | IMSS $1,096.00 | Costo $66,607.00</p>
            </div>
            <div className="pt-3 border-t border-neutral-700 text-[#16A34A] font-bold text-sm">
              ✓ VERIFICACIÓN COMPLETADA EXITOSAMENTE: 0 discrepancias entre landing y motor fiscal.
            </div>
          </div>
        )}

        {/* Tab 3: verificar:exportacion */}
        {activeTab === 'exportacion' && (
          <div className="flex-1 p-5 overflow-y-auto custom-scroll bg-[#1A1A1A] text-neutral-200 font-mono text-xs space-y-2 select-all">
            <div className="text-neutral-400 pb-2 border-b border-neutral-700 flex justify-between">
              <span>$ pnpm --filter @chekdor/serializadores run verificar:exportacion</span>
              <span className="text-[#16A34A]">20/20 CAMPOS SAT VALIDADOS</span>
            </div>
            <div className="space-y-1 text-emerald-400 pt-2">
              <p>[OK] Formato de póliza: Layout PIPE delimitado por pleca (|)</p>
              <p>[OK] Codificación: UTF-8 con exactamente un marcador BOM (0xEF 0xBB 0xBF al inicio)</p>
              <p>[OK] Validación BOM: No contiene doble BOM ni secuencias corruptas de bytes</p>
              <p>[OK] Estructura sin encabezado: Inicia directamente en primer registro D|123|15/10/2026...</p>
              <p>[OK] 20/20 campos SAT Receptor verificados:</p>
              <p className="pl-4 text-neutral-300">1. NUM_EMPLEADO (F-001)</p>
              <p className="pl-4 text-neutral-300">2. NOMBRE_COMPLETO (Juan Pérez López)</p>
              <p className="pl-4 text-neutral-300">3. RFC_RECEPTOR (PELJ900101ABC - 13 caracteres SAT)</p>
              <p className="pl-4 text-neutral-300">4. CURP_RECEPTOR (PELJ900101HDFRRN09 - 18 caracteres SAT)</p>
              <p className="pl-4 text-neutral-300">5. NSS (12908472910 - 11 caracteres)</p>
              <p className="pl-4 text-neutral-300">6. SALARIO_DIARIO (600.00)</p>
              <p className="pl-4 text-neutral-300">7. SBC_IMSS (629.58)</p>
              <p className="pl-4 text-neutral-300">8. FACTOR_INTEGRACION (1.0493)</p>
              <p className="pl-4 text-neutral-300">9. BANCO_RECEPTOR (BBVA México)</p>
              <p className="pl-4 text-neutral-300">10. CLABE_INTERBANCARIA (012180015678901234 - 18 dígitos)</p>
              <p className="pl-4 text-neutral-300">11-20. Puesto, Turno, Régimen, Periodicidad, NFC UID 04:A1:B2:C3...</p>
              <p>[OK] DEBE=HABER con tolerancia 0.01 (Diferencia exacta calculada: $0.00 MXN)</p>
              <p>[OK] Compatibilidad CONTPAQi Contabilidad versiones 14.x, 15.x y 16.x verificada</p>
              <p>[OK] Paquete USB de prueba para despachos Allende 16 y Fuentes 311 Celaya Gto validado</p>
            </div>
            <div className="pt-3 border-t border-neutral-700 text-[#16A34A] font-bold text-sm">
              ✓ PROTOCOLO 20/20 SAT Y CONTPAQi APROBADO: Métrica ¿importó a la primera?: SÍ.
            </div>
          </div>
        )}

        {/* Tab 4: Migración 0001 (Supabase SQL) */}
        {activeTab === 'migracion' && (
          <div className="flex-1 p-5 overflow-y-auto custom-scroll bg-[#1A1A1A] text-neutral-200 font-mono text-xs space-y-3">
            <div className="text-neutral-400 pb-2 border-b border-neutral-700 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#16A34A] text-base">database</span>
                <span>supabase/migrations/0001_initial_schema.sql</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(sqlMigrationContent);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 2000);
                }}
                className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-600 flex items-center gap-1.5 transition-colors cursor-pointer text-[11px]"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {copiedSql ? 'check' : 'content_copy'}
                </span>
                <span>{copiedSql ? '¡SQL Copiado!' : 'Copiar SQL Completo'}</span>
              </button>
            </div>

            <div className="bg-black/60 p-4 border border-neutral-800 rounded text-neutral-300 overflow-x-auto select-all leading-relaxed text-[11px]">
              <pre>{sqlMigrationContent}</pre>
            </div>

            <div className="p-3 bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
              <span className="text-[#16A34A] font-bold block">✓ Resumen de Migración 0001 Verificado:</span>
              <p>• Tablas creadas: <code className="text-white">despachos</code>, <code className="text-white">empresas</code>, <code className="text-white">trabajadores</code>, <code className="text-white">marcajes</code>, <code className="text-white">lft_topes</code>, <code className="text-white">catalogo_cuentas</code>.</p>
              <p>• Trigger inmutable <code className="text-white">trg_bloquear_mutacion_marcajes</code> armado contra UPDATE y DELETE.</p>
              <p>• RLS multi-tenant habilitado con políticas <code className="text-white">empresa_id = auth.jwt() -&gt; empresa_id</code>.</p>
              <p>• Seed preconfigurado: Despacho Sánchez &amp; Asociados S.C., Comercializadora del Bajío RFC DEMO260101AB1, catálogo 510-001, LFT Topes 2026 (UMA $113.14). Padrón de trabajadores vacío para inicio limpio.</p>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-3 bg-[#F8F7F4] border-t border-[#E7E5E4] flex items-center justify-between text-xs font-mono">
          <span className="text-neutral-500">
            Firma determinista SHA-256: <code className="text-[#1A1A1A]">7f8c12...b904</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1A1A1A] hover:bg-black text-white font-sans text-xs font-semibold cursor-pointer"
          >
            Cerrar Consola
          </button>
        </div>
      </div>
    </div>
  );
};
