import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classes usando clsx e tailwind-merge para criar strings de classes CSS
 * que funcionam corretamente com o Tailwind CSS
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formata um valor em dinheiro para o formato brasileiro
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Método para formatar uma data para o formato brasileiro
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

/**
 * Função para limitar o tamanho de um texto e adicionar "..." ao final
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * Gera um ID aleatório para uso em componentes ou itens que precisam
 * de um identificador único
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
} 