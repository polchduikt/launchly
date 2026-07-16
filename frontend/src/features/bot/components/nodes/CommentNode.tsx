import React, { useState, useEffect } from 'react';
import type { NodeProps, Node } from '@xyflow/react';
import { useConnection } from '@xyflow/react';
import type { CustomNodeData } from '../../../../types/bot';
import { useNodeHover } from '../../hooks/useNodeHover';
import { NodeToolbar } from './NodeToolbar';
import { t } from '../../../../i18n';

export const CommentNode: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected, data = {} }) => {
  const { showToolbar, bindHover } = useNodeHover();
  const [isHighlighted, setIsHighlighted] = useState(false);
  const connection = useConnection();
  const isConnecting = connection.inProgress;

  useEffect(() => {
    const handleHoverEdge = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const { source, target } = customEvent.detail;
        setIsHighlighted(source === id || target === id);
      } else {
        setIsHighlighted(false);
      }
    };
    window.addEventListener('flow-hover-edge', handleHoverEdge);
    return () => {
      window.removeEventListener('flow-hover-edge', handleHoverEdge);
    };
  }, [id]);

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
          : isHighlighted
            ? 'border-indigo-400 ring-2 ring-indigo-50/60'
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
