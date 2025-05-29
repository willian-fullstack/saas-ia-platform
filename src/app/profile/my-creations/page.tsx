"use client";

import { useState, useEffect } from "react";
import { UserCreationsList } from "@/components/ai-modules/user-creations/UserCreationsList";
import { PageHeader } from "@/components/page-header";
import { Shell } from "@/components/shells/shell";

export default function MyCreationsPage() {
  return (
    <Shell variant="sidebar">
      <PageHeader 
        title="Minhas Criações" 
        description="Visualize e gerencie todas as suas criações do SAS"
      />
      
      <div className="px-4 md:px-6 lg:px-8 py-6">
        <UserCreationsList className="w-full" showHeader />
      </div>
    </Shell>
  );
} 