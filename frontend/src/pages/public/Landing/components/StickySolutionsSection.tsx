import React, { useEffect, useRef, useState } from 'react';
import {
  ShoppingBag,
  GraduationCap,
  Calendar,
  Target,
  Check,
  ArrowRight,
  Send,
  CheckCheck,
  Search,
  MoreVertical,
  Paperclip,
  Mic,
  RotateCcw,
} from 'lucide-react';
import { useTranslation } from '../../../../i18n/config';
import { createSafeHtml } from '../../../../utils/sanitize';

interface StickySolutionsSectionProps {
  onCtaClick: () => void;
}

type TabKey = 'ecommerce' | 'courses' | 'services' | 'agencies';

const TAB_KEYS: TabKey[] = ['ecommerce', 'courses', 'services', 'agencies'];

const DEFAULT_BOT_NAMES: Record<TabKey, string> = {
  ecommerce: 'E-Commerce Bot',
  courses: 'Courses Bot',
  services: 'Services Bot',
  agencies: 'Agencies Bot',
};

interface TelegramMessage {
  id: string;
  sender: 'bot' | 'user';
  text?: string;
  time: string;
  type?: 'text' | 'card' | 'buttons' | 'success';
  cardData?: {
    title: string;
    subtitle: string;
    price?: string;
  };
  buttons?: string[];
  selectedButton?: string;
}

export const StickySolutionsSection: React.FC<StickySolutionsSectionProps> = ({ onCtaClick }) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<TabKey>('ecommerce');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isInView, setIsInView] = useState(typeof IntersectionObserver === 'undefined');
  const [visibleCount, setVisibleCount] = useState(1);
  const [isTyping, setIsTyping] = useState(false);
  const [replayKey, setReplayKey] = useState(0);

  const isManualClick = useRef(false);
  const manualClickTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!containerRef.current || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const totalScrollable = rect.height - windowHeight;

      if (totalScrollable <= 0) return;

      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / totalScrollable));

      if (isManualClick.current) return;

      setScrollProgress(progress);
      const stepIndex = Math.min(3, Math.floor(progress * 4));
      setActiveTab(TAB_KEYS[stepIndex]);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (manualClickTimeout.current) clearTimeout(manualClickTimeout.current);
    };
  }, []);

  const handleTabClick = (tabKey: TabKey, index: number) => {
    if (activeTab === tabKey) {
      setReplayKey((k) => k + 1);
      return;
    }

    setActiveTab(tabKey);
    const targetProgress = (index + 0.5) / TAB_KEYS.length;
    setScrollProgress(targetProgress);

    isManualClick.current = true;
    if (manualClickTimeout.current) clearTimeout(manualClickTimeout.current);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const totalScrollable = rect.height - windowHeight;
      const targetScrollY = window.scrollY + rect.top + targetProgress * totalScrollable;

      window.scrollTo({
        top: targetScrollY,
        behavior: 'smooth',
      });
    }

    manualClickTimeout.current = setTimeout(() => {
      isManualClick.current = false;
    }, 700);
  };

  const getTabIcon = (key: TabKey, size = 16, className = '') => {
    const combinedClass = `shrink-0 ${className}`.trim();
    switch (key) {
      case 'ecommerce':
        return <ShoppingBag size={size} className={combinedClass || 'text-emerald-400 shrink-0'} />;
      case 'courses':
        return <GraduationCap size={size} className={combinedClass || 'text-amber-400 shrink-0'} />;
      case 'services':
        return <Calendar size={size} className={combinedClass || 'text-sky-400 shrink-0'} />;
      case 'agencies':
        return <Target size={size} className={combinedClass || 'text-purple-400 shrink-0'} />;
    }
  };

  const getTelegramDemoData = (tabKey: TabKey): TelegramMessage[] => {
    switch (tabKey) {
      case 'ecommerce':
        return [
          {
            id: 'e1',
            sender: 'bot',
            text: t('landing.demo.ecommerce.welcome', 'Вітаємо в **E-Commerce Bot**! Що бажаєте підібрати сьогодні?'),
            time: '12:00',
          },
          {
            id: 'e2',
            sender: 'bot',
            type: 'buttons',
            time: '12:00',
            buttons: [
              t('landing.demo.ecommerce.btn_shoes', '👟 Кросівки'),
              t('landing.demo.ecommerce.btn_clothes', '👕 Одяг'),
              t('landing.demo.ecommerce.btn_discounts', '🔥 Знижки'),
            ],
            selectedButton: t('landing.demo.ecommerce.btn_shoes', '👟 Кросівки'),
          },
          {
            id: 'e3',
            sender: 'user',
            text: t('landing.demo.ecommerce.user_select', 'Air Jordan 1 OG'),
            time: '12:00',
          },
          {
            id: 'e4',
            sender: 'bot',
            type: 'card',
            time: '12:01',
            cardData: {
              title: t('landing.demo.ecommerce.card_title', 'Nike Air Jordan 1 High OG'),
              subtitle: t('landing.demo.ecommerce.card_subtitle', 'В наявності: розміри 41, 42, 43, 44'),
              price: '$180',
            },
          },
          {
            id: 'e5',
            sender: 'user',
            text: t('landing.demo.ecommerce.user_buy', 'Купити розмір 42 через Telegram Pay'),
            time: '12:01',
          },
          {
            id: 'e6',
            sender: 'bot',
            type: 'success',
            text: t(
              'landing.demo.ecommerce.success',
              '✅ **Замовлення #4920 оплачено!**\nПлатіж через Stripe пройшов. ТТН надіслано в чат.'
            ),
            time: '12:02',
          },
        ];
      case 'courses':
        return [
          {
            id: 'c1',
            sender: 'bot',
            text: t('landing.demo.courses.welcome', 'Вітаємо в **Courses Bot**! Ваш перший вводний урок готовий:'),
            time: '14:15',
          },
          {
            id: 'c2',
            sender: 'bot',
            type: 'card',
            time: '14:15',
            cardData: {
              title: t('landing.demo.courses.card_title', '📹 Урок 1: Вступ до UI/UX Дизайну'),
              subtitle: t('landing.demo.courses.card_subtitle', 'Тривалість: 14 хв • HD 1080p'),
            },
          },
          {
            id: 'c3',
            sender: 'user',
            text: t('landing.demo.courses.user_get', 'Отримати повний доступ до курсу'),
            time: '14:16',
          },
          {
            id: 'c4',
            sender: 'bot',
            type: 'success',
            text: t(
              'landing.demo.courses.success',
              '⚡ **Pro-доступ активовано!**\nВам відкрито всі 12 модулів та приватний чат студентів.'
            ),
            time: '14:16',
          },
        ];
      case 'services':
        return [
          {
            id: 's1',
            sender: 'bot',
            text: t('landing.demo.services.welcome', 'Вітаємо в **Services Bot**! Оберіть бажану послугу:'),
            time: '16:00',
          },
          {
            id: 's2',
            sender: 'bot',
            type: 'buttons',
            time: '16:00',
            buttons: [
              t('landing.demo.services.btn_haircut', 'Стрижка & Борода'),
              t('landing.demo.services.btn_massage', 'Масаж'),
              t('landing.demo.services.btn_service', 'Сервіс'),
            ],
            selectedButton: t('landing.demo.services.btn_haircut', 'Стрижка & Борода'),
          },
          {
            id: 's3',
            sender: 'bot',
            type: 'card',
            time: '16:01',
            cardData: {
              title: t('landing.demo.services.card_title', 'П’ятниця, 8 Серпня'),
              subtitle: t('landing.demo.services.card_subtitle', 'Вільні слоти: 14:00, 16:30, 18:00'),
            },
          },
          {
            id: 's4',
            sender: 'user',
            text: t('landing.demo.services.user_book', 'Забронювати слот 16:30 Іван'),
            time: '16:02',
          },
          {
            id: 's5',
            sender: 'bot',
            type: 'success',
            text: t(
              'landing.demo.services.success',
              '🎉 **Запис підтверджено!**\nП’ятниця о 16:30 (Іван). Нагадування додано в Telegram.'
            ),
            time: '16:02',
          },
        ];
      case 'agencies':
        return [
          {
            id: 'a1',
            sender: 'bot',
            text: t(
              'landing.demo.agencies.welcome',
              '🚀 **Agencies Bot** готовий. Введіть ваш сайт для безкоштовного аудиту:'
            ),
            time: '11:20',
          },
          {
            id: 'a2',
            sender: 'user',
            text: t('landing.demo.agencies.user_site', 'mysite.com'),
            time: '11:21',
          },
          {
            id: 'a3',
            sender: 'bot',
            type: 'card',
            time: '11:21',
            cardData: {
              title: t('landing.demo.agencies.card_title', '📊 Аудит конверсії mysite.com'),
              subtitle: t('landing.demo.agencies.card_subtitle', 'Оцінка лідогенерації: 87/100 • 3 рекомендації'),
            },
          },
          {
            id: 'a4',
            sender: 'bot',
            text: t('landing.demo.agencies.pdf_info', '📥 Завантажте детальний PDF-звіт з рекомендаціями:'),
            time: '11:22',
          },
          {
            id: 'a5',
            sender: 'bot',
            type: 'success',
            text: t(
              'landing.demo.agencies.success',
              '✅ **Лід синхронізовано!**\nКонтакту передано в HubSpot & Telegram канал продажів.'
            ),
            time: '11:22',
          },
        ];
    }
  };

  const currentMessages = getTelegramDemoData(activeTab);
  const currentBotName = t(`landing.demo.${activeTab}.bot_name`, DEFAULT_BOT_NAMES[activeTab]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const msgs = getTelegramDemoData(activeTab);

    setVisibleCount(1);
    setIsTyping(false);

    let delay = 340;

    for (let i = 1; i < msgs.length; i++) {
      const msg = msgs[i];
      const isBot = msg.sender === 'bot';

      if (isBot) {
        const typeTimer = setTimeout(() => {
          setIsTyping(true);
        }, Math.max(0, delay - 200));
        timers.push(typeTimer);
      }

      const showTimer = setTimeout(() => {
        setIsTyping(false);
        setVisibleCount(i + 1);
      }, delay);
      timers.push(showTimer);

      delay += isBot ? 440 : 380;
    }

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [activeTab, replayKey]);

  useEffect(() => {
    if (!chatContainerRef.current) return;
    if (typeof chatContainerRef.current.scrollTo === 'function') {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    } else {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [visibleCount, isTyping]);

  return (
    <section
      id="use-cases"
      ref={containerRef}
      className="relative bg-[#F2EBDD] border-y-4 border-[#0A0A0A] z-10 py-6 lg:py-0 h-auto lg:h-[240vh]"
    >
      <style>{`
        @keyframes tgMsgInLeft {
          0% {
            opacity: 0;
            transform: translate3d(-16px, 14px, 0) scale(0.95);
          }
          70% {
            transform: translate3d(2px, -1px, 0) scale(1.01);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        @keyframes tgMsgInRight {
          0% {
            opacity: 0;
            transform: translate3d(16px, 14px, 0) scale(0.95);
          }
          70% {
            transform: translate3d(-2px, -1px, 0) scale(1.01);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        @keyframes tgSuccessGlow {
          0% {
            box-shadow: 0 0 0 0 rgba(52, 211, 153, 0);
          }
          40% {
            box-shadow: 0 0 16px 3px rgba(52, 211, 153, 0.45);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(52, 211, 153, 0);
          }
        }
        @keyframes tgTypingDot {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }
        @keyframes checkPop {
          0% {
            transform: scale(0);
          }
          70% {
            transform: scale(1.25);
          }
          100% {
            transform: scale(1);
          }
        }
        @keyframes cardContentFade {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes featureSlideIn {
          0% {
            opacity: 0;
            transform: translateX(-12px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes popBadge {
          0% {
            transform: scale(0.88);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>

      <div className="relative lg:sticky top-0 lg:top-14 py-4 lg:py-8 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto flex flex-col justify-center min-h-0 lg:min-h-[calc(100vh-3.5rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          <div className={`lg:col-span-8 flex flex-col justify-between space-y-4 sm:space-y-5 transition-all duration-700 ease-out ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="text-left border-l-8 border-[#0A0A0A] pl-5">
              <h2 className="font-['Anybody',sans-serif] text-3xl sm:text-4xl lg:text-5xl font-black text-[#0A0A0A] mb-1 uppercase leading-none">
                {t('landing.use_cases.title', 'Solutions for Every Industry')}
              </h2>
              <p className="text-xs sm:text-base text-[#0A0A0A] font-bold">
                {t('landing.use_cases.subtitle', 'Automate communications and sales tailored to your specific business needs')}
              </p>
            </div>

            <div className="hidden lg:block w-full bg-[#0A0A0A]/10 h-2.5 rounded-full overflow-hidden border border-[#0A0A0A]/20">
              <div
                className="bg-[#0A0A0A] h-full w-full origin-left transition-transform duration-100 ease-out will-change-transform"
                style={{ transform: `scaleX(${scrollProgress})` }}
              />
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-2.5">
              {TAB_KEYS.map((key, idx) => {
                const isActive = activeTab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleTabClick(key, idx)}
                    className={`py-3 px-1 sm:px-2 border-3 border-[#0A0A0A] font-['JetBrains_Mono',monospace] font-black uppercase transition-all flex items-center justify-center cursor-pointer select-none active:translate-y-0 ${
                      isActive
                        ? 'bg-[#0A0A0A] text-[#F2EBDD] shadow-[4px_4px_0px_#0A0A0A] -translate-y-0.5'
                        : 'bg-white text-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] hover:bg-[#0A0A0A]/5 hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 border border-black shrink-0 animate-pulse" />
                      )}
                      <span className="text-[9px] sm:text-[10px] xl:text-xs tracking-tighter sm:tracking-tight whitespace-nowrap text-center">
                        {t(`landing.use_cases.${key}_title`)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="bg-white border-4 border-[#0A0A0A] shadow-[8px_8px_0px_#0A0A0A] p-5 sm:p-7 rounded-2xl flex flex-col justify-between space-y-4 transition-all duration-300 flex-1">
              <div
                key={`${activeTab}-${replayKey}`}
                className="space-y-3 animate-[cardContentFade_0.35s_cubic-bezier(0.16,1,0.3,1)_both]"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0A0A0A] text-[#F2EBDD] font-['JetBrains_Mono',monospace] text-xs font-black uppercase rounded-lg shadow-[2px_2px_0px_#0A0A0A] animate-[popBadge_0.25s_cubic-bezier(0.34,1.56,0.64,1)_both]">
                  {getTabIcon(activeTab, 14)}
                  <span>{t(`landing.use_cases.${activeTab}_title`)}</span>
                </div>

                <h3 className="font-['Anybody',sans-serif] text-2xl sm:text-3xl font-black text-[#0A0A0A] uppercase leading-tight">
                  {t(`landing.use_cases.${activeTab}_title`)}
                </h3>

                <p className="text-xs sm:text-base text-[#0A0A0A]/85 font-semibold leading-relaxed">
                  {t(`landing.use_cases.${activeTab}_desc`)}
                </p>

                <div className="space-y-2.5 pt-1">
                  {[1, 2, 3].map((num) => (
                    <div
                      key={num}
                      className="flex items-start gap-2.5 animate-[featureSlideIn_0.35s_cubic-bezier(0.16,1,0.3,1)_both]"
                      style={{ animationDelay: `${num * 70}ms` }}
                    >
                      <div
                        className="w-5 h-5 rounded-full bg-emerald-400 border-2 border-[#0A0A0A] flex items-center justify-center shrink-0 mt-0.5 shadow-[2px_2px_0px_#0A0A0A] animate-[checkPop_0.35s_cubic-bezier(0.34,1.56,0.64,1)_both]"
                        style={{ animationDelay: `${num * 70 + 40}ms` }}
                      >
                        <Check size={12} className="text-[#0A0A0A] stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-[#0A0A0A]">
                        {t(`landing.use_cases.${activeTab}_f${num}`)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onCtaClick}
                  className="group w-full sm:w-auto bg-[#0A0A0A] text-[#F2EBDD] font-['JetBrains_Mono',monospace] text-xs sm:text-sm font-extrabold uppercase tracking-wider px-7 py-3.5 border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{t('landing.hero.cta_start', 'Start Building Free')}</span>
                  <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>

          <div
            className={`hidden lg:flex lg:col-span-4 justify-center items-stretch transition-all duration-700 ease-out ${
              isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <div className="w-full max-w-[340px] h-full min-h-[500px] bg-[#0A0A0A] p-2 sm:p-2.5 rounded-[36px] sm:rounded-[40px] border-4 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] sm:shadow-[10px_10px_0px_#0A0A0A] flex flex-col justify-between">
              <div className="w-24 h-4 bg-[#0A0A0A] rounded-full mx-auto mb-1.5 flex items-center justify-center gap-1.5 shrink-0 z-20">
                <div className="w-2.5 h-2.5 rounded-full bg-[#1C1C1E]" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#0D1F2D]" />
              </div>

              <div className="bg-[#0E1621] rounded-[30px] overflow-hidden flex flex-col flex-1 relative text-white border border-white/10">
                <div className="bg-[#17212B] px-3.5 py-3 border-b border-white/10 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-8 h-8 rounded-full bg-[#2B5278] flex items-center justify-center font-bold text-xs text-white border border-white/20">
                        {currentBotName.charAt(0)}
                      </div>
                      <span className="w-2 h-2 bg-emerald-400 rounded-full absolute bottom-0 right-0 border-2 border-[#17212B]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-white leading-tight truncate">{currentBotName}</h4>
                      <p className="text-[10px] text-[#4E7194] font-medium leading-none mt-0.5">
                        {isTyping ? t('landing.demo.typing', 'typing...') : t('landing.demo.bot', 'online')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[#6C7883] shrink-0">
                    <button
                      type="button"
                      onClick={() => setReplayKey((k) => k + 1)}
                      className="p-1 hover:text-white transition-colors cursor-pointer"
                      title={t('landing.demo.replay', 'Replay')}
                      aria-label="Replay animation"
                    >
                      <RotateCcw size={14} className="hover:-rotate-45 transition-transform duration-200" />
                    </button>
                    <Search size={16} className="hover:text-white cursor-pointer transition-colors" />
                    <MoreVertical size={16} className="hover:text-white cursor-pointer transition-colors" />
                  </div>
                </div>

                <div
                  ref={chatContainerRef}
                  className="flex-1 p-3 overflow-y-auto scrollbar-none space-y-2.5 bg-[#0E1621]"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {currentMessages.slice(0, visibleCount).map((msg) => (
                    <div
                      key={`${activeTab}-${replayKey}-${msg.id}`}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} ${
                        msg.sender === 'user'
                          ? 'animate-[tgMsgInRight_0.35s_cubic-bezier(0.16,1,0.3,1)_both]'
                          : 'animate-[tgMsgInLeft_0.35s_cubic-bezier(0.16,1,0.3,1)_both]'
                      }`}
                    >
                      {msg.text && (
                        <div
                          className={`max-w-[88%] px-3 py-2 text-[11px] leading-relaxed transition-all ${
                            msg.sender === 'user'
                              ? 'bg-[#2B5278] text-white rounded-2xl rounded-tr-xs shadow-xs'
                              : msg.type === 'success'
                              ? 'bg-[#182533] text-white rounded-2xl rounded-tl-xs shadow-xs border border-emerald-400/40 animate-[tgSuccessGlow_1.2s_ease-out_both]'
                              : 'bg-[#182533] text-white rounded-2xl rounded-tl-xs shadow-xs border border-white/5'
                          }`}
                        >
                          <div dangerouslySetInnerHTML={createSafeHtml(msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'))} />
                          <div
                            className={`flex items-center gap-1 justify-end text-[9px] mt-1 ${
                              msg.sender === 'user' ? 'text-white/70' : 'text-white/40'
                            }`}
                          >
                            <span>{msg.time}</span>
                            {msg.sender === 'user' && (
                              <CheckCheck size={11} className="text-[#2AABEE] animate-[checkPop_0.3s_cubic-bezier(0.34,1.56,0.64,1)_both]" />
                            )}
                          </div>
                        </div>
                      )}

                      {msg.type === 'buttons' && msg.buttons && (
                        <div className="flex flex-wrap gap-1.5 mt-1 max-w-[88%]">
                          {msg.buttons.map((btn, bIdx) => {
                            const isSelected = msg.selectedButton === btn;
                            return (
                              <span
                                key={bIdx}
                                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg shadow-xs transition-all border ${
                                  isSelected
                                    ? 'bg-[#2B5278] text-white border-[#2AABEE] scale-[1.02]'
                                    : 'bg-[#1C2733] hover:bg-[#243142] text-[#2AABEE] border-[#2AABEE]/30'
                                }`}
                              >
                                {btn}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {msg.type === 'card' && msg.cardData && (
                        <div className="max-w-[88%] bg-[#182533] border border-white/10 rounded-2xl rounded-tl-xs p-2.5 shadow-xs space-y-1 hover:border-white/20 transition-colors">
                          <p className="font-bold text-[11px] text-white leading-tight">{msg.cardData.title}</p>
                          <p className="text-[10px] text-white/70 leading-tight">{msg.cardData.subtitle}</p>
                          {msg.cardData.price && (
                            <p className="font-black text-xs text-emerald-400">{msg.cardData.price}</p>
                          )}
                          <div className="text-[9px] text-white/40 text-right mt-0.5">{msg.time}</div>
                        </div>
                      )}
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex items-center gap-1 px-3 py-2 bg-[#182533] border border-white/5 rounded-2xl rounded-tl-xs w-fit animate-[fadeIn_0.15s_ease-out_both]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4E7194] animate-[tgTypingDot_1.1s_infinite_0ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4E7194] animate-[tgTypingDot_1.1s_infinite_180ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4E7194] animate-[tgTypingDot_1.1s_infinite_360ms]" />
                    </div>
                  )}
                </div>

                <div className="bg-[#17212B] px-2.5 py-2 border-t border-white/10 flex items-center gap-1.5 shrink-0 text-[#6C7883]">
                  <Paperclip size={16} className="hover:text-white cursor-pointer transition-colors shrink-0" />
                  <div className="flex-1 bg-[#0E1621] text-white/50 text-[11px] px-2.5 py-1.5 rounded-xl border border-white/5 truncate">
                    {t('landing.demo.input_placeholder', 'Write a message...')}
                  </div>
                  <Mic size={16} className="hover:text-white cursor-pointer transition-colors shrink-0" />
                  <div className="w-7 h-7 rounded-full bg-[#2AABEE] flex items-center justify-center text-white shrink-0 shadow-xs cursor-pointer hover:bg-[#229ED9]">
                    <Send size={12} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
