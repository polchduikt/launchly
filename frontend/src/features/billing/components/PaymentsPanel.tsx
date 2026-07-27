import React, { useState, useEffect } from 'react';
import { t } from '../../../i18n/config';
import { 
  CheckCircle2, 
  HelpCircle, 
  CreditCard, 
  AlertCircle, 
  Plus
} from 'lucide-react';

interface Order {
  avatarText: string;
  avatarBg: string;
  name: string;
  date: string;
  orderId: string;
  itemPrice: string;
  status: 'Successful' | 'Refunded' | 'Failed';
  itemName: string;
  additionalInfo: string;
}

export const PaymentsPanel: React.FC = () => {
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const savedStripe = localStorage.getItem('launchly_payments_stripe_connected');
    if (savedStripe === 'true') setIsStripeConnected(true);

    const savedPaypal = localStorage.getItem('launchly_payments_paypal_connected');
    if (savedPaypal === 'true') {
      setIsPaypalConnected(true);
      setPaypalClientId(localStorage.getItem('launchly_payments_paypal_client') || '');
      setPaypalWebhookId(localStorage.getItem('launchly_payments_paypal_wh') || '');
      setPaypalLiveClientId(localStorage.getItem('launchly_payments_paypal_live_client') || '');
      setPaypalLiveWebhookId(localStorage.getItem('launchly_payments_paypal_live_wh') || '');
    }

    const savedCurrency = localStorage.getItem('launchly_payments_currency');
    if (savedCurrency) setCurrency(savedCurrency);

    setNotifyMessenger(localStorage.getItem('launchly_payments_notify_messenger') === 'true');
    setNotifyEmail(localStorage.getItem('launchly_payments_notify_email') === 'true');
    setSendReceiptEmail(localStorage.getItem('launchly_payments_send_receipt') === 'true');

    const savedOrders = localStorage.getItem('launchly_payments_orders');
    if (savedOrders) {
      try {
        setOrders(JSON.parse(savedOrders));
      } catch (e) {
        console.error('Failed to parse saved orders', e);
      }
    }
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleConnectStripe = () => {
    if (isStripeConnected) {
      setIsStripeConnected(false);
      localStorage.removeItem('launchly_payments_stripe_connected');
      showNotification('success', t('settings.payments.stripe.disconnected_msg'));
      return;
    }

    setIsStripeConnecting(true);
    setTimeout(() => {
      setIsStripeConnecting(false);
      setIsStripeConnected(true);
      localStorage.setItem('launchly_payments_stripe_connected', 'true');
      showNotification('success', t('settings.payments.stripe.connected_msg'));
    }, 1500);
  };

  const handleConnectPaypal = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPaypalConnected) {
      setIsPaypalConnected(false);
      localStorage.removeItem('launchly_payments_paypal_connected');
      localStorage.removeItem('launchly_payments_paypal_client');
      localStorage.removeItem('launchly_payments_paypal_wh');
      localStorage.removeItem('launchly_payments_paypal_live_client');
      localStorage.removeItem('launchly_payments_paypal_live_wh');
      setPaypalClientId('');
      setPaypalWebhookId('');
      setPaypalLiveClientId('');
      setPaypalLiveWebhookId('');
      showNotification('success', t('settings.payments.paypal.disconnected_msg'));
      return;
    }

    if (!paypalClientId.trim() || !paypalWebhookId.trim() || !paypalLiveClientId.trim() || !paypalLiveWebhookId.trim()) {
      showNotification('error', t('settings.payments.paypal.error_fill'));
      return;
    }

    setIsPaypalConnecting(true);
    setTimeout(() => {
      setIsPaypalConnecting(false);
      setIsPaypalConnected(true);
      localStorage.setItem('launchly_payments_paypal_connected', 'true');
      localStorage.setItem('launchly_payments_paypal_client', paypalClientId);
      localStorage.setItem('launchly_payments_paypal_wh', paypalWebhookId);
      localStorage.setItem('launchly_payments_paypal_live_client', paypalLiveClientId);
      localStorage.setItem('launchly_payments_paypal_live_wh', paypalLiveWebhookId);
      showNotification('success', t('settings.payments.paypal.connected_msg'));
    }, 1500);
  };

  const handleSaveSettings = (key: string, value: any) => {
    localStorage.setItem(key, String(value));
    showNotification('success', t('settings.payments.history.saved_msg'));
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

    const newOrder: Order = {
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
    localStorage.setItem('launchly_payments_orders', JSON.stringify(updated));
    showNotification('success', t('settings.payments.history.success_sim'));
  };

  const handleClearOrders = () => {
    setOrders([]);
    localStorage.removeItem('launchly_payments_orders');
    showNotification('success', t('settings.payments.history.success_clear'));
  };

  return (
    <div className="space-y-6 pb-10">
      {notification && (
        <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border animate-in slide-in-from-top-4 duration-300 ${
          notification.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
          )}
          <span className="text-xs font-bold">{notification.message}</span>
        </div>
      )}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm divide-y divide-slate-100 overflow-hidden">
        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start justify-between">
          <div className="w-full md:w-1/4">
            <h3 className="font-bold text-sm text-slate-800">{t('settings.payments.stripe.title')}</h3>
          </div>
          <div className="w-full md:w-5/12 flex flex-col gap-3">
            {isStripeConnected ? (
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{t('settings.payments.stripe.connected')}</div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{t('settings.payments.stripe.mode')}</div>
                  </div>
                </div>
                <button
                  onClick={handleConnectStripe}
                  className="px-3 py-1.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                >
                  {t('settings.payments.stripe.btn_disconnect')}
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectStripe}
                disabled={isStripeConnecting}
                className="w-fit px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm cursor-pointer shadow-indigo-100 flex items-center gap-2"
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
          <div className="w-full md:w-1/3 text-xs text-slate-400 leading-relaxed text-balance">
            {t('settings.payments.stripe.desc')}
          </div>
        </div>

        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start justify-between">
          <div className="w-full md:w-1/4">
            <h3 className="font-bold text-sm text-slate-800">{t('settings.payments.paypal.title')}</h3>
          </div>
          <div className="w-full md:w-5/12 flex flex-col gap-3.5">
            <a 
              href="https://developer.paypal.com" 
              target="_blank" 
              rel="noreferrer" 
              className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 w-fit"
            >
              {t('settings.payments.paypal.faq_link')}
            </a>

            {isPaypalConnected ? (
              <div className="p-4 rounded-2xl bg-sky-50/40 border border-sky-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-sm font-black text-xs">
                    PP
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{t('settings.payments.paypal.connected')}</div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{t('settings.payments.paypal.mode')}</div>
                  </div>
                </div>
                <button
                  onClick={handleConnectPaypal}
                  className="px-3 py-1.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
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
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-400 bg-slate-50/20"
                />
                <input
                  type="text"
                  required
                  placeholder={t('settings.payments.paypal.placeholder_wh')}
                  value={paypalWebhookId}
                  onChange={(e) => setPaypalWebhookId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-400 bg-slate-50/20"
                />
                <input
                  type="text"
                  required
                  placeholder={t('settings.payments.paypal.placeholder_live_client')}
                  value={paypalLiveClientId}
                  onChange={(e) => setPaypalLiveClientId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-400 bg-slate-50/20"
                />
                <input
                  type="text"
                  required
                  placeholder={t('settings.payments.paypal.placeholder_live_wh')}
                  value={paypalLiveWebhookId}
                  onChange={(e) => setPaypalLiveWebhookId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-400 bg-slate-50/20"
                />

                <button
                  type="submit"
                  disabled={isPaypalConnecting}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm cursor-pointer shadow-indigo-100 flex items-center gap-2 mt-1"
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
          <div className="w-full md:w-1/3 text-xs text-slate-400 leading-relaxed text-balance">
            {t('settings.payments.paypal.desc')}
          </div>
        </div>
        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start justify-between">
          <div className="w-full md:w-1/4">
            <h3 className="font-bold text-sm text-slate-800">{t('settings.payments.currency.title')}</h3>
          </div>
          <div className="w-full md:w-5/12">
            <select
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value);
                handleSaveSettings('launchly_payments_currency', e.target.value);
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-indigo-500 transition-all bg-white"
            >
              <option value="USD">{t('settings.payments.currency.usd')}</option>
              <option value="EUR">{t('settings.payments.currency.eur')}</option>
              <option value="UAH">{t('settings.payments.currency.uah')}</option>
              <option value="GBP">{t('settings.payments.currency.gbp')}</option>
            </select>
          </div>
          <div className="w-full md:w-1/3 text-xs text-slate-400 leading-relaxed text-balance">
            {t('settings.payments.currency.desc')}
          </div>
        </div>
        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start justify-between">
          <div className="w-full md:w-1/4">
            <h3 className="font-bold text-sm text-slate-800">{t('settings.payments.notify.title')}</h3>
          </div>
          <div className="w-full md:w-5/12 flex flex-col gap-2.5 pt-1">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyMessenger}
                onChange={(e) => {
                  setNotifyMessenger(e.target.checked);
                  handleSaveSettings('launchly_payments_notify_messenger', e.target.checked);
                }}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <span className="flex items-center gap-1">
                {t('settings.payments.notify.messenger')}
                <HelpCircle size={13} className="text-slate-400" title={t('settings.payments.notify.messenger_tooltip')} />
              </span>
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyEmail}
                onChange={(e) => {
                  setNotifyEmail(e.target.checked);
                  handleSaveSettings('launchly_payments_notify_email', e.target.checked);
                }}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <span>{t('settings.payments.notify.email')}</span>
            </label>
          </div>
          <div className="w-full md:w-1/3 text-xs text-slate-400 leading-relaxed text-balance">
            {t('settings.payments.notify.desc')}
          </div>
        </div>
        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start justify-between">
          <div className="w-full md:w-1/4">
            <h3 className="font-bold text-sm text-slate-800">{t('settings.payments.receipt.title')}</h3>
          </div>
          <div className="w-full md:w-5/12 pt-1">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={sendReceiptEmail}
                onChange={(e) => {
                  setSendReceiptEmail(e.target.checked);
                  handleSaveSettings('launchly_payments_send_receipt', e.target.checked);
                }}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <span>{t('settings.payments.receipt.email')}</span>
            </label>
          </div>
          <div className="w-full md:w-1/3 text-xs text-slate-400 leading-relaxed text-balance">
            {t('settings.payments.receipt.desc')}
          </div>
        </div>

      </div>
      <div className="space-y-4">
        <div className="space-y-2 select-none">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('settings.payments.history.total_orders')}</span>
          <div className="w-fit px-10 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm text-center">
            <span className="text-3xl font-black text-emerald-600 leading-none">
              {orders.length}
            </span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 md:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-md font-extrabold text-slate-800 tracking-tight">{t('settings.payments.history.title')}</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">{t('settings.payments.history.subtitle')}</p>
            </div>
            
            {(isStripeConnected || isPaypalConnected) && (
              <div className="flex items-center gap-2">
                {orders.length > 0 && (
                  <button 
                    onClick={handleClearOrders}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                  >
                    {t('settings.payments.history.btn_clear')}
                  </button>
                )}
                <button
                  onClick={handleGenerateTestOrder}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg transition-all shadow-xs cursor-pointer shadow-indigo-100 flex items-center gap-1"
                >
                  <Plus size={11} />
                  <span>{t('settings.payments.history.btn_simulate')}</span>
                </button>
              </div>
            )}
          </div>

          <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold uppercase tracking-wider">
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
              <tbody className="divide-y divide-slate-100 bg-white">
                {orders.map((order) => (
                  <tr key={order.orderId} className="hover:bg-slate-50/20 transition-colors">
                    <td className="px-5 py-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-inner ${order.avatarBg}`}>
                        {order.avatarText}
                      </div>
                    </td>
                    <td className="px-5 py-3 font-bold text-slate-700">{order.name}</td>
                    <td className="px-5 py-3 text-slate-500 font-medium">{order.date}</td>
                    <td className="px-5 py-3 font-mono text-[10px] text-slate-400 font-bold">{order.orderId}</td>
                    <td className="px-5 py-3 font-bold text-slate-700">{order.itemPrice}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600 font-medium">{order.itemName}</td>
                    <td className="px-5 py-3 text-slate-400 font-medium">{order.additionalInfo}</td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400 font-semibold bg-slate-50/10">
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
