export interface FlowBlockConfig {
  type: string;
  label: string;
  color: string;
}

export const FLOW_BLOCKS: FlowBlockConfig[] = [
  { type: 'MESSAGE', label: 'Send Message', color: 'text-sky-500 bg-sky-50' },
  { type: 'INPUT', label: 'Input Prompt', color: 'text-amber-500 bg-amber-50' },
  { type: 'CONDITION', label: 'Condition Rule', color: 'text-purple-700 bg-purple-50' },
  { type: 'ORDER', label: 'Create Order', color: 'text-emerald-500 bg-emerald-50' },
  { type: 'LEAD', label: 'CRM Lead Capture', color: 'text-sky-500 bg-sky-50' },
  { type: 'API_CALL', label: 'API Integration', color: 'text-indigo-500 bg-indigo-50' },
  { type: 'END', label: 'End Session', color: 'text-slate-500 bg-slate-50' },
];

export const createDefaultNodeData = (type: string): Record<string, unknown> => {
  switch (type) {
    case 'MESSAGE':
      return { text: 'Hello! Enter your text here.', buttons: [] };
    case 'INPUT':
      return { text: 'Please enter a value:', variableName: 'input_var' };
    case 'CONDITION':
      return { variable: 'user_input', operator: 'equals', value: 'Yes' };
    case 'ORDER':
      return { productName: 'Product Name', price: '100', currency: 'UAH' };
    case 'LEAD':
      return { name: 'user_name', email: 'user_email', phone: 'user_phone' };
    case 'API_CALL':
      return { url: 'https://api.example.com/endpoint', method: 'GET' };
    default:
      return {};
  }
};
