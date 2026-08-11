import React from 'react';
import { LegalLayout } from './LegalLayout';
import { useSEO } from '../../../hooks/useSEO';
import { useTranslation } from '../../../i18n/config';

export const AcceptableUsePolicyPage: React.FC = () => {
  const { t } = useTranslation();

  useSEO({
    title: t('seo.acceptable_use.title', 'Acceptable Use Policy — Launchly'),
    description: t('seo.acceptable_use.description', 'Launchly Acceptable Use Policy: prohibited content, prohibited actions, and consequences for violations on the platform.'),
    canonicalPath: '/acceptable-use',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: t('seo.acceptable_use.title', 'Acceptable Use Policy — Launchly'),
      url: 'https://launchly.app/acceptable-use',
      publisher: { '@type': 'Organization', name: 'Launchly', url: 'https://launchly.app' },
    },
  });

  return (
    <LegalLayout title="Acceptable Use Policy" effectiveDate="AUGUST 14, 2026">
      <p className="text-base font-medium text-slate-900 leading-relaxed">
        This Acceptable Use Policy (&quot;AUP&quot;) outlines prohibited uses of the Launchly platform, services, APIs, and automated messaging infrastructure.
      </p>

      <h2 className="text-xl font-black text-slate-950 pt-4 border-t border-slate-200">
        1. Prohibited Content
      </h2>
      <p>You may not use Launchly to generate, store, or transmit any content that:</p>
      <ul className="list-square pl-6 space-y-2 text-slate-800 font-medium">
        <li>Is illegal, fraudulent, deceptive, or misleading.</li>
        <li>Promotes hate speech, discrimination, harassment, or violence.</li>
        <li>Infringes on intellectual property rights, trademarks, or copyrights.</li>
        <li>Contains malware, phishing links, viruses, or malicious payloads.</li>
      </ul>

      <h2 className="text-xl font-black text-slate-950 pt-4 border-t border-slate-200">
        2. Anti-Spam &amp; Broadcast Messaging Rules
      </h2>
      <p>Launchly maintains a strict zero-tolerance policy for unsolicited spam broadcasts:</p>
      <ul className="list-square pl-6 space-y-2 text-slate-800 font-medium">
        <li><strong>Prior Opt-In Required:</strong> You must have explicit, verifiable consent from subscribers before sending marketing messages or automated broadcasts.</li>
        <li><strong>Unsubscribe Mechanism:</strong> All broadcast channels must honor subscriber opt-out requests immediately.</li>
        <li><strong>Platform Limits:</strong> You must adhere strictly to messaging platform limits (e.g., Telegram Bot API guidelines). Attempting to bypass rate limits or use unauthorized bot networks is prohibited.</li>
      </ul>

      <h2 className="text-xl font-black text-slate-950 pt-4 border-t border-slate-200">
        3. System Integrity &amp; Enforcement
      </h2>
      <p>
        Launchly reserves the right to monitor system traffic, investigate suspected violations, and suspend or terminate accounts immediately upon violation of this AUP without prior warning or refund.
      </p>
    </LegalLayout>
  );
};

export default AcceptableUsePolicyPage;
