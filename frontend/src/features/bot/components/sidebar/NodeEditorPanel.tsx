import React from 'react';
import type { Node } from '@xyflow/react';
import { EditButtonDialog } from '../dialogs/EditButtonDialog';
import { useNodeEditor } from '../../hooks/useNodeEditor';
import { NODE_TITLES, NODE_ICONS } from '../../config/nodeDisplay';
import { StartNodeEditor } from './editors/StartNodeEditor';
import { MessageNodeEditor } from './editors/MessageNodeEditor';
import { InputNodeEditor } from './editors/InputNodeEditor';
import { ConditionNodeEditor } from './editors/ConditionNodeEditor';
import { OrderNodeEditor } from './editors/OrderNodeEditor';
import { LeadNodeEditor } from './editors/LeadNodeEditor';
import { ApiCallNodeEditor } from './editors/ApiCallNodeEditor';
import { EndNodeEditor } from './editors/EndNodeEditor';

interface NodeEditorPanelProps {
  node?: Node;
  onUpdateNodeData: (nodeId: string, newData: Record<string, unknown>) => void;
}

export const NodeEditorPanel: React.FC<NodeEditorPanelProps> = ({ node, onUpdateNodeData }) => {
  const {
    isBtnDialogOpen,
    setIsBtnDialogOpen,
    editingButton,
    isUploading,
    showImageUrlInput,
    setShowImageUrlInput,
    fileInputRef,
    data,
    buttons,
    handleChange,
    handleAddButton,
    handleOpenEditButton,
    handleSaveButton,
    handleRemoveButton,
    handleFileUpload,
  } = useNodeEditor(node, onUpdateNodeData);

  if (!node) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 text-xs font-semibold select-none text-center p-8">
        Click on any node in the canvas to edit its properties.
      </div>
    );
  }

  const renderIcon = () => {
    return NODE_ICONS[node.type || ''] || null;
  };

  const renderTitle = () => {
    return NODE_TITLES[node.type || ''] || 'Node Settings';
  };

  const renderEditor = () => {
    switch (node.type) {
      case 'START':
        return <StartNodeEditor />;
      case 'MESSAGE':
        return (
          <MessageNodeEditor
            data={data}
            buttons={buttons}
            showImageUrlInput={showImageUrlInput}
            isUploading={isUploading}
            fileInputRef={fileInputRef}
            setShowImageUrlInput={setShowImageUrlInput}
            handleChange={handleChange}
            handleAddButton={handleAddButton}
            handleOpenEditButton={handleOpenEditButton}
            handleFileUpload={handleFileUpload}
          />
        );
      case 'INPUT':
        return <InputNodeEditor data={data} handleChange={handleChange} />;
      case 'CONDITION':
        return <ConditionNodeEditor data={data} handleChange={handleChange} />;
      case 'ORDER':
        return <OrderNodeEditor data={data} handleChange={handleChange} />;
      case 'LEAD':
        return <LeadNodeEditor data={data} handleChange={handleChange} />;
      case 'API_CALL':
        return <ApiCallNodeEditor data={data} handleChange={handleChange} />;
      case 'END':
        return <EndNodeEditor />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full overflow-y-auto p-5 space-y-5 font-sans flex flex-col justify-between">
      <div className="space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-slate-50 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
              {renderIcon()}
            </span>
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block leading-none">
                Editing node
              </span>
              <span className="text-xs font-bold text-slate-800 block mt-0.5">
                {renderTitle()}
              </span>
            </div>
          </div>
        </div>

        {renderEditor()}
      </div>

      <EditButtonDialog
        isOpen={isBtnDialogOpen}
        onClose={() => {
          setIsBtnDialogOpen(false);
        }}
        button={editingButton}
        onSave={handleSaveButton}
        onRemove={handleRemoveButton}
      />
    </div>
  );
};
