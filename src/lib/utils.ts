import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Standard skill-proficiency tiers.
 *
 * The public site filters by percentage ranges, so storing `level` as a free-
 * text string lets the two drift apart. This single source of truth maps any
 * percentage to its canonical level, keeping the admin form and the portfolio
 * display permanently consistent.
 */
export const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export function getSkillLevelFromPercentage(percentage: number | undefined | null): SkillLevel {
  const p = Math.min(100, Math.max(0, Number(percentage) || 0));
  if (p >= 90) return 'Expert';
  if (p >= 80) return 'Advanced';
  if (p >= 50) return 'Intermediate';
  return 'Beginner';
}

