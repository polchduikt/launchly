import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '../../../../i18n/config';

interface CreateContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    gender: string;
  }) => void;
}

import { COUNTRIES } from '../../../../const/chat';
import { createContactSchema } from '../../../../schemas/crm.schema';

export const CreateContactModal: React.FC<CreateContactModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [countryIndex, setCountryIndex] = useState(0);
  const [phoneBody, setPhoneBody] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);

  if (!isOpen) return null;

  const activeCountry = COUNTRIES[countryIndex];
  const fullPhone = phoneBody.trim() ? `${activeCountry.dial}${phoneBody.trim()}` : '';
  const validationResult = createContactSchema.safeParse({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    phone: fullPhone,
    email: email.trim(),
    gender,
  });

  const isFormValid = validationResult.success && isConfirmed;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !validationResult.success) return;

    onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: fullPhone,
      email: email.trim(),
      gender,
    });

    setFirstName('');
    setLastName('');
    setPhoneBody('');
    setEmail('');
    setGender('');
    setIsConfirmed(false);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0A]/50 p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#F2EBDD] rounded-2xl border-2 border-[#0A0A0A] shadow-2xl max-w-md w-full overflow-hidden cursor-default font-['JetBrains_Mono',monospace]"
      >
        <div className="px-6 py-4 border-b-2 border-[#0A0A0A] flex items-center justify-between">
          <h3 className="font-['Anybody',sans-serif] text-base font-black text-[#0A0A0A] uppercase tracking-tight select-none">
            {t('crm.contacts.btn.create')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#0A0A0A] hover:bg-white p-1 rounded-xl border-2 border-transparent hover:border-[#0A0A0A] transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-xs font-bold text-slate-700 leading-relaxed select-none">
            {t('crm.contact.create_desc')}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-[#0A0A0A] uppercase tracking-wider select-none">
              {t('crm.contact.first_name')}
            </label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3.5 py-2.5 border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] placeholder:text-slate-500 focus:outline-none transition-all bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-[#0A0A0A] uppercase tracking-wider select-none">
              {t('crm.contact.last_name')}
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3.5 py-2.5 border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] placeholder:text-slate-500 focus:outline-none transition-all bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-[#0A0A0A] uppercase tracking-wider select-none">
              {t('crm.contact.phone_number')}
            </label>
            <div className="flex gap-2">
              <div className="relative">
                <select
                  value={countryIndex}
                  onChange={(e) => setCountryIndex(Number(e.target.value))}
                  className="px-3 py-2.5 border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] bg-white focus:outline-none cursor-pointer appearance-none pr-7"
                >
                  {COUNTRIES.map((c, i) => (
                    <option key={c.code} value={i}>
                      {c.code}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[9px] text-[#0A0A0A]">
                  ▼
                </div>
              </div>
              <div className="flex-1 flex border-2 border-[#0A0A0A] rounded-xl overflow-hidden bg-white">
                <span className="px-2.5 flex items-center justify-center text-xs font-bold text-[#0A0A0A] bg-slate-100 border-r border-[#0A0A0A] select-none">
                  {activeCountry.dial}
                </span>
                <input
                  type="text"
                  placeholder={t('crm.contact.enter_phone')}
                  value={phoneBody}
                  onChange={(e) => setPhoneBody(e.target.value.replace(/[^0-9]/g, ''))}
                  className="flex-1 px-3 py-2.5 text-xs font-bold text-[#0A0A0A] placeholder:text-slate-500 focus:outline-none bg-white"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-[#0A0A0A] uppercase tracking-wider select-none">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] placeholder:text-slate-500 focus:outline-none transition-all bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-[#0A0A0A] uppercase tracking-wider select-none">
              {t('crm.contact.gender')}
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-3.5 py-2.5 border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] bg-white focus:outline-none cursor-pointer"
            >
              <option value="">{t('crm.contact.select_gender')}</option>
              <option value="Male">{t('crm.contact.gender_male')}</option>
              <option value="Female">{t('crm.contact.gender_female')}</option>
              <option value="Other">{t('crm.contact.gender_other')}</option>
            </select>
          </div>

          <label className="flex gap-3 items-start cursor-pointer select-none text-[11px] font-bold text-slate-700 leading-normal pt-1">
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="mt-0.5 accent-[#0A0A0A] cursor-pointer"
            />
            <span>
              {t('crm.contact.consent_confirmation')}
            </span>
          </label>

          <div className="flex justify-end gap-3 pt-3 border-t-2 border-[#0A0A0A]/15">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-[#0A0A0A] hover:bg-white border-2 border-[#0A0A0A] rounded-xl transition-all cursor-pointer"
            >
              {t('crm.contacts.bulk.btn_cancel')}
            </button>
            <button
              type="submit"
              disabled={!isFormValid}
              className="px-5 py-2.5 text-xs font-black uppercase text-[#F2EBDD] bg-[#0A0A0A] hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-[#0A0A0A] rounded-xl transition-all cursor-pointer"
            >
              {t('crm.contacts.btn.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
