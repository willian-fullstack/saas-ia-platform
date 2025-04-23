import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Otimizando carregamento da fonte
const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap', // Garante melhor performance na troca de fontes
  preload: true
});

export const metadata: Metadata = {
  title: "SAS IA Platform",
  description: "Plataforma All-in-One com IA para Criadores de Conteúdo",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
