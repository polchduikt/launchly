import React, { useState, useRef, useEffect } from 'react';
import { getBezierPath, getSmoothStepPath, EdgeLabelRenderer, useReactFlow, type EdgeProps } from '@xyflow/react';
import { Trash2 } from 'lucide-react';

export const InteractiveEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  type, 
  source,
  target,
}) => {
  const [showDelete, setShowDelete] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const deleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { screenToFlowPosition } = useReactFlow();
  const [deletePos, setDeletePos] = useState<{ x: number; y: number } | null>(null);

  const handleMouseEnter = (event: React.MouseEvent) => {
    if (deleteTimeoutRef.current) {
      clearTimeout(deleteTimeoutRef.current);
      deleteTimeoutRef.current = null;
    }
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = null;
    }

    setIsHighlighted(true);
    window.dispatchEvent(
      new CustomEvent('flow-hover-edge', {
        detail: { edgeId: id, source, target },
      })
    );

    if (!showDelete && !enterTimeoutRef.current) {
      const clientX = event.clientX;
      const clientY = event.clientY;
      enterTimeoutRef.current = setTimeout(() => {
        const pos = screenToFlowPosition({ x: clientX, y: clientY });
        setDeletePos(pos);
        setShowDelete(true);
        enterTimeoutRef.current = null;
      }, 45);
    }
  };

  const handleMouseEnterButton = () => {
    if (deleteTimeoutRef.current) {
      clearTimeout(deleteTimeoutRef.current);
      deleteTimeoutRef.current = null;
    }
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = null;
    }
    setIsHighlighted(true);
  };

  const handleMouseLeave = () => {
    if (enterTimeoutRef.current) {
      clearTimeout(enterTimeoutRef.current);
      enterTimeoutRef.current = null;
    }

    if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    highlightTimeoutRef.current = setTimeout(() => {
      setIsHighlighted(false);
      window.dispatchEvent(new CustomEvent('flow-hover-edge', { detail: null }));
      highlightTimeoutRef.current = null;
    }, 50);

    if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
    deleteTimeoutRef.current = setTimeout(() => {
      setShowDelete(false);
      deleteTimeoutRef.current = null;
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
      if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    };
  }, []);

  const [edgePath, labelX, labelY] = type === 'smoothstep'
    ? getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
      })
    : getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
      });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('flow-delete-edge', { detail: { edgeId: id } }));
  };

  const displayX = deletePos ? deletePos.x : labelX;
  const displayY = deletePos ? deletePos.y - 20 : labelY - 20;

  return (
    <>
      <defs>
        <marker
          id={`arrow-grey-${id}`}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5.5"
          markerHeight="5.5"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#7b8794" />
        </marker>
        <marker
          id={`arrow-indigo-${id}`}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5.5"
          markerHeight="5.5"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366f1" />
        </marker>
      </defs>

      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="react-flow__edge-interaction"
        style={{ cursor: 'pointer' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />

      <path
        id={id}
        d={edgePath}
        fill="none"
        style={{
          ...style,
          stroke: isHighlighted ? '#6366f1' : (style.stroke || '#7b8794'),
        }}
        strokeWidth={style.strokeWidth || 1.6}
        markerEnd={isHighlighted ? `url(#arrow-indigo-${id})` : `url(#arrow-grey-${id})`}
        className="react-flow__edge-path transition-colors duration-155"
      />

      {showDelete && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${displayX}px,${displayY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
            onMouseEnter={handleMouseEnterButton}
            onMouseLeave={handleMouseLeave}
          >
            <button
              onClick={handleDelete}
              className="w-8 h-8 bg-white border border-slate-200 rounded-xl shadow-md flex items-center justify-center text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
              title="Delete Connection"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
export default InteractiveEdge;
