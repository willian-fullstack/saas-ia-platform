"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Trash, Save, AlertTriangle, CreditCard } from "lucide-react";
import { useRequireAdmin } from "@/lib/auth";
import Link from "next/link";

interface Plan {
  _id?: string;
  name: string;
  description: string;
  price: number;
  credits: number;
  features: string[];
  isFree: boolean;
  active: boolean;
}

export default function AdminPlansPage() {
  const { isAdmin, isLoading: authLoading } = useRequireAdmin();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [newPlan, setNewPlan] = useState<Partial<Plan>>({
    name: "",
    description: "",
    price: 0,
    credits: 0,
    features: [""],
    isFree: false,
    active: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlans() {
      setLoading(true);
      try {
        const response = await fetch("/api/subscription/plans?admin=true");
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Erro ao buscar planos");
        }

        setPlans(data.plans || []);
      } catch (error) {
        console.error("Erro ao carregar planos:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Erro ao carregar planos"
        );
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchPlans();
    }
  }, [authLoading]);

  const handleAddPlan = async () => {
    if (!newPlan.name || typeof newPlan.price !== 'number' || typeof newPlan.credits !== 'number') {
      setError("Preencha todos os campos obrigatórios corretamente");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPlan),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Erro ao adicionar plano");
      }

      setPlans([...plans, data.plan]);
      setNewPlan({
        name: "",
        description: "",
        price: 0,
        credits: 0,
        features: [""],
        isFree: false,
        active: true,
      });
      setMessage("Plano adicionado com sucesso!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Erro ao adicionar plano:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Erro ao adicionar plano"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (planId: string) => {
    const plan = plans.find((p) => p._id === planId);
    if (!plan) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ active: !plan.active }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Erro ao atualizar plano");
      }

      setPlans(
        plans.map((p) =>
          p._id === planId ? { ...p, active: !p.active } : p
        )
      );
      setMessage("Plano atualizado com sucesso!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Erro ao atualizar plano:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Erro ao atualizar plano"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm("Tem certeza que deseja excluir este plano?")) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Erro ao excluir plano");
      }

      setPlans(plans.filter((p) => p._id !== planId));
      setMessage("Plano excluído com sucesso!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Erro ao excluir plano:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Erro ao excluir plano"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePlan = async (planId: string) => {
    const plan = plans.find((p) => p._id === planId);
    if (!plan) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: plan.name,
          description: plan.description,
          price: plan.price,
          credits: plan.credits,
          features: plan.features,
          isFree: plan.isFree,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Erro ao atualizar plano");
      }

      setMessage("Plano atualizado com sucesso!");
      setTimeout(() => setMessage(""), 3000);
      setEditing(null);
    } catch (error) {
      console.error("Erro ao atualizar plano:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Erro ao atualizar plano"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEditChange = (
    planId: string,
    field: keyof Plan,
    value: string | number | boolean | string[]
  ) => {
    setPlans(
      plans.map((p) =>
        p._id === planId ? { ...p, [field]: value } : p
      )
    );
  };

  const handleAddFeature = (planId: string | undefined) => {
    if (planId) {
      const plan = plans.find((p) => p._id === planId);
      if (plan) {
        handleEditChange(planId, 'features', [...plan.features, '']);
      }
    } else {
      setNewPlan({
        ...newPlan,
        features: [...(newPlan.features || []), ''],
      });
    }
  };

  const handleRemoveFeature = (planId: string | undefined, index: number) => {
    if (planId) {
      const plan = plans.find((p) => p._id === planId);
      if (plan) {
        const newFeatures = [...plan.features];
        newFeatures.splice(index, 1);
        handleEditChange(planId, 'features', newFeatures);
      }
    } else {
      const newFeatures = [...(newPlan.features || [])];
      newFeatures.splice(index, 1);
      setNewPlan({
        ...newPlan,
        features: newFeatures,
      });
    }
  };

  const handleFeatureChange = (planId: string | undefined, index: number, value: string) => {
    if (planId) {
      const plan = plans.find((p) => p._id === planId);
      if (plan) {
        const newFeatures = [...plan.features];
        newFeatures[index] = value;
        handleEditChange(planId, 'features', newFeatures);
      }
    } else {
      const newFeatures = [...(newPlan.features || [])];
      newFeatures[index] = value;
      setNewPlan({
        ...newPlan,
        features: newFeatures,
      });
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Helper para formatar preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gerenciamento de Planos</h1>
          <p className="text-muted-foreground">
            Configure os planos de assinatura disponíveis para os usuários
          </p>
        </div>
        <div>
          <Link 
            href="/dashboard/admin/credits" 
            className="inline-flex items-center py-2 px-4 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Configurações de Créditos
          </Link>
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
        <h2 className="text-xl font-semibold mb-4">Adicionar Novo Plano</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Nome do Plano*
            </label>
            <input
              type="text"
              id="name"
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Ex: Básico, Médio, Avançado ou personalizado"
              value={newPlan.name}
              onChange={(e) =>
                setNewPlan({ ...newPlan, name: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Sugestões: Básico, Médio, Avançado - ou crie um nome personalizado
            </p>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Descrição
            </label>
            <input
              type="text"
              id="description"
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Ex: Plano para iniciantes"
              value={newPlan.description}
              onChange={(e) =>
                setNewPlan({ ...newPlan, description: e.target.value })
              }
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium mb-1">
              Preço Mensal (R$)*
            </label>
            <input
              type="number"
              id="price"
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={newPlan.price}
              onChange={(e) =>
                setNewPlan({ ...newPlan, price: parseFloat(e.target.value) })
              }
            />
          </div>
          <div>
            <label htmlFor="credits" className="block text-sm font-medium mb-1">
              Créditos Mensais*
            </label>
            <input
              type="number"
              id="credits"
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
              min="0"
              step="1"
              placeholder="0"
              value={newPlan.credits}
              onChange={(e) =>
                setNewPlan({ ...newPlan, credits: parseInt(e.target.value) })
              }
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isFree"
                className="rounded text-primary focus:ring-primary"
                checked={newPlan.isFree}
                onChange={(e) =>
                  setNewPlan({ ...newPlan, isFree: e.target.checked })
                }
              />
              <label htmlFor="isFree" className="ml-2 text-sm">
                Plano Gratuito
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                className="rounded text-primary focus:ring-primary"
                checked={newPlan.active}
                onChange={(e) =>
                  setNewPlan({ ...newPlan, active: e.target.checked })
                }
              />
              <label htmlFor="active" className="ml-2 text-sm">
                Ativo
              </label>
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Recursos do Plano
          </label>
          <div className="space-y-2">
            {newPlan.features?.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Ex: Acesso ilimitado ao copywriting"
                  value={feature}
                  onChange={(e) => handleFeatureChange(undefined, index, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveFeature(undefined, index)}
                  className="p-2 text-red-500 hover:text-red-700"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleAddFeature(undefined)}
              className="text-primary hover:text-primary/80 text-sm flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" /> Adicionar recurso
            </button>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            className="flex items-center justify-center bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded"
            onClick={handleAddPlan}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Adicionar Plano
          </button>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Planos Disponíveis</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted">
              <th className="text-left p-3 border">Nome</th>
              <th className="text-center p-3 border">Preço</th>
              <th className="text-center p-3 border">Créditos</th>
              <th className="text-center p-3 border">Tipo</th>
              <th className="text-center p-3 border">Status</th>
              <th className="text-center p-3 border">Ações</th>
            </tr>
          </thead>
          <tbody>
            {plans.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-4 border">
                  Nenhum plano encontrado
                </td>
              </tr>
            ) : (
              plans.map((plan) => (
                <tr key={plan._id} className="hover:bg-muted/50">
                  <td className="p-3 border">
                    {editing === plan._id ? (
                      <div>
                        <input
                          type="text"
                          className="w-full p-1 border rounded mb-1"
                          value={plan.name}
                          onChange={(e) =>
                            handleEditChange(plan._id!, "name", e.target.value)
                          }
                        />
                        <input
                          type="text"
                          className="w-full p-1 border rounded"
                          value={plan.description}
                          onChange={(e) =>
                            handleEditChange(plan._id!, "description", e.target.value)
                          }
                          placeholder="Descrição"
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="font-medium">{plan.name}</div>
                        <div className="text-sm text-muted-foreground">{plan.description}</div>
                      </div>
                    )}
                  </td>
                  <td className="p-3 border text-center">
                    {editing === plan._id ? (
                      <input
                        type="number"
                        className="w-24 p-1 border rounded mx-auto text-center"
                        min="0"
                        step="0.01"
                        value={plan.price}
                        onChange={(e) =>
                          handleEditChange(
                            plan._id!,
                            "price",
                            parseFloat(e.target.value)
                          )
                        }
                      />
                    ) : (
                      formatPrice(plan.price)
                    )}
                  </td>
                  <td className="p-3 border text-center">
                    {editing === plan._id ? (
                      <input
                        type="number"
                        className="w-24 p-1 border rounded mx-auto text-center"
                        min="0"
                        step="1"
                        value={plan.credits}
                        onChange={(e) =>
                          handleEditChange(
                            plan._id!,
                            "credits",
                            parseInt(e.target.value)
                          )
                        }
                      />
                    ) : (
                      plan.credits.toLocaleString()
                    )}
                  </td>
                  <td className="p-3 border text-center">
                    {editing === plan._id ? (
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          id={`isFree-${plan._id}`}
                          className="rounded text-primary focus:ring-primary"
                          checked={plan.isFree}
                          onChange={(e) =>
                            handleEditChange(
                              plan._id!,
                              "isFree",
                              e.target.checked
                            )
                          }
                        />
                        <label htmlFor={`isFree-${plan._id}`} className="ml-2 text-sm">
                          Gratuito
                        </label>
                      </div>
                    ) : (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          plan.isFree
                            ? "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400"
                        }`}
                      >
                        {plan.isFree ? "Gratuito" : "Pago"}
                      </span>
                    )}
                  </td>
                  <td className="p-3 border text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        plan.active
                          ? "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400"
                      }`}
                    >
                      {plan.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="p-3 border text-center">
                    <div className="flex items-center justify-center gap-2">
                      {editing === plan._id ? (
                        <button
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => handleUpdatePlan(plan._id!)}
                          disabled={saving}
                        >
                          <Save className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => setEditing(plan._id!)}
                        >
                          Editar
                        </button>
                      )}
                      <button
                        className="text-amber-600 hover:text-amber-800"
                        onClick={() => handleToggleActive(plan._id!)}
                        disabled={saving}
                      >
                        {plan.active ? "Desativar" : "Ativar"}
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800"
                        onClick={() => handleDeletePlan(plan._id!)}
                        disabled={saving}
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="mt-6 p-4 border rounded-lg bg-muted/30">
          <h3 className="font-medium mb-2">Editar Recursos do Plano</h3>
          <div className="space-y-2 mb-4">
            {plans.find(p => p._id === editing)?.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={feature}
                  onChange={(e) => handleFeatureChange(editing, index, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveFeature(editing, index)}
                  className="p-2 text-red-500 hover:text-red-700"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleAddFeature(editing)}
              className="text-primary hover:text-primary/80 text-sm flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" /> Adicionar recurso
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 