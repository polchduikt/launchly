import React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Zap,
  Send,
  Filter,
  Globe,
  Octagon,
  Sliders,
  Clock,
  Shuffle,
  StickyNote,
  SquareArrowRight,
  Terminal,
  Calculator,
  Trophy,
  Hourglass,
} from 'lucide-react';
import { AiIcon } from '../components/ui/AiIcon';

export const NODE_TITLES: Record<string, string> = {
  START: 'Trigger Settings',
  MESSAGE: 'Send Message',
  CONDITION: 'Condition Rule',
  API_CALL: 'API Integration',
  ACTION: 'Actions',
  MATH: 'Calculation',
  LEADERBOARD: 'Leaderboard',
  COOLDOWN: 'Cooldown (Timeout)',
  END: 'End Session',
  SMART_DELAY: 'Smart Delay',
  RANDOMIZER: 'Randomizer',
  START_AUTOMATION: 'Start Automation',
  COMMAND: 'Command Trigger',
  COMMENT: 'Comment',
  AI: 'AI Step',
};

export const NODE_ICON_COMPONENTS: Record<string, LucideIcon | React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  START: Zap,
  MESSAGE: Send,
  CONDITION: Filter,
  API_CALL: Globe,
  ACTION: Sliders,
  MATH: Calculator,
  LEADERBOARD: Trophy,
  COOLDOWN: Hourglass,
  END: Octagon,
  SMART_DELAY: Clock,
  RANDOMIZER: Shuffle,
  START_AUTOMATION: SquareArrowRight,
  COMMAND: Terminal,
  COMMENT: StickyNote,
  AI: AiIcon,
};

export const NODE_ICONS: Record<string, React.ReactNode> = {
  START: <Zap size={16} className="text-emerald-600" />,
  MESSAGE: <Send size={16} className="text-sky-500" />,
  CONDITION: <Filter size={16} className="text-purple-600" />,
  API_CALL: <Globe size={16} className="text-indigo-500" />,
  ACTION: <Sliders size={16} className="text-amber-600" />,
  MATH: <Calculator size={16} className="text-cyan-600" />,
  LEADERBOARD: <Trophy size={16} className="text-fuchsia-600" />,
  COOLDOWN: <Hourglass size={16} className="text-amber-600" />,
  END: <Octagon size={16} className="text-slate-500" />,
  SMART_DELAY: <Clock size={16} className="text-rose-400" />,
  RANDOMIZER: <Shuffle size={16} className="text-purple-500" />,
  START_AUTOMATION: <SquareArrowRight size={16} className="text-lime-600" />,
  COMMAND: <Terminal size={16} className="text-teal-600" />,
  COMMENT: <StickyNote size={16} className="text-amber-500" />,
  AI: <AiIcon size={16} className="text-emerald-600" />,
};

