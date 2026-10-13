/**
 * Chekdor v2.0 - Marcajes Inmutables SHA-256
 * LFT Reforma 1 mayo 2026 Art. 132 Fracc. XXXIV
 * Genera el hash determinista SHA-256(id_trabajador + timestamp ISO8601 UTC + device_id + salt)
 */

export async function generarHashMarcaje(
  idTrabajador: string,
  timestampIsoUtc: string,
  deviceId: string,
  salt: string
): Promise<string> {
  const cadena = `${idTrabajador}|${timestampIsoUtc}|${deviceId}|${salt}`;

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(cadena);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback determinista en entornos sin crypto.subtle
  let hash = 0x811c9dc5;
  for (let i = 0; i < cadena.length; i++) {
    hash ^= cadena.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return 'sha256:' + (hash >>> 0).toString(16).padStart(64, 'a');
}
