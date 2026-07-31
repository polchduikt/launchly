import { t } from '../i18n/config';
import {
  MessageSquare,
  GitFork,
  Sliders,
  Code,
  Clock,
  Shuffle,
  StickyNote,
  Power,
  SquareArrowRight
} from 'lucide-react';

export const STEP_OPTIONS = [
  {
    type: 'MESSAGE',
    get label() { return t('step_option.MESSAGE.label'); },
    get description() { return t('step_option.MESSAGE.desc'); },
    icon: MessageSquare,
    color: 'text-sky-500 bg-sky-50 border-sky-100',
  },
  {
    type: 'CONDITION',
    get label() { return t('step_option.CONDITION.label'); },
    get description() { return t('step_option.CONDITION.desc'); },
    icon: GitFork,
    color: 'text-purple-600 bg-purple-50 border-purple-100',
  },
  {
    type: 'ACTION',
    get label() { return t('step_option.ACTION.label'); },
    get description() { return t('step_option.ACTION.desc'); },
    icon: Sliders,
    color: 'text-amber-600 bg-amber-50 border-amber-100',
  },
  {
    type: 'API_CALL',
    get label() { return t('step_option.API_CALL.label'); },
    get description() { return t('step_option.API_CALL.desc'); },
    icon: Code,
    color: 'text-indigo-500 bg-indigo-50 border-indigo-100',
  },
  {
    type: 'SMART_DELAY',
    get label() { return t('step_option.SMART_DELAY.label'); },
    get description() { return t('step_option.SMART_DELAY.desc'); },
    icon: Clock,
    color: 'text-rose-500 bg-rose-50 border-rose-100',
  },
  {
    type: 'RANDOMIZER',
    get label() { return t('step_option.RANDOMIZER.label'); },
    get description() { return t('step_option.RANDOMIZER.desc'); },
    icon: Shuffle,
    color: 'text-purple-650 bg-purple-50 border-purple-100',
  },
  {
    type: 'START_AUTOMATION',
    get label() { return t('step_option.START_AUTOMATION.label'); },
    get description() { return t('step_option.START_AUTOMATION.desc'); },
    icon: SquareArrowRight,
    color: 'text-lime-600 bg-lime-50 border-lime-100',
  },
  {
    type: 'COMMENT',
    get label() { return t('step_option.COMMENT.label'); },
    get description() { return t('step_option.COMMENT.desc'); },
    icon: StickyNote,
    color: 'text-amber-500 bg-amber-50 border-amber-100',
  },
  {
    type: 'END',
    get label() { return t('step_option.END.label'); },
    get description() { return t('step_option.END.desc'); },
    icon: Power,
    color: 'text-slate-500 bg-slate-50 border-slate-100',
  },
];
