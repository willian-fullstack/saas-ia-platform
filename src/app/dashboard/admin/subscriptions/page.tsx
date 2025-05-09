"use client";

import { useState, useEffect } from "react";
import { Loader2, Check, X, AlertTriangle, Search, RefreshCw } from "lucide-react";
import { useRequireAdmin } from "@/lib/auth";
import Link from "next/link";

// Interface para os dados da assinatura
interface Subscription {
  _id: string;
  userId: string;
  planId: {
    _id: string;
    name: string;
    price: number;
    credits: number;
  };
  status: 'active' | 'cancelled' | 'pending';
  mercadoPagoId?: string;
  startDate?: string;
  endDate?: string;
  renewalDate?: string;
  paymentHistory: {
    paymentId: string;
    amount: number;
    status: string;
    date: string;
  }[];
  createdAt: string;
  updatedAt: string;
  user?: {
    _id: string;
    name: string;
    email: string;
  };
}

export default function AdminSubscriptionsPage() {
  const { isAdmin, isLoading: authLoading } = useRequireAdmin();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Função para buscar assinaturas
  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/subscriptions");
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Erro ao buscar assinaturas");
      }

      // Ordenar por data de atualização (mais recentes primeiro)
      const sortedSubscriptions = data.subscriptions.sort((a: Subscription, b: Subscription) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      setSubscriptions(sortedSubscriptions);
      setFilteredSubscriptions(sortedSubscriptions);
      setError("");
    } catch (error) {
      console.error("Erro ao carregar assinaturas:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Erro ao carregar assinaturas"
      );
    } finally {
      setLoading(false);
    }
  };

  // Carregar assinaturas quando a página é carregada
  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchSubscriptions();
    }
  }, [authLoading, isAdmin]);

  // Filtrar assinaturas com base no termo de busca e status
  useEffect(() => {
    if (subscriptions.length > 0) {
      let filtered = [...subscriptions];

      // Aplicar filtro de status
      if (statusFilter !== "all") {
        filtered = filtered.filter(sub => sub.status === statusFilter);
      }

      // Aplicar termo de busca (email, nome ou ID da assinatura)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        filtered = filtered.filter(
          sub =>
            (sub.user?.email && sub.user.email.toLowerCase().includes(term)) ||
            (sub.user?.name && sub.user.name.toLowerCase().includes(term)) ||
            sub._id.toLowerCase().includes(term) ||
            (sub.mercadoPagoId && sub.mercadoPagoId.toLowerCase().includes(term))
        );
      }

      setFilteredSubscriptions(filtered);
    }
  }, [searchTerm, statusFilter, subscriptions]);

  // Função para corrigir uma assinatura pendente
  const handleFixSubscription = async (subscriptionId: string) => {
    if (!confirm("Tem certeza que deseja ativar manualmente esta assinatura?")) {
      return;
    }

    setProcessing(subscriptionId);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/subscription/fix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId,
          forceActivate: true,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Erro ao corrigir assinatura");
      }

      setMessage("Assinatura corrigida com sucesso!");
      
      // Atualizar a lista de assinaturas
      fetchSubscriptions();
    } catch (error) {
      console.error("Erro ao corrigir assinatura:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Erro ao corrigir assinatura"
      );
    } finally {
      setProcessing(null);
    }
  };

  // Renderizar indicador de carregamento
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Verificar permissão de administrador
  if (!isAdmin) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-200px)] gap-4">
        <AlertTriangle className="h-16 w-16 text-amber-500" />
        <h1 className="text-2xl font-bold text-center">Acesso Restrito</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Esta página é restrita a administradores do sistema. Se você acredita
          que deveria ter acesso, entre em contato com o suporte.
        </p>
      </div>
    );
  }

  // Renderizar página principal
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gerenciamento de Assinaturas</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie as assinaturas de usuários
          </p>
        </div>
        <div>
          <button
            className="inline-flex items-center py-2 px-4 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
            onClick={fetchSubscriptions}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          <p>{message}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}

      <div className="bg-card rounded-lg shadow p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por email, nome ou ID"
              className="w-full pl-10 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <select
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos os status</option>
              <option value="active">Ativo</option>
              <option value="pending">Pendente</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma assinatura encontrada com os filtros aplicados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-3 border">Usuário</th>
                  <th className="text-center p-3 border">Plano</th>
                  <th className="text-center p-3 border">Status</th>
                  <th className="text-center p-3 border">Criado em</th>
                  <th className="text-center p-3 border">Pagamento</th>
                  <th className="text-center p-3 border">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscriptions.map((subscription) => (
                  <tr key={subscription._id} className="hover:bg-muted/50">
                    <td className="p-3 border">
                      <div>
                        <div className="font-medium">
                          {subscription.user?.name || "Nome não disponível"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {subscription.user?.email || "Email não disponível"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          ID: {subscription.userId}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 border text-center">
                      <div className="font-medium">
                        {subscription.planId?.name || "Plano desconhecido"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {subscription.planId?.price
                          ? new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(subscription.planId.price)
                          : "-"}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {subscription.planId?.credits} créditos
                      </div>
                    </td>
                    <td className="p-3 border text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          subscription.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400"
                            : subscription.status === "pending"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-800/20 dark:text-amber-400"
                            : "bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400"
                        }`}
                      >
                        {subscription.status === "active"
                          ? "Ativo"
                          : subscription.status === "pending"
                          ? "Pendente"
                          : "Cancelado"}
                      </span>
                      {subscription.renewalDate && subscription.status === "active" && (
                        <div className="text-xs text-muted-foreground mt-2">
                          Renovação:{" "}
                          {new Date(subscription.renewalDate).toLocaleDateString("pt-BR")}
                        </div>
                      )}
                    </td>
                    <td className="p-3 border text-center text-sm">
                      {new Date(subscription.createdAt).toLocaleDateString("pt-BR")}
                      <div className="text-xs text-muted-foreground">
                        {new Date(subscription.createdAt).toLocaleTimeString("pt-BR")}
                      </div>
                    </td>
                    <td className="p-3 border text-center">
                      {subscription.mercadoPagoId ? (
                        <div>
                          <div className="text-sm font-medium truncate max-w-[150px] mx-auto overflow-hidden">
                            {subscription.mercadoPagoId}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {subscription.paymentHistory.length > 0
                              ? subscription.paymentHistory[
                                  subscription.paymentHistory.length - 1
                                ].status
                              : "Sem histórico"}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Não processado
                        </div>
                      )}
                    </td>
                    <td className="p-3 border text-center">
                      <div className="flex flex-col gap-2 items-center">
                        {subscription.status === "pending" && (
                          <button
                            className="text-primary hover:text-primary/80 text-sm flex items-center"
                            onClick={() => handleFixSubscription(subscription._id)}
                            disabled={processing === subscription._id}
                          >
                            {processing === subscription._id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <Check className="h-4 w-4 mr-1" />
                            )}
                            Ativar
                          </button>
                        )}
                        <Link
                          href={`/dashboard/admin/users/${subscription.userId}`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Ver usuário
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 