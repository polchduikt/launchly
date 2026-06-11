import React, { useState } from 'react';
import type { Node } from '@xyflow/react';
import { EditButtonDialog } from '../dialogs/EditButtonDialog';
import {
  Sparkles,
  MessageSquare,
  Plus,
  HelpCircle,
  GitFork,
  ShoppingCart,
  UserCheck,
  Globe,
  Octagon,
  Edit,
} from 'lucide-react';

interface NodeEditorPanelProps {
  node?: Node;
  onUpdateNodeData: (nodeId: string, newData: Record<string, any>) => void;
}

export const NodeEditorPanel: React.FC<NodeEditorPanelProps> = ({ node, onUpdateNodeData }) => {
  const [isBtnDialogOpen, setIsBtnDialogOpen] = useState(false);
  const [editingButton, setEditingButton] = useState<{ label: string; value: string } | null>(null);

  if (!node) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 text-xs font-semibold select-none text-center p-8">
        Click on any node in the canvas to edit its properties.
      </div>
    );
  }

  const data = (node.data || {}) as Record<string, any>;

  const handleChange = (key: string, value: any) => {
    onUpdateNodeData(node.id, {
      ...data,
      [key]: value,
    });
  };

  const handleAddButton = () => {
    const currentBtns = (data.buttons || []) as Array<{ label: string; value: string }>;
    if (currentBtns.length >= 10) return;
    const newBtn = {
      label: `Button ${currentBtns.length + 1}`,
      value: `btn_${Date.now()}`,
    };
    handleChange('buttons', [...currentBtns, newBtn]);
  };

  const handleOpenEditButton = (btn: { label: string; value: string }) => {
    setEditingButton(btn);
    setIsBtnDialogOpen(true);
  };

  const handleSaveButton = (updated: { label: string; value: string }) => {
    const currentBtns = (data.buttons || []) as Array<{ label: string; value: string }>;
    const newBtns = currentBtns.map((b) => (b.value === editingButton?.value ? updated : b));
    handleChange('buttons', newBtns);
    setEditingButton(null);
  };

  const handleRemoveButton = () => {
    const currentBtns = (data.buttons || []) as Array<{ label: string; value: string }>;
    const newBtns = currentBtns.filter((b) => b.value !== editingButton?.value);
    handleChange('buttons', newBtns);
    setEditingButton(null);
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 font-sans">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <span className="w-10 h-10 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200 shadow-sm">
          {node.type === 'START' && <Sparkles size={20} className="text-indigo-700" />}
          {node.type === 'MESSAGE' && <MessageSquare size={20} className="text-sky-500" />}
          {node.type === 'INPUT' && <HelpCircle size={20} className="text-amber-500" />}
          {node.type === 'CONDITION' && <GitFork size={20} className="text-purple-700" />}
          {node.type === 'ORDER' && <ShoppingCart size={20} className="text-emerald-500" />}
          {node.type === 'LEAD' && <UserCheck size={20} className="text-sky-500" />}
          {node.type === 'API_CALL' && <Globe size={20} className="text-indigo-500" />}
          {node.type === 'END' && <Octagon size={20} className="text-slate-500" />}
        </span>
        <div>
          <h2 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider block">
            {node.type === 'START' && 'Start Trigger'}
            {node.type === 'MESSAGE' && 'Send Message'}
            {node.type === 'INPUT' && 'Input Prompt'}
            {node.type === 'CONDITION' && 'Condition Rule'}
            {node.type === 'ORDER' && 'Create Order'}
            {node.type === 'LEAD' && 'CRM Lead Capture'}
            {node.type === 'API_CALL' && 'API Integration'}
            {node.type === 'END' && 'End Session'}
          </h2>
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Node Settings</span>
        </div>
      </div>

      <div className="space-y-5">
        {node.type === 'START' && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 leading-relaxed">
            <p className="font-bold text-slate-800 mb-1">Onboarding Trigger</p>
            <p>This is the entry point of the bot dialog. It launches automatically when a user clicks /start or joins the chat.</p>
          </div>
        )}

        {node.type === 'MESSAGE' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="msgText" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Message Body
              </label>
              <textarea
                id="msgText"
                rows={5}
                value={data.text || ''}
                onChange={(e) => handleChange('text', e.target.value)}
                placeholder="Enter your message text..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition-all resize-none bg-slate-50/20"
              />
            </div>

            <div>
              <label htmlFor="msgImage" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Image Attachment URL (Optional)
              </label>
              <input
                id="msgImage"
                type="text"
                value={data.imageUrl || ''}
                onChange={(e) => handleChange('imageUrl', e.target.value)}
                placeholder="e.g. https://example.com/photo.jpg"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition-all bg-slate-50/20"
              />
            </div>

            <div className="pt-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Buttons ({data.buttons?.length || 0}/10)
                </span>
                <button
                  onClick={handleAddButton}
                  className="flex items-center gap-1 text-[10px] font-extrabold text-indigo-700 hover:text-indigo-700 transition-colors uppercase cursor-pointer"
                >
                  <Plus size={12} />
                  <span>Add Button</span>
                </button>
              </div>
              <div className="space-y-2">
                {((data.buttons || []) as Array<{ label: string; value: string }>).map((btn, idx: number) => (
                  <div
                    key={btn.value + idx}
                    className="flex justify-between items-center bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-semibold text-slate-700"
                  >
                    <span className="truncate">{btn.label}</span>
                    <button
                      onClick={() => handleOpenEditButton(btn)}
                      className="text-slate-400 hover:text-indigo-600 p-1 transition-colors cursor-pointer"
                    >
                      <Edit size={14} />
                    </button>
                  </div>
                ))}
                {(!data.buttons || data.buttons.length === 0) && (
                  <p className="text-[10px] text-slate-400 italic">No buttons configured. Next node will execute automatically.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {node.type === 'INPUT' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="inputPrompt" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Prompt Message
              </label>
              <textarea
                id="inputPrompt"
                rows={3}
                value={data.text || ''}
                onChange={(e) => handleChange('text', e.target.value)}
                placeholder="Enter prompt instruction..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition-all resize-none bg-slate-50/20"
              />
            </div>

            <div>
              <label htmlFor="inputVar" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Save Input to Variable Name
              </label>
              <input
                id="inputVar"
                type="text"
                value={data.variableName || ''}
                onChange={(e) => handleChange('variableName', e.target.value)}
                placeholder="e.g. user_phone"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition-all bg-slate-50/20 font-mono"
              />
            </div>
          </div>
        )}

        {node.type === 'CONDITION' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="condVar" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Variable Name to Check
              </label>
              <input
                id="condVar"
                type="text"
                value={data.variable || ''}
                onChange={(e) => handleChange('variable', e.target.value)}
                placeholder="e.g. user_phone"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition-all bg-slate-50/20 font-mono"
              />
            </div>

            <div>
              <label htmlFor="condOp" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Comparison Operator
              </label>
              <select
                id="condOp"
                value={data.operator || 'equals'}
                onChange={(e) => handleChange('operator', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition-all bg-white"
              >
                <option value="equals">Equals</option>
                <option value="not_equals">Does not equal</option>
                <option value="contains">Contains</option>
                <option value="not_empty">Is set / has value</option>
                <option value="empty">Is not set / empty</option>
              </select>
            </div>

            {data.operator !== 'not_empty' && data.operator !== 'empty' && (
              <div>
                <label htmlFor="condVal" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Comparison Value
                </label>
                <input
                  id="condVal"
                  type="text"
                  value={data.value || ''}
                  onChange={(e) => handleChange('value', e.target.value)}
                  placeholder="e.g. Yes"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition-all bg-slate-50/20"
                />
              </div>
            )}
          </div>
        )}

        {node.type === 'ORDER' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="orderProd" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Product Name
              </label>
              <input
                id="orderProd"
                type="text"
                value={data.productName || ''}
                onChange={(e) => handleChange('productName', e.target.value)}
                placeholder="e.g. Premium Plan Upgrade"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition-all bg-slate-50/20"
              />
            </div>

            <div>
              <label htmlFor="orderPrice" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Invoice Total Amount (Price)
              </label>
              <input
                id="orderPrice"
                type="text"
                value={data.price || ''}
                onChange={(e) => handleChange('price', e.target.value)}
                placeholder="e.g. 250"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition-all bg-slate-50/20"
              />
            </div>

            <div>
              <label htmlFor="orderCurr" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Currency
              </label>
              <select
                id="orderCurr"
                value={data.currency || 'UAH'}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition-all bg-white"
              >
                <option value="UAH">UAH (₴)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>

            <div>
              <label htmlFor="orderText" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Confirmation Reply Message (Optional)
              </label>
              <textarea
                id="orderText"
                rows={3}
                value={data.text || ''}
                onChange={(e) => handleChange('text', e.target.value)}
                placeholder="Reply sent to customer upon generation..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition-all resize-none bg-slate-50/20"
              />
            </div>
          </div>
        )}

        {node.type === 'LEAD' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-[11px] text-blue-800 leading-relaxed mb-4">
              Extracts lead parameters (Name, Email, Phone) from stored session variables and creates/updates a Lead record in CRM.
            </div>

            <div>
              <label htmlFor="leadName" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Lead Name Source Variable (Optional)
              </label>
              <input
                id="leadName"
                type="text"
                value={data.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Defaults to user_name"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition-all bg-slate-50/20 font-mono"
              />
            </div>

            <div>
              <label htmlFor="leadEmail" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Lead Email Source Variable (Optional)
              </label>
              <input
                id="leadEmail"
                type="text"
                value={data.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Defaults to user_email"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition-all bg-slate-50/20 font-mono"
              />
            </div>

            <div>
              <label htmlFor="leadPhone" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Lead Phone Source Variable (Optional)
              </label>
              <input
                id="leadPhone"
                type="text"
                value={data.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="Defaults to user_phone"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition-all bg-slate-50/20 font-mono"
              />
            </div>

            <div>
              <label htmlFor="leadText" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Confirmation Reply Message (Optional)
              </label>
              <textarea
                id="leadText"
                rows={3}
                value={data.text || ''}
                onChange={(e) => handleChange('text', e.target.value)}
                placeholder="Reply sent to customer upon capture..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition-all resize-none bg-slate-50/20"
              />
            </div>
          </div>
        )}

        {node.type === 'API_CALL' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="apiMethod" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                HTTP Method
              </label>
              <select
                id="apiMethod"
                value={data.method || 'GET'}
                onChange={(e) => handleChange('method', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition-all bg-white"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div>
              <label htmlFor="apiUrl" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Endpoint URL
              </label>
              <input
                id="apiUrl"
                type="text"
                value={data.url || ''}
                onChange={(e) => handleChange('url', e.target.value)}
                placeholder="e.g. https://api.mycrm.com/users"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition-all bg-slate-50/20 font-mono text-xs"
              />
            </div>
          </div>
        )}

        {node.type === 'END' && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 leading-relaxed">
            <p className="font-bold text-slate-800 mb-1">End Execution</p>
            <p>Closes active flow execution. The bot will wait for a new user message / start command to evaluate again.</p>
          </div>
        )}
      </div>

      <EditButtonDialog
        isOpen={isBtnDialogOpen}
        onClose={() => setIsBtnDialogOpen(false)}
        button={editingButton}
        onSave={handleSaveButton}
        onRemove={handleRemoveButton}
      />
    </div>
  );
};
