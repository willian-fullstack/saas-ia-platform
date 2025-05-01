import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SAS IA Platform - Dashboard",
  description: "Plataforma All-in-One com IA para Criadores de Conteúdo",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <div className={`min-h-screen flex flex-col ${inter.className}`}>
        <DashboardHeader />
        <div className="flex flex-1">
          <DashboardSidebar />
          {/* Main content */}
          <main className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
} 