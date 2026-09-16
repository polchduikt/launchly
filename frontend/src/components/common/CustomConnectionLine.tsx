import React from 'react';
import { getBezierPath, getSmoothStepPath } from '@xyflow/react';
import type { ConnectionLineComponentProps } from '@xyflow/react';

interface CustomConnectionLineProps extends ConnectionLineComponentProps {
  strokeColor?: string;
  strokeWidth?: number;
}

export const CustomConnectionLine: React.FC<CustomConnectionLineProps> = ({
  fromX,
  fromY,
  toX,
  toY,
  fromPosition,
  toPosition,
  connectionLineStyle,
  connectionLineType,
  strokeColor,
  strokeWidth,
}) => {
  const edgePath = connectionLineType === 'smoothstep'
    ? getSmoothStepPath({
        sourceX: fromX,
        sourceY: fromY,
        sourcePosition: fromPosition,
        targetX: toX,
        targetY: toY,
        targetPosition: toPosition,
      })[0]
    : getBezierPath({
        sourceX: fromX,
        sourceY: fromY,
        sourcePosition: fromPosition,
        targetX: toX,
        targetY: toY,
        targetPosition: toPosition,
      })[0];

  const finalStroke = strokeColor
    ?? (connectionLineStyle?.stroke as string)
    ?? '#64748b';
  const finalWidth = strokeWidth
    ?? (connectionLineStyle?.strokeWidth as number)
    ?? 2.4;

  return (
    <g>
      <path
        fill="none"
        stroke={finalStroke}
        strokeWidth={finalWidth}
        d={edgePath}
        style={{
          ...connectionLineStyle,
          stroke: finalStroke,
          strokeWidth: finalWidth,
          markerEnd: 'url(#arrow-grey)',
        }}
      />
    </g>
  );
};
