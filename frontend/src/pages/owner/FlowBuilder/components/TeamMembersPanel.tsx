import React, { useState, useEffect, useRef } from 'react';
import { X, HelpCircle, Check, Plus, ChevronDown } from 'lucide-react';
import { useBotStore } from '../../../../store/useBotStore';
import { useAuthStore } from '../../../../store/useAuthStore';
import { t } from '../../../../i18n/config';
import {
  getTeamMembersApi,
  inviteMemberApi,
  cancelInvitationApi,
  updateMemberApi,
  removeMemberApi
} from '../../../../api/teamApi';
import type { TeamMemberResponse } from '../../../../api/teamApi';
import { SafeAvatar } from '../../../../components/common/SafeAvatar';

const CustomRoleDropdown: React.FC<{
  currentRole: string;
  disabled?: boolean;
  onSelectRole: (role: string) => void;
}> = ({ currentRole, disabled = false, onSelectRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roles = ['Admin', 'Editor', 'Inbox Agent', 'Viewer'];

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2 bg-white text-[#0A0A0A] text-xs font-bold rounded-xl border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] flex items-center justify-between transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <span>{currentRole}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-1.5 w-full bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] rounded-2xl z-50 py-1.5 overflow-hidden animate-in fade-in duration-150">
          {roles.map((role) => {
            const isSelected = role === currentRole;
            return (
              <button
                key={role}
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onSelectRole(role);
                }}
                className={`w-full text-left px-4 py-2 text-xs font-extrabold transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                    : 'text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD]'
                }`}
              >
                <span>{role}</span>
                {isSelected && <Check size={12} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const getRoleDescription = (role: string) => {
  switch (role) {
    case 'Owner': return t('settings.members.role.owner_desc');
    case 'Admin': return t('settings.members.role.admin_desc');
    case 'Editor': return t('settings.members.role.editor_desc');
    case 'Inbox Agent': return t('settings.members.role.agent_desc');
    case 'Viewer': return t('settings.members.role.viewer_desc');
    default: return '';
  }
};

export const TeamMembersPanel: React.FC = () => {
  const activeBotId = useBotStore((state) => state.activeBotId);
  const currentUser = useAuthStore((s) => s.user);

  const [members, setMembers] = useState<TeamMemberResponse[]>([]);
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Viewer');
  const [inviteInboxSeat, setInviteInboxSeat] = useState(false);
  const [inviteBilling, setInviteBilling] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchMembers = async () => {
    if (!activeBotId) return;
    try {
      const data = await getTeamMembersApi(activeBotId);
      setMembers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [activeBotId]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBotId || !inviteEmail.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      await inviteMemberApi(activeBotId, {
        email: inviteEmail.trim(),
        role: inviteRole,
        inboxSeat: inviteInboxSeat,
        billingPermission: inviteBilling
      });
      setIsInviteOpen(false);
      setInviteEmail('');
      setInviteRole('Viewer');
      setInviteInboxSeat(false);
      setInviteBilling(false);
      fetchMembers();
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setErrorMsg(message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePermissions = async (
    targetUserId: number,
    updatedRole: string,
    updatedInboxSeat: boolean,
    updatedBilling: boolean
  ) => {
    if (!activeBotId) return;
    try {
      await updateMemberApi(activeBotId, targetUserId, {
        role: updatedRole,
        inboxSeat: updatedInboxSeat,
        billingPermission: updatedBilling
      });
      fetchMembers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveMemberOrInvite = async (member: TeamMemberResponse) => {
    if (!activeBotId) return;
    try {
      const isMe = member.userId === currentUser?.id;
      if (member.isPending) {
        await cancelInvitationApi(activeBotId, member.id);
      } else if (member.userId) {
        await removeMemberApi(activeBotId, member.userId);
      }
      setEditingMemberId(null);
      if (isMe) {
        window.location.href = '/';
      } else {
        fetchMembers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getMemberName = (m: TeamMemberResponse) => {
    if (m.userId === currentUser?.id && currentUser?.name) {
      return currentUser.name;
    }
    return m.name || m.email;
  };

  const renderMemberAvatar = (m: TeamMemberResponse, sizeClass = 'w-8 h-8') => {
    const avatarUrl = m.userId === currentUser?.id && currentUser?.avatar ? currentUser.avatar : m.avatar;
    const name = getMemberName(m);
    return (
      <SafeAvatar
        src={avatarUrl}
        name={name}
        className={`${sizeClass} rounded-full object-cover border-2 border-[#0A0A0A] shrink-0`}
        fallbackClassName={`${sizeClass} rounded-full bg-[#0A0A0A] text-[#F2EBDD] font-black flex items-center justify-center text-xs shrink-0 select-none border-2 border-[#0A0A0A]`}
      />
    );
  };

  const editingMember = members.find(m => m.id === editingMemberId);

  if (editingMemberId && editingMember) {
    const isMe = editingMember.userId === currentUser?.id;
    const isOwner = editingMember.role === 'Owner';

    return (
      <div className="space-y-6 text-left font-['JetBrains_Mono',monospace]">
        <div className="flex items-center gap-1.5 text-xs font-black text-slate-600 select-none">
          <button
            onClick={() => setEditingMemberId(null)}
            className="hover:text-[#0A0A0A] transition-colors cursor-pointer uppercase"
          >
            {t('settings.members.breadcrumb')}
          </button>
          <span>&gt;</span>
          <span className="text-[#0A0A0A] uppercase">{getMemberName(editingMember)}</span>
        </div>

        <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl divide-y-2 divide-[#0A0A0A]/15 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 items-center">
            <div className="lg:col-span-3">
              <span className="font-['Anybody',sans-serif] text-xs font-black text-[#0A0A0A] uppercase">{t('settings.members.name')}</span>
            </div>
            <div className="lg:col-span-9 flex items-center gap-3">
              {renderMemberAvatar(editingMember)}
              <span className="text-xs font-bold text-[#0A0A0A]">{getMemberName(editingMember)}</span>
              {editingMember.isPending && (
                <span className="px-2 py-0.5 bg-amber-200 border-2 border-[#0A0A0A] text-[#0A0A0A] rounded-md font-black text-[10px] uppercase">
                  {t('settings.members.pending_invite')}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 items-start">
            <div className="lg:col-span-3 pt-1">
              <span className="font-['Anybody',sans-serif] text-xs font-black text-[#0A0A0A] uppercase">{t('settings.members.role_label')}</span>
            </div>
            <div className="lg:col-span-5">
              <CustomRoleDropdown
                currentRole={editingMember.role}
                disabled={isMe || isOwner || editingMember.isPending}
                onSelectRole={(newRole) => {
                  const targetUserId = editingMember.userId || editingMember.id;
                  handleUpdatePermissions(
                    targetUserId,
                    newRole,
                    editingMember.inboxSeat,
                    editingMember.billingPermission
                  );
                }}
              />
            </div>
            <div className="lg:col-span-4">
              <p className="text-xs text-slate-700 font-bold leading-relaxed">
                {getRoleDescription(editingMember.role)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 items-start">
            <div className="lg:col-span-3 pt-1">
              <span className="font-['Anybody',sans-serif] text-xs font-black text-[#0A0A0A] uppercase">{t('settings.members.seat_type')}</span>
            </div>
            <div className="lg:col-span-5 flex items-center gap-3">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={editingMember.inboxSeat}
                  disabled={isMe || isOwner || editingMember.isPending}
                  onChange={(e) => {
                    if (editingMember.userId) {
                      handleUpdatePermissions(
                        editingMember.userId,
                        editingMember.role,
                        e.target.checked,
                        editingMember.billingPermission
                      );
                    }
                  }}
                  className="w-4 h-4 accent-[#0A0A0A] cursor-pointer"
                />
                <span className="text-xs font-bold text-[#0A0A0A] select-none">{t('settings.members.inbox_seat')}</span>
              </label>
            </div>
            <div className="lg:col-span-4">
              <p className="text-xs text-slate-700 font-bold leading-relaxed">
                {t('settings.members.inbox_seat_desc')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 items-start">
            <div className="lg:col-span-3 pt-1">
              <span className="font-['Anybody',sans-serif] text-xs font-black text-[#0A0A0A] uppercase">{t('settings.members.billing')}</span>
            </div>
            <div className="lg:col-span-5 flex items-center gap-3">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={editingMember.billingPermission}
                  disabled={isMe || isOwner || editingMember.isPending}
                  onChange={(e) => {
                    if (editingMember.userId) {
                      handleUpdatePermissions(
                        editingMember.userId,
                        editingMember.role,
                        editingMember.inboxSeat,
                        e.target.checked
                      );
                    }
                  }}
                  className="w-4 h-4 accent-[#0A0A0A] cursor-pointer"
                />
                <span className="text-xs font-bold text-[#0A0A0A] select-none">{t('settings.members.has_permissions')}</span>
              </label>
            </div>
            <div className="lg:col-span-4">
              <p className="text-xs text-slate-700 font-bold leading-relaxed">
                {t('settings.members.billing_desc')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 items-start">
            <div className="lg:col-span-3 pt-1">
              <span className="font-['Anybody',sans-serif] text-xs font-black text-[#0A0A0A] uppercase">{t('settings.members.remove')}</span>
            </div>
            <div className="lg:col-span-5">
              <button
                type="button"
                onClick={() => handleRemoveMemberOrInvite(editingMember)}
                disabled={isOwner || (isMe && editingMember.role === 'Owner')}
                className="w-full py-2 bg-rose-200 hover:bg-rose-300 border-2 border-[#0A0A0A] text-[#0A0A0A] text-xs font-black uppercase rounded-xl select-none cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingMember.isPending ? t('settings.members.btn.cancel_inv') : isMe ? t('settings.members.btn.leave_ws') : t('settings.members.btn.remove_mem')}
              </button>
            </div>
            <div className="lg:col-span-4">
              <p className="text-xs text-slate-700 font-bold leading-relaxed">
                {isMe
                  ? isOwner
                    ? t('settings.members.desc.owner_leave')
                    : t('settings.members.desc.me_leave')
                  : isOwner
                  ? t('settings.members.desc.owner_remove')
                  : t('settings.members.desc.member_remove')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-['JetBrains_Mono',monospace]">
      <div className="space-y-6 text-left animate-in fade-in duration-150">
        <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl overflow-hidden">
          <div className="p-5 flex justify-between items-center border-b-2 border-[#0A0A0A]">
            <h3 className="font-['Anybody',sans-serif] text-sm font-black text-[#0A0A0A] uppercase">
              {t('settings.members.title', 'Члени команди')}
            </h3>
            <button
              onClick={() => {
                setErrorMsg('');
                setIsInviteOpen(true);
              }}
              className="px-4 py-2 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-[#F2EBDD] text-xs font-black uppercase rounded-xl border-2 border-[#0A0A0A] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>{t('settings.members.btn.invite', 'Запросити учасника')}</span>
            </button>
          </div>

          <div className="p-6">
            <div className="bg-white border-2 border-[#0A0A0A] rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 border-b-2 border-[#0A0A0A] font-extrabold uppercase text-[#0A0A0A]">
                  <tr>
                    <th className="px-6 py-3.5">{t('settings.members.table.name', "Ім'я")}</th>
                    <th className="px-6 py-3.5">{t('settings.members.table.role', 'Роль')}</th>
                    <th className="px-6 py-3.5 flex items-center gap-1">
                      {t('settings.members.table.inbox', 'Доступ до Inbox')}
                      <HelpCircle size={12} className="text-slate-400 cursor-help" />
                    </th>
                    <th className="px-6 py-3.5">
                      <div className="flex items-center gap-1">
                        {t('settings.members.table.billing', 'Оплата')}
                        <HelpCircle size={12} className="text-slate-400 cursor-help" />
                      </div>
                    </th>
                    <th className="px-6 py-3.5 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y border-[#0A0A0A]/10 font-bold">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        {renderMemberAvatar(m)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-[#0A0A0A]">{getMemberName(m)}</span>
                            {m.userId === currentUser?.id && (
                              <span className="bg-[#0A0A0A] text-[#F2EBDD] text-[9px] px-1.5 py-0.5 rounded uppercase font-black">
                                {t('settings.members.badge.me', 'Це я')}
                              </span>
                            )}
                            {m.isPending && (
                              <span className="bg-amber-200 text-[#0A0A0A] text-[9px] px-1.5 py-0.5 rounded uppercase font-black border border-[#0A0A0A]">
                                {t('settings.members.badge.pending', 'Очікує')}
                              </span>
                            )}
                          </div>
                          {m.email && <div className="text-[10px] text-slate-500 font-bold">{m.email}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {m.role === 'Owner'
                          ? t('settings.members.role.owner', 'Owner')
                          : m.role === 'Admin'
                          ? t('settings.members.role.admin', 'Admin')
                          : t('settings.members.role.viewer', 'Viewer')}
                      </td>
                      <td className="px-6 py-4">
                        {m.inboxSeat && <Check size={16} className="text-[#0A0A0A]" />}
                      </td>
                      <td className="px-6 py-4">
                        {m.billingPermission && <Check size={16} className="text-[#0A0A0A]" />}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setEditingMemberId(m.id)}
                          className="text-[#0A0A0A] hover:underline font-black uppercase cursor-pointer"
                        >
                          {t('settings.members.table.edit', 'Редагувати')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {isInviteOpen && (
        <div 
          onClick={() => {
            setIsInviteOpen(false);
            setInviteEmail('');
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0A0A0A]/40 p-4 animate-in fade-in duration-200 cursor-pointer"
        >
          <form 
            onSubmit={handleSendInvite}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-6 shadow-[8px_8px_0px_0px_#0A0A0A] w-full max-w-md flex flex-col gap-4 animate-in zoom-in-95 duration-200 text-left cursor-default"
          >
            <div className="flex items-center justify-between border-b-2 border-[#0A0A0A] pb-3">
              <h3 className="font-['Anybody',sans-serif] text-sm font-black text-[#0A0A0A] uppercase tracking-wide">
                {t('settings.members.invite_btn')}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsInviteOpen(false);
                  setInviteEmail('');
                }}
                className="p-1 hover:bg-white rounded-lg text-[#0A0A0A] transition-all cursor-pointer border-2 border-transparent hover:border-[#0A0A0A]"
              >
                <X size={16} />
              </button>
            </div>

            {errorMsg && (
              <div className="px-4 py-2.5 bg-rose-200 border-2 border-[#0A0A0A] text-[#0A0A0A] text-xs font-bold rounded-xl">
                {errorMsg}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1.5">
                  {t('settings.members.invite.email_label')}
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder={t('settings.members.invite.email_placeholder')}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold bg-white text-[#0A0A0A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-2.5">
                  {t('settings.members.invite.select_role')}
                </label>
                <div className="space-y-2">
                  {['Admin', 'Editor', 'Inbox Agent', 'Viewer'].map((role) => (
                    <label key={role} className="flex items-center gap-3 select-none cursor-pointer">
                      <input
                        type="radio"
                        name="inviteRole"
                        checked={inviteRole === role}
                        onChange={() => {
                          setInviteRole(role);
                          setInviteInboxSeat(role !== 'Viewer');
                          setInviteBilling(role === 'Admin');
                        }}
                        className="w-4 h-4 accent-[#0A0A0A] cursor-pointer"
                      />
                      <span className="text-xs font-bold text-[#0A0A0A]">{role}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-t-2 border-b-2 border-[#0A0A0A]/15">
                <span className="text-xs font-bold text-[#0A0A0A]">{t('settings.members.invite.assign_inbox')}</span>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={inviteInboxSeat}
                    onChange={(e) => setInviteInboxSeat(e.target.checked)}
                    className="w-4 h-4 accent-[#0A0A0A] cursor-pointer"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between pb-2 border-b-2 border-[#0A0A0A]/15">
                <span className="text-xs font-bold text-[#0A0A0A]">{t('settings.members.invite.grant_billing')}</span>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={inviteBilling}
                    onChange={(e) => setInviteBilling(e.target.checked)}
                    className="w-4 h-4 accent-[#0A0A0A] cursor-pointer"
                  />
                </label>
              </div>

              <div className="bg-white border-2 border-[#0A0A0A] p-4 rounded-2xl text-xs text-slate-700 font-bold leading-relaxed">
                {getRoleDescription(inviteRole)}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t-2 border-[#0A0A0A]/15 select-none">
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="px-4 py-2.5 bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] text-xs font-black uppercase rounded-xl border-2 border-[#0A0A0A] transition-all cursor-pointer"
              >
                {t('settings.members.invite.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading || !inviteEmail.trim()}
                className="px-5 py-2.5 bg-[#0A0A0A] hover:bg-[#2A2A2A] disabled:opacity-55 text-[#F2EBDD] text-xs font-black uppercase rounded-xl border-2 border-[#0A0A0A] transition-all cursor-pointer"
              >
                {loading ? t('settings.members.invite.sending') : t('settings.members.invite.send_btn')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
