import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { ShoppingCart } from 'lucide-react';
import type { OrderNodeProps } from '../../../../types/bot';

export const OrderNode: React.FC<OrderNodeProps> = ({ selected, data = {} }) => {
  const productName = data?.productName || 'Product';
  const price = data?.price || '0';
  const currency = data?.currency || 'UAH';

  return (
    <div
      className={`w-64 bg-white border-2 rounded-2xl p-4 shadow-sm transition-all ${
        selected ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-slate-400 border-2 border-white"
      />

      <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
        <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <ShoppingCart size={16} />
        </span>
        <div>
          <span className="font-bold text-xs text-slate-800 uppercase tracking-wider block">CRM Order</span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Generate Invoice</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 leading-relaxed font-semibold">
          <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-wider mb-1">
            <span>Product</span>
          </div>
          <div className="text-slate-900 font-bold truncate mb-2">{productName}</div>

          <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-wider mb-1">
            <span>Price</span>
          </div>
          <div className="text-emerald-600 font-extrabold text-base">
            {price} {currency}
          </div>
        </div>
      </div>

      <div className="flex justify-end items-center mt-3 pt-2 border-t border-slate-100">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mr-2">Next Step</span>
        <Handle
          type="source"
          position={Position.Right}
          id="next"
          className="w-3 h-3 bg-slate-400 border-2 border-white hover:scale-125 transition-transform"
        />
      </div>
    </div>
  );
};
