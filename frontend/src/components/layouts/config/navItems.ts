import { Home, BarChart2, Zap, MessageSquare, Users, Sparkles, Send, Settings, BookOpen } from 'lucide-react';
import { ROUTES } from '../../../constants/routes';

export interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number }>;
  disabled?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', path: ROUTES.HOME, icon: Home },
  { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: BarChart2 },
  { label: 'Automation', path: ROUTES.AUTOMATIONS, icon: Zap },
  { label: 'Chat', path: ROUTES.CHAT, icon: MessageSquare },
  { label: 'Contacts', path: ROUTES.CONTACTS, icon: Users },
  { label: 'AI Assistant', path: ROUTES.AI, icon: Sparkles },
  { label: 'Broadcasts', path: ROUTES.BROADCASTS, icon: Send },
  { label: 'Settings', path: ROUTES.SETTINGS, icon: Settings },
];
