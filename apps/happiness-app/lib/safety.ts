// lib/safety.ts
import { RiskLevel } from '../constants/safety';

const HIGH_RISK_TERMS = [
  'suicide','kill myself','end my life','end it all',
  'self-harm','cut myself','overdose','hang myself'
];

export function assessRisk(text: string): { level: RiskLevel; reasons: string[] } {
  const t = (text || '').toLowerCase();
  const hits = HIGH_RISK_TERMS.filter(term => t.includes(term));
  if (hits.length > 0) return { level: 'high', reasons: hits };
  // simple heuristic; you can expand later
  return { level: 'low', reasons: [] };
}
