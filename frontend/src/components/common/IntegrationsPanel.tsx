import React from 'react';
import { useIntegrationsQuery } from '../../hooks/integration/useIntegrationQueries';
import { GoogleSheetsCard } from './GoogleSheetsCard';
import { PremiumIntegrationCard } from './PremiumIntegrationCard';
import { Loader2 } from 'lucide-react';
import { SiClaude, SiGooglegemini, SiMailchimp, SiHubspot } from '@icons-pack/react-simple-icons';
import { t } from '../../i18n/config';

interface IntegrationsPanelProps {
  botId: number;
  onOpenPricing?: () => void;
}

export const IntegrationsPanel: React.FC<IntegrationsPanelProps> = ({ botId, onOpenPricing }) => {
  const { data: integrations = [], isLoading } = useIntegrationsQuery();

  const googleIntegration = integrations.find(
    (i) => i.type === 'GOOGLE_SHEETS' && i.botId === botId
  );

  const hotmartIntegration = integrations.find(
    (i) => i.type === 'HOTMART' && i.botId === botId
  );

  const chatgptIntegration = integrations.find(
    (i) => i.type === 'CHATGPT' && i.botId === botId
  );

  const claudeIntegration = integrations.find(
    (i) => i.type === 'CLAUDE' && i.botId === botId
  );

  const deepseekIntegration = integrations.find(
    (i) => i.type === 'DEEPSEEK' && i.botId === botId
  );

  const geminiIntegration = integrations.find(
    (i) => i.type === 'GEMINI' && i.botId === botId
  );

  const mailchimpIntegration = integrations.find(
    (i) => i.type === 'MAILCHIMP' && i.botId === botId
  );

  const hubspotIntegration = integrations.find(
    (i) => i.type === 'HUBSPOT' && i.botId === botId
  );

  const handleUpgradeClick = () => {
    if (onOpenPricing) {
      onOpenPricing();
    } else {
      console.log('Open pricing modal');
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center items-center">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* 1. Google Sheets Integration */}
      <GoogleSheetsCard botId={botId} integration={googleIntegration} />

      {/* 2. Hotmart Integration */}
      <PremiumIntegrationCard
        title={t('settings.integrations.hotmart.title')}
        name="Hotmart"
        description={t('settings.integrations.hotmart.desc')}
        logo={
          <svg className="w-12 h-12 text-[#FF5A00] fill-current" viewBox="0 0 27 37">
            <path d="M25.7756 17.3698C25.2893 15.6249 24.5666 13.9548 23.6276 12.4058H23.6296C23.6296 12.4058 22.7026 10.8678 22.3136 10.4028H22.3106C22.2146 10.2818 22.0216 10.4158 22.0956 10.5538C22.2046 10.7828 22.3036 11.0648 22.2346 11.3398C22.1206 11.6758 21.7456 11.9088 21.4006 11.7898C21.3051 11.7512 21.2186 11.6933 21.1466 11.6198C20.7936 11.2548 20.6096 10.6508 20.3806 9.8838C20.1746 9.2008 19.9196 8.35279 19.4596 7.43479C18.7116 5.94279 17.8266 5.25279 17.7906 5.22379C17.7686 5.20662 17.7416 5.19721 17.7137 5.19703C17.6859 5.19685 17.6587 5.20591 17.6366 5.2228C17.6142 5.23992 17.5976 5.26346 17.5891 5.29028C17.5805 5.31709 17.5803 5.34588 17.5886 5.3728C17.5926 5.3848 17.9646 6.61479 17.2466 7.54579C16.9606 7.91679 16.5256 8.1408 16.0186 8.1728C15.5086 8.2058 15.0036 8.0368 14.7006 7.7328C13.9496 6.9778 13.8616 5.63979 13.8756 4.90979C13.9226 2.47579 14.6576 0.770795 15.0406 0.209795C15.0567 0.185815 15.0649 0.157376 15.064 0.12849C15.0631 0.0996036 15.0532 0.071728 15.0356 0.048795C15.018 0.0265184 14.9936 0.0106996 14.9661 0.00382184C14.9385 -0.00305591 14.9095 -0.000603202 14.8836 0.010795C11.9096 1.2998 9.75456 3.50679 8.65356 6.38379C8.03456 8.09479 7.76456 8.8748 7.54556 9.3658C7.34356 9.8148 7.15656 10.0218 6.96556 10.1358C6.86056 10.1998 6.73256 10.2358 6.60056 10.2408C6.40656 10.2208 5.44656 10.0448 6.28256 8.4388C6.35156 8.3038 6.16856 8.1698 6.06656 8.2788L5.40856 9.0058C5.37923 9.0378 5.3499 9.0698 5.32056 9.1018L5.21156 9.2228C5.1929 9.24413 5.1759 9.2648 5.16056 9.2848C3.08056 11.6618 1.62756 14.7038 0.790564 17.5138C0.0405639 20.2138 -0.00643612 22.3708 0.000563879 23.1908L0.00156388 23.3728C0.00156388 27.0068 1.38356 30.4228 3.89256 32.9928C6.40156 35.5628 9.73956 36.9778 13.2876 36.9778C16.8356 36.9778 20.1736 35.5628 22.6826 32.9928C25.1926 30.4228 26.5736 27.0058 26.5736 23.3728C26.5736 21.0578 26.2756 19.1718 25.7706 17.3698H25.7756ZM13.2896 30.4168C9.49156 30.4168 6.41056 27.2648 6.41056 23.3738C6.41056 19.4828 9.49056 16.3298 13.2896 16.3298C17.0886 16.3298 20.1686 19.4838 20.1686 23.3738C20.1686 27.2638 17.0886 30.4168 13.2896 30.4168Z" />
          </svg>
        }
        botId={botId}
        integration={hotmartIntegration}
        onUpgrade={handleUpgradeClick}
      />

      {/* 3. ChatGPT Integration */}
      <PremiumIntegrationCard
        title={t('settings.integrations.chatgpt.title')}
        name="ChatGPT"
        description={t('settings.integrations.chatgpt.desc')}
        logo={
          <svg className="w-12 h-12 text-slate-900 fill-current" viewBox="0 0 256 260">
            <path d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Zm-97.56 136.338a48.397 48.397 0 0 1-31.105-11.255l1.535-.87 51.67-29.825a8.595 8.595 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601Zm-104.466-44.61a48.345 48.345 0 0 1-5.781-32.589l1.534.921 51.722 29.826a8.339 8.339 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803ZM23.549 85.38a48.499 48.499 0 0 1 25.58-21.333v61.39a8.288 8.288 0 0 0 4.195 7.316l62.874 36.272-21.845 12.636a.819.819 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405v.256Zm179.466 41.695-63.08-36.63L161.73 77.86a.819.819 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.544 8.544 0 0 0-4.4-7.213Zm21.742-32.69-1.535-.922-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.716.716 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391v.205ZM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87-51.67 29.825a8.595 8.595 0 0 0-4.246 7.367l-.051 72.697Zm11.868-25.58 28.138-16.217 28.188 16.218v32.434l-28.086 16.218-28.188-16.218-.052-32.434Z" />
          </svg>
        }
        hasApiSecret={true}
        stepText={t('settings.integrations.chatgpt.title')}
        placeholder={t('settings.integrations.chatgpt.placeholder')}
        botId={botId}
        integration={chatgptIntegration}
        onUpgrade={handleUpgradeClick}
      />

      {/* 4. Claude Integration */}
      <PremiumIntegrationCard
        title={t('settings.integrations.claude.title')}
        name="Claude"
        description={t('settings.integrations.claude.desc')}
        logo={<SiClaude className="w-12 h-12 text-[#D97757]" />}
        hasApiSecret={true}
        placeholder={t('settings.integrations.claude.placeholder')}
        botId={botId}
        integration={claudeIntegration}
        onUpgrade={handleUpgradeClick}
      />

      {/* 5. DeepSeek Integration */}
      <PremiumIntegrationCard
        title={t('settings.integrations.deepseek.title')}
        name="DeepSeek"
        description={t('settings.integrations.deepseek.desc')}
        logo={
          <svg className="w-12 h-12" viewBox="0 0 24 24">
            <path fill="#4D6BFE" d="M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 0 1-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 0 0-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 0 1-.465.137 9.597 9.597 0 0 0-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 0 0 1.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696 4.696 0 0 1 1.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306 0 0 1 .415-.287.302.302 0 0 1 .2.288.306.306 0 0 1-.31.307.303.303 0 0 1-.304-.308zm3.11 1.596c-.2.081-.399.151-.59.16a1.245 1.245 0 0 1-.798-.254c-.274-.23-.47-.358-.552-.758a1.73 1.73 0 0 1 .016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.559.559 0 0 1-.254-.078.253.253 0 0 1-.114-.358c.028-.054.16-.186.192-.21.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452z" />
          </svg>
        }
        hasApiSecret={true}
        placeholder={t('settings.integrations.deepseek.placeholder')}
        botId={botId}
        integration={deepseekIntegration}
        onUpgrade={handleUpgradeClick}
      />

      {/* 6. Gemini Integration */}
      <PremiumIntegrationCard
        title={t('settings.integrations.gemini.title')}
        name="Gemini"
        description={t('settings.integrations.gemini.desc')}
        logo={<SiGooglegemini className="w-12 h-12 text-blue-600" />}
        hasApiSecret={true}
        placeholder={t('settings.integrations.gemini.placeholder')}
        botId={botId}
        integration={geminiIntegration}
        onUpgrade={handleUpgradeClick}
      />

      {/* 7. MailChimp Integration */}
      <PremiumIntegrationCard
        title={t('settings.integrations.mailchimp.title')}
        name="MailChimp"
        description={t('settings.integrations.mailchimp.desc')}
        logo={<SiMailchimp className="w-12 h-12 text-black" />}
        stepText={t('settings.integrations.mailchimp.title')}
        botId={botId}
        integration={mailchimpIntegration}
        onUpgrade={handleUpgradeClick}
      />

      {/* 8. HubSpot CRM Integration */}
      <PremiumIntegrationCard
        title={t('settings.integrations.hubspot.title')}
        name="HubSpot CRM"
        description={t('settings.integrations.hubspot.desc')}
        logo={<SiHubspot className="w-12 h-12 text-[#FF7A59]" />}
        stepText={t('settings.integrations.hubspot.title')}
        botId={botId}
        integration={hubspotIntegration}
        onUpgrade={handleUpgradeClick}
      />
    </div>
  );
};
