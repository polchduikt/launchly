import React from 'react';
import { Star } from 'lucide-react';
import { useTranslation } from '../../../../i18n/config';

export const LandingTestimonialsSection: React.FC = () => {
  const { t } = useTranslation();

  const testimonials = [
    {
      textKey: 'landing.testimonials.t1_text',
      nameKey: 'landing.testimonials.t1_name',
      roleKey: 'landing.testimonials.t1_role',
      img: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&w=256&q=80',
      anim: 'reveal-brutal-pop reveal-delay-50',
    },
    {
      textKey: 'landing.testimonials.t2_text',
      nameKey: 'landing.testimonials.t2_name',
      roleKey: 'landing.testimonials.t2_role',
      img: 'https://images.unsplash.com/photo-1598550874175-4d0ef436c909?auto=format&fit=crop&w=256&q=80',
      anim: 'reveal-scale-rotate reveal-delay-100',
    },
    {
      textKey: 'landing.testimonials.t3_text',
      nameKey: 'landing.testimonials.t3_name',
      roleKey: 'landing.testimonials.t3_role',
      img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80',
      anim: 'reveal-brutal-pop reveal-delay-150',
    },
    {
      textKey: 'landing.testimonials.t4_text',
      nameKey: 'landing.testimonials.t4_name',
      roleKey: 'landing.testimonials.t4_role',
      img: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&w=256&q=80',
      anim: 'reveal-scale-rotate reveal-delay-200',
    },
    {
      textKey: 'landing.testimonials.t5_text',
      nameKey: 'landing.testimonials.t5_name',
      roleKey: 'landing.testimonials.t5_role',
      img: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=256&q=80',
      anim: 'reveal-brutal-pop reveal-delay-250',
    },
    {
      textKey: 'landing.testimonials.t6_text',
      nameKey: 'landing.testimonials.t6_name',
      roleKey: 'landing.testimonials.t6_role',
      img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
      anim: 'reveal-scale-rotate reveal-delay-300',
    },
  ];

  return (
    <section id="testimonials" className="py-20 md:py-28 bg-[#F2EBDD] border-b-4 border-[#0A0A0A] px-6 lg:px-12 relative z-10">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="text-left border-l-8 border-[#0A0A0A] pl-6 reveal-blur-in">
          <h2 className="font-['Anybody',sans-serif] text-3xl sm:text-5xl font-black text-[#0A0A0A] mb-2 uppercase leading-none">
            {t('landing.testimonials.title', 'Що кажуть наші клієнти')}
          </h2>
          <p className="text-base sm:text-lg text-[#0A0A0A] font-bold max-w-2xl">
            {t(
              'landing.testimonials.subtitle',
              'Понад 500+ бізнесів та агентств автоматизують продажі та підтримку за допомогою Launchly.'
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-8">
          {testimonials.map((item, idx) => (
            <div
              key={idx}
              className={`bg-white border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] sm:shadow-[6px_6px_0px_#0A0A0A] p-3.5 sm:p-7 flex flex-col justify-between space-y-3 sm:space-y-5 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all ${item.anim}`}
            >
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-0.5 sm:gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 text-amber-500" />
                  ))}
                </div>
                <p className="font-['Geist',sans-serif] text-xs sm:text-base text-[#0A0A0A] font-medium leading-relaxed">
                  {t(item.textKey)}
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3.5 pt-2.5 sm:pt-4 border-t border-[#0A0A0A]/10">
                <img
                  src={item.img}
                  alt={t(item.nameKey)}
                  className="w-8 h-8 sm:w-11 sm:h-11 rounded-full border-2 border-[#0A0A0A] object-cover shrink-0 shadow-[2px_2px_0px_#0A0A0A]"
                />
                <div className="min-w-0">
                  <h4 className="font-['Anybody',sans-serif] text-xs sm:text-base font-black text-[#0A0A0A] uppercase leading-tight truncate">
                    {t(item.nameKey)}
                  </h4>
                  <p className="font-['JetBrains_Mono',monospace] text-[10px] sm:text-xs font-bold text-slate-600 truncate">
                    {t(item.roleKey)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
