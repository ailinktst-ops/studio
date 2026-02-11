
import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RankUp Counter | Ranking em Tempo Real',
  description: 'Sistema de contador de consumo com ranking automático para festas e eventos.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased selection:bg-primary/20 selection:text-primary">
        {children}
      </body>
    </html>
  );
}
