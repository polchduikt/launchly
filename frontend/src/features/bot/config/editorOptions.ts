export interface SelectionOption {
  value: string;
  label: string;
}

export const CONDITION_OPERATORS: SelectionOption[] = [
  { value: 'is', label: 'is' },
  { value: 'isn_t', label: "isn't" },
  { value: 'has_any_value', label: 'has any value' },
  { value: 'contains', label: 'contains' },
  { value: 'doesn_t_contain', label: "doesn't contain" },
  { value: 'begins_with', label: 'begins with' },
  { value: 'is_unknown', label: 'is unknown' },
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
      return 'is';
    case 'isn_t':
    case 'not_equals':
      return "isn't";
    case 'has_any_value':
    case 'not_empty':
      return 'has any value';
    case 'contains':
      return 'contains';
    case 'doesn_t_contain':
      return "doesn't contain";
    case 'begins_with':
      return 'begins with';
    case 'is_unknown':
    case 'empty':
      return 'is unknown';
    default:
      return op;
  }
};
