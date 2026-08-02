import React, { useState, useEffect } from 'react';
import { t } from '../../i18n/config';
import { 
  CheckCircle2, 
  HelpCircle, 
  CreditCard, 
  AlertCircle, 
  Plus
} from 'lucide-react';
import { useBotStore } from '../../store/useBotStore';
import {
  useIntegrationsQuery,
  useCreateIntegrationMutation,
  useDeleteIntegrationMutation,
} from '../../hooks/integration/useIntegrationQueries';
import type { PaymentOrder } from '../../types/billing';
import type { IntegrationResponse } from '../../types';
import { paypalConfigSchema } from '../../schemas';

export const PaymentsPanel: React.FC = () => {
  const activeBotId = useBotStore((state) => state.activeBotId) || 0;
  const { data: integrations = [] } = useIntegrationsQuery();
  const createIntegrationMutation = useCreateIntegrationMutation();
  const deleteIntegrationMutation = useDeleteIntegrationMutation();
  const stripeIntegration = integrations.find((i: IntegrationResponse) => i.type === 'STRIPE');
  const paypalIntegration = integrations.find((i: IntegrationResponse) => i.type === 'PAYPAL');
  const [isStripeConnected, setIsStripeConnected] = useState(false);
  const [isStripeConnecting, setIsStripeConnecting] = useState(false);
  const [paypalClientId, setPaypalClientId] = useState('');
  const [paypalWebhookId, setPaypalWebhookId] = useState('');
  const [paypalLiveClientId, setPaypalLiveClientId] = useState('');
  const [paypalLiveWebhookId, setPaypalLiveWebhookId] = useState('');
  const [isPaypalConnected, setIsPaypalConnected] = useState(false);
  const [isPaypalConnecting, setIsPaypalConnecting] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [notifyMessenger, setNotifyMessenger] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [sendReceiptEmail, setSendReceiptEmail] = useState(false);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const stripeActive = stripeIntegration?.active;
  const paypalIntegrationId = paypalIntegration?.id;

  useEffect(() => {
    setIsStripeConnected(!!stripeActive);

    if (paypalIntegration) {
      setIsPaypalConnected(paypalIntegration.active);
      const cfg = paypalIntegration.config || {};
      setPaypalClientId(cfg.paypalClientId || '');
      setPaypalWebhookId(cfg.paypalWebhookId || '');
      setPaypalLiveClientId(cfg.paypalLiveClientId || '');
      setPaypalLiveWebhookId(cfg.paypalLiveWebhookId || '');
      setCurrency(cfg.currency || 'USD');
      setNotifyMessenger(!!cfg.notifyMessenger);
      setNotifyEmail(!!cfg.notifyEmail);
      setSendReceiptEmail(!!cfg.sendReceiptEmail);
      setOrders(Array.isArray(cfg.orders) ? cfg.orders : []);
    } else {
      setIsPaypalConnected(false);
    }
  }, [stripeActive, paypalIntegrationId]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleConnectStripe = async () => {
    if (isStripeConnected && stripeIntegration) {
      try {
        await deleteIntegrationMutation.mutateAsync(stripeIntegration.id);
        setIsStripeConnected(false);
        showNotification('success', t('settings.payments.stripe.disconnected_msg'));
      } catch (err) {
        console.error(err);
      }
      return;
    }

    setIsStripeConnecting(true);
    try {
      await createIntegrationMutation.mutateAsync({
        name: 'Stripe Payment Gateway',
        type: 'STRIPE' as IntegrationResponse['type'],
        botId: activeBotId,
        config: { connected: true },
      });
      setIsStripeConnected(true);
      showNotification('success', t('settings.payments.stripe.connected_msg'));
    } catch (err) {
      console.error(err);
      showNotification('error', 'Failed to connect Stripe');
    } finally {
      setIsStripeConnecting(false);
    }
  };

  const handleConnectPaypal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPaypalConnected && paypalIntegration) {
      try {
        await deleteIntegrationMutation.mutateAsync(paypalIntegration.id);
        setIsPaypalConnected(false);
        setPaypalClientId('');
        setPaypalWebhookId('');
        setPaypalLiveClientId('');
        setPaypalLiveWebhookId('');
        showNotification('success', t('settings.payments.paypal.disconnected_msg'));
      } catch (err) {
        console.error(err);
      }
      return;
    }

    const payload = {
      paypalClientId: paypalClientId.trim(),
      paypalWebhookId: paypalWebhookId.trim(),
      paypalLiveClientId: paypalLiveClientId.trim(),
      paypalLiveWebhookId: paypalLiveWebhookId.trim(),
      currency,
      notifyMessenger,
      notifyEmail,
      sendReceiptEmail,
    };

    const validation = paypalConfigSchema.safeParse(payload);
    if (!validation.success || !paypalClientId.trim() || !paypalWebhookId.trim() || !paypalLiveClientId.trim() || !paypalLiveWebhookId.trim()) {
      showNotification('error', t('settings.payments.paypal.error_fill'));
      return;
    }

    setIsPaypalConnecting(true);
    try {
      await createIntegrationMutation.mutateAsync({
        name: 'PayPal Payment Gateway',
        type: 'PAYPAL' as IntegrationResponse['type'],
        botId: activeBotId,
        config: {
          ...payload,
          orders,
        },
      });
      setIsPaypalConnected(true);
      showNotification('success', t('settings.payments.paypal.connected_msg'));
    } catch (err) {
      console.error(err);
      showNotification('error', 'Failed to connect PayPal');
    } finally {
      setIsPaypalConnecting(false);
    }
  };

  const handleSaveSettings = async (updates: Record<string, unknown>) => {
    showNotification('success', t('settings.payments.history.saved_msg'));
    if (paypalIntegration) {
      const updatedConfig = { ...paypalIntegration.config, ...updates };
      try {
        await createIntegrationMutation.mutateAsync({
          name: 'PayPal Payment Gateway',
          type: 'PAYPAL' as IntegrationResponse['type'],
          botId: activeBotId,
          config: updatedConfig,
        });
      } catch (err) {
        console.error('Failed to sync settings to DB:', err);
      }
    }
  };

  const handleGenerateTestOrder = () => {
    if (!isStripeConnected && !isPaypalConnected) {
      showNotification('error', t('settings.payments.history.connect_needed'));
      return;
    }

    const firstNames = ['John', 'Sarah', 'Alex', 'Elena', 'Michael', 'Emma', 'David', 'Sophie'];
    const lastNames = ['Smith', 'Miller', 'Jones', 'Petrenko', 'Doe', 'Ivanov', 'Brown', 'Davis'];
    const items = ['Standard Plan', 'Premium Plan Upgrade', 'Custom Chatbot Flow', 'Credits Pack (1000)', 'Enterprise Solution'];
    const prices = ['$19.00', '$49.00', '$99.00', '$29.00', '$299.00'];
    const gateways = isStripeConnected && isPaypalConnected 
      ? (Math.random() > 0.5 ? 'Stripe' : 'PayPal')
      : isStripeConnected ? 'Stripe' : 'PayPal';

    const randomIndex = Math.floor(Math.random() * firstNames.length);
    const randomItemIndex = Math.floor(Math.random() * items.length);

    const name = `${firstNames[randomIndex]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    const initials = name.split(' ').map(n => n[0]).join('');
    
    const colors = [
      'bg-indigo-500', 'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 
      'bg-pink-500', 'bg-rose-500', 'bg-amber-500', 'bg-teal-500'
    ];
    const avatarBg = colors[Math.floor(Math.random() * colors.length)];

    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const newOrder: PaymentOrder = {
      avatarText: initials,
      avatarBg,
      name,
      date: dateStr,
      orderId: `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`,
      itemPrice: prices[randomItemIndex],
      status: 'Successful',
      itemName: items[randomItemIndex],
      additionalInfo: `Paid via ${gateways}`
    };

    const updated = [newOrder, ...orders];
    setOrders(updated);
    handleSaveSettings({ orders: updated });
    showNotification('success', t('settings.payments.history.success_sim'));
  };

  const handleClearOrders = () => {
    setOrders([]);
    handleSaveSettings({ orders: [] });
    showNotification('success', t('settings.payments.history.success_clear'));
  };

  return (
    <div className="space-y-6 pb-10 font-['JetBrains_Mono',monospace]">
      {notification && (
        <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-2xl border-2 border-[#0A0A0A] shadow-[4px_4px_0px_0px_#0A0A0A] animate-in fade-in duration-200 ${
          notification.type === 'success' 
            ? 'bg-emerald-200 text-[#0A0A0A]' 
            : 'bg-rose-200 text-[#0A0A0A]'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 size={16} className="text-[#0A0A0A] shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-[#0A0A0A] shrink-0" />
          )}
          <span className="text-xs font-bold">{notification.message}</span>
        </div>
      )}
      <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl divide-y-2 divide-[#0A0A0A]/15 overflow-hidden">
        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start justify-between">
          <div className="w-full md:w-1/4">
            <h3 className="font-['Anybody',sans-serif] text-sm font-black text-[#0A0A0A] uppercase">{t('settings.payments.stripe.title')}</h3>
          </div>
          <div className="w-full md:w-5/12 flex flex-col gap-3">
            {isStripeConnected ? (
              <div className="p-4 rounded-2xl bg-white border-2 border-[#0A0A0A] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#0A0A0A] text-[#F2EBDD] flex items-center justify-center border-2 border-[#0A0A0A]">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0A0A0A]">{t('settings.payments.stripe.connected')}</div>
                    <div className="text-[10px] text-slate-700 font-bold mt-0.5">{t('settings.payments.stripe.mode')}</div>
                  </div>
                </div>
                <button
                  onClick={handleConnectStripe}
                  className="px-3 py-1.5 bg-rose-200 hover:bg-rose-600 hover:text-white border-2 border-[#0A0A0A] text-[#0A0A0A] text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer"
                >
                  {t('settings.payments.stripe.btn_disconnect')}
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectStripe}
                disabled={isStripeConnecting}
                className="w-fit px-4 py-2.5 bg-[#0A0A0A] hover:bg-[#2A2A2A] disabled:opacity-50 text-[#F2EBDD] text-xs font-black uppercase rounded-xl border-2 border-[#0A0A0A] transition-all cursor-pointer flex items-center gap-2"
              >
                {isStripeConnecting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t('settings.payments.stripe.connecting')}</span>
                  </>
                ) : (
                  <span>{t('settings.payments.stripe.btn_connect')}</span>
                )}
              </button>
            )}
          </div>
          <div className="w-full md:w-1/3 text-xs text-slate-700 font-bold leading-relaxed text-balance">
            {t('settings.payments.stripe.desc')}
          </div>
        </div>

        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start justify-between">
          <div className="w-full md:w-1/4">
            <h3 className="font-['Anybody',sans-serif] text-sm font-black text-[#0A0A0A] uppercase">{t('settings.payments.paypal.title')}</h3>
          </div>
          <div className="w-full md:w-5/12 flex flex-col gap-3.5">
            <a 
              href="https://developer.paypal.com" 
              target="_blank" 
              rel="noreferrer" 
              className="text-xs font-bold text-[#0A0A0A] underline uppercase flex items-center gap-1 w-fit"
            >
              {t('settings.payments.paypal.faq_link')}
            </a>

            {isPaypalConnected ? (
              <div className="p-4 rounded-2xl bg-white border-2 border-[#0A0A0A] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#0A0A0A] text-[#F2EBDD] flex items-center justify-center font-black text-xs border-2 border-[#0A0A0A]">
                    PP
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0A0A0A]">{t('settings.payments.paypal.connected')}</div>
                    <div className="text-[10px] text-slate-700 font-bold mt-0.5">{t('settings.payments.paypal.mode')}</div>
                  </div>
                </div>
                <button
                  onClick={handleConnectPaypal}
                  className="px-3 py-1.5 bg-rose-200 hover:bg-rose-600 hover:text-white border-2 border-[#0A0A0A] text-[#0A0A0A] text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer"
                >
                  {t('settings.payments.stripe.btn_disconnect')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleConnectPaypal} className="space-y-2.5">
                <input
                  type="text"
                  required
                  placeholder={t('settings.payments.paypal.placeholder_client')}
                  value={paypalClientId}
                  onChange={(e) => setPaypalClientId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold bg-white text-[#0A0A0A] focus:outline-none"
                />
                <input
                  type="text"
                  required
                  placeholder={t('settings.payments.paypal.placeholder_wh')}
                  value={paypalWebhookId}
                  onChange={(e) => setPaypalWebhookId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold bg-white text-[#0A0A0A] focus:outline-none"
                />
                <input
                  type="text"
                  required
                  placeholder={t('settings.payments.paypal.placeholder_live_client')}
                  value={paypalLiveClientId}
                  onChange={(e) => setPaypalLiveClientId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold bg-white text-[#0A0A0A] focus:outline-none"
                />
                <input
                  type="text"
                  required
                  placeholder={t('settings.payments.paypal.placeholder_live_wh')}
                  value={paypalLiveWebhookId}
                  onChange={(e) => setPaypalLiveWebhookId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold bg-white text-[#0A0A0A] focus:outline-none"
                />

                <button
                  type="submit"
                  disabled={isPaypalConnecting}
                  className="px-4 py-2.5 bg-[#0A0A0A] hover:bg-[#2A2A2A] disabled:opacity-50 text-[#F2EBDD] text-xs font-black uppercase rounded-xl border-2 border-[#0A0A0A] transition-all cursor-pointer flex items-center gap-2 mt-1"
                >
                  {isPaypalConnecting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{t('settings.payments.stripe.connecting')}</span>
                    </>
                  ) : (
                    <span>{t('settings.payments.paypal.btn_connect')}</span>
                  )}
                </button>
              </form>
            )}
          </div>
          <div className="w-full md:w-1/3 text-xs text-slate-700 font-bold leading-relaxed text-balance">
            {t('settings.payments.paypal.desc')}
          </div>
        </div>

        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start justify-between">
          <div className="w-full md:w-1/4">
            <h3 className="font-['Anybody',sans-serif] text-sm font-black text-[#0A0A0A] uppercase">{t('settings.payments.currency.title')}</h3>
          </div>
          <div className="w-full md:w-5/12">
            <select
              value={currency}
              onChange={(e) => {
                const val = e.target.value;
                setCurrency(val);
                handleSaveSettings({ currency: val });
              }}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold bg-white text-[#0A0A0A] focus:outline-none cursor-pointer"
            >
              <option value="USD">{t('settings.payments.currency.usd')}</option>
              <option value="EUR">{t('settings.payments.currency.eur')}</option>
              <option value="UAH">{t('settings.payments.currency.uah')}</option>
              <option value="GBP">{t('settings.payments.currency.gbp')}</option>
            </select>
          </div>
          <div className="w-full md:w-1/3 text-xs text-slate-700 font-bold leading-relaxed text-balance">
            {t('settings.payments.currency.desc')}
          </div>
        </div>

        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start justify-between">
          <div className="w-full md:w-1/4">
            <h3 className="font-['Anybody',sans-serif] text-sm font-black text-[#0A0A0A] uppercase">{t('settings.payments.notify.title')}</h3>
          </div>
          <div className="w-full md:w-5/12 flex flex-col gap-2.5 pt-1">
            <label className="flex items-center gap-2 text-xs font-bold text-[#0A0A0A] cursor-pointer">
              <input
                type="checkbox"
                checked={notifyMessenger}
                onChange={(e) => {
                  const val = e.target.checked;
                  setNotifyMessenger(val);
                  handleSaveSettings({ notifyMessenger: val });
                }}
                className="w-4 h-4 accent-[#0A0A0A] cursor-pointer"
              />
              <span className="flex items-center gap-1">
                {t('settings.payments.notify.messenger')}
                <span title={t('settings.payments.notify.messenger_tooltip')}>
                  <HelpCircle size={13} className="text-[#0A0A0A]" />
                </span>
              </span>
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-[#0A0A0A] cursor-pointer">
              <input
                type="checkbox"
                checked={notifyEmail}
                onChange={(e) => {
                  const val = e.target.checked;
                  setNotifyEmail(val);
                  handleSaveSettings({ notifyEmail: val });
                }}
                className="w-4 h-4 accent-[#0A0A0A] cursor-pointer"
              />
              <span>{t('settings.payments.notify.email')}</span>
            </label>
          </div>
          <div className="w-full md:w-1/3 text-xs text-slate-700 font-bold leading-relaxed text-balance">
            {t('settings.payments.notify.desc')}
          </div>
        </div>

        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start justify-between">
          <div className="w-full md:w-1/4">
            <h3 className="font-['Anybody',sans-serif] text-sm font-black text-[#0A0A0A] uppercase">{t('settings.payments.receipt.title')}</h3>
          </div>
          <div className="w-full md:w-5/12 pt-1">
            <label className="flex items-center gap-2 text-xs font-bold text-[#0A0A0A] cursor-pointer">
              <input
                type="checkbox"
                checked={sendReceiptEmail}
                onChange={(e) => {
                  const val = e.target.checked;
                  setSendReceiptEmail(val);
                  handleSaveSettings({ sendReceiptEmail: val });
                }}
                className="w-4 h-4 accent-[#0A0A0A] cursor-pointer"
              />
              <span>{t('settings.payments.receipt.email')}</span>
            </label>
          </div>
          <div className="w-full md:w-1/3 text-xs text-slate-700 font-bold leading-relaxed text-balance">
            {t('settings.payments.receipt.desc')}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2 select-none">
          <span className="text-xs font-black text-[#0A0A0A] uppercase tracking-wider">{t('settings.payments.history.total_orders')}</span>
          <div className="w-fit px-10 py-3.5 bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl text-center">
            <span className="text-3xl font-black text-[#0A0A0A] leading-none">
              {orders.length}
            </span>
          </div>
        </div>

        <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl p-6 md:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-['Anybody',sans-serif] text-md font-black text-[#0A0A0A] uppercase tracking-tight">{t('settings.payments.history.title')}</h2>
              <p className="text-xs text-slate-700 font-bold mt-0.5">{t('settings.payments.history.subtitle')}</p>
            </div>
            
            {(isStripeConnected || isPaypalConnected) && (
              <div className="flex items-center gap-2">
                {orders.length > 0 && (
                  <button 
                    onClick={handleClearOrders}
                    className="px-3 py-1.5 bg-white hover:bg-rose-600 hover:text-white border-2 border-[#0A0A0A] text-[#0A0A0A] text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer"
                  >
                    {t('settings.payments.history.btn_clear')}
                  </button>
                )}
                <button
                  onClick={handleGenerateTestOrder}
                  className="px-3.5 py-1.5 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-[#F2EBDD] border-2 border-[#0A0A0A] text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1"
                >
                  <Plus size={11} />
                  <span>{t('settings.payments.history.btn_simulate')}</span>
                </button>
              </div>
            )}
          </div>

          <div className="border-2 border-[#0A0A0A] rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F2EBDD] border-b-2 border-[#0A0A0A] text-[#0A0A0A] font-black uppercase tracking-wider">
                  <th className="px-5 py-3 select-none">{t('settings.payments.history.col.avatar')}</th>
                  <th className="px-5 py-3 select-none">{t('settings.payments.history.col.name')}</th>
                  <th className="px-5 py-3 select-none">{t('settings.payments.history.col.date')}</th>
                  <th className="px-5 py-3 select-none">{t('settings.payments.history.col.order_id')}</th>
                  <th className="px-5 py-3 select-none">{t('settings.payments.history.col.price')}</th>
                  <th className="px-5 py-3 select-none">{t('settings.payments.history.col.status')}</th>
                  <th className="px-5 py-3 select-none">{t('settings.payments.history.col.item_name')}</th>
                  <th className="px-5 py-3 select-none">{t('settings.payments.history.col.info')}</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#0A0A0A]/15 bg-white">
                {orders.map((order) => (
                  <tr key={order.orderId} className="hover:bg-[#F2EBDD]/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[#F2EBDD] text-[10px] font-black border-2 border-[#0A0A0A] bg-[#0A0A0A]`}>
                        {order.avatarText}
                      </div>
                    </td>
                    <td className="px-5 py-3 font-bold text-[#0A0A0A]">{order.name}</td>
                    <td className="px-5 py-3 text-slate-700 font-bold">{order.date}</td>
                    <td className="px-5 py-3 font-mono text-[10px] text-[#0A0A0A] font-bold">{order.orderId}</td>
                    <td className="px-5 py-3 font-bold text-[#0A0A0A]">{order.itemPrice}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-200 border-2 border-[#0A0A0A] text-[#0A0A0A]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A]" />
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-700 font-bold">{order.itemName}</td>
                    <td className="px-5 py-3 text-slate-700 font-bold">{order.additionalInfo}</td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-700 font-bold italic bg-white">
                      {t('settings.payments.history.empty')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
