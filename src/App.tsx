/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Despacho, Empresa, Trabajador, MarcajeAsistencia, CatalogoTipo } from './types';
import { DEMO_EMPRESA, DEMO_TRABAJADORES, DEMO_MARCAJES_INMUTABLES } from './mock/demoData';
import { ComplianceHeader } from './components/ComplianceHeader';
import { ComplianceFooter } from './components/ComplianceFooter';
import { Sidebar, NavTab } from './components/Sidebar';
import { LoginScreen } from './components/screens/LoginScreen';
import { EmpresasScreen } from './components/screens/EmpresasScreen';
import { NuevaEmpresaModal } from './components/screens/NuevaEmpresaModal';
import { TrabajadoresScreen } from './components/screens/TrabajadoresScreen';
import { AsistenciaScreen } from './components/screens/AsistenciaScreen';
import { NominaScreen } from './components/screens/NominaScreen';
import { ContabilidadScreen } from './components/screens/ContabilidadScreen';
import { ConfiguracionScreen } from './components/screens/ConfiguracionScreen';
import { AuditoriaModal } from './components/screens/AuditoriaModal';

export default function App() {
  // Despacho state - starts unauthenticated
  const [despacho, setDespacho] = useState<Despacho | null>(null);

  // Tenant state - starts strictly empty without companies
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<Empresa | null>(null);
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [marcajes, setMarcajes] = useState<MarcajeAsistencia[]>([]);

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<NavTab>('empresas');

  // Modals
  const [isNuevaEmpresaModalOpen, setIsNuevaEmpresaModalOpen] = useState(false);
  const [isAuditoriaModalOpen, setIsAuditoriaModalOpen] = useState(false);
  const [auditoriaInitialTab, setAuditoriaInitialTab] = useState<'tests' | 'demo' | 'exportacion'>('tests');

  // Handler: Login / Registro de Despacho
  const handleLoginDespacho = (d: Despacho) => {
    setDespacho(d);
    // Starts with 0 companies by default, clean state
    setEmpresas([]);
    setEmpresaSeleccionada(null);
    setTrabajadores([]);
    setMarcajes([]);
    setCurrentTab('empresas');
  };

  const handleLogoutDespacho = () => {
    setDespacho(null);
    setEmpresas([]);
    setEmpresaSeleccionada(null);
    setTrabajadores([]);
    setMarcajes([]);
  };

  // Handler: Cargar Empresa Demo al Instante
  const handleCargarDemo = (catalogoBase: CatalogoTipo = '510-001') => {
    const demo: Empresa = {
      ...DEMO_EMPRESA,
      catalogoBase,
    };
    setEmpresas([demo]);
    setEmpresaSeleccionada(demo);
    setTrabajadores(DEMO_TRABAJADORES);
    setMarcajes(DEMO_MARCAJES_INMUTABLES);
    setCurrentTab('empresas');
  };

  // Handler: Crear Nueva Empresa Cliente
  const handleCrearEmpresa = (nueva: Empresa) => {
    setEmpresas((prev) => [...prev, nueva]);
    setEmpresaSeleccionada(nueva);
    // If it's the demo RFC or requested, seed demo workers or start with Juan Pérez
    if (nueva.rfc === 'CBA240101AB1' || nueva.rfc === 'DEMO260101AB1') {
      setTrabajadores(DEMO_TRABAJADORES);
      setMarcajes(DEMO_MARCAJES_INMUTABLES);
    } else {
      // Worker 01 initialized for this company
      const primerTrabajador: Trabajador = {
        ...DEMO_TRABAJADORES[0],
        empresaId: nueva.id,
      };
      setTrabajadores([primerTrabajador]);
      setMarcajes([]);
    }
    setCurrentTab('trabajadores');
  };

  // Handler: Seleccionar Empresa Activa
  const handleSelectEmpresa = (empresa: Empresa) => {
    setEmpresaSeleccionada(empresa);
    // Navigate to trabajadores or nomina
    setCurrentTab('trabajadores');
  };

  // Handler: Alta de trabajador
  const handleAgregarTrabajador = (t: Trabajador) => {
    setTrabajadores((prev) => [...prev, t]);
  };

  // Handler: Importar CSV 20/20 SAT
  const handleImportarCsv = () => {
    setTrabajadores(DEMO_TRABAJADORES);
  };

  // Handler: Simular checada NFC
  const handleSimularChecadaNfc = (t: Trabajador) => {
    setCurrentTab('asistencia');
  };

  // Handler: Actualizar jornada (horas extra / domingos)
  const handleActualizarJornadaTrabajador = (
    trabajadorId: string,
    horasExtra: number,
    domingos: number
  ) => {
    setTrabajadores((prev) =>
      prev.map((t) =>
        t.id === trabajadorId
          ? { ...t, horasExtraDobles: horasExtra, domingosTrabajados: domingos }
          : t
      )
    );
  };

  // Handler: Cambiar catálogo base
  const handleCambiarCatalogoEmpresa = (cat: CatalogoTipo) => {
    if (empresaSeleccionada) {
      const updated = { ...empresaSeleccionada, catalogoBase: cat };
      setEmpresaSeleccionada(updated);
      setEmpresas((prev) =>
        prev.map((e) => (e.id === updated.id ? updated : e))
      );
    }
  };

  // Script triggers
  const handleOpenAuditoriaConTab = (tab: 'tests' | 'demo' | 'exportacion') => {
    setAuditoriaInitialTab(tab);
    setIsAuditoriaModalOpen(true);
  };

  const handleLimpiarDatos = () => {
    setEmpresas([]);
    setEmpresaSeleccionada(null);
    setTrabajadores([]);
    setMarcajes([]);
    setCurrentTab('empresas');
  };

  // Si no ha iniciado sesión en el despacho:
  if (!despacho) {
    return (
      <LoginScreen
        onLogin={handleLoginDespacho}
        onOpenAuditoria={() => handleOpenAuditoriaConTab('tests')}
      />
    );
  }

  // Empresa activa fallback
  const empresaActiva =
    empresaSeleccionada ||
    empresas[0] || {
      id: 'sin_empresa',
      despachoId: despacho.id,
      rfc: 'DEMO260101AB1',
      nombre: 'Comercializadora del Bajío S.A. de C.V.',
      catalogoBase: '510-001',
      regimenFiscal: '601 General de Ley Personas Morales',
      registroPatronalImss: 'Y54-92183-10-8',
      creadoEn: new Date().toISOString(),
    };

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFCF9] text-[#1A1A1A] antialiased selection:bg-[#C65D3A]/20 selection:text-[#1A1A1A]">
      {/* Top Compliance Banner */}
      <ComplianceHeader
        empresaNombre={empresaSeleccionada?.nombre}
        onOpenAuditoria={() => handleOpenAuditoriaConTab('tests')}
      />

      <div className="flex flex-1 w-full min-h-[calc(100vh-37px)] overflow-hidden">
        {/* Dark Sidebar 240px */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          despacho={despacho}
          empresasCount={empresas.length}
          empresaSeleccionada={empresaSeleccionada}
          onLogoutDespacho={handleLogoutDespacho}
          onOpenAuditoria={() => handleOpenAuditoriaConTab('tests')}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col justify-between bg-[#FCFCF9] overflow-hidden">
          {currentTab === 'empresas' && (
            <EmpresasScreen
              empresas={empresas}
              empresaSeleccionada={empresaSeleccionada}
              onSelectEmpresa={handleSelectEmpresa}
              onOpenNuevaEmpresaModal={() => setIsNuevaEmpresaModalOpen(true)}
              onCargarDemo={handleCargarDemo}
              onOpenAuditoria={() => handleOpenAuditoriaConTab('exportacion')}
            />
          )}

          {currentTab === 'trabajadores' && (
            <TrabajadoresScreen
              empresa={empresaActiva}
              trabajadores={trabajadores}
              onAgregarTrabajador={handleAgregarTrabajador}
              onImportarCsv={handleImportarCsv}
              onSimularChecadaNfc={handleSimularChecadaNfc}
            />
          )}

          {currentTab === 'asistencia' && (
            <AsistenciaScreen
              empresa={empresaActiva}
              trabajadores={trabajadores.length > 0 ? trabajadores : DEMO_TRABAJADORES}
              marcajes={marcajes}
              onNuevoMarcaje={(m) => setMarcajes((prev) => [m, ...prev])}
              onActualizarJornadaTrabajador={handleActualizarJornadaTrabajador}
            />
          )}

          {currentTab === 'nomina' && (
            <NominaScreen
              empresa={empresaActiva}
              trabajadores={trabajadores.length > 0 ? trabajadores : DEMO_TRABAJADORES}
              onIrAContabilidad={() => setCurrentTab('contabilidad')}
            />
          )}

          {currentTab === 'contabilidad' && (
            <ContabilidadScreen
              empresa={empresaActiva}
              trabajadores={trabajadores.length > 0 ? trabajadores : DEMO_TRABAJADORES}
              onCambiarCatalogoEmpresa={handleCambiarCatalogoEmpresa}
            />
          )}

          {currentTab === 'configuracion' && (
            <ConfiguracionScreen
              despacho={despacho}
              empresa={empresaSeleccionada}
              onActualizarDespacho={(d) => setDespacho((prev) => (prev ? { ...prev, ...d } : null))}
              onActualizarEmpresa={(e) => {
                if (empresaSeleccionada) {
                  const upd = { ...empresaSeleccionada, ...e };
                  setEmpresaSeleccionada(upd);
                  setEmpresas((prev) => prev.map((item) => (item.id === upd.id ? upd : item)));
                }
              }}
              onEjecutarScriptDemo={() => handleOpenAuditoriaConTab('demo')}
              onEjecutarScriptExportacion={() => handleOpenAuditoriaConTab('exportacion')}
              onOpenAuditoria={() => handleOpenAuditoriaConTab('tests')}
              onLimpiarDatos={handleLimpiarDatos}
            />
          )}

          {/* Persistent Compliance Footer */}
          <ComplianceFooter onOpenTests={() => handleOpenAuditoriaConTab('tests')} />
        </main>
      </div>

      {/* Modals */}
      <NuevaEmpresaModal
        isOpen={isNuevaEmpresaModalOpen}
        onClose={() => setIsNuevaEmpresaModalOpen(false)}
        onCrearEmpresa={handleCrearEmpresa}
        despachoId={despacho.id}
      />

      <AuditoriaModal
        isOpen={isAuditoriaModalOpen}
        onClose={() => setIsAuditoriaModalOpen(false)}
        initialTab={auditoriaInitialTab}
      />
    </div>
  );
}
