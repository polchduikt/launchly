import React, { useState, useEffect, useRef } from 'react';
import { Zap, Send, Sparkles, Check, Paperclip, Mic } from 'lucide-react';
import { useTranslation } from '../../../../i18n/config';

// Ease-in-out matching cubic-bezier(0.45, 0, 0.55, 1)
const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

// Animate a line path with a polygon arrowhead traveling in perfect sync
const animateLine = (
  pathEl: SVGPathElement,
  arrowEl: SVGPolygonElement,
  duration = 700
): (() => void) => {
  const total = pathEl.getTotalLength();
  pathEl.style.strokeDasharray = String(total);
  pathEl.style.strokeDashoffset = String(total);
  arrowEl.style.opacity = '0';

  let start: number | null = null;
  let rafId: number;

  const frame = (ts: number) => {
    if (!start) start = ts;
    const t = Math.min((ts - start) / duration, 1);
    const p = easeInOut(t);
    const len = total * p;

    // Update line
    pathEl.style.strokeDashoffset = String(total - len);

    // Update arrowhead position + rotation
    if (len > 1) {
      const ahead = pathEl.getPointAtLength(len);
      const behind = pathEl.getPointAtLength(Math.max(0, len - 2));
      const angle = Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180 / Math.PI;
      arrowEl.setAttribute('transform', `translate(${ahead.x},${ahead.y}) rotate(${angle})`);
      arrowEl.style.opacity = '1';
    }

    if (t < 1) rafId = requestAnimationFrame(frame);
  };

  rafId = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(rafId);
};

export const HeroInteractiveDemo: React.FC = () => {
  const { t } = useTranslation();

  const [activeView, setActiveView] = useState<'builder' | 'telegram'>('builder');
  const [step, setStep] = useState<number>(0);

  const canvasRef = useRef<HTMLDivElement>(null);
  const handle1Ref = useRef<HTMLSpanElement>(null);
  const handle2TargetRef = useRef<HTMLSpanElement>(null);
  const handle2BtnRef = useRef<HTMLSpanElement>(null);
  const handle3TargetRef = useRef<HTMLSpanElement>(null);

  // SVG element refs for JS animation
  const svgLine1Ref = useRef<SVGPathElement>(null);
  const svgArrow1Ref = useRef<SVGPolygonElement>(null);
  const svgLine2Ref = useRef<SVGPathElement>(null);
  const svgArrow2Ref = useRef<SVGPolygonElement>(null);

  const [pts, setPts] = useState({ h1x: 0, h1y: 0, h2tx: 0, h2ty: 0, h2bx: 0, h2by: 0, h3tx: 0, h3ty: 0 });

  // Measure handle positions
  useEffect(() => {
    const measure = () => {
      if (!canvasRef.current) return;
      const cb = canvasRef.current.getBoundingClientRect();
      const get = (ref: React.RefObject<HTMLSpanElement | null>) => {
        if (!ref.current) return { x: 0, y: 0 };
        const r = ref.current.getBoundingClientRect();
        return { x: r.left - cb.left + r.width / 2, y: r.top - cb.top + r.height / 2 };
      };
      const h1 = get(handle1Ref);
      const h2t = get(handle2TargetRef);
      const h2b = get(handle2BtnRef);
      const h3t = get(handle3TargetRef);
      setPts({ h1x: h1.x, h1y: h1.y, h2tx: h2t.x, h2ty: h2t.y, h2bx: h2b.x, h2by: h2b.y, h3tx: h3t.x, h3ty: h3t.y });
    };
    const raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  });

  // Step timer
  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => {
        const next = (prev + 1) % 12;
        if (next === 6) setActiveView('telegram');
        else if (next === 0) setActiveView('builder');
        return next;
      });
    }, 1300);
    return () => clearInterval(timer);
  }, []);

  // Trigger line 1 animation when step hits 2 and pts are ready
  useEffect(() => {
    if (step === 2 && svgLine1Ref.current && svgArrow1Ref.current) {
      const tId = setTimeout(() => {
        if (svgLine1Ref.current && svgArrow1Ref.current)
          animateLine(svgLine1Ref.current, svgArrow1Ref.current);
      }, 30);
      return () => clearTimeout(tId);
    }
  }, [step]);

  // Trigger line 2 animation when step hits 4
  useEffect(() => {
    if (step === 4 && svgLine2Ref.current && svgArrow2Ref.current) {
      const tId = setTimeout(() => {
        if (svgLine2Ref.current && svgArrow2Ref.current)
          animateLine(svgLine2Ref.current, svgArrow2Ref.current);
      }, 30);
      return () => clearTimeout(tId);
    }
  }, [step]);

  const line1Path = () => {
    if (!pts.h1x || !pts.h2tx) return '';
    const midX = (pts.h1x + pts.h2tx) / 2;
    return `M ${pts.h1x} ${pts.h1y} H ${midX} V ${pts.h2ty} H ${pts.h2tx}`;
  };

  const line2Path = () => {
    if (!pts.h2bx || !pts.h3tx) return '';
    const rightEdge = pts.h2bx + 20;
    const midY = (pts.h2by + pts.h3ty) / 2;
    const leftEdge = pts.h2tx - 20;
    return `M ${pts.h2bx} ${pts.h2by} H ${rightEdge} V ${midY} H ${leftEdge} V ${pts.h3ty} H ${pts.h3tx}`;
  };

  return (
    <div className="w-full bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[8px_8px_0px_#0A0A0A] rounded-3xl overflow-hidden font-['JetBrains_Mono',monospace] select-none">
      <style>{`
        @keyframes tgMsgIn {
          0%   { opacity: 0; transform: translateY(10px) scale(0.97); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .tg-msg-in {
          animation: tgMsgIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes viewFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .view-fade-in {
          animation: viewFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>

      {/* Title Bar */}
      <div className="bg-[#0A0A0A] text-[#F2EBDD] px-4 py-2.5 flex items-center gap-2 border-b-2 border-[#0A0A0A]">
        <span className="w-3 h-3 rounded-full bg-rose-500 border border-black/20" />
        <span className="w-3 h-3 rounded-full bg-amber-500 border border-black/20" />
        <span className="w-3 h-3 rounded-full bg-emerald-500 border border-black/20" />
        <span className="ml-3 text-xs font-black tracking-wider uppercase font-['Anybody',sans-serif]">
          {activeView === 'builder' ? t('landing.demo.builder_tab') : t('landing.demo.telegram_tab')}
        </span>
      </div>

      <div className="relative h-[410px] sm:h-[435px] overflow-hidden">

        {/* ── BUILDER VIEW ─────────────────────────────────── */}
        {activeView === 'builder' && (
          <div className="absolute inset-0 flex flex-col bg-[#F2EBDD] view-fade-in">
            <div className="absolute inset-0 opacity-[0.15] pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(#0A0A0A 1.2px, transparent 1.2px)', backgroundSize: '16px 16px' }} />

            {/* Toolbar */}
            <div className="relative z-20 w-full bg-[#F2EBDD] border-b-2 border-[#0A0A0A] px-4 py-2 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-[#0A0A0A]/50 font-['Anybody',sans-serif]">{t('landing.demo.flow_label')}</span>
                <span className="text-xs font-black text-[#0A0A0A] uppercase tracking-wider font-['Anybody',sans-serif]">{t('landing.demo.flow_title')}</span>
              </div>
              <button type="button"
                className="flex items-center gap-1.5 px-3 py-1 bg-[#0A0A0A] text-[#F2EBDD] text-[10px] font-black uppercase rounded-xl border-2 border-[#0A0A0A]">
                <span className={`w-2 h-2 rounded-full border border-black/30 transition-colors duration-700 ${step >= 5 ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                <span>{step >= 5 ? t('landing.demo.live_status') : t('landing.demo.update_status')}</span>
              </button>
            </div>

            {/* Canvas */}
            <div ref={canvasRef} className="relative flex-1 p-3 overflow-hidden">

              {/* SVG — lines drawn by JS */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">

                {/* LINE 1 */}
                {step >= 2 && pts.h1x > 0 && (
                  <>
                    <path
                      ref={svgLine1Ref}
                      d={line1Path()}
                      fill="none"
                      stroke="#7b8794"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ strokeDasharray: 800, strokeDashoffset: 800 }}
                    />
                    <polygon
                      ref={svgArrow1Ref}
                      points="0,0 -8,-4 -8,4"
                      fill="#7b8794"
                      style={{ opacity: 0 }}
                    />
                  </>
                )}

                {/* LINE 2 */}
                {step >= 4 && pts.h2bx > 0 && (
                  <>
                    <path
                      ref={svgLine2Ref}
                      d={line2Path()}
                      fill="none"
                      stroke="#7b8794"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ strokeDasharray: 800, strokeDashoffset: 800 }}
                    />
                    <polygon
                      ref={svgArrow2Ref}
                      points="0,0 -8,-4 -8,4"
                      fill="#7b8794"
                      style={{ opacity: 0 }}
                    />
                  </>
                )}

                {/* Source handle circles */}
                {pts.h1x > 0 && (
                  <circle cx={pts.h1x} cy={pts.h1y} r="4.5"
                    fill={step >= 2 ? '#7b8794' : 'white'} stroke="#7b8794" strokeWidth="1.5"
                    style={{ transition: 'fill 0.6s ease' }} />
                )}
                {step >= 1 && pts.h2bx > 0 && (
                  <circle cx={pts.h2bx} cy={pts.h2by} r="4.5"
                    fill={step >= 4 ? '#7b8794' : 'white'} stroke="#7b8794" strokeWidth="1.5"
                    style={{ transition: 'fill 0.6s ease' }} />
                )}
              </svg>

              {/* NODE 1 */}
              <div className={`absolute left-3 top-3 w-40 bg-white border-2 border-[#0A0A0A] rounded-2xl shadow-md z-10 transition-all duration-700 ease-out ${step >= 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100/70 rounded-t-[14px] border-b border-[#0A0A0A]/10">
                  <Zap size={12} className="text-emerald-700 fill-current shrink-0" />
                  <span className="font-black text-[9px] text-[#0A0A0A] uppercase tracking-wider font-['Anybody',sans-serif]">{t('landing.demo.when')}</span>
                </div>
                <div className="p-2">
                  <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl p-1.5 flex gap-1.5 items-center">
                    <span className="w-4 h-4 rounded-full bg-[#0A0A0A] text-[#F2EBDD] flex items-center justify-center shrink-0 text-[8px] font-black">tg</span>
                    <div className="min-w-0">
                      <p className="text-[8.5px] font-bold text-[#0A0A0A] leading-tight">{t('landing.demo.user_subscribes')}</p>
                      <p className="text-[7px] text-[#0A0A0A]/60 font-black uppercase tracking-wider mt-0.5">{t('landing.demo.welcome_trigger')}</p>
                    </div>
                  </div>
                </div>
                <div className="relative flex justify-end items-center px-2.5 py-1 bg-[#F2EBDD] rounded-b-[14px] border-t border-[#0A0A0A]/10">
                  <span className="text-[7.5px] font-black text-[#0A0A0A] uppercase tracking-wider mr-2 font-['Anybody',sans-serif]">{t('landing.demo.then')}</span>
                  <span ref={handle1Ref} className="absolute -right-[5px] top-1/2 -translate-y-1/2 w-[9px] h-[9px] rounded-full opacity-0" />
                </div>
              </div>

              {/* NODE 2 */}
              {step >= 1 && (
                <div className="absolute left-[228px] top-3 w-44 sm:w-48 bg-white border-2 border-[#0A0A0A] rounded-2xl shadow-md z-10"
                  style={{ animation: 'tgMsgIn 0.8s cubic-bezier(0.16,1,0.3,1) both' }}>
                  <span ref={handle2TargetRef} className="absolute -left-[5px] top-[22px] w-[9px] h-[9px] rounded-full opacity-0" />
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-100/80 rounded-t-[14px] border-b border-[#0A0A0A]/10">
                    <Send size={11} className="text-sky-600 shrink-0" />
                    <div className="flex flex-col leading-none">
                      <span className="text-[7px] font-black text-sky-700/80 uppercase">{t('landing.demo.telegram_header')}</span>
                      <span className="text-[9px] font-bold text-sky-900 font-['Anybody',sans-serif]">{t('landing.demo.send_message')}</span>
                    </div>
                  </div>
                  <div className="p-2 space-y-1.5">
                    <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl p-1.5 text-[8.5px] font-bold text-[#0A0A0A] leading-tight">
                      {t('landing.demo.msg1_content')}
                    </div>
                    <div className="relative bg-white border-2 border-[#0A0A0A] rounded-xl p-1 text-center font-bold text-[8px] text-[#0A0A0A]">
                      {t('landing.demo.get_offer_btn')}
                      <span ref={handle2BtnRef} className="absolute -right-[5px] top-1/2 -translate-y-1/2 w-[9px] h-[9px] rounded-full opacity-0" />
                    </div>
                  </div>
                  <div className="relative flex justify-end items-center px-2.5 py-1 bg-[#F2EBDD] rounded-b-[14px] border-t border-[#0A0A0A]/10">
                    <span className="text-[7px] font-black text-[#0A0A0A]/60 uppercase tracking-wider mr-2 font-['Anybody',sans-serif]">{t('landing.demo.next_step')}</span>
                    <span className="absolute -right-[5px] top-1/2 -translate-y-1/2 w-[9px] h-[9px] rounded-full bg-white border border-slate-400" />
                  </div>
                </div>
              )}

              {/* NODE 3 */}
              {step >= 3 && (
                <div className="absolute left-[228px] top-[235px] w-44 sm:w-48 bg-white border-2 border-[#0A0A0A] rounded-2xl shadow-md z-10"
                  style={{ animation: 'tgMsgIn 0.8s cubic-bezier(0.16,1,0.3,1) both' }}>
                  <span ref={handle3TargetRef} className="absolute -left-[5px] top-[18px] w-[9px] h-[9px] rounded-full opacity-0" />
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100/80 rounded-t-[14px] border-b border-[#0A0A0A]/10">
                    <Sparkles size={11} className="text-amber-700 shrink-0" />
                    <span className="font-bold text-[9px] text-amber-900 font-['Anybody',sans-serif]">{t('landing.demo.perform_actions')}</span>
                  </div>
                  <div className="p-2">
                    <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl p-1.5 space-y-0.5">
                      <span className="block text-[7px] text-slate-500 uppercase font-black">{t('landing.demo.set_field_label')}</span>
                      <span className="block text-[8px] font-black text-amber-900">{t('landing.demo.set_field_value')}</span>
                    </div>
                  </div>
                  <div className="relative flex justify-end items-center px-2.5 py-1 bg-[#F2EBDD] rounded-b-[14px] border-t border-[#0A0A0A]/10">
                    <span className="text-[7px] font-black text-[#0A0A0A]/60 uppercase tracking-wider mr-2 font-['Anybody',sans-serif]">{t('landing.demo.next_step')}</span>
                    <span className="absolute -right-[5px] top-1/2 -translate-y-1/2 w-[9px] h-[9px] rounded-full bg-white border border-slate-400" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TELEGRAM VIEW ──────────────────────────────────── */}
        {activeView === 'telegram' && (
          <div className="absolute inset-0 flex flex-col view-fade-in" style={{ background: '#17212B' }}>
            {/* Header */}
            <div className="flex items-center gap-3 px-3 py-2.5 shrink-0" style={{ background: '#232E3C', borderBottom: '1px solid #0d1721' }}>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm text-white"
                    style={{ background: 'linear-gradient(135deg, #2AABEE, #229ED9)' }}>L</div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#232E3C]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-white leading-tight">Launchly Bot</p>
                  <p className="text-[11px] font-medium" style={{ color: '#6ab3f3' }}>{t('landing.demo.bot_role')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8898AA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8898AA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
                </svg>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 flex flex-col justify-end px-3 py-3 space-y-2 overflow-hidden" style={{ background: '#17212B' }}>
              {step >= 7 && (
                <div className="flex justify-end tg-msg-in">
                  <div className="px-3 py-1.5 rounded-[16px] rounded-br-[4px] text-white text-[12px] font-medium" style={{ background: '#2B90D9' }}>
                    <span>/start</span>
                    <span className="ml-2 text-[10px] opacity-70 align-bottom">12:00</span>
                  </div>
                </div>
              )}
              {step >= 8 && (
                <div className="flex items-end gap-2 tg-msg-in">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-[11px] text-white shrink-0 mb-0.5"
                    style={{ background: 'linear-gradient(135deg, #2AABEE, #229ED9)' }}>L</div>
                  <div className="max-w-[78%] space-y-0.5">
                    <div className="rounded-[16px] rounded-tl-[4px]" style={{ background: '#182533' }}>
                      <div className="px-3 pt-2 pb-1.5">
                        <p className="text-[12px] text-white leading-[1.45]">{t('landing.demo.bot_msg1')}</p>
                        <span className="text-[10px] opacity-40 text-white float-right mt-1">12:00</span>
                        <div className="clear-both" />
                      </div>
                    </div>
                    <button type="button" className="w-full rounded-xl py-1.5 text-[12px] font-semibold transition-all duration-500"
                      style={{
                        background: step >= 9 ? '#2B90D9' : '#182533',
                        color: step >= 9 ? '#fff' : '#2AABEE',
                        border: `1px solid ${step >= 9 ? '#2B90D9' : '#2e4057'}`,
                      }}>
                      {step >= 9 ? t('landing.demo.bot_msg1_btn_active') : t('landing.demo.bot_msg1_btn')}
                    </button>
                  </div>
                </div>
              )}
              {step >= 10 && (
                <div className="flex items-end gap-2 tg-msg-in">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-[11px] text-white shrink-0 mb-0.5"
                    style={{ background: 'linear-gradient(135deg, #2AABEE, #229ED9)' }}>L</div>
                  <div className="max-w-[78%] rounded-[16px] rounded-tl-[4px] px-3 pt-2 pb-1.5" style={{ background: '#182533' }}>
                    <p className="text-[12px] font-semibold mb-0.5" style={{ color: '#4eca78' }}>
                      <Check size={12} className="inline mr-1" />{t('landing.demo.bot_msg2_title')}
                    </p>
                    <p className="text-[12px] text-white/80 leading-[1.45]">
                      {t('landing.demo.bot_msg2_promo_label')}{' '}
                      <span className="font-mono font-bold px-1 py-0.5 rounded text-[11px]"
                        style={{ background: '#0d1721', color: '#F5A623' }}>LAUNCH2026</span>
                      {t('landing.demo.bot_msg2_end')}
                    </p>
                    <span className="text-[10px] opacity-40 text-white float-right mt-1">12:01</span>
                    <div className="clear-both" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="px-3 py-2 shrink-0 flex items-center gap-2" style={{ background: '#17212B', borderTop: '1px solid #0d1721' }}>
              <Paperclip size={20} color="#8898AA" className="shrink-0" />
              <div className="flex-1 rounded-2xl px-3 py-1.5 text-[12px]" style={{ background: '#232E3C', color: '#8898AA' }}>{t('landing.demo.input_placeholder')}</div>
              <Mic size={20} color="#8898AA" className="shrink-0" />
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: '#2B90D9' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
