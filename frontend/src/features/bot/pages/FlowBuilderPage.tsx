import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import type { Connection, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useBotStore } from '../../../store/useBotStore';
import { useFlowSchemaQuery, useSaveFlowSchemaMutation } from '../hooks/useFlowSchema';
import { NodeEditorPanel } from '../components/sidebar/NodeEditorPanel';
import { FLOW_BLOCKS, createDefaultNodeData } from '../config/flowBlocks';

import {
  StartNode,
  MessageNode,
  InputNode,
  ConditionNode,
  OrderNode,
  LeadNode,
  ApiCallNode,
  EndNode,
} from '../components/nodes';

import { ArrowLeft, Loader2, Save, Plus, Trash2 } from 'lucide-react';

const nodeTypes = {
  START: StartNode,
  MESSAGE: MessageNode,
  INPUT: InputNode,
  CONDITION: ConditionNode,
  ORDER: OrderNode,
  LEAD: LeadNode,
  API_CALL: ApiCallNode,
  END: EndNode,
};

export const FlowBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const activeBotId = useBotStore((state) => state.activeBotId);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveErrorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerSaveError = (msg: string) => {
    setSaveError(msg);
    if (saveErrorTimeoutRef.current) {
      clearTimeout(saveErrorTimeoutRef.current);
    }
    saveErrorTimeoutRef.current = setTimeout(() => {
      setSaveError(null);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (saveErrorTimeoutRef.current) {
        clearTimeout(saveErrorTimeoutRef.current);
      }
    };
  }, []);

  const getErrorMessage = (err: unknown) => {
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      return axiosErr.response?.data?.message || axiosErr.message || 'An error occurred';
    }
    return err instanceof Error ? err.message : 'An error occurred';
  };

  useEffect(() => {
    if (!activeBotId) {
      navigate('/home');
    }
  }, [activeBotId, navigate]);

  const { data: schema, isLoading } = useFlowSchemaQuery(activeBotId || 0);
  const saveMutation = useSaveFlowSchemaMutation(activeBotId || 0);

  useEffect(() => {
    if (!isLoading) {
      if (schema) {
        let parsedNodes: Node[] = [];
        let parsedEdges: Edge[] = [];

        try {
          const rawNodes = typeof schema.nodes === 'string' ? JSON.parse(schema.nodes) : schema.nodes;
          const rawEdges = typeof schema.edges === 'string' ? JSON.parse(schema.edges) : schema.edges;
          if (Array.isArray(rawNodes)) {
            parsedNodes = rawNodes;
          }
          if (Array.isArray(rawEdges)) {
            parsedEdges = rawEdges;
          }
        } catch (e) {
          parsedNodes = [];
          parsedEdges = [];
        }

        if (parsedNodes.length === 0) {
          parsedNodes = [
            {
              id: 'node_start',
              type: 'START',
              position: { x: 100, y: 150 },
              data: {},
            },
          ];
          parsedEdges = [];
        }

        setNodes(parsedNodes);
        setEdges(parsedEdges);
      } else {
        setNodes([
          {
            id: 'node_start',
            type: 'START',
            position: { x: 100, y: 150 },
            data: {},
          },
        ]);
        setEdges([]);
      }
    }
  }, [schema, isLoading, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, type: 'default' }, eds));
    },
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleUpdateNodeData = useCallback(
    (nodeId: string, newData: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data: newData };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  const handleAddNode = (type: keyof typeof nodeTypes) => {
    if (type === 'START') {
      const hasStart = nodes.some((n) => n.type === 'START');
      if (hasStart) {
        triggerSaveError('Flow must have exactly one START node');
        return;
      }
    }

    const id = `node_${type.toLowerCase()}_${Date.now()}`;
    const newNode: Node = {
      id,
      type,
      position: { x: Math.random() * 200 + 150, y: Math.random() * 200 + 100 },
      data: createDefaultNodeData(type),
    };

    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(id);
  };

  const handleDeleteSelectedNode = () => {
    if (!selectedNodeId) return;
    const nodeToDelete = nodes.find((n) => n.id === selectedNodeId);
    if (nodeToDelete?.type === 'START') {
      triggerSaveError('You cannot delete the START node');
      return;
    }

    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
  };

  const handleSaveFlow = () => {
    setSaveError(null);

    const startCount = nodes.filter((n) => n.type === 'START').length;
    if (startCount !== 1) {
      setSaveError('Flow must have exactly one START node');
      return;
    }

    saveMutation.mutate({
      nodes,
      edges,
    });
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!activeBotId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
          <span className="text-sm font-semibold text-slate-500">Loading flow constructor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 font-sans overflow-hidden">
      <header className="h-16 border-b border-slate-200 bg-white px-6 flex justify-between items-center z-10 shrink-0 select-none">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/automations')}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
            <span>Automations</span>
            <span>&gt;</span>
            <span className="text-slate-800 font-bold text-sm">Telegram Flow Schema</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saveError && (
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 border border-rose-100 rounded-lg animate-pulse">
              {saveError}
            </span>
          )}

          {saveMutation.isSuccess && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 border border-emerald-100 rounded-lg">
              Saved successfully
            </span>
          )}

          {saveMutation.isError && (
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 border border-rose-100 rounded-lg">
              {getErrorMessage(saveMutation.error)}
            </span>
          )}

          <button
            onClick={handleSaveFlow}
            disabled={saveMutation.isPending}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow shadow-indigo-100 cursor-pointer"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="animate-spin" size={14} />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Set Live</span>
              </>
            )}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <aside className="w-80 border-r border-slate-200 bg-white z-10 shrink-0 flex flex-col justify-between overflow-hidden shadow-sm shadow-slate-100">
          <NodeEditorPanel node={selectedNode} onUpdateNodeData={handleUpdateNodeData} />
        </aside>

        <div className="flex-1 relative h-full">
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-auto">
            <div className="bg-white/95 backdrop-blur border border-slate-200 p-3 rounded-2xl shadow-sm flex flex-col gap-1.5 select-none w-48">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                Add Flow Blocks
              </span>
              {FLOW_BLOCKS.map((item) => (
                <button
                  key={item.type}
                  onClick={() => handleAddNode(item.type as keyof typeof nodeTypes)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-xl text-left text-xs font-semibold text-slate-700 transition-all cursor-pointer group"
                >
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                    <Plus size={12} className="group-hover:scale-110 transition-transform" />
                  </span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {selectedNodeId && (
              <button
                onClick={handleDeleteSelectedNode}
                className="flex items-center justify-center gap-1.5 w-48 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-2xl border border-rose-100 shadow-sm transition-all cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Delete Block</span>
              </button>
            )}
          </div>

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            fitView
            proOptions={{ hideAttribution: true }}
            className="bg-slate-50"
          >
            <Controls position="bottom-left" className="border border-slate-200 rounded-xl overflow-hidden shadow-sm" />
            <Background color="#cbd5e1" gap={16} size={1} />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};
