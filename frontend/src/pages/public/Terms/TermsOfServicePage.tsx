import React from 'react';
import { LegalLayout } from '../Legal/LegalLayout';
import { useSEO } from '../../../hooks/useSEO';
import { useTranslation } from '../../../i18n/config';

export const TermsOfServicePage: React.FC = () => {
  const { t } = useTranslation();

  useSEO({
    title: t('seo.terms.title', 'Terms of Service — Launchly'),
    description: t('seo.terms.description', 'Read the Launchly Terms of Service. Understand your rights, responsibilities, billing, and acceptable use of the platform.'),
    canonicalPath: '/terms',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: t('seo.terms.title', 'Terms of Service — Launchly'),
      description: t('seo.terms.description', 'Read the Launchly Terms of Service.'),
      url: 'https://launchly.app/terms',
      publisher: { '@type': 'Organization', name: 'Launchly', url: 'https://launchly.app' },
    },
  });

  return (
    <LegalLayout title="Launchly Terms of Service" effectiveDate="AUGUST 14, 2026">
      
      <p className="text-base font-medium text-slate-900 leading-relaxed">
        THESE TERMS OF SERVICE (&quot;AGREEMENT&quot; OR &quot;TERMS&quot;) CONSTITUTE A BINDING LEGAL CONTRACT BETWEEN LAUNCHLY, INC. (&quot;LAUNCHLY&quot;, &quot;WE&quot;, &quot;US&quot;, OR &quot;OUR&quot;) AND THE INDIVIDUAL OR LEGAL ENTITY ACCESSING OR USING THE LAUNCHLY PLATFORM (&quot;CUSTOMER&quot;, &quot;YOU&quot;, OR &quot;YOUR&quot;). BY REGISTERING AN ACCOUNT, CREATING A WORKSPACE, CONNECTING MESSAGING CHANNELS, OR USING ANY PORTION OF THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY ALL TERMS AND CONDITIONS HEREIN.
      </p>

      <p className="text-sm text-slate-700 leading-relaxed">
        If you are entering into this Agreement on behalf of a company, organization, or other legal entity, you represent and warrant that you have full legal authority to bind such entity to these Terms. If you do not agree to all terms of this Agreement, you may not access or use the Service.
      </p>

      <h2 className="text-xl font-black text-slate-950 pt-6 border-t border-slate-200">
        1. Definitions
      </h2>
      <p>In this Agreement, capitalized terms shall have the specific meanings set forth below:</p>
      <ul className="list-square pl-6 space-y-2 text-slate-800 font-medium">
        <li>
          <strong>&quot;Account&quot;</strong> means a unique account created by or on behalf of Customer to access and utilize the Launchly Service.
        </li>
        <li>
          <strong>&quot;Authorized User&quot;</strong> means any employee, contractor, agent, or representative of Customer authorized by Customer to access the Account and use the Service under Customer&apos;s credentials.
        </li>
        <li>
          <strong>&quot;Customer Data&quot;</strong> means all electronic data, text, flow schemas, broadcast media, subscriber records, tags, custom field values, messages, and graphics submitted, uploaded, or transmitted to the Service by or on behalf of Customer or its End Users.
        </li>
        <li>
          <strong>&quot;End User&quot; or &quot;Subscriber&quot;</strong> means any individual who interacts with Customer&apos;s automated messaging bots, flows, or broadcasts hosted or powered by the Launchly platform.
        </li>
        <li>
          <strong>&quot;Messaging API / Channel&quot;</strong> means third-party communications services integrated into the Service, including but not limited to the Telegram Bot API, Meta Messenger API, Instagram Direct Messaging API, and WhatsApp Business API.
        </li>
        <li>
          <strong>&quot;Order Form&quot; / &quot;Subscription Plan&quot;</strong> means the online checkout schedule, tier selection, or enterprise order agreement executed by Customer specifying the Subscription Plan, feature limits, pricing, and billing terms.
        </li>
        <li>
          <strong>&quot;Service&quot; or &quot;Platform&quot;</strong> means Launchly&apos;s proprietary visual flow builder, automated broadcasting engine, omnichannel CRM, live chat interface, AI assistant nodes, and associated web applications provided via launchly.app.
        </li>
        <li>
          <strong>&quot;Third-Party Services&quot;</strong> means external software, APIs, payment gateways (e.g., Stripe, PayPal), or AI models (e.g., OpenAI, Anthropic) integrated with or utilized alongside the Service.
        </li>
      </ul>

      <h2 className="text-xl font-black text-slate-950 pt-6 border-t border-slate-200">
        2. Account Registration, Access &amp; Responsibilities
      </h2>
      <p>
        <strong>2.1 Eligibility:</strong> You must be at least eighteen (18) years of age, or the legal age of majority in your jurisdiction, to form a binding contract with Launchly. By using the Service, you represent and warrant that you meet these eligibility requirements.
      </p>
      <p>
        <strong>2.2 Account Security:</strong> Customer is solely responsible for maintaining the strict confidentiality of all Account login credentials, API tokens, and access keys. Customer agrees to immediately notify Launchly at legal@launchly.app upon becoming aware of any unauthorized access, breach of security, or compromised credentials. Launchly will not be liable for any loss, damage, or unauthorized data modification resulting from Customer&apos;s failure to safeguard its credentials.
      </p>
      <p>
        <strong>2.3 Team Workspaces &amp; Roles:</strong> Customer may invite Authorized Users to its workspace. Customer is fully liable for all actions, omissions, communications, and content generated by its Authorized Users as if performed directly by Customer.
      </p>

      <h2 className="text-xl font-black text-slate-950 pt-6 border-t border-slate-200">
        3. License Grant &amp; Scope of Use
      </h2>
      <p>
        <strong>3.1 Limited License Grant:</strong> Subject to Customer&apos;s continuous compliance with these Terms and timely payment of applicable Subscription fees, Launchly grants Customer a limited, non-exclusive, non-transferable, non-sublicensable, worldwide right to access and use the Service during the Subscription Term solely for Customer&apos;s internal business operations.
      </p>
      <p>
        <strong>3.2 Modifications &amp; Beta Features:</strong> Launchly continuously enhances the Platform and reserves the right to modify, update, or discontinue features of the Service at any time. If Launchly provides access to pre-release, experimental, or &quot;Beta&quot; features, such features are provided strictly &quot;AS-IS&quot; without warranties of any kind and may be modified or withdrawn at Launchly&apos;s sole discretion.
      </p>

      <h2 className="text-xl font-black text-slate-950 pt-6 border-t border-slate-200">
        4. Customer Data, End-User Consent &amp; Messaging API Compliance
      </h2>
      <p>
        <strong>4.1 Customer Data Ownership:</strong> As between Launchly and Customer, Customer retains all right, title, and interest, including all intellectual property rights, in and to Customer Data. Customer grants Launchly a non-exclusive, worldwide, royalty-free license to host, store, copy, transmit, format, and display Customer Data solely as necessary to provide, maintain, debug, and protect the Service.
      </p>
      <p>
        <strong>4.2 Mandatory Subscriber Opt-In &amp; Consent:</strong> Customer represents and warrants that it has obtained all necessary legal rights, consents, and opt-ins from End Users prior to storing their personal information in the Launchly CRM or initiating automated messages, broadcasts, or sequences. Customer is solely responsible for ensuring that its communications comply with applicable anti-spam and privacy laws, including TCPA, CAN-SPAM, ePrivacy Directive, GDPR, and local telecommunications regulations.
      </p>
      <p>
        <strong>4.3 Third-Party Messaging API Rules:</strong> Customer acknowledges that messaging automation relies on third-party Messaging APIs (including the Telegram Bot API). Customer agrees to strictly comply with all third-party terms of service, developer guidelines, and anti-spam policies. Launchly is not responsible or liable for any account restrictions, bot token revocations, rate-limiting, or service suspensions imposed by third-party messaging providers due to Customer&apos;s activities.
      </p>

      <h2 className="text-xl font-black text-slate-950 pt-6 border-t border-slate-200">
        5. Acceptable Use Policy &amp; Platform Restrictions
      </h2>
      <p>Customer agrees that it will not, and will not permit any Authorized User or third party to:</p>
      <ul className="list-square pl-6 space-y-2 text-slate-800 font-medium">
        <li>Reverse engineer, decompile, disassemble, or attempt to discover the source code, underlying algorithms, or trade secrets of the Platform.</li>
        <li>Send unsolicited, spam, fraudulent, deceptive, or abusive messages, broadcasts, or phishing campaigns to End Users.</li>
        <li>Use the Platform to store, transmit, or process illegal, defamatory, obscene, pornographic, hateful, or violent content.</li>
        <li>Bypass, disable, or interfere with security features, rate limits, license checks, or access restrictions of the Service.</li>
        <li>Use automated scripts, web scrapers, or bots to harvest data from the Service without Launchly&apos;s explicit prior written consent.</li>
        <li>Resell, sublicense, white-label, rent, or lease access to the Service to third parties, except as expressly permitted under a separate written Partner Agreement.</li>
      </ul>

      <h2 className="text-xl font-black text-slate-950 pt-6 border-t border-slate-200">
        6. Fees, Billing, Payments &amp; Taxes
      </h2>
      <p>
        <strong>6.1 Subscription Fees:</strong> Access to paid features of the Service requires a valid Subscription Plan. Subscription Fees are billed in advance on a monthly or annual cycle as selected during purchase. All payment obligations are non-cancelable and all fees paid are non-refundable, except as expressly provided herein or mandated by applicable law.
      </p>
      <p>
        <strong>6.2 Automatic Renewal:</strong> Subscriptions automatically renew at the end of each Subscription Term for an equivalent period unless Customer cancels its Subscription through the Platform Account Settings prior to the renewal date.
      </p>
      <p>
        <strong>6.3 Payment Processing:</strong> Customer agrees to provide valid, unexpired credit card or electronic payment credentials via authorized payment gateways (e.g., Stripe, PayPal). Customer authorizes Launchly to charge all applicable fees to its designated payment method. If payment fails or is overdue, Launchly may suspend access to the Service until full payment is received.
      </p>
      <p>
        <strong>6.4 Taxes:</strong> All fees are exclusive of applicable federal, state, local, or international sales, use, value-added (VAT), or withholding taxes. Customer is responsible for paying all taxes associated with its purchases, excluding taxes based on Launchly&apos;s net income.
      </p>

      <h2 className="text-xl font-black text-slate-950 pt-6 border-t border-slate-200">
        7. Intellectual Property Rights &amp; Feedback
      </h2>
      <p>
        <strong>7.1 Launchly Ownership:</strong> Launchly and its licensors retain all right, title, and interest, including all patent, copyright, trade secret, trademark, and other intellectual property rights, in and to the Platform, visual builder components, backend architectures, documentation, and design assets. Nothing in this Agreement grants Customer any ownership rights in the Platform.
      </p>
      <p>
        <strong>7.2 Feedback License:</strong> If Customer or its Authorized Users submit suggestions, feature requests, improvements, or feedback regarding the Service (&quot;Feedback&quot;), Customer grants Launchly an irrevocable, perpetual, worldwide, royalty-free right and license to use, modify, and incorporate such Feedback into the Service without restriction or compensation.
      </p>

      <h2 className="text-xl font-black text-slate-950 pt-6 border-t border-slate-200">
        8. Confidentiality
      </h2>
      <p>
        <strong>8.1 Confidential Information:</strong> &quot;Confidential Information&quot; means all non-public information disclosed by one party (&quot;Disclosing Party&quot;) to the other party (&quot;Receiving Party&quot;) under this Agreement, including technical architecture, software code, product roadmaps, business strategies, customer data, and pricing terms.
      </p>
      <p>
        <strong>8.2 Protection Standards:</strong> The Receiving Party agrees to protect Confidential Information using the same degree of care it uses for its own confidential information of like nature, but no less than reasonable care, and not to disclose such Confidential Information to third parties except to its employees, contractors, and legal advisors who need to know and are bound by equivalent confidentiality obligations.
      </p>

      <h2 className="text-xl font-black text-slate-950 pt-6 border-t border-slate-200">
        9. Warranties &amp; Legal Disclaimers
      </h2>
      <p>
        <strong>9.1 Service Warranty:</strong> Launchly warrants that it will provide the Service in a professional manner consistent with standard industry practices. Launchly does not warrant that the Service will be completely uninterrupted, error-free, or compatible with all third-party systems.
      </p>
      <p className="font-bold text-slate-950">
        9.2 DISCLAIMER: EXCEPT AS EXPRESSLY PROVIDED HEREIN, THE SERVICE IS PROVIDED ON AN &quot;AS-IS&quot; AND &quot;AS-AVAILABLE&quot; BASIS. LAUNCHLY DISCLAIMS ALL OTHER WARRANTIES, EXPRESS, IMPLIED, OR STATUTORY, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
      </p>

      <h2 className="text-xl font-black text-slate-950 pt-6 border-t border-slate-200">
        10. Indemnification
      </h2>
      <p>
        Customer agrees to defend, indemnify, and hold harmless Launchly, its affiliates, directors, officers, employees, and agents from and against any third-party claims, damages, liabilities, costs, losses, and expenses (including reasonable attorneys&apos; fees) arising out of or relating to: (a) Customer Data; (b) Customer&apos;s breach of this Agreement or Acceptable Use Policy; (c) Customer&apos;s violation of subscriber opt-in requirements or anti-spam regulations; or (d) Customer&apos;s misuse of third-party Messaging APIs.
      </p>

      <h2 className="text-xl font-black text-slate-950 pt-6 border-t border-slate-200">
        11. Limitation of Liability
      </h2>
      <p className="font-bold text-slate-950">
        11.1 EXCLUSION OF CONSEQUENTIAL DAMAGES: TO THE FULLEST EXTENT PERMITTED BY LAW, IN NO EVENT SHALL LAUNCHLY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, COVER, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING LOSS OF PROFITS, REVENUE, DATA, GOODWILL, OR BUSINESS INTERRUPTION, ARISING OUT OF OR IN CONNECTION WITH THE SERVICE, REGARDLESS OF THE THEORY OF LIABILITY.
      </p>
      <p className="font-bold text-slate-950">
        11.2 LIABILITY CAP: LAUNCHLY&apos;S AGGREGATE CUMULATIVE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT SHALL NOT EXCEED THE TOTAL AMOUNT ACTUALLY PAID BY CUSTOMER TO LAUNCHLY UNDER THIS AGREEMENT IN THE TWELVE (12) MONTH PERIOD IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO LIABILITY.
      </p>

      <h2 className="text-xl font-black text-slate-950 pt-6 border-t border-slate-200">
        12. Term, Suspension &amp; Termination
      </h2>
      <p>
        <strong>12.1 Term:</strong> This Agreement begins on the date Customer creates an Account or executes an Order Form and continues until all Subscriptions have expired or been terminated.
      </p>
      <p>
        <strong>12.2 Termination for Convenience:</strong> Customer may cancel its Subscription at any time through Account Settings. Cancellation takes effect at the conclusion of the current prepaid billing period.
      </p>
      <p>
        <strong>12.3 Termination for Cause:</strong> Either party may terminate this Agreement immediately upon written notice if the other party materially breaches this Agreement and fails to cure such breach within thirty (30) days of receiving written notice. Launchly may terminate or suspend Customer&apos;s Account immediately without prior notice if Customer engages in illegal activity, spamming, or severe platform abuse.
      </p>

      <h2 className="text-xl font-black text-slate-950 pt-6 border-t border-slate-200">
        13. Governing Law &amp; Dispute Resolution
      </h2>
      <p>
        This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of laws principles. Any legal suit, action, or proceeding arising out of or related to this Agreement shall be instituted exclusively in the federal or state courts located in Wilmington, Delaware.
      </p>

      <h2 className="text-xl font-black text-slate-950 pt-6 border-t border-slate-200">
        14. General Provisions
      </h2>
      <p>
        <strong>14.1 Entire Agreement:</strong> This Agreement, including all referenced Policies and Order Forms, constitutes the entire agreement between the parties regarding its subject matter and supersedes all prior proposals, negotiations, and communications.
      </p>
      <p>
        <strong>14.2 Updates to Terms:</strong> Launchly reserves the right to modify these Terms at any time by posting the updated version on the Platform. Continued use of the Service after effective date of updates constitutes acceptance of revised Terms.
      </p>
      <p>
        <strong>14.3 Severability &amp; Waiver:</strong> If any provision of this Agreement is held to be invalid or unenforceable, such provision shall be enforced to the maximum extent permissible, and remaining provisions shall remain in full force and effect.
      </p>

      <div className="bg-slate-100 p-5 rounded-xl text-xs font-mono font-bold text-slate-800 space-y-1 mt-8 border border-slate-200">
        <p className="text-sm font-black text-slate-950">Launchly, Inc. — Legal Department</p>
        <p>Email: legal@launchly.app</p>
        <p>Website: launchly.app/terms</p>
      </div>

    </LegalLayout>
  );
};

export default TermsOfServicePage;
