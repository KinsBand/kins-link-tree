import type { PlatformItem, PlatformCategory } from '../../settings/platformsData';

/**
 * Converts numbers into rounded whole-number notations with a trailing '+':
 * - 1,250 -> 1K+
 * - 28,400 -> 28K+
 * - 88,000 -> 88K+
 * - 1,200,000 -> 1M+
 * - 850 -> 850+
 */
export function formatCount(num: number): string {
  if (!num || isNaN(num) || num <= 0) return '0+';
  
  if (num >= 1_000_000) {
    const rounded = Math.round(num / 1_000_000);
    return `${rounded}M+`;
  }
  
  if (num >= 1_000) {
    const rounded = Math.round(num / 1_000);
    return `${rounded}K+`;
  }

  return `${Math.round(num)}+`;
}

export interface PlatformMetricsSummary {
  totalGlobalCount: number;
  formattedGlobalCount: string;
  categoryCounts: Record<PlatformCategory, number>;
  formattedCategoryCounts: Record<PlatformCategory, string>;
}

/**
 * Computes global total and sub-totals grouped by platform categories.
 */
export function computePlatformMetrics(items: PlatformItem[]): PlatformMetricsSummary {
  const categoryCounts: Record<PlatformCategory, number> = {
    streams: 0,
    socials: 0,
    community: 0
  };

  let totalGlobalCount = 0;

  for (const item of items) {
    const count = typeof item.count === 'number' ? item.count : 0;
    if (categoryCounts.hasOwnProperty(item.category)) {
      categoryCounts[item.category] += count;
    }
    totalGlobalCount += count;
  }

  return {
    totalGlobalCount,
    formattedGlobalCount: formatCount(totalGlobalCount),
    categoryCounts,
    formattedCategoryCounts: {
      streams: formatCount(categoryCounts.streams),
      socials: formatCount(categoryCounts.socials),
      community: formatCount(categoryCounts.community)
    }
  };
}
