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
