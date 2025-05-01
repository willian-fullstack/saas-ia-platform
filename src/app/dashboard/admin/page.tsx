"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequireAdmin } from "@/lib/auth";

export default function AdminRedirectPage() {
  const router = useRouter();
  const { isAdmin, isLoading } = useRequireAdmin();

  useEffect(() => {
    if (!isLoading) {
      if (isAdmin) {
        router.push("/dashboard/admin/credits");
      }
    }
  }, [isAdmin, isLoading, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecionando...</h1>
        <p className="text-muted-foreground">
          Aguarde enquanto redirecionamos você para a área administrativa.
        </p>
      </div>
    </div>
  );
} 