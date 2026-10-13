import React from 'react';

export const metadata = {
  title: 'Chekdor v2.0 — Dashboard Despacho',
  description: 'Sistema de registro electrónico LFT art 132 fr XXXIV y pólizas CONTPAQi',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap"
          rel="stylesheet"
        />
        <style>{`
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 15px;
          }
          .font-fraunces {
            font-family: 'Fraunces', Georgia, serif;
          }
          .font-mono {
            font-family: 'JetBrains Mono', monospace;
          }
        `}</style>
      </head>
      <body className="min-h-full bg-[#1C1917] text-[#FAFAF9] antialiased">
        {children}
      </body>
    </html>
  );
}
