import React, { useState, useEffect, useRef } from 'react';
import { useBotStore } from '../../../store/useBotStore';
import { DashboardLayout } from '../../../components/layouts/DashboardLayout';
import {
  useOrdersQuery,
  useLeadsQuery,
  useConversationsQuery,
  useMessagesQuery,
  useUpdateOrderMutation,
  useUpdateLeadMutation,
  useSendMessageMutation,
} from '../hooks/useCrmQueries';
import { useCrmWebSocket } from '../hooks/useCrmWebSocket';
import {
  MessageSquare,
  Users,
  ShoppingCart,
  Send,
  Loader2,
  AlertCircle,
  Download,
} from 'lucide-react';
import type { LeadStatus, OrderStatus } from '../../../types/crm';
import { exportExcelApi } from '../../integration/api/integration';

export const CrmPage: React.FC = () => {
  const activeBotId = useBotStore((state) => state.activeBotId);
  const botId = activeBotId || 0;
  useCrmWebSocket(botId);
  const [activeTab, setActiveTab] = useState<'chat' | 'contacts' | 'orders'>('chat');
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
  const [typedMessage, setTypedMessage] = useState('');
  const { data: conversations = [], isLoading: isConvLoading } = useConversationsQuery(botId);
  const { data: messages = [], isLoading: isMsgLoading } = useMessagesQuery(selectedConvId || 0);
  const { data: leads = [], isLoading: isLeadsLoading } = useLeadsQuery(botId);
  const { data: orders = [], isLoading: isOrdersLoading } = useOrdersQuery(botId);
  const updateOrderMut = useUpdateOrderMutation(botId);
  const updateLeadMut = useUpdateLeadMutation(botId);
  const sendMessageMut = useSendMessageMutation(selectedConvId || 0, botId);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (conversations.length > 0 && !selectedConvId) {
      setSelectedConvId(conversations[0].id);
    }
  }, [conversations, selectedConvId]);

  const handleSendMessage = () => {
    if (!typedMessage.trim() || !selectedConvId) return;
    sendMessageMut.mutate(typedMessage.trim());
    setTypedMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectedConversation = conversations.find((c) => c.id === selectedConvId);

  const [isExportingLeads, setIsExportingLeads] = useState(false);
  const [isExportingOrders, setIsExportingOrders] = useState(false);

  const handleExportExcel = async (type: 'LEADS' | 'ORDERS') => {
    if (type === 'LEADS') setIsExportingLeads(true);
    else setIsExportingOrders(true);

    try {
      const blob = await exportExcelApi(botId, type);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type.toLowerCase()}_bot_${botId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export Excel:', err);
    } finally {
      if (type === 'LEADS') setIsExportingLeads(false);
      else setIsExportingOrders(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-50 font-sans">

        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">CRM Workspace</h1>
            <p className="text-xs text-slate-400">Manage leads, track orders, and talk with subscribers in real-time</p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <MessageSquare size={14} />
              <span>Live Chat</span>
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'contacts'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users size={14} />
              <span>Contacts</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShoppingCart size={14} />
              <span>Orders</span>
            </button>
          </div>
        </header>


        <div className="flex-1 overflow-hidden">
          {botId === 0 ? (
            <div className="h-full flex items-center justify-center p-8 text-center">
              <div className="max-w-sm space-y-3">
                <AlertCircle size={40} className="text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700">No active bot found</p>
                <p className="text-xs text-slate-400">Please connect a bot first to access the CRM tools.</p>
              </div>
            </div>
          ) : activeTab === 'chat' ? (
            <div className="h-full flex overflow-hidden">

              <aside className="w-80 border-r border-slate-200 bg-white flex flex-col shrink-0">
                <div className="p-4 border-b border-slate-100 select-none">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Conversations</h3>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {isConvLoading ? (
                    <div className="p-8 flex justify-center">
                      <Loader2 className="animate-spin text-indigo-600" size={20} />
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 italic">No conversations logged yet.</div>
                  ) : (
                    conversations.map((c) => {
                      const isSelected = c.id === selectedConvId;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setSelectedConvId(c.id)}
                          className={`w-full text-left p-4 flex flex-col gap-1 transition-all cursor-pointer ${
                            isSelected ? 'bg-indigo-50/50 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-xs text-slate-800 truncate max-w-[140px]">
                              {c.botUserName}
                            </span>
                            {c.lastMessageAt && (
                              <span className="text-[10px] text-slate-400">
                                {new Date(c.lastMessageAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                          {c.botUserUsername && (
                            <span className="text-[10px] text-slate-400">@{c.botUserUsername}</span>
                          )}
                          <p className="text-xs text-slate-500 truncate mt-1">
                            {c.lastMessage || 'No messages'}
                          </p>
                        </button>
                      );
                    })
                  )}
                </div>
              </aside>


              <main className="flex-1 flex flex-col bg-slate-50">
                {selectedConvId ? (
                  <>

                    <div className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-sm z-10 shrink-0">
                      <div>
                        <h2 className="font-bold text-sm text-slate-800">
                          {selectedConversation?.botUserName}
                        </h2>
                        {selectedConversation?.botUserUsername && (
                          <span className="text-[10px] text-slate-400 block">
                            @{selectedConversation.botUserUsername}
                          </span>
                        )}
                      </div>
                    </div>


                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {isMsgLoading ? (
                        <div className="h-full flex items-center justify-center">
                          <Loader2 className="animate-spin text-indigo-600" size={24} />
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                          No messages in this thread.
                        </div>
                      ) : (
                        messages.map((m) => {
                          const isOwner = m.senderType === 'OWNER';
                          return (
                            <div
                              key={m.id}
                              className={`flex ${isOwner ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className="max-w-[70%] space-y-1">
                                <div
                                  className={`p-3.5 text-xs font-semibold leading-relaxed shadow-sm ${
                                    isOwner
                                      ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none'
                                      : 'bg-white text-slate-800 rounded-2xl rounded-tl-none border border-slate-200/50'
                                  }`}
                                >
                                  {m.content}
                                </div>
                                <span
                                  className={`text-[9px] text-slate-400 block ${
                                    isOwner ? 'text-right' : 'text-left'
                                  }`}
                                >
                                  {new Date(m.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>


                    <div className="bg-white border-t border-slate-200 p-4 flex gap-3 items-end shrink-0 shadow-lg">
                      <textarea
                        value={typedMessage}
                        onChange={(e) => setTypedMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type your reply here... (Press Enter to Send)"
                        rows={2}
                        className="flex-1 border border-slate-200 rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-indigo-600 resize-none transition-all"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!typedMessage.trim() || sendMessageMut.isPending}
                        className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer shadow shadow-indigo-100 shrink-0"
                      >
                        {sendMessageMut.isPending ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <Send size={16} />
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                    Select a conversation to start chatting.
                  </div>
                )}
              </main>
            </div>
          ) : activeTab === 'contacts' ? (
            <div className="h-full overflow-y-auto p-6">
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center select-none">
                  <h2 className="font-bold text-slate-800 text-sm">Leads Contacts</h2>
                  <button
                    onClick={() => handleExportExcel('LEADS')}
                    disabled={isExportingLeads || leads.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 text-xs font-bold rounded-xl transition-all border border-indigo-100 cursor-pointer shadow-sm shadow-indigo-50/50"
                  >
                    {isExportingLeads ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      <Download size={14} />
                    )}
                    <span>Export to Excel</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider select-none">
                        <th className="py-3 px-6">Name</th>
                        <th className="py-3 px-6">Email</th>
                        <th className="py-3 px-6">Phone</th>
                        <th className="py-3 px-6">Status</th>
                        <th className="py-3 px-6">Captured At</th>
                        <th className="py-3 px-6">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                      {isLeadsLoading ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center">
                            <Loader2 className="animate-spin text-indigo-600 mx-auto" size={24} />
                          </td>
                        </tr>
                      ) : leads.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                            No leads captured yet.
                          </td>
                        </tr>
                      ) : (
                        leads.map((l) => (
                          <tr key={l.id} className="hover:bg-slate-50/50">
                            <td className="py-4 px-6 font-bold text-slate-900">{l.name}</td>
                            <td className="py-4 px-6">{l.email || '—'}</td>
                            <td className="py-4 px-6">{l.phone || '—'}</td>
                            <td className="py-4 px-6">
                              <select
                                value={l.status}
                                onChange={(e) =>
                                  updateLeadMut.mutate({
                                    leadId: l.id,
                                    status: e.target.value as LeadStatus,
                                    notes: l.notes || '',
                                  })
                                }
                                className={`px-2 py-1 rounded-lg border font-bold text-[10px] cursor-pointer focus:outline-none transition-all ${
                                  l.status === 'NEW'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : l.status === 'CONTACTED'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : l.status === 'QUALIFIED'
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : l.status === 'CONVERTED'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-slate-200 text-slate-700 border-slate-200'
                                }`}
                              >
                                <option value="NEW">New</option>
                                <option value="CONTACTED">Contacted</option>
                                <option value="QUALIFIED">Qualified</option>
                                <option value="CONVERTED">Converted</option>
                                <option value="LOST">Lost</option>
                              </select>
                            </td>
                            <td className="py-4 px-6 text-slate-400 text-[11px]">
                              {new Date(l.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-6">
                              <input
                                type="text"
                                defaultValue={l.notes || ''}
                                onBlur={(e) => {
                                  if (e.target.value !== (l.notes || '')) {
                                    updateLeadMut.mutate({
                                      leadId: l.id,
                                      status: l.status,
                                      notes: e.target.value,
                                    });
                                  }
                                }}
                                placeholder="Click to add notes..."
                                className="w-full bg-transparent hover:bg-slate-100/50 focus:bg-white border border-transparent focus:border-slate-200 rounded px-2 py-1 transition-all focus:outline-none placeholder:italic"
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-6">
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center select-none">
                  <h2 className="font-bold text-slate-800 text-sm">Product Orders</h2>
                  <button
                    onClick={() => handleExportExcel('ORDERS')}
                    disabled={isExportingOrders || orders.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 text-xs font-bold rounded-xl transition-all border border-indigo-100 cursor-pointer shadow-sm shadow-indigo-50/50"
                  >
                    {isExportingOrders ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      <Download size={14} />
                    )}
                    <span>Export to Excel</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider select-none">
                        <th className="py-3 px-6">Order Number</th>
                        <th className="py-3 px-6">Customer</th>
                        <th className="py-3 px-6">Items Details</th>
                        <th className="py-3 px-6">Amount</th>
                        <th className="py-3 px-6">Status</th>
                        <th className="py-3 px-6">Date</th>
                        <th className="py-3 px-6">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                      {isOrdersLoading ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center">
                            <Loader2 className="animate-spin text-indigo-600 mx-auto" size={24} />
                          </td>
                        </tr>
                      ) : orders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                            No orders placed yet.
                          </td>
                        </tr>
                      ) : (
                        orders.map((o) => (
                          <tr key={o.id} className="hover:bg-slate-50/50">
                            <td className="py-4 px-6 font-bold text-slate-900">{o.orderNumber}</td>
                            <td className="py-4 px-6">{o.botUserName}</td>
                            <td className="py-4 px-6 max-w-xs truncate" title={o.items || ''}>
                              {o.items || '—'}
                            </td>
                            <td className="py-4 px-6">
                              {o.totalAmount} {o.currency}
                            </td>
                            <td className="py-4 px-6">
                              <select
                                value={o.status}
                                onChange={(e) =>
                                  updateOrderMut.mutate({
                                    orderId: o.id,
                                    status: e.target.value as OrderStatus,
                                    notes: o.notes || '',
                                  })
                                }
                                className={`px-2 py-1 rounded-lg border font-bold text-[10px] cursor-pointer focus:outline-none transition-all ${
                                  o.status === 'NEW'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : o.status === 'IN_PROGRESS'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : o.status === 'COMPLETED'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                <option value="NEW">New</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                              </select>
                            </td>
                            <td className="py-4 px-6 text-slate-400 text-[11px]">
                              {new Date(o.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-6">
                              <input
                                type="text"
                                defaultValue={o.notes || ''}
                                onBlur={(e) => {
                                  if (e.target.value !== (o.notes || '')) {
                                    updateOrderMut.mutate({
                                      orderId: o.id,
                                      status: o.status,
                                      notes: e.target.value,
                                    });
                                  }
                                }}
                                placeholder="Click to add notes..."
                                className="w-full bg-transparent hover:bg-slate-100/50 focus:bg-white border border-transparent focus:border-slate-200 rounded px-2 py-1 transition-all focus:outline-none placeholder:italic"
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
