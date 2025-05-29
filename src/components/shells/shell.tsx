"use client";

import { ReactNode } from "react";
import { DashboardHeader } from "@/components/dashboard/header";

interface ShellProps {
  children: ReactNode;
  variant?: "default" | "sidebar" | "centered";
  className?: string;
}

export function Shell({ children, variant = "default", className = "" }: ShellProps) {
  const containerClasses = {
    default: "container mx-auto px-4 py-6",
    sidebar: "md:container mx-auto",
    centered: "container mx-auto max-w-3xl px-4 py-10"
  };

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader />
      <main className={`flex-1 ${containerClasses[variant]} ${className}`}>
        {children}
      </main>
    </div>
  );
}