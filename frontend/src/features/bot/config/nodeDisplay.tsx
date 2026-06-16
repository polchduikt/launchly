import React from 'react';
import {
  Sparkles,
  MessageSquare,
  HelpCircle,
  GitFork,
  ShoppingCart,
  UserCheck,
  Globe,
  Grid,
} from 'lucide-react';

export const NODE_TITLES: Record<string, string> = {
  START: 'Trigger Settings',
  MESSAGE: 'Send Message',
  INPUT: 'Input Prompt',
  CONDITION: 'Condition Rule',
  ORDER: 'Create Order',
  LEAD: 'CRM Lead Capture',
  API_CALL: 'API Integration',
  END: 'End Session',
};

export const NODE_ICONS: Record<string, React.ReactNode> = {
  START: <Sparkles size={16} className="text-indigo-600 animate-pulse" />,
  MESSAGE: <MessageSquare size={16} className="text-sky-500" />,
  INPUT: <HelpCircle size={16} className="text-amber-500" />,
  CONDITION: <GitFork size={16} className="text-purple-600" />,
  ORDER: <ShoppingCart size={16} className="text-emerald-500" />,
  LEAD: <UserCheck size={16} className="text-rose-500" />,
  API_CALL: <Globe size={16} className="text-indigo-500" />,
  END: <Grid size={16} className="text-slate-500" />,
};
