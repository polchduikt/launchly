import React from 'react';
import { Home, Zap, Users, Send, Settings } from 'lucide-react';
import { ROUTES } from '../../../constants/routes';

export interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number }>;
  disabled?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', path: ROUTES.HOME, icon: Home },
  { label: 'Automation', path: ROUTES.AUTOMATIONS, icon: Zap },
  { label: 'CRM', path: ROUTES.CRM, icon: Users },
  { label: 'Broadcasts', path: ROUTES.BROADCASTS, icon: Send },
  { label: 'Settings', path: ROUTES.SETTINGS, icon: Settings },
];
