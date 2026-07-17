import React from 'react';
import type { NodeProps, Node } from '@xyflow/react';
import { useConnection } from '@xyflow/react';
import type { CustomNodeData } from '../../../../types/bot';
import { useNodeHover } from '../../hooks/useNodeHover';
import { NodeToolbar } from './NodeToolbar';
import { t } from '../../../../i18n';

const CommentNodeInner: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected, data = {} }) => {
  const { showToolbar, bindHover } = useNodeHover();
  const connection = useConnection();
  const isConnecting = connection.inProgress;

  const noteSize = data.noteSize || 'M';
  const fontSize = data.fontSize || 'S';

  const getSizeClasses = () => {
    switch (noteSize) {
      case 'S':
        return 'w-56 min-h-16';
      case 'L':
        return 'w-96 min-h-28';
      case 'M':
      default:
        return 'w-72 min-h-20';
    }
  };

  const getFontSizeClasses = () => {
    switch (fontSize) {
      case 'L':
        return 'text-base';
      case 'S':
      default:
        return 'text-xs';
    }
  };

  const text = data.text || t('node.comment.placeholder');

  return (
    <div
      {...bindHover}
      className={`bg-[#FFFCEB]/85 backdrop-blur-[2px] border-2 rounded-3xl p-4 shadow-md transition-all relative overflow-visible isolate ${getSizeClasses()} ${
        selected
          ? 'border-emerald-500 ring-4 ring-emerald-100'
          : 'border-slate-200 hover:border-slate-355'
      } ${isConnecting ? 'opacity-40 grayscale pointer-events-none' : ''}`}
    >

      {showToolbar && <NodeToolbar nodeId={id} />}
      <div className={`text-slate-700 whitespace-pre-wrap leading-relaxed select-none font-medium ${getFontSizeClasses()}`}>
        {text}
      </div>
    </div>
  );
};
CommentNodeInner.displayName = 'CommentNode';
export const CommentNode = React.memo(CommentNodeInner);
