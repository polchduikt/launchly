import React from 'react';
import type { CustomNodeData } from '../../../../../types/bot';
import { ORDER_CURRENCIES } from '../../../config/editorOptions';

interface OrderNodeEditorProps {
  data: CustomNodeData;
  handleChange: (key: string, value: unknown) => void;
}

export const OrderNodeEditor: React.FC<OrderNodeEditorProps> = ({ data, handleChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="prodName" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          Product Name
        </label>
        <input
          id="prodName"
          type="text"
          value={data.productName || ''}
          onChange={(e) => handleChange('productName', e.target.value)}
          placeholder="e.g. Premium Plan"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-semibold transition-all bg-slate-50/20"
        />
      </div>
      <div>
        <label htmlFor="prodPrice" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          Price Amount
        </label>
        <input
          id="prodPrice"
          type="text"
          value={data.price || ''}
          onChange={(e) => handleChange('price', e.target.value)}
          placeholder="e.g. 49.99"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-semibold transition-all bg-slate-50/20"
        />
      </div>
      <div>
        <label htmlFor="prodCurr" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          Currency
        </label>
        <select
          id="prodCurr"
          value={data.currency || 'USD'}
          onChange={(e) => handleChange('currency', e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-bold transition-all bg-white"
        >
          {ORDER_CURRENCIES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
