import {
  MessageSquare,
  GitFork,
  Sliders,
  Code,
  Clock,
  Shuffle,
  StickyNote,
  Power
} from 'lucide-react';

export const STEP_OPTIONS = [
  {
    type: 'MESSAGE',
    label: 'Telegram',
    description: 'Send text, images, files, audio or video',
    icon: MessageSquare,
    color: 'text-sky-500 bg-sky-50 border-sky-100',
  },
  {
    type: 'CONDITION',
    label: 'Condition Rule',
    description: 'Filter flows using conditional rules',
    icon: GitFork,
    color: 'text-purple-600 bg-purple-50 border-purple-100',
  },
  {
    type: 'ACTION',
    label: 'Actions',
    description: 'Perform tag actions, custom fields and Google Sheets operations',
    icon: Sliders,
    color: 'text-amber-600 bg-amber-50 border-amber-100',
  },
  {
    type: 'API_CALL',
    label: 'API Integration',
    description: 'Execute external JSON webhook API requests',
    icon: Code,
    color: 'text-indigo-500 bg-indigo-50 border-indigo-100',
  },
  {
    type: 'SMART_DELAY',
    label: 'Smart Delay',
    description: 'Pause automation flow for a duration or date',
    icon: Clock,
    color: 'text-rose-500 bg-rose-50 border-rose-100',
  },
  {
    type: 'RANDOMIZER',
    label: 'Randomizer',
    description: 'Split traffic randomly into multiple paths',
    icon: Shuffle,
    color: 'text-purple-650 bg-purple-50 border-purple-100',
  },
  {
    type: 'COMMENT',
    label: 'Comment',
    description: 'Add a static text note on the canvas',
    icon: StickyNote,
    color: 'text-amber-500 bg-amber-50 border-amber-100',
  },
  {
    type: 'END',
    label: 'End Session',
    description: 'Terminate active user session/flow sequence',
    icon: Power,
    color: 'text-slate-500 bg-slate-50 border-slate-100',
  },
];
