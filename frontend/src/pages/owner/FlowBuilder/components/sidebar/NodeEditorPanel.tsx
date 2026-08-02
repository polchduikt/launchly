import React from 'react';
import type { Node } from '@xyflow/react';
import { t } from '../../../../../i18n/config';
import { useNodeEditor } from '../../../../../hooks/bot/useNodeEditor';
import { NODE_TITLES, NODE_ICONS } from '../../../../../const/nodeDisplay';
import { StartNodeEditor } from './editors/StartNodeEditor';
import { MessageNodeEditor } from './editors/MessageNodeEditor';
import { ConditionNodeEditor } from './editors/ConditionNodeEditor';
import { ApiCallNodeEditor } from './editors/ApiCallNodeEditor';
import { EndNodeEditor } from './editors/EndNodeEditor';
import { ActionNodeEditor } from './editors/ActionNodeEditor';
import { SmartDelayNodeEditor } from './editors/SmartDelayNodeEditor';
import { RandomizerNodeEditor } from './editors/RandomizerNodeEditor';
import { CommentNodeEditor } from './editors/CommentNodeEditor';
import { StartAutomationNodeEditor } from './editors/StartAutomationNodeEditor';
import { AiNodeEditor } from './editors/AiNodeEditor';


interface NodeEditorPanelProps {
  node?: Node;
  onUpdateNodeData: (nodeId: string, newData: Record<string, unknown>) => void;
  editorState?: ReturnType<typeof useNodeEditor>;
  onSelectNode?: (nodeId: string | null) => void;
}

export const NodeEditorPanel: React.FC<NodeEditorPanelProps> = ({ 
  node, 
  onUpdateNodeData, 
  editorState: passedEditorState,
  onSelectNode 
}) => {
  const localEditorState = useNodeEditor(node, onUpdateNodeData);
  const editorState = passedEditorState || localEditorState;
  const { data, handleChange } = editorState;

  if (!node) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 text-xs font-semibold select-none text-center p-8">
        {t('flow_builder.empty_canvas')}
      </div>
    );
  }

  const renderIcon = () => {
    return NODE_ICONS[node.type || ''] || null;
  };

  const renderTitle = () => {
    const key = `node.title.${String(node.type || '').toLowerCase()}`;
    const val = t(key);
    if (val !== key) return val;
    return NODE_TITLES[node.type || ''] || 'Node Settings';
  };

  const renderEditor = () => {
    switch (node.type) {
      case 'START':
        return <StartNodeEditor />;
      case 'MESSAGE':
        return (
          <MessageNodeEditor
            nodeId={node.id}
            editorState={editorState}
            onSelectNode={onSelectNode}
          />
        );
      case 'CONDITION':
        return <ConditionNodeEditor data={data} handleChange={handleChange} editorState={editorState} />;
      case 'API_CALL':
        return <ApiCallNodeEditor data={data} handleChange={handleChange} />;
      case 'ACTION':
        return <ActionNodeEditor data={data} handleChange={handleChange} editorState={editorState} />;
      case 'SMART_DELAY':
        return <SmartDelayNodeEditor data={data} handleChange={handleChange} editorState={editorState} />;
      case 'RANDOMIZER':
        return <RandomizerNodeEditor nodeId={node.id} data={data} handleChange={handleChange} editorState={editorState} />;
      case 'COMMENT':
        return <CommentNodeEditor data={data} handleChange={handleChange} />;
      case 'START_AUTOMATION':
        return <StartAutomationNodeEditor node={node} data={data} handleChange={handleChange} editorState={editorState} />;
      case 'AI':
        return <AiNodeEditor data={data} handleChange={handleChange} editorState={editorState} />;
      case 'END':
        return <EndNodeEditor />;
      default:
        return null;
    }
  };


  return (
    <div className="h-full overflow-y-auto p-5 pb-24 font-['JetBrains_Mono',monospace] flex flex-col custom-scrollbar bg-[#F2EBDD] text-[#0A0A0A]">
      <div className="flex-1 flex flex-col gap-5">
        <div className="flex items-center justify-between border-b-2 border-[#0A0A0A] pb-3.5 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#F2EBDD] text-[#0A0A0A] flex items-center justify-center shrink-0 border-2 border-[#0A0A0A] shadow-sm">
              {renderIcon()}
            </span>
            <div>
              <span className="text-[10px] text-[#0A0A0A]/60 font-black uppercase tracking-wider block leading-none font-['Anybody',sans-serif]">
                {t('flow_builder.editing_node')}
              </span>
              <span className="text-xs font-black text-[#0A0A0A] block mt-0.5 font-['Anybody',sans-serif]">
                {renderTitle()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          {renderEditor()}
        </div>
      </div>
    </div>
  );
};
