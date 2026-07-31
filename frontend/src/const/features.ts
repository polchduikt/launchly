import { Bot, Users, Cpu, Send } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface LandingFeature {
  icon: LucideIcon;
  title: string;
  desc: string;
  color: string;
}

export const LANDING_FEATURES: LandingFeature[] = [
  {
    icon: Bot,
    title: 'Visual Flow Builder',
    desc: 'Design advanced conversational flows visually. No coding required.',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  },
  {
    icon: Cpu,
    title: 'AI-Powered Responses',
    desc: 'Train your bot with custom instructions to answer complex queries automatically.',
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  },
  {
    icon: Users,
    title: 'Built-in CRM',
    desc: 'Segment contacts, assign custom tags, and view conversations in real-time.',
    color: 'bg-sky-50 text-sky-500 border-sky-100',
  },
  {
    icon: Send,
    title: 'Broadcast Campaigns',
    desc: 'Send targeted broadcast messages to specific segments instantly.',
    color: 'bg-rose-50 text-rose-500 border-rose-100',
  },
];
