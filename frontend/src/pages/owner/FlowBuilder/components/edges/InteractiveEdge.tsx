import React, { useState, useRef, useEffect } from 'react';
import { getBezierPath, getSmoothStepPath, EdgeLabelRenderer, useReactFlow, type EdgeProps } from '@xyflow/react';
import { Trash2 } from 'lucide-react';
import { useFlowUiStore } from '../../../../../store/useFlowUiStore';

export const InteractiveEdge = React.memo<EdgeProps>(
  ({
    id,
    source,
    sourceHandleId,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    type,
    selected,
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
      useFlowUiStore.getState().requestDeleteEdge(id);
    };

    const displayX = deletePos ? deletePos.x : labelX;
    const displayY = deletePos ? deletePos.y - 20 : labelY - 20;

    const pathRef = useRef<SVGPathElement | null>(null);

    const highlighted = isHighlighted || selected;

    useEffect(() => {
      const el = pathRef.current;
      if (!el) return;
      const svg = el.ownerSVGElement;
      if (svg) {
        svg.style.zIndex = highlighted ? '1001' : '';
      }
    }, [highlighted]);

    useEffect(() => {
      if (!source) return;
      const getSourceHandle = (): Element | null => {
        if (sourceHandleId) {
          const el = document.querySelector(
            `.react-flow__handle[data-nodeid="${source}"][data-handleid="${sourceHandleId}"]`
          );
          if (el) return el;
        }
        return (
          document.querySelector(`.react-flow__handle-source[data-nodeid="${source}"]`) ||
          document.querySelector(`.react-flow__handle[data-nodeid="${source}"][data-handlepos="${sourcePosition}"]`) ||
          document.querySelector(`.react-flow__handle[data-nodeid="${source}"]`)
        );
      };

      const handleEl = getSourceHandle();
      if (handleEl) {
        if (highlighted) {
          handleEl.classList.add('handle-highlighted');
        } else {
          handleEl.classList.remove('handle-highlighted');
        }
      }

      return () => {
        if (handleEl) {
          handleEl.classList.remove('handle-highlighted');
        }
      };
    }, [source, sourceHandleId, sourcePosition, highlighted]);

    const edgeStyle = React.useMemo(() => {
      const base = style || {};
      return {
        ...base,
        stroke: highlighted ? '#0A0A0A' : (base.stroke || '#64748b'),
        strokeWidth: highlighted ? 2.8 : (base.strokeWidth || 2.4),
      };
    }, [style, highlighted]);

    return (
      <>
        <path
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={22}
          className="react-flow__edge-interaction"
          style={{ cursor: 'pointer' }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />

        {highlighted && (
          <path
            d={edgePath}
            fill="none"
            stroke="#F2EBDD"
            strokeWidth={5.5}
            className="pointer-events-none"
            style={{ opacity: 0.95 }}
          />
        )}

        <path
          ref={pathRef}
          id={id}
          d={edgePath}
          fill="none"
          style={edgeStyle}
          strokeWidth={edgeStyle.strokeWidth}
          markerEnd={highlighted ? 'url(#arrow-indigo)' : 'url(#arrow-grey)'}
          className={`react-flow__edge-path transition-colors duration-150 ${
            highlighted ? 'edge-path-highlight' : 'edge-path-default'
          }`}
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
                className="w-8 h-8 bg-white dark:bg-[#18181B] border-2 border-[#0A0A0A] dark:border-[#27272A] rounded-xl shadow-[2px_2px_0px_#0A0A0A] dark:shadow-none flex items-center justify-center text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-[#3B1219] transition-colors cursor-pointer"
                title="Delete Connection"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </EdgeLabelRenderer>
        )}
      </>
    );
  },
  (prev, next) => {
    return (
      prev.id === next.id &&
      prev.source === next.source &&
      prev.target === next.target &&
      prev.sourceHandleId === next.sourceHandleId &&
      prev.targetHandleId === next.targetHandleId &&
      prev.sourceX === next.sourceX &&
      prev.sourceY === next.sourceY &&
      prev.targetX === next.targetX &&
      prev.targetY === next.targetY &&
      prev.sourcePosition === next.sourcePosition &&
      prev.targetPosition === next.targetPosition &&
      prev.type === next.type &&
      prev.selected === next.selected &&
      prev.style?.stroke === next.style?.stroke &&
      prev.style?.strokeWidth === next.style?.strokeWidth
    );
  }
);

InteractiveEdge.displayName = 'InteractiveEdge';
export default InteractiveEdge;
