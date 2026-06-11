import { Sparkles, Calendar, ArrowUpRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface DashboardTemplate {
  id: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  iconBgClass: string;
  iconTextClass: string;
  hoverTextClass: string;
  type: string;
}

export const START_HERE_TEMPLATES: DashboardTemplate[] = [
  {
    id: 'lead_magnet',
    icon: Sparkles,
    title: 'Capture customer data with a lead magnet',
    desc: 'Use a lead magnet to capture qualified emails and profile details automatically.',
    iconBgClass: 'bg-indigo-50 border-indigo-100',
    iconTextClass: 'text-indigo-600',
    hoverTextClass: 'group-hover:text-indigo-600',
    type: 'Flow Builder',
  },
  {
    id: 'reminders',
    icon: Calendar,
    title: 'Send event reminders',
    desc: 'Send scheduled reminders and confirmations to save time and increase attendance.',
    iconBgClass: 'bg-rose-50 border-rose-100',
    iconTextClass: 'text-rose-500',
    hoverTextClass: 'group-hover:text-rose-650',
    type: 'Flow Builder',
  },
  {
    id: 'redirect',
    icon: ArrowUpRight,
    title: 'Redirect customers to your website',
    desc: 'Direct users to specific web URLs and pages in response to common keyword queries.',
    iconBgClass: 'bg-sky-50 border-sky-100',
    iconTextClass: 'text-sky-500',
    hoverTextClass: 'group-hover:text-sky-600',
    type: 'Flow Builder',
  },
];

export const GROWTH_GOAL_TEMPLATES: DashboardTemplate[] = [
  {
    id: 'ai_support',
    icon: Sparkles,
    title: 'Automate conversations with AI',
    desc: "Get AI to collect your follower's info, share details, or tell it how to reply.",
    iconBgClass: 'bg-emerald-50 border-emerald-100',
    iconTextClass: 'text-emerald-600',
    hoverTextClass: 'group-hover:text-emerald-600',
    type: 'Flow Builder',
  },
];
