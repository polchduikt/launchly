import { t } from '../i18n/config';

export interface SelectionOption {
  value: string;
  label: string;
}

export const CONDITION_OPERATORS = [
  { value: 'is', get label() { return t('operator.is'); } },
  { value: 'isn_t', get label() { return t('operator.isn_t'); } },
  { value: 'has_any_value', get label() { return t('operator.has_any_value'); } },
  { value: 'contains', get label() { return t('operator.contains'); } },
  { value: 'doesn_t_contain', get label() { return t('operator.doesn_t_contain'); } },
  { value: 'begins_with', get label() { return t('operator.begins_with'); } },
  { value: 'is_unknown', get label() { return t('operator.is_unknown'); } },
];

export const ORDER_CURRENCIES: SelectionOption[] = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'UAH', label: 'UAH (₴)' },
];

export const API_METHODS: SelectionOption[] = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'DELETE', label: 'DELETE' },
];

export const API_METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  POST: 'bg-blue-50 text-blue-500 border-blue-100',
  PUT: 'bg-amber-50 text-amber-600 border-amber-100',
  DELETE: 'bg-rose-50 text-rose-500 border-rose-100',
};

export const getOperatorLabel = (op: string): string => {
  switch (op.toLowerCase()) {
    case 'is':
    case 'equals':
      return t('operator.is');
    case 'isn_t':
    case 'not_equals':
      return t('operator.isn_t');
    case 'has_any_value':
    case 'not_empty':
      return t('operator.has_any_value');
    case 'contains':
      return t('operator.contains');
    case 'doesn_t_contain':
      return t('operator.doesn_t_contain');
    case 'begins_with':
      return t('operator.begins_with');
    case 'is_unknown':
    case 'empty':
      return t('operator.is_unknown');
    default:
      return op;
  }
};
