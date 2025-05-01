"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { CreditBadge } from "@/components/subscription/CreditBadge";
import { formatDate } from "@/lib/utils";

interface CreditHistoryItem {
  _id: string;
  userId: string;
  amount: number;
  operation: "add" | "use";
  feature?: string;
  description?: string;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  skip: number;
}

export default function CreditHistoryPage() {
  const { data: session } = useSession();
  const [history, setHistory] = useState<CreditHistoryItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    skip: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchHistory() {
      if (!session) return;

      setLoading(true);
      try {
        const { page, limit } = pagination;
        const response = await fetch(
          `/api/credits/balance?history=true&page=${page}&limit=${limit}`
        );
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Erro ao buscar histórico");
        }

        setHistory(data.history || []);
        setPagination(data.pagination || pagination);
      } catch (error) {
        console.error("Erro ao carregar histórico:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Erro ao carregar histórico de créditos"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [session, pagination.page, pagination.limit]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1) return;
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  if (!session) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <p>Você precisa estar logado para acessar esta página.</p>
      </div>
    );
  }

  if (loading && history.length === 0) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Histórico de Créditos</h1>
          <p className="text-slate-500 mt-1">
            Acompanhe o uso e as adições de créditos na sua conta
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <CreditBadge variant="default" className="text-lg" />
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Operação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Quantidade
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
              {history.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-center text-slate-500 dark:text-slate-400"
                  >
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(new Date(item.createdAt))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.operation === "add" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <ArrowUp className="w-3 h-3 mr-1" />
                          Adição
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          <ArrowDown className="w-3 h-3 mr-1" />
                          Uso
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {item.description || (item.feature ? `Funcionalidade: ${item.feature}` : "-")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                      <span
                        className={
                          item.operation === "add"
                            ? "text-green-600"
                            : "text-amber-600"
                        }
                      >
                        {item.operation === "add" ? "+" : "-"}
                        {Math.abs(item.amount)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {history.length > 0 && (
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-700 flex items-center justify-between">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Página {pagination.page}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 rounded text-sm disabled:opacity-50 bg-white dark:bg-slate-600 shadow"
              >
                Anterior
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={history.length < pagination.limit}
                className="px-3 py-1 rounded text-sm disabled:opacity-50 bg-white dark:bg-slate-600 shadow"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 