import React from 'react';
import { LegalLayout } from './LegalLayout';

export const PaymentTermsPage: React.FC = () => {
  return (
    <LegalLayout title="Payment & Merchant Terms" effectiveDate="AUGUST 14, 2026">
      <p className="text-base font-medium text-slate-900 leading-relaxed">
        These Payment &amp; Merchant Terms (&quot;Payment Terms&quot;) govern the configuration, integration, and processing of monetary transactions executed through chatbots, visual flows, and payment nodes created on the Launchly platform.
      </p>

      <h2 className="text-xl font-black text-slate-950 pt-4 border-t border-slate-200">
        1. Merchant Integration &amp; Platform Role
      </h2>
      <p>
        Launchly provides software infrastructure allowing Workspace Owners (&quot;Merchants&quot;) to integrate third-party payment processing gateways (e.g., Stripe, Monobank, WayForPay, PayPal) into Telegram chatbots.
      </p>
      <ul className="list-square pl-6 space-y-2 text-slate-800 font-medium">
        <li><strong>SaaS Provider Only:</strong> Launchly acts solely as a technical intermediary and SaaS platform. Launchly is not a bank, payment processor, money transmitter, or Merchant of Record for products or services sold by Merchants through chatbots.</li>
        <li><strong>Direct Relationship:</strong> The contract for purchase of goods or services is formed directly between the Merchant and the end buyer (&quot;Customer&quot;).</li>
      </ul>

      <h2 className="text-xl font-black text-slate-950 pt-4 border-t border-slate-200">
        2. Merchant Responsibilities
      </h2>
      <p>
        By connecting a payment gateway node to a Launchly chatbot, the Merchant represents and warrants that:
      </p>
      <ul className="list-square pl-6 space-y-2 text-slate-800 font-medium">
        <li>They hold all necessary licenses, permits, and legal registrations to sell their products or services.</li>
        <li>They provide accurate pricing, descriptions, refund policies, and contact information to Customers within the chatbot flow.</li>
        <li>They comply with all applicable tax laws, invoicing regulations, and consumer protection legislation.</li>
      </ul>

      <h2 className="text-xl font-black text-slate-950 pt-4 border-t border-slate-200">
        3. Refunds, Chargebacks &amp; Disputes
      </h2>
      <p>
        Launchly does not hold customer funds, process payouts, or handle customer support for transactions conducted through Merchant chatbots.
      </p>
      <ul className="list-square pl-6 space-y-2 text-slate-800 font-medium">
        <li><strong>Dispute Resolution:</strong> All refund requests, payment cancellations, and chargeback disputes must be handled directly between the Customer and the Merchant via the connected payment gateway dashboard.</li>
        <li><strong>No Liability:</strong> Launchly is not liable for unauthorized transactions, failed API webhook callbacks, or financial losses arising from payment gateway outages.</li>
      </ul>

      <h2 className="text-xl font-black text-slate-950 pt-4 border-t border-slate-200">
        4. Prohibited Merchant Activities
      </h2>
      <p>
        Merchants are strictly prohibited from using Launchly payment nodes to collect payments for:
      </p>
      <ul className="list-square pl-6 space-y-2 text-slate-800 font-medium">
        <li>Illegal goods, counterfeit items, narcotics, or dangerous weapons.</li>
        <li>Unauthorized financial schemes, pyramid schemes, or fraudulent investment opportunities.</li>
        <li>Adult content or services violating messaging network terms of service.</li>
      </ul>
      <p className="text-xs text-slate-500 pt-2 font-mono">
        Violation of Payment Terms may result in immediate suspension of payment nodes and workspace termination.
      </p>
    </LegalLayout>
  );
};

export default PaymentTermsPage;
