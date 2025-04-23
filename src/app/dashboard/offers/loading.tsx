import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function OffersLoading() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">IA de Ofertas</h1>
        <p className="text-muted-foreground">
          Carregando ferramenta de criação de ofertas...
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Esqueleto do formulário */}
        <div className="space-y-6">
          <div className="space-y-4 rounded-lg border p-4 shadow-sm">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-full" />
            
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-full" />
            
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-20 w-full" />
            
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-full" />
            
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-full" />
            
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-full" />
            
            <Skeleton className="h-8 w-48 mb-2" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-10" />
            </div>
            
            <Skeleton className="h-4 w-48 mt-4" />
            <Skeleton className="h-4 w-48" />
            
            <Skeleton className="h-10 w-32 mt-4" />
          </div>
        </div>

        {/* Esqueleto do resultado */}
        <div className="space-y-4">
          <div className="rounded-lg border p-4 shadow-sm min-h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <Skeleton className="h-6 w-32" />
            </div>

            <div className="flex-1 relative bg-muted/30 rounded-md p-4 overflow-auto flex items-center justify-center">
              <div className="text-center flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Preparando interface da IA de Ofertas...</p>
              </div>
            </div>
          </div>

          <div className="bg-primary/10 rounded-lg p-4">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
} 