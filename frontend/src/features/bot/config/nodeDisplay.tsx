import React from 'react';
import {
  Sparkles,
  MessageSquare,
  Filter,
  Globe,
  Grid,
  Sliders,
  Clock,
  Shuffle,
  StickyNote,
  SquareArrowRight,
} from 'lucide-react';

export const NODE_TITLES: Record<string, string> = {
  START: 'Trigger Settings',
  MESSAGE: 'Send Message',
  CONDITION: 'Condition Rule',
  API_CALL: 'API Integration',
  ACTION: 'Actions',
  END: 'End Session',
  SMART_DELAY: 'Smart Delay',
  RANDOMIZER: 'Randomizer',
  START_AUTOMATION: 'Start Automation',
  COMMENT: 'Comment',
};

export const NODE_ICONS: Record<string, React.ReactNode> = {
  START: <Sparkles size={16} className="text-indigo-600 animate-pulse" />,
  MESSAGE: <MessageSquare size={16} className="text-sky-500" />,
  CONDITION: <Filter size={16} className="text-purple-600" />,
  API_CALL: <Globe size={16} className="text-indigo-500" />,
  ACTION: <Sliders size={16} className="text-amber-600" />,
  END: <Grid size={16} className="text-slate-500" />,
  SMART_DELAY: <Clock size={16} className="text-rose-400" />,
  RANDOMIZER: <Shuffle size={16} className="text-purple-500" />,
  START_AUTOMATION: <SquareArrowRight size={16} className="text-lime-600" />,
  COMMENT: <StickyNote size={16} className="text-amber-500" />,
};
