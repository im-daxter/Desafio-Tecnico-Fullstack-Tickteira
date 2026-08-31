import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tickteira - Painel de Suporte',
  description: 'Sistema de monitoramento e reenvio de e-mails',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
