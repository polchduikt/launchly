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
import { CommandNodeEditor } from './editors/CommandNodeEditor';
import { AiNodeEditor } from './editors/AiNodeEditor';
import { MathNodeEditor } from './editors/MathNodeEditor';
import { LeaderboardNodeEditor } from './editors/LeaderboardNodeEditor';
import { CooldownNodeEditor } from './editors/CooldownNodeEditor';
import { SchedulerNodeEditor } from './editors/SchedulerNodeEditor';


interface NodeEditorPanelProps {
  node?: Node;
  onUpdateNodeData: (nodeId: string, newData: Record<string, unknown>) => void;
  editorState?: ReturnType<typeof useNodeEditor>;
  onSelectNode?: (nodeId: string | null) => void;
}

type NodeEditorComponent = React.FC<{
  node: Node;
  data: Record<string, unknown>;
  handleChange: (keyOrUpdates: string | Record<string, unknown>, value?: unknown) => void;
  editorState: ReturnType<typeof useNodeEditor>;
  onSelectNode?: (nodeId: string | null) => void;
}>;

const NODE_EDITORS: Record<string, NodeEditorComponent> = {
  START: () => <StartNodeEditor />,
  MESSAGE: ({ node, editorState, onSelectNode }) => (
    <MessageNodeEditor nodeId={node.id} editorState={editorState} onSelectNode={onSelectNode} />
  ),
  CONDITION: ({ data, handleChange, editorState }) => (
    <ConditionNodeEditor data={data} handleChange={handleChange} editorState={editorState} />
  ),
  API_CALL: ({ data, handleChange }) => (
    <ApiCallNodeEditor data={data} handleChange={handleChange} />
  ),
  ACTION: ({ data, handleChange, editorState }) => (
    <ActionNodeEditor data={data} handleChange={handleChange} editorState={editorState} />
  ),
  MATH: ({ data, handleChange, editorState }) => (
    <MathNodeEditor data={data} handleChange={handleChange} editorState={editorState} />
  ),
  LEADERBOARD: ({ data, handleChange, editorState }) => (
    <LeaderboardNodeEditor data={data} handleChange={handleChange} editorState={editorState} />
  ),
  COOLDOWN: ({ data, handleChange, editorState }) => (
    <CooldownNodeEditor data={data} handleChange={handleChange} editorState={editorState} />
  ),
  SCHEDULER: ({ data, handleChange, editorState }) => (
    <SchedulerNodeEditor data={data} handleChange={handleChange} editorState={editorState} />
  ),
  SMART_DELAY: ({ data, handleChange, editorState }) => (
    <SmartDelayNodeEditor data={data} handleChange={handleChange} editorState={editorState} />
  ),
  RANDOMIZER: ({ node, data, handleChange, editorState }) => (
    <RandomizerNodeEditor nodeId={node.id} data={data} handleChange={handleChange} editorState={editorState} />
  ),
  COMMENT: ({ data, handleChange }) => (
    <CommentNodeEditor data={data} handleChange={handleChange} />
  ),
  START_AUTOMATION: ({ node, data, handleChange, editorState }) => (
    <StartAutomationNodeEditor node={node} data={data} handleChange={handleChange} editorState={editorState} />
  ),
  COMMAND: ({ data, handleChange }) => (
    <CommandNodeEditor data={data} handleChange={handleChange} />
  ),
  AI: ({ data, handleChange, editorState }) => (
    <AiNodeEditor data={data} handleChange={handleChange} editorState={editorState} />
  ),
  END: () => <EndNodeEditor />,
};

interface NodeEditorPanelContentProps {
  node: Node;
  editorState: ReturnType<typeof useNodeEditor>;
  onSelectNode?: (nodeId: string | null) => void;
}

const NodeEditorPanelContent: React.FC<NodeEditorPanelContentProps> = ({
  node,
  editorState,
  onSelectNode,
}) => {
  const { data, handleChange } = editorState;

  const renderIcon = () => {
    return NODE_ICONS[node.type || ''] || null;
  };

  const renderTitle = () => {
    const key = `node.title.${String(node.type || '').toLowerCase()}`;
    const val = t(key);
    if (val !== key) return val;
    return NODE_TITLES[node.type || ''] || 'Node Settings';
  };

  const EditorComponent = node.type ? NODE_EDITORS[node.type] : null;

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
          {EditorComponent ? (
            <EditorComponent
              node={node}
              data={data}
              handleChange={handleChange}
              editorState={editorState}
              onSelectNode={onSelectNode}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

const NodeEditorPanelWithLocalState: React.FC<{
  node: Node;
  onUpdateNodeData: (nodeId: string, newData: Record<string, unknown>) => void;
  onSelectNode?: (nodeId: string | null) => void;
}> = ({ node, onUpdateNodeData, onSelectNode }) => {
  const editorState = useNodeEditor(node, onUpdateNodeData);
  return (
    <NodeEditorPanelContent
      node={node}
      editorState={editorState}
      onSelectNode={onSelectNode}
    />
  );
};

export const NodeEditorPanel: React.FC<NodeEditorPanelProps> = ({ 
  node, 
  onUpdateNodeData, 
  editorState: passedEditorState,
  onSelectNode 
}) => {
  if (!node) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 text-xs font-semibold select-none text-center p-8">
        {t('flow_builder.empty_canvas')}
      </div>
    );
  }

  if (passedEditorState) {
    return (
      <NodeEditorPanelContent
        node={node}
        editorState={passedEditorState}
        onSelectNode={onSelectNode}
      />
    );
  }

  return (
    <NodeEditorPanelWithLocalState
      node={node}
      onUpdateNodeData={onUpdateNodeData}
      onSelectNode={onSelectNode}
    />
  );
};
