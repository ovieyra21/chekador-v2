import React, { useState } from 'react';
import { Despacho } from '../../types';
import { ComplianceHeader } from '../ComplianceHeader';
import { ComplianceFooter } from '../ComplianceFooter';

interface LoginScreenProps {
  onLogin: (despacho: Despacho) => void;
  onOpenAuditoria: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onOpenAuditoria,
}) => {
  const [email, setEmail] = useState('contador@despacho.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [despachoNombre, setDespachoNombre] = useState('Sánchez & Asociados S.C.');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const despacho: Despacho = {
      id: 'despacho_sanchez_2026',
      nombre: despachoNombre.trim() || 'Sánchez & Asociados S.C.',
      rfc: 'SAS180210XY8',
      correo: email.trim(),
      tokenAuth: 'd9b8e21a4f023f12',
      licenciaLimiteEmpleados: 100,
      creadoEn: '2026-10-01T00:00:00Z',
    };
    onLogin(despacho);
  };

  return (
    <div className="min-h-full flex flex-col justify-between selection:bg-[#C65D3A]/20 selection:text-[#1A1A1A]">
      <ComplianceHeader onOpenAuditoria={onOpenAuditoria} />

      {/* Main Centered Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-[400px] bg-white border border-[#E7E5E4] rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)] p-8">
          {/* Brand & Header */}
          <div className="flex flex-col items-center text-center mb-7">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded bg-[#C65D3A] text-white font-mono font-bold text-sm flex items-center justify-center shadow-sm">
                Ch
              </span>
              <span className="font-serif font-semibold text-xl tracking-tight text-[#1A1A1A]">
                Chekdor
              </span>
            </div>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-medium bg-[#F4F2EE] text-[#5A554E] border border-[#E7E5E4] mb-3">
              <span className="material-symbols-outlined text-[14px] text-[#16A34A]">
                verified_user
              </span>
              ADAPTADOR FISCAL PÓLIZAS
            </span>

            <h1 className="font-serif font-semibold text-[24px] text-[#1A1A1A] leading-tight">
              {isRegisterMode ? 'Registra tu despacho' : 'Accede a tu despacho'}
            </h1>
            <p className="text-xs text-[#6B7280] mt-1">
              {isRegisterMode
                ? 'Crea tu espacio de despacho contable multi-tenant'
                : 'Ingresa tus credenciales autorizadas del despacho'}
            </p>
          </div>

          {/* Login / Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegisterMode && (
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5 tracking-wide">
                  Nombre del Despacho
                </label>
                <input
                  type="text"
                  required
                  value={despachoNombre}
                  onChange={(e) => setDespachoNombre(e.target.value)}
                  placeholder="Ej. González & Socios Contadores"
                  className="w-full px-3 py-2 text-[14px] bg-[#FCFCF9] border border-[#E7E5E4] rounded text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#C65D3A] focus:border-[#C65D3A] transition-colors"
                />
              </div>
            )}

            {/* Email input */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-[#1A1A1A] mb-1.5 tracking-wide"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9CA3AF]">
                  <span className="material-symbols-outlined text-[16px]">mail</span>
                </div>
                <input
                  type="email"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contador@despacho.com"
                  className="w-full pl-9 pr-3 py-2 text-[14px] bg-[#FCFCF9] border border-[#E7E5E4] rounded text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#C65D3A] focus:border-[#C65D3A] transition-colors font-sans"
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-[#1A1A1A] tracking-wide"
                >
                  Contraseña
                </label>
                <span className="text-[11px] text-[#6B7280] font-mono">
                  RLS Hermético
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9CA3AF]">
                  <span className="material-symbols-outlined text-[16px]">lock</span>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2 text-[14px] bg-[#FCFCF9] border border-[#E7E5E4] rounded text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#C65D3A] focus:border-[#C65D3A] transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#9CA3AF] hover:text-[#1A1A1A] transition-colors focus:outline-none cursor-pointer"
                  title="Mostrar / ocultar contraseña"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Primary Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                className="w-full bg-[#C65D3A] hover:bg-[#b24f2f] active:bg-[#9f4325] text-white font-medium text-[15px] py-2.5 px-4 rounded transition-colors shadow-sm flex items-center justify-center gap-2 group focus:outline-none focus:ring-2 focus:ring-[#C65D3A] focus:ring-offset-2 cursor-pointer"
              >
                <span>{isRegisterMode ? 'Crear despacho' : 'Entrar'}</span>
                <span className="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-0.5">
                  arrow_forward
                </span>
              </button>
            </div>
          </form>

          {/* Toggle between Login and Register */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              className="text-xs text-[#C65D3A] hover:underline cursor-pointer font-medium"
            >
              {isRegisterMode
                ? '¿Ya tienes despacho? Acceder'
                : '¿Nuevo despacho? Registrar nuevo despacho'}
            </button>
          </div>

          {/* Divider */}
          <div className="my-5 border-t border-[#E7E5E4]"></div>

          {/* Regulatory bottom text */}
          <div className="text-center">
            <p className="text-[11px] leading-relaxed text-[#5A554E] font-normal">
              Chekdor no es PAC, no timbra, no dispersa. Registro electrónico LFT art 132 fr XXXIV.
            </p>
          </div>
        </div>
      </main>

      <ComplianceFooter onOpenTests={onOpenAuditoria} />
    </div>
  );
};
