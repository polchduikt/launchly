export interface SelectionOption {
  value: string;
  label: string;
}

export const CONDITION_OPERATORS: SelectionOption[] = [
  { value: 'EQUALS', label: 'Equals' },
  { value: 'NOT_EQUALS', label: 'Not Equals' },
  { value: 'GREATER_THAN', label: 'Greater Than' },
  { value: 'LESS_THAN', label: 'Less Than' },
  { value: 'CONTAINS', label: 'Contains' },
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
    case 'equals':
      return 'equals';
    case 'not_equals':
      return 'does not equal';
    case 'contains':
      return 'contains';
    case 'not_empty':
      return 'is set';
    case 'empty':
      return 'is not set';
    default:
      return op;
  }
};
