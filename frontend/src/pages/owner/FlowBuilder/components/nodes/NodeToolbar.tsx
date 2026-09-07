import React from 'react';
import { Copy, Trash2 } from 'lucide-react';
import { t } from '../../../../../i18n/config';

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
      className="absolute top-[-44px] left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 p-1 bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[2px_2px_0px_#0A0A0A] animate-in fade-in slide-in-from-bottom-1 duration-150"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent('flow-copy-node', { detail: { nodeId } }));
        }}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-colors cursor-pointer"
        title={t('flow_builder.copy_block')}
      >
        <Copy size={14} />
      </button>
      <div className="w-[1.5px] h-4 bg-[#0A0A0A]/20" />
      <button
        onClick={(e) => {
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent('flow-delete-node', { detail: { nodeId } }));
        }}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-rose-600 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
        title={t('flow_builder.delete_block')}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
};
export default NodeToolbar;
