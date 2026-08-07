import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, ShieldCheck, UserCheck, Loader2, ArrowRight, LogOut } from 'lucide-react';
import { useBotStore } from '../../../../store/useBotStore';
import { useBotsQuery } from '../../../../hooks/bot/useBotsQuery';
import { useAuthStore } from '../../../../store/useAuthStore';
import { useLogoutMutation } from '../../../../hooks/auth/useLogoutMutation';
import { getTeamMembersApi, transferOwnershipApi, leaveBotApi, type TeamMemberResponse } from '../../../../api/teamApi';
import { SafeAvatar } from '../../../../components/common/SafeAvatar';
import { t } from '../../../../i18n/config';

interface LeaveAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTeam?: () => void;
}

export const LeaveAccountModal: React.FC<LeaveAccountModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTeam,
}) => {
  const activeBotId = useBotStore((state) => state.activeBotId);
  const { data: bots = [] } = useBotsQuery();
  const botId = activeBotId || (bots[0]?.id || 0);

  const currentUser = useAuthStore((state) => state.user);
  const logoutMutation = useLogoutMutation();

  const [candidates, setCandidates] = useState<TeamMemberResponse[]>([]);
  const [isOwner, setIsOwner] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedNewOwnerId, setSelectedNewOwnerId] = useState<number | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !botId) return;
    setConfirmText('');

    const fetchMembers = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const allMembers = await getTeamMembersApi(botId);
        const ownerMember = allMembers.find((m) => m.role === 'Owner');
        const userIsOwner = Boolean(
          ownerMember
            ? (currentUser?.id && (ownerMember.userId === currentUser.id || ownerMember.id === currentUser.id)) ||
              (currentUser?.email && ownerMember.email?.toLowerCase() === currentUser.email.toLowerCase())
            : true
        );

        setIsOwner(userIsOwner);

        const validCandidates = allMembers.filter((m) => {
          if (m.isPending) return false;
          if (m.role === 'Owner') return false;
          if (currentUser?.id && (m.userId === currentUser.id || m.id === currentUser.id)) return false;
          if (currentUser?.email && m.email && m.email.toLowerCase() === currentUser.email.toLowerCase()) return false;
          return true;
        });

        setCandidates(validCandidates);
        if (validCandidates.length > 0) {
          const defaultCand = validCandidates.find((m) => m.userId) || validCandidates[0];
          if (defaultCand && defaultCand.userId) {
            setSelectedNewOwnerId(defaultCand.userId);
          }
        }
      } catch (err) {
        setIsOwner(true);
        setCandidates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [isOpen, botId, currentUser?.id, currentUser?.email]);

  if (!isOpen) return null;

  const confirmTransferWord = t('settings.leave.confirm_word', 'ПЕРЕДАТИ').toUpperCase();
  const confirmLeaveWord = t('settings.leave.confirm_leave_word', 'ВИЙТИ').toUpperCase();

  const userTyped = confirmText.trim().toUpperCase();
  const isTransferConfirmed = userTyped === confirmTransferWord || userTyped === 'ПЕРЕДАТИ' || userTyped === 'TRANSFER';
  const isLeaveConfirmed = userTyped === confirmLeaveWord || userTyped === 'ВИЙТИ' || userTyped === 'LEAVE';

  const handleTransferAndLeave = async () => {
    if (candidates.length > 0 && !selectedNewOwnerId) {
      setErrorMsg(t('settings.leave.select_new_owner_err', 'Будь ласка, оберіть нового власника з команди'));
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      if (candidates.length > 0 && selectedNewOwnerId) {
        await transferOwnershipApi(botId, selectedNewOwnerId);
      } else {
        await leaveBotApi(botId);
      }

      logoutMutation.mutate();
    } catch (err) {
      logoutMutation.mutate();
    } finally {
      setSubmitting(false);
    }
  };

  const handleOnlyLeaveTeam = async () => {
    setSubmitting(true);
    setErrorMsg(null);

    try {
      await leaveBotApi(botId);
      logoutMutation.mutate();
    } catch (err) {
      logoutMutation.mutate();
    } finally {
      setSubmitting(false);
    }
  };

  const hasCandidates = candidates.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-['JetBrains_Mono',monospace]">
      <div className="bg-[#F2EBDD] border-4 border-[#0A0A0A] shadow-[10px_10px_0px_#0A0A0A] rounded-3xl max-w-lg w-full overflow-hidden text-[#0A0A0A] relative">
        
        {/* Header */}
        <div className="p-6 border-b-2 border-[#0A0A0A] flex items-center justify-between bg-amber-100/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-[#0A0A0A] border-2 border-[#0A0A0A] flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#0A0A0A]">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h2 className="font-extrabold text-base uppercase tracking-tight">
                {t('settings.leave.title', 'Залишити акаунт')}
              </h2>
              <p className="text-[11px] font-bold text-slate-600">
                {t('settings.leave.subtitle', 'Передача права власності та вихід з команди')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-xl border-2 border-[#0A0A0A] bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-[#0A0A0A]" size={28} />
              <span className="text-xs font-bold">{t('settings.leave.checking_team', 'Перевірка складу команди...')}</span>
            </div>
          ) : !isOwner ? (
            /* CASE B: User is NOT the owner (Joined member) */
            <>
              <div className="bg-amber-50 border-2 border-[#0A0A0A] p-5 rounded-2xl space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={22} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1.5">
                    <h4 className="font-extrabold text-xs uppercase text-[#0A0A0A]">
                      {t('settings.leave.member_notice_title', 'Ви є членом цієї команди')}
                    </h4>
                    <p className="text-[11.5px] font-bold text-slate-700 leading-relaxed">
                      {t(
                        'settings.leave.member_notice_desc',
                        'Передати право власності на акаунт може лише Owner. При натисканні кнопки нижче ви вийдете з команди цього проєкту та втратите доступ до його матеріалів.'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Word Confirmation for leaving team */}
              <div className="pt-3 border-t-2 border-[#0A0A0A]/15 space-y-2">
                <label className="block text-[11px] font-extrabold uppercase text-[#0A0A0A] leading-tight">
                  {t('settings.leave.confirm_leave_label', 'Для підтвердження виходу введіть слово')}{' '}
                  <span className="bg-amber-300 px-2 py-0.5 rounded-md border border-[#0A0A0A] font-black text-[#0A0A0A] select-all">
                    {confirmLeaveWord}
                  </span>:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={t('settings.leave.confirm_leave_placeholder', `Введіть ${confirmLeaveWord}...`)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#0A0A0A] bg-white text-xs font-black uppercase text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-400 placeholder:font-bold tracking-wider"
                />
              </div>
            </>
          ) : hasCandidates ? (
            /* CASE A1: Owner with team candidates */
            <>
              <div className="bg-white border-2 border-[#0A0A0A] p-4 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-[#0A0A0A]">
                  <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                  <span>{t('settings.leave.select_owner_title', 'Оберіть нового Власника (Owner):')}</span>
                </div>
                <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
                  {t(
                    'settings.leave.owner_desc',
                    'Право власності на цей бот, проєкт та його PRO-підписку буде повністю передано обраному користувачу. Ви вийдете з цього акаунту.'
                  )}
                </p>
              </div>

              {errorMsg && (
                <div className="bg-rose-100 border-2 border-rose-600 text-rose-800 p-3 rounded-xl text-xs font-bold">
                  {errorMsg}
                </div>
              )}

              {/* Members Select List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {candidates.map((m) => {
                  const isSelected = selectedNewOwnerId === m.userId;
                  return (
                    <div
                      key={m.id}
                      onClick={() => m.userId && setSelectedNewOwnerId(m.userId)}
                      className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#0A0A0A] text-[#F2EBDD] border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A]'
                          : 'bg-white text-[#0A0A0A] border-[#0A0A0A] hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <SafeAvatar
                          src={m.avatar}
                          name={m.name}
                          className="w-9 h-9 rounded-full object-cover border-2 border-current shrink-0"
                          fallbackClassName="w-9 h-9 rounded-full bg-amber-400 text-[#0A0A0A] font-black flex items-center justify-center text-xs shrink-0 border-2 border-current"
                        />
                        <div>
                          <p className="font-extrabold text-xs leading-snug">{m.name}</p>
                          <p className={`text-[10px] font-bold ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                            {m.email} • {m.role}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-[#F2EBDD] bg-amber-400' : 'border-[#0A0A0A]'
                        }`}
                      >
                        {isSelected && <UserCheck size={12} className="text-[#0A0A0A]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Strict Word Confirmation */}
              <div className="pt-3 border-t-2 border-[#0A0A0A]/15 space-y-2">
                <label className="block text-[11px] font-extrabold uppercase text-[#0A0A0A] leading-tight">
                  {t('settings.leave.confirm_label', 'Для підтвердження введіть слово')}{' '}
                  <span className="bg-amber-300 px-2 py-0.5 rounded-md border border-[#0A0A0A] font-black text-[#0A0A0A] select-all">
                    {confirmTransferWord}
                  </span>:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={t('settings.leave.confirm_placeholder', `Введіть ${confirmTransferWord}...`)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#0A0A0A] bg-white text-xs font-black uppercase text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-400 placeholder:font-bold tracking-wider"
                />
              </div>
            </>
          ) : (
            /* CASE A2: Owner sole user */
            <div className="bg-amber-50 border-2 border-[#0A0A0A] p-5 rounded-2xl space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-xs uppercase text-[#0A0A0A]">
                    {t('settings.leave.no_members_title', 'Ви єдиний користувач у цьому акаунті')}
                  </h4>
                  <p className="text-[11.5px] font-bold text-slate-700 leading-relaxed">
                    {t(
                      'settings.leave.no_members_desc',
                      'Щоб передати акаунт іншому користувачу, спочатку додайте члена команди у розділі "Команда". Якщо ви бажаєте повністю видалити акаунт, скористайтеся кнопкою "Видалити акаунт".'
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t-2 border-[#0A0A0A] bg-white flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-5 py-2.5 bg-white hover:bg-slate-100 text-[#0A0A0A] border-2 border-[#0A0A0A] text-xs font-extrabold rounded-xl transition-all cursor-pointer"
          >
            {t('common.cancel', 'Скасувати')}
          </button>

          {!isOwner ? (
            <button
              onClick={handleOnlyLeaveTeam}
              disabled={submitting || !isLeaveConfirmed}
              className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  <span>{t('settings.leave.leaving_team', 'Виходимо з команди...')}</span>
                </>
              ) : (
                <>
                  <span>{t('settings.leave.btn_leave_team', 'Вийти з команди')}</span>
                  <LogOut size={14} />
                </>
              )}
            </button>
          ) : hasCandidates ? (
            <button
              onClick={handleTransferAndLeave}
              disabled={submitting || !selectedNewOwnerId || !isTransferConfirmed}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  <span>{t('settings.leave.submitting', 'Передаємо акаунт...')}</span>
                </>
              ) : (
                <>
                  <span>{t('settings.leave.btn_transfer', 'Передати акаунт та вийти')}</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          ) : (
            onNavigateToTeam && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToTeam();
                }}
                className="px-6 py-2.5 bg-[#0A0A0A] hover:bg-[#0A0A0A]/90 text-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <span>{t('settings.leave.btn_add_member', 'Перейти в раздел Команда')}</span>
                <ArrowRight size={14} />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
