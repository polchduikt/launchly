import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  X, 
  HelpCircle, 
  CreditCard, 
  AlertCircle, 
  DollarSign, 
  Mail, 
  MessageSquare,
  Sparkles,
  ShoppingBag,
  ArrowRight,
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
      showNotification('success', 'Stripe account disconnected successfully.');
      return;
    }

    setIsStripeConnecting(true);
    setTimeout(() => {
      setIsStripeConnecting(false);
      setIsStripeConnected(true);
      localStorage.setItem('launchly_payments_stripe_connected', 'true');
      showNotification('success', 'Stripe account connected successfully!');
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
      showNotification('success', 'PayPal account disconnected successfully.');
      return;
    }

    if (!paypalClientId.trim() || !paypalWebhookId.trim() || !paypalLiveClientId.trim() || !paypalLiveWebhookId.trim()) {
      showNotification('error', 'Please fill in all PayPal Client ID and Webhook ID fields.');
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
      showNotification('success', 'PayPal account connected successfully!');
    }, 1500);
  };

  const handleSaveSettings = (key: string, value: any) => {
    localStorage.setItem(key, String(value));
    showNotification('success', 'Setting saved successfully.');
  };
  const handleGenerateTestOrder = () => {
    if (!isStripeConnected && !isPaypalConnected) {
      showNotification('error', 'Please connect Stripe or PayPal to simulate orders.');
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
    showNotification('success', 'Simulated order created successfully!');
  };

  const handleClearOrders = () => {
    setOrders([]);
    localStorage.removeItem('launchly_payments_orders');
    showNotification('success', 'Order history cleared.');
  };

  return (
    <div className="space-y-6">
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
            <h3 className="font-bold text-sm text-slate-800">Stripe Account</h3>
          </div>
          <div className="w-full md:w-5/12 flex flex-col gap-3">
            {isStripeConnected ? (
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Connected to Stripe</div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Live Mode • USD</div>
                  </div>
                </div>
                <button
                  onClick={handleConnectStripe}
                  className="px-3 py-1.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                >
                  Disconnect
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
                    <span>Connecting...</span>
                  </>
                ) : (
                  <span>Connect Stripe Account</span>
                )}
              </button>
            )}
          </div>
          <div className="w-full md:w-1/3 text-xs text-slate-400 leading-relaxed">
            You can accept payments via Messenger and Instagram. You need to connect an existing Stripe account or create a new one to access Buy Button in your Automations. Buy Button can be used with Card, Gallery, List or Media Template elements. <a href="https://stripe.com" target="_blank" rel="noreferrer" className="text-indigo-600 font-bold hover:underline">Learn more</a>
          </div>
        </div>

        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start justify-between">
          <div className="w-full md:w-1/4">
            <h3 className="font-bold text-sm text-slate-800">PayPal Account</h3>
          </div>
          <div className="w-full md:w-5/12 flex flex-col gap-3.5">
            <a 
              href="https://developer.paypal.com" 
              target="_blank" 
              rel="noreferrer" 
              className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 w-fit"
            >
              How can I find needed Client ID and Webhook ID?
            </a>

            {isPaypalConnected ? (
              <div className="p-4 rounded-2xl bg-sky-50/40 border border-sky-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-sm font-black text-xs">
                    PP
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Connected to PayPal</div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Test & Live Mode</div>
                  </div>
                </div>
                <button
                  onClick={handleConnectPaypal}
                  className="px-3 py-1.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <form onSubmit={handleConnectPaypal} className="space-y-2.5">
                <input
                  type="text"
                  required
                  placeholder="Client ID"
                  value={paypalClientId}
                  onChange={(e) => setPaypalClientId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-400 bg-slate-50/20"
                />
                <input
                  type="text"
                  required
                  placeholder="Webhook ID"
                  value={paypalWebhookId}
                  onChange={(e) => setPaypalWebhookId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-400 bg-slate-50/20"
                />
                <input
                  type="text"
                  required
                  placeholder="Live Client ID"
                  value={paypalLiveClientId}
                  onChange={(e) => setPaypalLiveClientId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-400 bg-slate-50/20"
                />
                <input
                  type="text"
                  required
                  placeholder="Live Webhook ID"
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
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <span>Connect PayPal Account</span>
                  )}
                </button>
              </form>
            )}
          </div>
          <div className="w-full md:w-1/3 text-xs text-slate-400 leading-relaxed">
            You can accept PayPal payments via Messenger and Instagram. You need to connect an existing PayPal Business account to access Buy Button in your Automation.
          </div>
        </div>
        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start justify-between">
          <div className="w-full md:w-1/4">
            <h3 className="font-bold text-sm text-slate-800">Currency</h3>
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
              <option value="USD">US Dollar</option>
              <option value="EUR">Euro</option>
              <option value="UAH">Ukrainian Hryvnia</option>
              <option value="GBP">British Pound</option>
            </select>
          </div>
          <div className="w-full md:w-1/3 text-xs text-slate-400 leading-relaxed">
            Select currency type.
          </div>
        </div>
        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start justify-between">
          <div className="w-full md:w-1/4">
            <h3 className="font-bold text-sm text-slate-800">Notify Assignees About New Orders</h3>
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
                Messenger 
                <HelpCircle size={13} className="text-slate-400" title="Sends a push notification inside the Launchly Inbox to active operators" />
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
              <span>Email</span>
            </label>
          </div>
          <div className="w-full md:w-1/3 text-xs text-slate-400 leading-relaxed">
            Notify Assignees when a new payment received.
          </div>
        </div>
        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start justify-between">
          <div className="w-full md:w-1/4">
            <h3 className="font-bold text-sm text-slate-800">Send To Contact Successful Charge Receipt</h3>
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
              <span>Email</span>
            </label>
          </div>
          <div className="w-full md:w-1/3 text-xs text-slate-400 leading-relaxed">
            To notify a user about successful payment by e-mail, you have to tick the box in Manychat Payments and set this option up in your Stripe account by following <a href="https://stripe.com" target="_blank" rel="noreferrer" className="text-indigo-600 font-bold hover:underline">this link</a>
          </div>
        </div>

      </div>
      <div className="space-y-4">
        <div className="space-y-2 select-none">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Orders:</span>
          <div className="w-fit px-10 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm text-center">
            <span className="text-3xl font-black text-emerald-600 leading-none">
              {orders.length}
            </span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 md:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-md font-extrabold text-slate-800 tracking-tight">Purchase History</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Real-time log of customer payments processed through automations.</p>
            </div>
            
            {(isStripeConnected || isPaypalConnected) && (
              <div className="flex items-center gap-2">
                {orders.length > 0 && (
                  <button 
                    onClick={handleClearOrders}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                  >
                    Clear History
                  </button>
                )}
                <button
                  onClick={handleGenerateTestOrder}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg transition-all shadow-xs cursor-pointer shadow-indigo-100 flex items-center gap-1"
                >
                  <Plus size={11} />
                  <span>Simulate Order</span>
                </button>
              </div>
            )}
          </div>

          <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="px-5 py-3 select-none">Avatar</th>
                  <th className="px-5 py-3 select-none">Name</th>
                  <th className="px-5 py-3 select-none">Date</th>
                  <th className="px-5 py-3 select-none">Order ID</th>
                  <th className="px-5 py-3 select-none">Item Price</th>
                  <th className="px-5 py-3 select-none">Status</th>
                  <th className="px-5 py-3 select-none">Item Name</th>
                  <th className="px-5 py-3 select-none">Additional Information</th>
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
                      No orders yet
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
