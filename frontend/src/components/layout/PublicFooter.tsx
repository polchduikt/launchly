import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/images/logo.png';
import { ROUTES } from '../../routes/paths';
import { ShieldCheck, Lock, FileText, Heart } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 select-none relative z-10">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-900">
          
          <div className="lg:col-span-2 space-y-4">
            <Link to={ROUTES.LANDING} className="flex items-center gap-2">
              <img src={logo} alt="Launchly Logo" className="h-9 w-auto object-contain brightness-125" />
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Launchly is the next-generation omnichannel marketing automation & CRM platform. Empowering businesses to automate sales, AI customer support, and user engagement across Telegram and Messaging networks.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                <ShieldCheck size={13} className="text-emerald-400" />
                <span>GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                <Lock size={13} className="text-indigo-400" />
                <span>256-bit SSL Encrypted</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li>
                <a href="/#features" className="hover:text-white transition-colors">Features</a>
              </li>
              <li>
                <a href="/#pricing" className="hover:text-white transition-colors">Pricing</a>
              </li>
              <li>
                <Link to={ROUTES.BLOG} className="hover:text-white transition-colors">Blog & Updates</Link>
              </li>
              <li>
                <Link to={ROUTES.REGISTER} className="hover:text-white transition-colors">Free Trial</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider mb-4">Resources</h4>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li>
                <Link to={ROUTES.BLOG} className="hover:text-white transition-colors">Documentation</Link>
              </li>
              <li>
                <a href="https://t.me/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Telegram Support</span>
                </a>
              </li>
              <li>
                <Link to={ROUTES.BLOG} className="hover:text-white transition-colors">API Reference</Link>
              </li>
              <li>
                <span className="text-slate-500 cursor-not-allowed">System Status (Operational)</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider mb-4">Legal & Privacy</h4>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li>
                <Link to={ROUTES.TERMS} className="hover:text-white transition-colors flex items-center gap-1.5">
                  <FileText size={13} className="text-indigo-400" />
                  <span>Terms of service</span>
                </Link>
              </li>
              <li>
                <Link to={ROUTES.PRIVACY} className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-indigo-400" />
                  <span>Privacy policy</span>
                </Link>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
          <p className="flex items-center gap-1">
            <span>&copy; {currentYear} Launchly Inc. All rights reserved. Built with</span>
            <Heart size={12} className="text-rose-500 fill-rose-500 inline" />
            <span>for marketers & developers.</span>
          </p>
          <div className="flex items-center gap-6 text-xs">
            <Link to={ROUTES.TERMS} className="hover:text-slate-300 transition-colors">Terms</Link>
            <Link to={ROUTES.PRIVACY} className="hover:text-slate-300 transition-colors">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
