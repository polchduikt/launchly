import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBotStore } from '../../../store/useBotStore';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { useTranslation } from '../../../i18n/config';
import {
  useOrdersQuery,
  useUpdateOrderMutation,
} from '../../../hooks/crm/useCrmQueries';
import {
  Loader2,
  AlertCircle,
  Download,
  ShoppingCart,
  Plus
} from 'lucide-react';
import type { OrderStatus } from '../../../types/crm';
import { exportExcelApi } from '../../../api/integration';

export const OrdersPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const activeBotId = useBotStore((state) => state.activeBotId);
  const botId = activeBotId || 0;
  const { data: orders = [], isLoading: isOrdersLoading } = useOrdersQuery(botId);
  const updateOrderMut = useUpdateOrderMutation(botId);

  const [isExportingOrders, setIsExportingOrders] = useState(false);

  const handleExportExcel = async () => {
    setIsExportingOrders(true);
    try {
      const blob = await exportExcelApi(botId, 'ORDERS');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orders_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingOrders(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-[#F2EBDD] font-['JetBrains_Mono',monospace]">

        <header className="bg-[#F2EBDD] border-b-2 border-[#0A0A0A] px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div>
            <h1 className="font-['Anybody',sans-serif] text-xl font-black text-[#0A0A0A] uppercase tracking-tight">Orders</h1>
            <p className="text-xs text-[#0A0A0A]/70 font-bold">Track and manage your product orders</p>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          {botId === 0 ? (
            <div className="h-full flex items-center justify-center p-8 text-center bg-[#F2EBDD]">
              <div className="max-w-md space-y-4 font-['JetBrains_Mono',monospace] bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-10 shadow-[4px_4px_0px_#0A0A0A]">
                <div className="w-16 h-16 rounded-2xl bg-white border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] flex items-center justify-center mx-auto text-[#0A0A0A]">
                  <AlertCircle size={32} />
                </div>
                <p className="font-['Anybody',sans-serif] font-black text-[#0A0A0A] text-xl uppercase tracking-tight">
                  {t('crm.contacts.no_bot_title', 'No active bot found')}
                </p>
                <p className="font-['Geist',sans-serif] text-xs text-[#0A0A0A]/70 font-semibold max-w-xs mx-auto leading-relaxed">
                  Please connect a bot first to view orders.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => navigate('/connect-bot')}
                    className="px-6 py-3 bg-[#0A0A0A] text-[#F2EBDD] font-['JetBrains_Mono',monospace] text-xs font-black uppercase tracking-wider border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:bg-white hover:text-[#0A0A0A] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <Plus size={14} />
                    <span>{t('connect_bot.btn_connect_existing', 'Connect Bot')}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-6">
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center select-none">
                  <div className="flex items-center gap-2">
                    <ShoppingCart size={16} className="text-indigo-600" />
                    <h2 className="font-bold text-slate-800 text-sm">Product Orders</h2>
                  </div>
                  <button
                    onClick={handleExportExcel}
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
