import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeHandleProps } from '../../../../../types/bot';

export const NodeHandle: React.FC<NodeHandleProps> = ({
  type,
  position,
  id,
  isConnected = false,
  className = '',
  padded = false,
  style: passedStyle,
}) => {
  const isTarget = type === 'target';

  const style: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    width: '10px',
    height: '10px',
  };

  if (position === Position.Left) {
    style.left = isTarget ? '2px' : (padded ? '-18px' : '-2px');
    style.transform = 'translateY(-50%)';
  } else if (position === Position.Right) {
    style.right = padded ? '-21px' : '-5px';
    style.transform = 'translateY(-50%)';
  }

  const hasBgOverride = className.includes('!bg-') || !!(passedStyle && passedStyle.backgroundColor);
  const hasBorderOverride = className.includes('!border-') || !!(passedStyle && passedStyle.borderColor);

  const statusClass = isConnected
    ? `${hasBgOverride ? '' : 'handle-connected'} ${hasBorderOverride ? '' : 'border-[#7b8794]'}`
    : `${hasBgOverride ? '' : 'handle-unconnected'} ${hasBorderOverride ? '' : 'border-slate-300'}`;

  return (
    <Handle
      type={type}
      position={position}
      id={id}
      style={{ ...style, ...passedStyle }}
      className={`!rounded-full !border-[1.5px] !transition-all ${
        isTarget
          ? '!z-0 !opacity-0 !bg-transparent !border-transparent'
          : `!z-20 ${statusClass}`
      } ${className}`}
    />
  );
};
