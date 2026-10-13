'use client';

import React, { useState } from 'react';
import { createClient } from '../../../lib/supabase/client';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [despachoNombre, setDespachoNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      if (isSignUp) {
        // Registro con creación automática de despacho mediante trigger en Supabase
        const res = await fetch('/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            despacho_nombre: despachoNombre || `Despacho ${email.split('@')[0]}`,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al registrarse');

        setMessage('Cuenta creada con éxito. Despacho inicializado por trigger. Iniciando sesión...');
        // Iniciar sesión
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        window.location.href = '/dashboard';
      } else {
        // Login con email + password
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        window.location.href = '/dashboard';
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error durante la autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1C1917] text-[#FAFAF9] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#292524] border border-[#44403C] rounded-xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#C2410C] text-white flex items-center justify-center font-bold font-mono">
            Ch
          </div>
          <div>
            <h1 className="text-xl font-bold font-serif text-[#FAFAF9]">Chekdor v2.0</h1>
            <p className="text-xs text-[#A8A29E] font-mono">Autenticación Despacho & Supabase RLS</p>
          </div>
        </div>

        <div className="flex border-b border-[#44403C] mb-6">
          <button
            type="button"
            onClick={() => setIsSignUp(false)}
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
              !isSignUp ? 'border-[#C2410C] text-[#FAFAF9]' : 'border-transparent text-[#78716C]'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => setIsSignUp(true)}
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
              isSignUp ? 'border-[#C2410C] text-[#FAFAF9]' : 'border-transparent text-[#78716C]'
            }`}
          >
            Registrar Despacho
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-800 rounded text-red-300 text-xs font-mono">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-800 rounded text-emerald-300 text-xs font-mono">
            {message}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-mono text-[#D6D3D1] mb-1">
                Nombre del Despacho Contable
              </label>
              <input
                type="text"
                required
                value={despachoNombre}
                onChange={(e) => setDespachoNombre(e.target.value)}
                placeholder="Ej. Sánchez & Asociados S.C."
                className="w-full px-3 py-2 bg-[#1C1917] border border-[#44403C] rounded text-sm text-[#FAFAF9] focus:outline-none focus:border-[#C2410C]"
              />
              <span className="text-[11px] text-[#A8A29E] mt-1 block">
                * El trigger en Postgres creará el despacho asignando el rol de titular `contador`.
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-[#D6D3D1] mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contador@despacho.com.mx"
              className="w-full px-3 py-2 bg-[#1C1917] border border-[#44403C] rounded text-sm text-[#FAFAF9] focus:outline-none focus:border-[#C2410C]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-[#D6D3D1] mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3 py-2 bg-[#1C1917] border border-[#44403C] rounded text-sm text-[#FAFAF9] focus:outline-none focus:border-[#C2410C]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#C2410C] hover:bg-[#EA580C] text-white rounded font-medium text-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Procesando...' : isSignUp ? 'Crear Despacho y Registrarse' : 'Entrar al Despacho'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#44403C] text-[11px] text-[#78716C] font-mono text-center">
          LFT Art. 132 Fr. XXXIV • Integridad Inalterable SHA-256 • Supabase RLS
        </div>
      </div>
    </div>
  );
}
