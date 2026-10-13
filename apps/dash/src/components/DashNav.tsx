'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Users, Clock, Calculator, FileSpreadsheet, LayoutDashboard, LogOut, ShieldCheck } from 'lucide-react';

interface DashNavProps {
  despachoNombre?: string;
  empresaNombre?: string;
}

export function DashNav({
  despachoNombre = 'Sánchez & Asociados S.C.',
  empresaNombre,
}: DashNavProps) {
  const pathname = usePathname();

  const links = [
    { href: '/empresas', label: 'Empresas Cliente', icon: Building2 },
    { href: '/trabajadores', label: 'Trabajadores', icon: Users },
    { href: '/asistencia', label: 'Asistencia LFT', icon: Clock },
    { href: '/nomina/2026-10-1q', label: 'Nómina & Póliza', icon: Calculator },
    { href: '/contabilidad', label: 'Contabilidad CONTPAQi', icon: FileSpreadsheet },
    { href: '/dashboard', label: 'Sesión & RLS', icon: LayoutDashboard },
  ];

  return (
    <header className="border-b border-[#332E2B] bg-[#1C1917] sticky top-0 z-40">
      {/* Top Compliance Bar */}
      <div className="bg-[#262320] border-b border-[#383330] px-4 py-1.5 flex items-center justify-between text-xs font-mono text-[#A8A29E]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#C65D3A]" />
          <span>LFT Reforma DOF 01/05/2026 Art. 132 Fracc. XXXIV • Sanción Art. 994 Fr. IV Bis</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-[#78716C]">Despacho:</span>
          <span className="text-[#FAFAF9] font-medium">{despachoNombre}</span>
          {empresaNombre && (
            <>
              <span className="text-[#57534E]">/</span>
              <span className="text-[#FB923C] font-semibold">{empresaNombre}</span>
            </>
          )}
        </div>
      </div>

      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/empresas" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#C65D3A] text-white flex items-center justify-center font-bold font-mono text-sm shadow-inner">
              Ch
            </div>
            <div>
              <span className="font-fraunces text-lg font-bold text-[#FAFAF9] tracking-tight">
                Chekdor
              </span>
              <span className="ml-1.5 text-[11px] font-mono bg-[#2C2825] text-[#D6D3D1] px-1.5 py-0.5 rounded border border-[#443E3A]">
                v2.0
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#292524] text-[#FAFAF9] border border-[#44403C]'
                      : 'text-[#A8A29E] hover:text-[#FAFAF9] hover:bg-[#24211E]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#C65D3A]' : 'text-[#78716C]'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <form action="/auth/logout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono text-[#A8A29E] hover:text-[#FAFAF9] bg-[#24211E] hover:bg-[#2C2825] border border-[#3E3834] rounded transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
