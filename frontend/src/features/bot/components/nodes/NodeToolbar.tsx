import React from 'react';
import { Copy, Trash2 } from 'lucide-react';

interface NodeToolbarProps {
  nodeId: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const NodeToolbar: React.FC<NodeToolbarProps> = ({ nodeId, onMouseEnter, onMouseLeave }) => {
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="absolute top-[-44px] left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-2xl shadow-lg animate-in fade-in slide-in-from-bottom-1 duration-150"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent('flow-copy-node', { detail: { nodeId } }));
        }}
        className="p-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer flex items-center justify-center"
        title="Copy Block"
      >
        <Copy size={16} />
      </button>
      <div className="w-[1px] h-4 bg-slate-200" />
      <button
        onClick={(e) => {
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent('flow-delete-node', { detail: { nodeId } }));
        }}
        className="p-1 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer flex items-center justify-center"
        title="Delete Block"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};
export default NodeToolbar;
