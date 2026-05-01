import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDaysSinceLastTest(lastTestAt?: string): number {
  if (!lastTestAt) return 999; // Never tested
  const lastTest = new Date(lastTestAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastTest.getTime());
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays;
}

export function getHoursSinceLastTest(lastTestAt?: string): number {
  if (!lastTestAt) return 9999;
  const lastTest = new Date(lastTestAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastTest.getTime());
  return diffTime / (1000 * 60 * 60);
}

export function getRouteStatus(lastTestAt?: string): 'Aprovado' | 'Pendente' {
  const hours = getHoursSinceLastTest(lastTestAt);
  return hours < 48 ? 'Aprovado' : 'Pendente';
}

export function isRoutePending(route: { lastTestAt?: string, isVerified?: boolean }): boolean {
  // A route is pending if it hasn't been tested in more than 48 hours
  const hours = getHoursSinceLastTest(route.lastTestAt);
  return hours >= 48;
}

// ============================================================
// FORMATAÇÃO MONETÁRIA (BRL)
// ============================================================

/**
 * Formata um valor numérico para moeda brasileira.
 * Ex: formatBRL(15000.5) => "R$ 15.000,50"
 */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Formata um valor de forma compacta para dashboards.
 * Ex: formatBRLCompact(1500) => "R$ 1,5k"
 *     formatBRLCompact(1200000) => "R$ 1,2M"
 */
export function formatBRLCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}R$ ${(abs / 1_000_000).toFixed(1).replace('.', ',')}M`;
  if (abs >= 1_000) return `${sign}R$ ${(abs / 1_000).toFixed(1).replace('.', ',')}k`;
  return `${sign}R$ ${abs.toFixed(2).replace('.', ',')}`;
}

// ============================================================
// CÁLCULOS FINANCEIROS
// ============================================================

/**
 * Calcula a margem percentual entre receita e custo.
 * Ex: calculateMargin(1000, 600) => 40 (40% de margem)
 */
export function calculateMargin(revenue: number, cost: number): number {
  if (revenue === 0) return 0;
  return ((revenue - cost) / revenue) * 100;
}

// ============================================================
// FORMATAÇÃO DE TEMPO / DURAÇÃO
// ============================================================

/**
 * Converte segundos para formato legível.
 * Ex: formatDuration(3661) => "1h 1min 1s"
 *     formatDuration(125)  => "2min 5s"
 *     formatDuration(45)   => "45s"
 */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}min`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(' ');
}

/**
 * Converte segundos para formato hh:mm:ss.
 * Ex: formatDurationHMS(3661) => "01:01:01"
 */
export function formatDurationHMS(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}
