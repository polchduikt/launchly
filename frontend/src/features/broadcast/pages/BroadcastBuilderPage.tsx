import React from 'react';
import { ReactFlow, Controls, Background } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useBroadcastBuilder } from '../hooks/useBroadcastBuilder';
import { AudiencePanel, PickAutomationModal, TelegramPreviewModal } from '../components';
import { NodeEditorPanel } from '../../bot/components/sidebar/NodeEditorPanel';
import { NODE_TYPES } from '../config/nodeTypes';
import { BROADCAST_BLOCKS } from '../config/broadcastBlocks';
import { ROUTES } from '../../../constants/routes';

import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  Eye,
  Edit2,
  Check,
  Grid,
  Send,
  AlertTriangle,
  Plus,
} from 'lucide-react';

export const BroadcastBuilderPage: React.FC = () => {
  const {
    activeBotId,
    campaign,
    nodes,
    edges,
    selectedNodeId,
    campaignName,
    setCampaignName,
    isEditingName,
    setIsEditingName,
    messageText,
    isDirty,
    setIsDirty,
    isAudienceOpen,
    setIsAudienceOpen,
    isPreviewOpen,
    setIsPreviewOpen,
    isPickOpen,
    setIsPickOpen,
    searchQuery,
    setSearchQuery,
    conditions,
    setConditions,
    isConditionDropdownOpen,
    setIsConditionDropdownOpen,
    selectedCategory,
    setSelectedCategory,
    isCampaignsLoading,
    tags,
    activeNode,
    handleNodesChange,
    handleEdgesChange,
    onConnect,
    onNodeClick,
    onPaneClick,
    handleUpdateNodeData,
    handleAddNode,
    handleDeleteSelectedNode,
    handleSelectAutomation,
    handleAddTagCondition,
    handleRemoveCondition,
    handleSaveDraft,
    handleSendCampaign,
    getAudienceCount,
    updateCampaignMut,
    sendCampaignMut,
  } = useBroadcastBuilder();

  if (!activeBotId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-8 text-center space-y-4">
        <AlertTriangle className="text-amber-500" size={48} />
        <h1 className="text-lg font-bold text-slate-800 font-sans">No active bot selected</h1>
        <button
          onClick={() => window.location.assign(ROUTES.HOME)}
          className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all cursor-pointer"
        >
          Select Bot
        </button>
      </div>
    );
  }

  if (isCampaignsLoading || !campaign) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans overflow-hidden">
      <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between z-10 select-none">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.location.assign(ROUTES.BROADCASTS)}
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Broadcasts</span>
            <span className="text-xs font-semibold text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-400">Drafts</span>
            <span className="text-xs font-semibold text-slate-300">/</span>
            {isEditingName ? (
              <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-100">
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => {
                    setCampaignName(e.target.value);
                    setIsDirty(true);
                  }}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setIsEditingName(false);
                  }}
                  autoFocus
                  className="px-2 py-1 border border-indigo-400 rounded-lg text-sm font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                />
                <button
                  onClick={() => setIsEditingName(false)}
                  className="p-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all cursor-pointer"
                >
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <span className="font-bold text-sm text-slate-800">{campaignName}</span>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-650 transition-all p-1"
                >
                  <Edit2 size={12} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold select-none">
            {isDirty ? (
              <button
                onClick={handleSaveDraft}
                disabled={updateCampaignMut.isPending}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer flex items-center gap-1"
              >
                {updateCampaignMut.isPending ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <CheckCircle size={12} />
                )}
                Save Changes
              </button>
            ) : (
              <span className="text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                <CheckCircle size={12} className="fill-emerald-100 text-emerald-600" />
                Saved
              </span>
            )}
          </div>

          <button
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-1 px-4 py-2 border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
          >
            <Eye size={14} />
            <span>Preview</span>
          </button>

          <button
            onClick={handleSendCampaign}
            disabled={sendCampaignMut.isPending || updateCampaignMut.isPending}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-750 rounded-xl transition-all shadow-sm cursor-pointer shadow-indigo-100"
          >
            {sendCampaignMut.isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Send size={12} />
            )}
            <span>Send Now</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <aside className="w-80 border-r border-slate-200 bg-white z-10 shrink-0 flex flex-col justify-between overflow-hidden shadow-sm shadow-slate-100">
          {activeNode && activeNode.type === 'START_AUTOMATION' ? (
            <div className="p-6 space-y-6 font-sans">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 border border-slate-200 shadow-sm">
                  <Grid size={20} />
                </span>
                <div>
                  <h2 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider block">
                    Start Automation
                  </h2>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Node Settings</span>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-550 leading-relaxed font-medium">
                  Trigger an existing bot automation flow when the subscriber reaches this step.
                </p>
                {activeNode.data.automationName ? (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-700 font-extrabold text-center">
                    {activeNode.data.automationName}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-400 italic text-center">
                    No automation selected
                  </div>
                )}
                <button
                  onClick={() => setIsPickOpen(true)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow shadow-indigo-100 cursor-pointer"
                >
                  Choose Automation
                </button>
              </div>
            </div>
          ) : (
            <NodeEditorPanel node={activeNode} onUpdateNodeData={handleUpdateNodeData} />
          )}
        </aside>

        <div className="flex-1 relative h-full">
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-auto">
            <div className="bg-white/95 backdrop-blur border border-slate-200 p-3 rounded-2xl shadow-sm flex flex-col gap-1.5 select-none w-48">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                Add Flow Blocks
              </span>
              {BROADCAST_BLOCKS.map((item) => (
                <button
                  key={item.type}
                  onClick={() => handleAddNode(item.type)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-xl text-left text-xs font-semibold text-slate-700 transition-all cursor-pointer group animate-in slide-in-from-left-2 duration-100"
                >
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                    <Plus size={12} className="group-hover:scale-115 transition-transform" />
                  </span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {selectedNodeId && selectedNodeId !== 'start' && (
              <button
                onClick={handleDeleteSelectedNode}
                className="w-48 flex items-center justify-center gap-2 px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-2xl text-rose-600 text-xs font-bold transition-all shadow-sm shadow-rose-50 pointer-events-auto cursor-pointer animate-in fade-in duration-200"
              >
                <span>Delete Block</span>
              </button>
            )}
          </div>

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={NODE_TYPES}
            fitView
            fitViewOptions={{ padding: 0.6 }}
            className="bg-slate-50"
          >
            <Background color="#cbd5e1" gap={16} size={1} />
            <Controls className="!bg-white !border-slate-200 !shadow-sm !rounded-xl overflow-hidden" />
          </ReactFlow>

          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-800/80 backdrop-blur-xs text-white px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase select-none pointer-events-none shadow-xs">
            💡 click nodes to configure content
          </div>
        </div>

        <AudiencePanel
          isAudienceOpen={isAudienceOpen}
          setIsAudienceOpen={setIsAudienceOpen}
          getAudienceCount={getAudienceCount}
          conditions={conditions}
          handleRemoveCondition={handleRemoveCondition}
          isConditionDropdownOpen={isConditionDropdownOpen}
          setIsConditionDropdownOpen={setIsConditionDropdownOpen}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          tags={tags}
          handleAddTagCondition={handleAddTagCondition}
          setConditions={setConditions}
          setIsDirty={setIsDirty}
        />
      </div>

      <PickAutomationModal
        isPickOpen={isPickOpen}
        setIsPickOpen={setIsPickOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSelectAutomation={handleSelectAutomation}
      />

      <TelegramPreviewModal
        isPreviewOpen={isPreviewOpen}
        setIsPreviewOpen={setIsPreviewOpen}
        messageText={messageText}
      />
    </div>
  );
};
