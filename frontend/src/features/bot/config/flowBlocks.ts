export interface FlowBlockConfig {
  type: string;
  label: string;
  color: string;
}

export const FLOW_BLOCKS: FlowBlockConfig[] = [
  { type: 'MESSAGE', label: 'Send Message', color: 'text-sky-500 bg-sky-50' },
  { type: 'INPUT', label: 'Input Prompt', color: 'text-amber-500 bg-amber-50' },
  { type: 'CONDITION', label: 'Condition Rule', color: 'text-purple-700 bg-purple-50' },
  { type: 'ACTION', label: 'Actions', color: 'text-amber-600 bg-amber-50' },
  { type: 'ORDER', label: 'Create Order', color: 'text-emerald-500 bg-emerald-50' },

  { type: 'API_CALL', label: 'API Integration', color: 'text-indigo-500 bg-indigo-50' },
  { type: 'SMART_DELAY', label: 'Smart Delay', color: 'text-rose-500 bg-rose-50' },
  { type: 'RANDOMIZER', label: 'Randomizer', color: 'text-purple-600 bg-purple-50' },
  { type: 'COMMENT', label: 'Comment', color: 'text-amber-500 bg-amber-50' },
  { type: 'END', label: 'End Session', color: 'text-slate-500 bg-slate-50' },
];

export const createDefaultNodeData = (type: string): Record<string, unknown> => {
  switch (type) {
    case 'MESSAGE':
      return { text: 'Hello! Enter your text here.', buttons: [] };
    case 'INPUT':
      return { text: 'Please enter a value:', variableName: 'input_var' };
    case 'CONDITION':
      return {
        branches: [
          {
            id: 'branch_0',
            matchType: 'all',
            conditions: []
          }
        ]
      };
    case 'ACTION':
      return { actions: [] };
    case 'ORDER':
      return { productName: 'Product Name', price: '100', currency: 'UAH' };
    case 'LEAD':
      return { name: 'user_name', email: 'user_email', phone: 'user_phone' };
    case 'API_CALL':
      return { url: 'https://api.example.com/endpoint', method: 'GET' };
    case 'SMART_DELAY':
      return {
        mode: 'duration',
        waitAmount: 12,
        waitUnit: 'Hours',
        sendWithinSpecificHours: false,
        dateTime: ''
      };
    case 'RANDOMIZER':
      return {
        pickEveryTime: false,
        variations: [
          { id: 'variation_0', label: 'A', percentage: 50, color: '#7C3AED' },
          { id: 'variation_1', label: 'B', percentage: 50, color: '#B45309' }
        ]
      };
    case 'COMMENT':
      return {
        text: 'Write a comment...',
        noteSize: 'M',
        fontSize: 'S'
      };
    default:
      return {};
  }
};

