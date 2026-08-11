import React from 'react';
import { LegalLayout } from '../Legal/LegalLayout';
import { useSEO } from '../../../hooks/useSEO';
import { useTranslation } from '../../../i18n/config';

export const PrivacyPolicyPage: React.FC = () => {
  const { t } = useTranslation();

  useSEO({
    title: t('seo.privacy.title', 'Privacy Policy — Launchly'),
    description: t('seo.privacy.description', 'Launchly privacy policy: how we collect, use, and protect your personal data in compliance with GDPR and privacy regulations.'),
    canonicalPath: '/privacy',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: t('seo.privacy.title', 'Privacy Policy — Launchly'),
      description: t('seo.privacy.description', 'Launchly privacy policy: how we collect, use, and protect your personal data.'),
      url: 'https://launchly.app/privacy',
      publisher: { '@type': 'Organization', name: 'Launchly', url: 'https://launchly.app' },
    },
  });

  return (
    <LegalLayout title="Launchly Privacy Policy" effectiveDate="AUGUST 14, 2026">
      
      <p className="text-base font-medium text-slate-900 leading-relaxed">
        AT LAUNCHLY, INC. (&quot;LAUNCHLY&quot;, &quot;WE&quot;, &quot;US&quot;, OR &quot;OUR&quot;), WE CONSIDER THE PRIVACY, CONFIDENTIALITY, AND SECURITY OF PERSONAL DATA TO BE EXTREMELY IMPORTANT. THIS PRIVACY POLICY DESCRIBES OUR DATA PROTECTION PRACTICES REGARDING THE COLLECTION, USE, DISCLOSURE, AND SAFEGUARDING OF PERSONAL INFORMATION WHEN YOU VISIT OUR WEBSITE, USE OUR PLATFORM, OR INTERACT WITH OUR BOT AUTOMATION SERVICES.
      </p>

      <p className="text-sm text-slate-700 leading-relaxed">
        We process personal data in two distinct capacities: (1) as a <strong>Data Controller</strong> for personal data collected directly from our business customers, website visitors, and account holders; and (2) as a <strong>Data Processor</strong> on behalf of our customers when hosting, processing, or transmitting subscriber information and automated messages through our Platform.
      </p>
        <h2 className="text-xl font-black text-slate-950 pt-6 border-t border-slate-200">
        1. How We Collect Personal Data
      </h2>
      <p>
        The personal data we collect depends on your interactions with Launchly. We categorize the personal data we process as follows:
      </p>

      <ul className="list-square pl-6 space-y-3 text-slate-800 font-medium">
        <li>
          <strong>Information Provided directly by Customers:</strong> When you register for an Account, subscribe to a Plan, configure bot workflows, or submit support tickets, we collect your name, email address, company name, billing details, password hashes, and payment tokens.
        </li>
        <li>
          <strong>End-User &amp; Subscriber Data (Processed on behalf of Customers):</strong> When End Users interact with automated Telegram bots or flow sequences powered by Launchly, we store subscriber identifiers (e.g., Telegram User IDs, usernames, first/last names), conversation logs, tag assignments, custom field values, purchase records, and interaction timestamps as instructed by Customer.
        </li>
        <li>
          <strong>Automated Technical &amp; Device Information:</strong> When you visit our website or access the Service, we automatically record IP addresses, browser types, operating system details, referring URLs, device identifiers, and session interaction metrics via log files and essential cookies.
        </li>
      </ul>

      <h2 className="text-xl font-black text-slate-950 pt-6 border-t border-slate-200">
        2. Purposes of Data Processing &amp; Legal Bases (GDPR Article 6)
      </h2>
      <p>We process personal data for specific, lawful purposes under applicable data protection regulations:</p>
      
      <div className="overflow-x-auto my-4">
        <table className="w-full text-xs text-left border border-slate-200 rounded-lg">
          <thead className="bg-slate-100 font-black text-slate-900 uppercase">
            <tr>
              <th className="p-3">Processing Purpose</th>
              <th className="p-3">Data Categories</th>
              <th className="p-3">Legal Basis (GDPR Art. 6)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-medium">
            <tr>
              <td className="p-3 font-bold">Account Setup &amp; Service Delivery</td>
              <td className="p-3">Account credentials, email, bot tokens</td>
              <td className="p-3 text-slate-700 font-bold">Performance of Contract (Art. 6(1)(b))</td>
            </tr>
            <tr>
              <td className="p-3 font-bold">Billing &amp; Subscription Renewal</td>
              <td className="p-3">Payment tokens, invoice history, tax IDs</td>
              <td className="p-3 text-slate-700 font-bold">Performance of Contract &amp; Legal Duty (Art. 6(1)(c))</td>
            </tr>
            <tr>
              <td className="p-3 font-bold">Bot Flow Execution &amp; CRM Tagging</td>
              <td className="p-3">Subscriber IDs, flow states, tag values</td>
              <td className="p-3 text-slate-700 font-bold">Processor Instructions / Legitimate Interest (Art. 6(1)(f))</td>
            </tr>
            <tr>
              <td className="p-3 font-bold">Platform Security &amp; Anti-Spam Safeguards</td>
              <td className="p-3">IP logs, request headers, error stack traces</td>
              <td className="p-3 text-slate-700 font-bold">Legitimate Interest (Art. 6(1)(f))</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-black text-slate-950 pt-6 border-t border-slate-200">
        3. Authorized Sub-Processors &amp; Third-Party Transfers
      </h2>
      <p>
        Launchly engages authorized third-party service providers (&quot;Sub-Processors&quot;) to perform specialized functions. All Sub-Processors are vetted and bound by Data Processing Addendums (DPAs) requiring strict adherence to data protection standards.
      </p>

      <ul className="list-square pl-6 space-y-2 text-slate-800 font-medium">
        <li><strong>Telegram Messenger API:</strong> Used for webhook event delivery, sending bot messages, and managing channel subscriber state.</li>
        <li><strong>Stripe &amp; PayPal Inc.:</strong> Used for PCI-compliant billing, credit card authorization, and subscription tokenization.</li>
        <li><strong>OpenAI &amp; Anthropic API:</strong> Used for optional AI Assistant node processing (invoked strictly upon Customer configuration). Prompts are not used for public model training.</li>
        <li><strong>Amazon Web Services / Google Cloud:</strong> Secure cloud infrastructure hosting backend databases, encrypted backups, and API gateways.</li>
      </ul>

      <h2 className="text-xl font-black text-slate-950 pt-6 border-t border-slate-200">
        4. International Data Transfers
      </h2>
      <p>
        Personal data collected by Launchly may be stored and processed in the United States, European Union, or any country where Launchly or its Sub-Processors maintain facilities. When transferring personal data out of the European Economic Area (EEA), United Kingdom, or Switzerland, we rely on Standard Contractual Clauses (SCCs) approved by the European Commission or valid adequacy decisions.
      </p>

      <h2 className="text-xl font-black text-slate-950 pt-6 border-t border-slate-200">
        5. Data Retention &amp; Deletion Schedule
      </h2>
      <p>
        We retain personal data only for as long as necessary to fulfill the purposes for which it was collected or to comply with statutory legal, accounting, or reporting obligations.
      </p>
      <ul className="list-square pl-6 space-y-2 text-slate-800 font-medium">
        <li><strong>Active Accounts:</strong> Account data and CRM subscriber records are maintained throughout the active Subscription Term.</li>
        <li><strong>Cancelled Accounts:</strong> Upon account cancellation, Customer Data and subscriber records are purged from active production databases within sixty (60) days, unless longer retention is required by law.</li>
        <li><strong>System Logs:</strong> Operational access logs and technical diagnostics are automatically rotated and purged every ninety (90) days.</li>
      </ul>

      <h2 className="text-xl font-black text-slate-950 pt-6 border-t border-slate-200">
        6. Technical &amp; Organizational Security Safeguards
      </h2>
      <p>
        Launchly implements rigorous technical and organizational measures to safeguard personal data against unauthorized access, loss, alteration, or disclosure:
      </p>
      <ul className="list-square pl-6 space-y-2 text-slate-800 font-medium">
        <li><strong>Encryption in Transit:</strong> All web traffic, API requests, and webhooks are encrypted using Transport Layer Security (TLS 1.3).</li>
        <li><strong>Encryption at Rest:</strong> Customer databases, access tokens, and file archives are encrypted using AES-256 encryption.</li>
        <li><strong>Access Controls:</strong> Role-based access controls (RBAC) and mandatory Multi-Factor Authentication (MFA) restrict internal employee access to production databases.</li>
      </ul>

      <h2 className="text-xl font-black text-slate-950 pt-6 border-t border-slate-200">
        7. Data Subject Rights (GDPR &amp; CCPA)
      </h2>
      <p>Under applicable privacy laws (including GDPR, UK GDPR, and CCPA/CPRA), you possess the following rights:</p>
      <ul className="list-square pl-6 space-y-2 text-slate-800 font-medium">
        <li><strong>Right of Access &amp; Portability:</strong> You may request a machine-readable copy of the personal data held under your Account.</li>
        <li><strong>Right to Rectification:</strong> You may request correction of inaccurate or incomplete personal information.</li>
        <li><strong>Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> You may request the permanent deletion of your Account and associated subscriber records.</li>
        <li><strong>Right to Restrict or Object:</strong> You may object to data processing based on legitimate interests or request restrictions on processing.</li>
      </ul>

      <h2 className="text-xl font-black text-slate-950 pt-6 border-t border-slate-200">
        8. Data Protection Officer &amp; Inquiries
      </h2>
      <p>
        If you have questions regarding this Privacy Policy or wish to exercise your data subject rights, please contact our Data Protection Officer:
      </p>
      
      <div className="bg-slate-100 p-5 rounded-xl text-xs font-mono font-bold text-slate-800 space-y-1 mt-4 border border-slate-200">
        <p className="text-sm font-black text-slate-950">Launchly, Inc. — Data Protection Officer</p>
        <p>Email: privacy@launchly.app</p>
        <p>Address: Launchly Legal &amp; Privacy Dept, 100 Enterprise Way, Suite 400, Wilmington, DE 19801</p>
      </div>

    </LegalLayout>
  );
};

export default PrivacyPolicyPage;
