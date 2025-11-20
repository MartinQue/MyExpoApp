// constants/safety.ts
export const DISCLAIMER = `Happiness is not a substitute for professional care. 
If you're in immediate danger, call emergency services. 
If you're struggling, consider contacting the resources below.`;

export type RiskLevel = 'low' | 'medium' | 'high';

export const CRISIS_RESOURCES = {
  UK: [
    { name: 'Samaritans', contact: '116 123', url: 'https://www.samaritans.org' },
    { name: 'Shout (text)', contact: '85258', url: 'https://giveusashout.org' },
    { name: 'NHS 111 (non-emergency)', contact: '111', url: 'https://111.nhs.uk' },
    { name: 'Emergency', contact: '999', url: '' },
  ],
} as const;

export const DEFAULT_REGION = 'UK';
