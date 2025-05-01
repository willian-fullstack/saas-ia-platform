"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Trash, Save, AlertTriangle, BarChart, Settings, Check } from "lucide-react";
import { useRequireAdmin } from "@/lib/auth";
import Link from "next/link";

interface CreditSetting {
  _id?: string;
  featureId: string;
  featureName: string;
  description: string;
  creditCost: number;
  active: boolean;
}

interface CreditUsageStats {
  featureId: string;
  featureName: string;
  totalUsage: number;
  percentageOfTotal: number;
}

// Lista de módulos disponíveis no sistema
const availableModules = [
  { id: "dashboard", name: "Dashboard" },
  { id: "copywriting", name: "IA de Copywriting" },
  { id: "creative", name: "Criativos Visuais" },
  { id: "videos", name: "Vídeos Curtos" },
  { id: "landing", name: "Landing Pages" },
  { id: "offers", name: "IA de Ofertas" },
  { id: "consultant", name: "Consultor IA 24h" },
];

export default function AdminCreditsPage() {
  const { isAdmin, isLoading: authLoading } = useRequireAdmin();
  const [settings, setSettings] = useState<CreditSetting[]>([]);
  const [usageStats, setUsageStats] = useState<CreditUsageStats[]>([]);
  const [totalUsage, setTotalUsage] = useState(0);
  const [newSetting, setNewSetting] = useState<Partial<CreditSetting>>({
    featureId: "",
    featureName: "",
    description: "",
    creditCost: 1,
    active: true,
  });
  const [loading, setLoading] = useState(true);
  const [usageLoading, setUsageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'settings' | 'usage'>('settings');

  // Função para atualizar o nome da funcionalidade automaticamente quando o ID é selecionado
  const handleModuleSelect = (moduleId: string) => {
    const selectedModule = availableModules.find(m => m.id === moduleId);
    if (selectedModule) {
      setNewSetting({
        ...newSetting,
        featureId: selectedModule.id,
        featureName: selectedModule.name,
      });
    }
  };

  useEffect(() => {
    async function fetchSettings() {
      setLoading(true);
      try {
        const response = await fetch("/api/admin/credit-settings");
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Erro ao buscar configurações");
        }

        setSettings(data.settings || []);
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Erro ao carregar configurações de créditos"
        );
      } finally {
        setLoading(false);
      }
    }

    async function fetchUsageStats() {
      setUsageLoading(true);
      try {
        const response = await fetch("/api/admin/credit-usage");
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Erro ao buscar estatísticas de uso");
        }

        setUsageStats(data.usageStats || []);
        setTotalUsage(data.totalUsage || 0);
      } catch (error) {
        console.error("Erro ao carregar estatísticas de uso:", error);
      } finally {
        setUsageLoading(false);
      }
    }

    if (!authLoading) {
      fetchSettings();
      fetchUsageStats();
    }
  }, [authLoading]);

  const handleAddSetting = async () => {
    if (!newSetting.featureId || !newSetting.featureName || typeof newSetting.creditCost !== 'number' || newSetting.creditCost < 0) {
      setError("Preencha todos os campos obrigatórios corretamente");
      return;
    }

    // Verificar se a funcionalidade já existe
    if (settings.some(s => s.featureId === newSetting.featureId)) {
      setError("Esta funcionalidade já possui uma configuração de créditos");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/credit-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSetting),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Erro ao adicionar configuração");
      }

      setSettings([...settings, data.setting]);
      setNewSetting({
        featureId: "",
        featureName: "",
        description: "",
        creditCost: 1,
        active: true,
      });
      setMessage("Configuração adicionada com sucesso!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Erro ao adicionar configuração:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Erro ao adicionar configuração"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (settingId: string) => {
    const setting = settings.find((s) => s._id === settingId);
    if (!setting) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/credit-settings/${settingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ active: !setting.active }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Erro ao atualizar configuração");
      }

      setSettings(
        settings.map((s) =>
          s._id === settingId ? { ...s, active: !s.active } : s
        )
      );
      setMessage("Configuração atualizada com sucesso!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Erro ao atualizar configuração:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Erro ao atualizar configuração"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSetting = async (settingId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta configuração?")) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/credit-settings/${settingId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Erro ao excluir configuração");
      }

      setSettings(settings.filter((s) => s._id !== settingId));
      setMessage("Configuração excluída com sucesso!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Erro ao excluir configuração:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Erro ao excluir configuração"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSetting = async (settingId: string) => {
    const setting = settings.find((s) => s._id === settingId);
    if (!setting) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/credit-settings/${settingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          featureName: setting.featureName,
          description: setting.description,
          creditCost: setting.creditCost,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Erro ao atualizar configuração");
      }

      setMessage("Configuração atualizada com sucesso!");
      setTimeout(() => setMessage(""), 3000);
      setEditing(null);
    } catch (error) {
      console.error("Erro ao atualizar configuração:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Erro ao atualizar configuração"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEditChange = (
    settingId: string,
    field: keyof CreditSetting,
    value: string | number | boolean
  ) => {
    setSettings(
      settings.map((s) =>
        s._id === settingId ? { ...s, [field]: value } : s
      )
    );
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

  if (loading && activeTab === 'settings') {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Configurações de Créditos</h1>
          <p className="text-muted-foreground">
            Gerencie os custos de créditos para cada funcionalidade
          </p>
        </div>
        <div>
          <Link 
            href="/dashboard/admin/plans" 
            className="inline-flex items-center py-2 px-4 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            <Settings className="h-4 w-4 mr-2" />
            Gerenciar Planos
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

      <div className="flex border-b mb-6">
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'settings'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings className="h-4 w-4 inline-block mr-2" />
          Configurações
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'usage'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('usage')}
        >
          <BarChart className="h-4 w-4 inline-block mr-2" />
          Consumo de Créditos
        </button>
      </div>

      {activeTab === 'settings' ? (
        <>
          <div className="bg-card rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              Adicionar Nova Configuração
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label
                  htmlFor="featureId"
                  className="block text-sm font-medium mb-1"
                >
                  Funcionalidade*
                </label>
                <div className="relative">
                  <select
                    id="featureId"
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                    value={newSetting.featureId}
                    onChange={(e) => handleModuleSelect(e.target.value)}
                  >
                    <option value="">Selecione uma funcionalidade</option>
                    {availableModules.map((module) => (
                      <option 
                        key={module.id} 
                        value={module.id}
                        disabled={settings.some(s => s.featureId === module.id)}
                      >
                        {module.name} {settings.some(s => s.featureId === module.id) ? '(já configurado)' : ''}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <label
                  htmlFor="creditCost"
                  className="block text-sm font-medium mb-1"
                >
                  Custo em Créditos*
                </label>
                <input
                  type="number"
                  id="creditCost"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
                  min="0"
                  step="1"
                  value={newSetting.creditCost}
                  onChange={(e) =>
                    setNewSetting({
                      ...newSetting,
                      creditCost: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="mb-4">
              <label
                htmlFor="description"
                className="block text-sm font-medium mb-1"
              >
                Descrição
              </label>
              <textarea
                id="description"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
                rows={2}
                placeholder="Descrição da funcionalidade"
                value={newSetting.description}
                onChange={(e) =>
                  setNewSetting({ ...newSetting, description: e.target.value })
                }
              />
            </div>
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="active"
                className="rounded text-primary focus:ring-primary"
                checked={newSetting.active}
                onChange={(e) =>
                  setNewSetting({ ...newSetting, active: e.target.checked })
                }
              />
              <label htmlFor="active" className="ml-2 text-sm">
                Ativo
              </label>
            </div>
            <button
              className="flex items-center justify-center bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded"
              onClick={handleAddSetting}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Adicionar
            </button>
          </div>

          <h2 className="text-xl font-semibold mb-4">
            Configurações de Créditos Atuais
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-3 border">Funcionalidade</th>
                  <th className="text-left p-3 border">Descrição</th>
                  <th className="text-center p-3 border">Custo</th>
                  <th className="text-center p-3 border">Status</th>
                  <th className="text-center p-3 border">Ações</th>
                </tr>
              </thead>
              <tbody>
                {settings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-4 border">
                      Nenhuma configuração encontrada
                    </td>
                  </tr>
                ) : (
                  settings.map((setting) => (
                    <tr key={setting._id} className="hover:bg-muted/50">
                      <td className="p-3 border">
                        {editing === setting._id ? (
                          <input
                            type="text"
                            className="w-full p-1 border rounded"
                            value={setting.featureName}
                            onChange={(e) =>
                              handleEditChange(
                                setting._id!,
                                "featureName",
                                e.target.value
                              )
                            }
                          />
                        ) : (
                          <div className="flex items-center">
                            <span className="font-medium">{setting.featureName}</span>
                            <span className="text-xs text-muted-foreground ml-2">({setting.featureId})</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3 border">
                        {editing === setting._id ? (
                          <textarea
                            className="w-full p-1 border rounded"
                            rows={2}
                            value={setting.description}
                            onChange={(e) =>
                              handleEditChange(
                                setting._id!,
                                "description",
                                e.target.value
                              )
                            }
                          />
                        ) : (
                          setting.description
                        )}
                      </td>
                      <td className="p-3 border text-center">
                        {editing === setting._id ? (
                          <input
                            type="number"
                            className="w-20 p-1 border rounded mx-auto text-center"
                            min="0"
                            step="1"
                            value={setting.creditCost}
                            onChange={(e) =>
                              handleEditChange(
                                setting._id!,
                                "creditCost",
                                parseInt(e.target.value)
                              )
                            }
                          />
                        ) : (
                          <span className="font-medium">{setting.creditCost}</span>
                        )}
                      </td>
                      <td className="p-3 border text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            setting.active
                              ? "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400"
                          }`}
                        >
                          {setting.active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="p-3 border text-center">
                        <div className="flex items-center justify-center gap-2">
                          {editing === setting._id ? (
                            <button
                              className="text-blue-600 hover:text-blue-800"
                              onClick={() => handleUpdateSetting(setting._id!)}
                              disabled={saving}
                            >
                              <Save className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              className="text-blue-600 hover:text-blue-800"
                              onClick={() => setEditing(setting._id!)}
                            >
                              Editar
                            </button>
                          )}
                          <button
                            className="text-amber-600 hover:text-amber-800"
                            onClick={() => handleToggleActive(setting._id!)}
                            disabled={saving}
                          >
                            {setting.active ? "Desativar" : "Ativar"}
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800"
                            onClick={() => handleDeleteSetting(setting._id!)}
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
        </>
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Consumo de Créditos por Funcionalidade
          </h2>
          
          {usageLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : usageStats.length === 0 ? (
            <div className="bg-muted/50 rounded-lg p-8 text-center">
              <p className="text-lg text-muted-foreground">
                Nenhum dado de consumo disponível ainda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-lg shadow p-6">
                <h3 className="text-lg font-medium mb-4">
                  Estatísticas de Consumo
                </h3>
                <div className="space-y-4">
                  {usageStats.map((stat) => (
                    <div key={stat.featureId}>
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{stat.featureName}</span>
                        <span className="text-muted-foreground">
                          {stat.totalUsage} créditos ({Math.round(stat.percentageOfTotal)}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${stat.percentageOfTotal}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between">
                    <span className="font-medium">Total de consumo:</span>
                    <span className="font-bold">
                      {totalUsage.toLocaleString()} créditos
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-card rounded-lg shadow p-6">
                <h3 className="text-lg font-medium mb-4">
                  Detalhamento por Funcionalidade
                </h3>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Funcionalidade</th>
                      <th className="text-right py-2">Consumo</th>
                      <th className="text-right py-2">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageStats.map((stat) => (
                      <tr key={stat.featureId} className="border-b">
                        <td className="py-2">{stat.featureName}</td>
                        <td className="text-right py-2">{stat.totalUsage.toLocaleString()}</td>
                        <td className="text-right py-2">{stat.percentageOfTotal.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 