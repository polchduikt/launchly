import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SquareArrowRight, Search, X, Loader2, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBotsQuery } from '../../../hooks/useBotsQuery';
import { useFlowSchemaQuery } from '../../../hooks/useFlowSchema';
import { useBotStore } from '../../../../../store/useBotStore';
import { InlineFlowPreview } from './InlineFlowPreview';
import type { Node, Edge } from '@xyflow/react';

interface StartAutomationNodeEditorProps {
  node?: Node;
  data: Record<string, any>;
  handleChange: (keyOrUpdates: string | Record<string, any>, value?: any) => void;
  editorState?: any;
}

export const StartAutomationNodeEditor: React.FC<StartAutomationNodeEditorProps> = ({ node, data, handleChange, editorState }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBotId, setSelectedBotId] = useState<number | null>(null);
  const navigate = useNavigate();
  const setActiveBotId = useBotStore((state) => state.setActiveBotId);

  useEffect(() => {
    const handleOpenPickEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (node && customEvent.detail.nodeId === node.id) {
        setIsModalOpen(true);
      }
    };
    window.addEventListener('open-pick-automation', handleOpenPickEvent);
    return () => {
      window.removeEventListener('open-pick-automation', handleOpenPickEvent);
    };
  }, [node]);

  const { data: bots = [], isLoading: isLoadingBots } = useBotsQuery();
  const activeBotId = useBotStore((state) => state.activeBotId);
  const eligibleBots = bots.filter((b) => b.id !== activeBotId);
  const filteredBots = eligibleBots.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.description && b.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const { data: selectedSchema, isLoading: isLoadingSchema } = useFlowSchemaQuery(selectedBotId || 0);
  const selectedBot = bots.find((b) => b.id === selectedBotId);
  const currentTargetName = typeof data.targetBotName === 'string'
    ? data.targetBotName
    : typeof data.automationName === 'string'
      ? data.automationName
      : '';
  const handleSelectAutomation = () => {
    if (selectedBot) {
      handleChange({
        targetBotId: selectedBot.id,
        targetBotName: selectedBot.name,
        automationName: selectedBot.name,
      });
    }
    setIsModalOpen(false);
  };
  const handleOpenAutomation = () => {
    if (data.targetBotId) {
      setActiveBotId(Number(data.targetBotId));
      navigate('/builder');
    }
  };
  const handleClearSelection = () => {
    handleChange({
      targetBotId: null,
      targetBotName: '',
      automationName: '',
    });
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-3">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
          Target Automation
        </label>
        
        {currentTargetName ? (
          <div className="space-y-4">
            <div className="relative w-full py-3 px-10 bg-white border border-slate-200 rounded-2xl flex items-center justify-center font-bold text-slate-800 text-sm select-none shadow-xs">
              <span className="truncate">{currentTargetName}</span>
              <button
                onClick={handleClearSelection}
                className="absolute right-4 p-1 text-slate-400 hover:text-slate-650 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <button
              onClick={handleOpenAutomation}
              className="w-full py-3 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl transition-all cursor-pointer shadow-xs"
            >
              Open This Automation
            </button>

            <div className="border-t border-slate-100 my-4" />

            <button
              onClick={() => {
                if (editorState) {
                  editorState.setNextStepSourceHandle?.('next');
                  editorState.setIsNextStepDrawerOpen?.(true);
                }
              }}
              className="w-full py-3.5 bg-white hover:bg-lime-50/15 border border-dashed border-lime-200 hover:border-lime-400 text-lime-700 hover:text-lime-800 text-xs font-bold rounded-2xl transition-all cursor-pointer text-center select-none shadow-xs"
            >
              Choose Next Step
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setSelectedBotId(null);
              setIsModalOpen(true);
            }}
            className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-250 hover:border-slate-355 bg-white hover:bg-slate-50 rounded-2xl transition-all group cursor-pointer text-slate-400 hover:text-slate-500"
          >
            <SquareArrowRight size={22} className="stroke-[1.5] mb-2 text-slate-400 group-hover:text-indigo-500 transition-colors" />
            <span className="text-xs font-bold tracking-tight">Select Automation</span>
          </button>
        )}
      </div>

      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-100 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in duration-200">
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-bold text-slate-900">Pick Automation</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-5">
              <div className="md:col-span-3 flex flex-col overflow-hidden p-6 border-r border-slate-100">
                <div className="relative shrink-0 mb-4">
                  <Search size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search all Automations"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50 font-sans"
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {isLoadingBots ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                      <Loader2 size={24} className="animate-spin text-indigo-500" />
                      <span className="text-xs font-semibold">Loading automations...</span>
                    </div>
                  ) : filteredBots.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs font-medium">
                      No eligible automations found
                    </div>
                  ) : (
                    filteredBots.map((bot) => (
                      <div
                        key={bot.id}
                        onClick={() => setSelectedBotId(bot.id)}
                        className={`w-full p-4 border rounded-2xl cursor-pointer transition-all hover:bg-slate-50 flex items-center justify-between ${
                          selectedBotId === bot.id
                            ? 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500/20'
                            : 'border-slate-150 bg-white'
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                bot.active
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {bot.active ? 'ACTIVE' : 'STOPPED'}
                            </span>
                            <span className="text-sm font-bold text-slate-800 truncate">
                              {bot.name}
                            </span>
                          </div>
                          {bot.description && (
                            <p className="text-xs text-slate-500 truncate mt-1">
                              {bot.description}
                            </p>
                          )}
                        </div>
                        <div className="text-[11px] font-medium text-slate-450 shrink-0">
                          Runs: {bot.stats?.runs ?? 0}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="md:col-span-2 bg-slate-50/50 p-6 flex flex-col items-center justify-center overflow-hidden">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 self-start">
                  Flow Preview
                </span>

                <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
                  {selectedBotId === null ? (
                    <div className="text-center p-6 text-slate-400 max-w-[200px] flex flex-col items-center gap-2">
                      <Play size={24} className="text-slate-300 stroke-[1.5]" />
                      <span className="text-xs font-medium leading-normal">
                        Select an automation from the list to preview its flow
                      </span>
                    </div>
                  ) : isLoadingSchema ? (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 size={24} className="animate-spin text-indigo-500" />
                      <span className="text-xs font-semibold text-slate-400">
                        Loading preview schema...
                      </span>
                    </div>
                  ) : selectedSchema && selectedSchema.nodes ? (
                    <div className="w-full max-h-full overflow-hidden flex items-center justify-center">
                      <InlineFlowPreview
                        nodes={selectedSchema.nodes as unknown as Node[]}
                        edges={selectedSchema.edges as unknown as Edge[]}
                      />
                    </div>
                  ) : (
                    <div className="text-center p-6 text-slate-400 text-xs font-medium">
                      No flow schema configured for this bot
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 pt-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0 rounded-b-3xl">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSelectAutomation}
                disabled={selectedBotId === null}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-default rounded-xl transition-all shadow-sm shadow-indigo-100 cursor-pointer"
              >
                Pick This Automation
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
