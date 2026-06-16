import React, { useState } from 'react';
import { useAiSchemaMutation, useAiUsageQuery } from '../hooks/useAiQueries';
import { Sparkles, X, Loader2, AlertTriangle, AlertCircle } from 'lucide-react';
import { getAutoLayoutedElements } from '../../bot/utils/flowLayout';
import type { AiFlowGeneratorModalProps } from '../types';

export const AiFlowGeneratorModal: React.FC<AiFlowGeneratorModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  hasExistingNodes,
}) => {
  const [description, setDescription] = useState('');
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const schemaMutation = useAiSchemaMutation();
  const { data: usage, refetch: refetchUsage } = useAiUsageQuery();
  if (!isOpen) return null;
  const isLimitReached =
    usage && usage.requestsLimit > 0 && usage.requestsUsed >= usage.requestsLimit;
  const handleGenerate = async () => {
    if (!description.trim() || isLimitReached) return;
    if (hasExistingNodes && !confirmOverwrite) {
      setConfirmOverwrite(true);
      return;
    }
    try {
      const response = await schemaMutation.mutateAsync({
        description: description.trim(),
      });
      let parsedNodes = response.nodes;
      let parsedEdges = response.edges;
      if (typeof parsedNodes === 'string') {
        try {
          parsedNodes = JSON.parse(parsedNodes);
        } catch (e) {
          parsedNodes = [];
        }
      }
      if (typeof parsedEdges === 'string') {
        try {
          parsedEdges = JSON.parse(parsedEdges);
        } catch (e) {
          parsedEdges = [];
        }
      }

      if (parsedNodes && typeof parsedNodes === 'object' && !Array.isArray(parsedNodes)) {
        if (Array.isArray((parsedNodes as any).nodes)) {
          parsedNodes = (parsedNodes as any).nodes;
        } else {
          const arrayKey = Object.keys(parsedNodes).find(key => Array.isArray((parsedNodes as any)[key]));
          parsedNodes = arrayKey ? (parsedNodes as any)[arrayKey] : [];
        }
      }
      if (parsedEdges && typeof parsedEdges === 'object' && !Array.isArray(parsedEdges)) {
        if (Array.isArray((parsedEdges as any).edges)) {
          parsedEdges = (parsedEdges as any).edges;
        } else {
          const arrayKey = Object.keys(parsedEdges).find(key => Array.isArray((parsedEdges as any)[key]));
          parsedEdges = arrayKey ? (parsedEdges as any)[arrayKey] : [];
        }
      }
      
      if (!Array.isArray(parsedNodes)) {
        parsedNodes = [];
      }
      if (!Array.isArray(parsedEdges)) {
        parsedEdges = [];
      }

      parsedNodes = parsedNodes.map((node: any, idx: number) => {
        let position = node.position;
        if (!position || typeof position !== 'object') {
          const x = typeof node.x === 'number' ? node.x : idx * 250 + 100;
          const y = typeof node.y === 'number' ? node.y : 150;
          position = { x, y };
        } else {
          const x = typeof position.x === 'number' ? position.x : (typeof position.x === 'string' ? parseFloat(position.x) : idx * 250 + 100);
          const y = typeof position.y === 'number' ? position.y : (typeof position.y === 'string' ? parseFloat(position.y) : 150);
          position = {
            x: isNaN(x) ? idx * 250 + 100 : x,
            y: isNaN(y) ? 150 : y,
          };
        }

        let data = node.data;
        if (!data || typeof data !== 'object') {
          data = {};
        }

        const supportedTypes = ['START', 'MESSAGE', 'INPUT', 'CONDITION', 'ORDER', 'LEAD', 'API_CALL', 'END'];
        let type = (node.type || 'MESSAGE').toUpperCase();
        if (type === 'API' || type === 'INTEGRATION') {
          type = 'API_CALL';
        } else if (type === 'TRIGGER') {
          type = 'START';
        } else if (type === 'BUTTON' || type === 'TAG') {
          type = 'MESSAGE';
        } else if (!supportedTypes.includes(type)) {
          type = 'MESSAGE'; 
        }

        return {
          ...node,
          id: node.id || `node_generated_${idx}_${Date.now()}`,
          type,
          position,
          data,
        };
      });

      
      parsedEdges = parsedEdges
        .map((edge: any, idx: number) => {
          let sourceHandle = edge.sourceHandle;
          if (!sourceHandle) {
            const sourceNode = parsedNodes.find((n: any) => n.id === edge.source);
            sourceHandle = sourceNode?.type === 'START' ? 'then' : 'next';
          }
          return {
            ...edge,
            id: edge.id || `edge_generated_${idx}_${Date.now()}`,
            source: edge.source || '',
            target: edge.target || '',
            sourceHandle,
          };
        })
        .filter((edge: any) => edge.source && edge.target);

      
      const layouted = getAutoLayoutedElements(parsedNodes, parsedEdges, 'LR');
      onGenerate(layouted.nodes, layouted.edges);
      refetchUsage();
      handleClose();
    } catch (err) {
      
    }
  };

  const handleClose = () => {
    setDescription('');
    setConfirmOverwrite(false);
    schemaMutation.reset();
    onClose();
  };

  const templates = [
    {
      title: 'Lead Capture Bot',
      text: 'A bot that welcomes the user, asks for their name and email, registers them as a lead, and sends a thank you message.',
    },
    {
      title: 'Support & FAQ',
      text: 'A customer support bot that welcomes users and offers two buttons: "Contact Support" (creates a lead) and "FAQs" (answers common questions).',
    },
    {
      title: 'Order Placement',
      text: 'A simple ecommerce bot that welcomes the customer, asks what they want to order, triggers an order node with a price of 200, and finishes.',
    },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative flex flex-col gap-4 animate-scaleIn select-none max-h-[90vh] overflow-y-auto">
        
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Sparkles size={18} />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Generate Flow with AI</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={schemaMutation.isPending}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        
        {!confirmOverwrite && !schemaMutation.isPending && (
          <div className="space-y-4">
            <div className="text-xs text-slate-500 leading-relaxed font-medium">
              Describe the bot flow you want to build. Launchly AI will automatically generate the appropriate layout, blocks, and connections.
            </div>

            
            {usage && (
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-[10px] font-semibold flex justify-between items-center">
                <span className="text-slate-500">Daily AI requests:</span>
                <span className="text-slate-700">
                  {usage.requestsLimit === -1 ? (
                    <span className="text-indigo-600">Unlimited (Pro)</span>
                  ) : (
                    `${usage.requestsUsed} / ${usage.requestsLimit} requests`
                  )}
                </span>
              </div>
            )}

            {isLimitReached && (
              <div className="flex items-start gap-2 text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-2xl">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div className="text-xs font-bold leading-normal">
                  Daily AI limit reached. Please upgrade your plan for unlimited flow generations.
                </div>
              </div>
            )}

            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Describe Bot Flow
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLimitReached}
                rows={4}
                placeholder="E.g., A lead capture bot that greets the user, asks for their contact phone, registers a lead, and tags them as 'interested'..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-400"
              />
            </div>

            
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Quick Start Templates
              </span>
              <div className="grid grid-cols-1 gap-2">
                {templates.map((tpl) => (
                  <button
                    key={tpl.title}
                    disabled={isLimitReached}
                    onClick={() => setDescription(tpl.text)}
                    className="w-full text-left p-3 bg-white hover:bg-indigo-50/40 border border-slate-200 hover:border-indigo-200 rounded-2xl transition-all cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-[11px] font-bold text-slate-700 group-hover:text-indigo-600 block mb-0.5">
                      {tpl.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium line-clamp-1 group-hover:text-indigo-600/80">
                      {tpl.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        
        {confirmOverwrite && !schemaMutation.isPending && (
          <div className="space-y-4 py-3 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
              <AlertTriangle size={24} className="animate-pulse" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h4 className="text-xs font-bold text-slate-800">Overwrite Canvas?</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                You already have nodes on your constructor canvas. Generating a new flow with AI will completely replace all existing blocks. This cannot be undone.
              </p>
            </div>
          </div>
        )}

        
        {schemaMutation.isPending && (
          <div className="space-y-4 py-8 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
            <div className="space-y-1 text-center">
              <h4 className="text-xs font-bold text-slate-800 animate-pulse">AI is generating flow...</h4>
              <p className="text-[10px] text-slate-400 font-semibold">
                Structuring nodes, connecting edges, and validating Start block.
              </p>
            </div>
          </div>
        )}

        
        {schemaMutation.isError && (
          <div className="flex items-start gap-2 text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-2xl text-xs font-bold leading-normal">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              {schemaMutation.error instanceof Error
                ? schemaMutation.error.message
                : 'Failed to generate bot schema. Please check your prompt and try again.'}
            </div>
          </div>
        )}

        
        {!schemaMutation.isPending && (
          <div className="flex gap-2.5 justify-end pt-2 border-t border-slate-100 shrink-0">
            {confirmOverwrite ? (
              <>
                <button
                  onClick={() => setConfirmOverwrite(false)}
                  className="px-4 py-2 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleGenerate}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Yes, Overwrite & Generate
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={!description.trim() || isLimitReached}
                  onClick={handleGenerate}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  <Sparkles size={12} />
                  <span>Generate Bot</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      
      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};
