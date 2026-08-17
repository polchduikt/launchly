import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../../../store/useAuthStore';
import { updateProfileApi } from '../../../../api/auth';
import { useMediaUpload } from '../../../../hooks/bot/useMediaUpload';
import { SafeAvatar } from '../../../../components/common/SafeAvatar';
import { t } from '../../../../i18n/config';
import { 
  Camera, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  User as UserIcon, 
  Mail, 
  Lock, 
  ShieldCheck,
  Check
} from 'lucide-react';

export const ProfilePanel: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState<string | null>(user?.avatar || null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarUploadMutation = useMediaUpload('avatars');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setAvatar(user.avatar || null);
    }
  }, [user]);

  const isGoogle = user?.provider === 'GOOGLE';
  const hasPassword = Boolean(user?.hasPassword);

  const hasChanges =
    name.trim() !== (user?.name || '') ||
    (!isGoogle && email.trim().toLowerCase() !== (user?.email || '').toLowerCase()) ||
    (avatar || null) !== (user?.avatar || null) ||
    (hasPassword && currentPassword.length > 0) ||
    newPassword.length > 0 ||
    confirmPassword.length > 0;

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg(t('settings.profile.error_image_type', 'Please select an image file'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(t('settings.profile.error_image_size', 'Image size must not exceed 5 MB'));
      return;
    }

    setErrorMsg(null);
    avatarUploadMutation.mutate(file, {
      onSuccess: (data) => {
        setAvatar(data.url);
      },
      onError: (err: any) => {
        setErrorMsg(err?.response?.data?.message || t('settings.profile.error_avatar_upload', 'Failed to upload avatar'));
      },
    });
  };

  const handleRemoveAvatar = () => {
    setAvatar(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg(t('settings.profile.error_empty_name', 'Please enter your name'));
      return;
    }

    if (!isGoogle && (!email.trim() || !email.includes('@'))) {
      setErrorMsg(t('settings.profile.error_invalid_email', 'Please enter a valid email'));
      return;
    }

    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        setErrorMsg(t('settings.profile.error_password_min', 'New password must be at least 6 characters'));
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg(t('settings.profile.error_password_match', 'New passwords do not match'));
        return;
      }
      if (hasPassword && !currentPassword) {
        setErrorMsg(t('settings.profile.error_current_password', 'Enter current password to save changes'));
        return;
      }
    }

    setIsSaving(true);
    try {
      const updatedUser = await updateProfileApi({
        name: name.trim(),
        email: isGoogle ? user!.email : email.trim(),
        avatar: avatar,
        currentPassword: hasPassword ? (currentPassword || undefined) : undefined,
        newPassword: newPassword || undefined,
      });

      setUser(updatedUser);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMsg(t('settings.profile.save_success', 'Profile successfully updated!'));
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || t('settings.profile.save_error', 'Failed to update profile'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl divide-y-2 divide-[#0A0A0A]/15 overflow-hidden font-['JetBrains_Mono',monospace] shadow-[4px_4px_0px_#0A0A0A]">
      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
        <div className="border-b-2 border-[#0A0A0A]/15 pb-6">
          <h2 className="font-['Anybody',sans-serif] text-xl md:text-2xl font-black uppercase text-[#0A0A0A] tracking-tight">
            {t('settings.profile.title', 'Edit Profile')}
          </h2>
          <p className="text-xs text-slate-600 font-bold mt-1">
            {t('settings.profile.subtitle', 'Manage your personal information, avatar and security')}
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-100 border-2 border-rose-500 rounded-2xl flex items-center gap-3 text-xs font-bold text-rose-800 shadow-[2px_2px_0px_#0A0A0A]">
            <AlertCircle size={18} className="shrink-0 text-rose-600" />
            <span className="flex-1">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-100 border-2 border-emerald-500 rounded-2xl flex items-center gap-3 text-xs font-bold text-emerald-800 shadow-[2px_2px_0px_#0A0A0A]">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
            <span className="flex-1">{successMsg}</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between pb-6 border-b-2 border-[#0A0A0A]/15">
          <div className="w-full md:w-1/3">
            <h3 className="font-bold text-sm text-[#0A0A0A] uppercase">{t('settings.profile.avatar_title', 'Profile Avatar')}</h3>
            <p className="text-xs text-slate-600 font-bold mt-1">
              {t('settings.profile.avatar_desc', 'Formats: PNG, JPG, WEBP (up to 5 MB)')}
            </p>
          </div>

          <div className="w-full md:w-2/3 flex flex-wrap items-center gap-6">
            <div className="relative group">
              <SafeAvatar
                src={avatar}
                name={name || user?.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A]"
                fallbackClassName="w-20 h-20 rounded-2xl bg-white text-[#0A0A0A] font-black text-2xl flex items-center justify-center border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A]"
              />
              {avatarUploadMutation.isPending && (
                <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center text-white">
                  <Loader2 size={24} className="animate-spin" />
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarFileChange}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploadMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] text-xs font-bold border-2 border-[#0A0A0A] rounded-xl transition-all cursor-pointer shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
              >
                <Camera size={14} />
                <span>{t('settings.profile.btn_upload_avatar', 'Upload new photo')}</span>
              </button>

              {avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={avatarUploadMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold border-2 border-[#0A0A0A] rounded-xl transition-all cursor-pointer shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
                >
                  <Trash2 size={14} />
                  <span>{t('settings.profile.btn_delete_avatar', 'Remove')}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 md:items-start justify-between pb-6 border-b-2 border-[#0A0A0A]/15">
          <div className="w-full md:w-1/3">
            <h3 className="font-bold text-sm text-[#0A0A0A] uppercase">{t('settings.profile.details_title', 'Personal Details')}</h3>
            <p className="text-xs text-slate-600 font-bold mt-1">
              {t('settings.profile.details_desc', 'Your public name and sign-in email address')}
            </p>
          </div>

          <div className="w-full md:w-2/3 space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0A0A0A] uppercase mb-1.5 flex items-center gap-1.5">
                <UserIcon size={13} />
                {t('settings.profile.name_label', 'Name')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                required
                className="w-full max-w-md px-4 py-2.5 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]"
                placeholder={t('settings.profile.placeholder_name', 'Your name')}
              />
            </div>

            <div>
              <div className="flex items-center justify-between max-w-md mb-1.5">
                <label className="block text-xs font-bold text-[#0A0A0A] uppercase flex items-center gap-1.5">
                  <Mail size={13} />
                  {t('settings.profile.email_label', 'Email')}
                </label>
                {isGoogle && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 border border-amber-400 text-amber-900 rounded-md text-[10px] font-black uppercase tracking-wider">
                    <ShieldCheck size={11} className="text-amber-700" />
                    {t('settings.profile.google_badge', 'Google Account')}
                  </span>
                )}
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isGoogle}
                required
                className={`w-full max-w-md px-4 py-2.5 border-2 border-[#0A0A0A] rounded-xl text-xs font-bold shadow-[2px_2px_0px_#0A0A0A] ${
                  isGoogle
                    ? 'bg-slate-100 text-slate-500 cursor-not-allowed select-none'
                    : 'bg-white text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]'
                }`}
                placeholder={t('settings.profile.placeholder_email', 'youremail@example.com')}
              />
              {isGoogle && (
                <p className="text-[11px] text-slate-500 font-bold mt-1.5 flex items-center gap-1.5">
                  <Lock size={12} className="text-slate-400 shrink-0" />
                  <span>{t('settings.profile.email_managed_by_google', 'Email is linked to your Google account and cannot be changed')}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 md:items-start justify-between pb-6 border-b-2 border-[#0A0A0A]/15">
          <div className="w-full md:w-1/3">
            <h3 className="font-bold text-sm text-[#0A0A0A] uppercase">
              {hasPassword
                ? t('settings.profile.password_title', 'Change Password')
                : t('settings.profile.password_set_title', 'Set Password')}
            </h3>
            <p className="text-xs text-slate-600 font-bold mt-1">
              {hasPassword
                ? t('settings.profile.password_desc', 'Leave fields blank if you do not wish to change your password')
                : t('settings.profile.password_set_desc', 'Create a password to enable sign-in with email and password')}
            </p>
          </div>

          <div className="w-full md:w-2/3 space-y-4">
            {hasPassword && (
              <div>
                <label className="block text-xs font-bold text-[#0A0A0A] uppercase mb-1.5 flex items-center gap-1.5">
                  <Lock size={13} />
                  {t('settings.profile.current_password_label', 'Current Password')}
                </label>
                <div className="relative w-full max-w-md">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] pr-10"
                    placeholder={t('settings.profile.placeholder_current_password', 'Enter current password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#0A0A0A] cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
              <div>
                <label className="block text-xs font-bold text-[#0A0A0A] uppercase mb-1.5">
                  {t('settings.profile.new_password_label', 'New Password')}
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6}
                    className="w-full px-4 py-2.5 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] pr-10"
                    placeholder={t('settings.profile.placeholder_new_password', 'Min 6 characters')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#0A0A0A] cursor-pointer"
                  >
                    {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A0A0A] uppercase mb-1.5">
                  {t('settings.profile.confirm_password_label', 'Confirm Password')}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] pr-10"
                    placeholder={t('settings.profile.placeholder_confirm_password', 'Repeat new password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#0A0A0A] cursor-pointer"
                  >
                    {showConfirmPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="text-xs text-slate-600 font-bold">
            {isSaving && (
              <span className="flex items-center gap-2 text-[#0A0A0A]">
                <Loader2 size={14} className="animate-spin" /> {t('settings.profile.saving', 'Saving changes...')}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={!hasChanges || isSaving || avatarUploadMutation.isPending}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#0A0A0A] text-[#F2EBDD] text-xs font-black uppercase tracking-wider border-2 border-[#0A0A0A] rounded-xl transition-all shadow-[4px_4px_0px_#0A0A0A] enabled:cursor-pointer enabled:hover:translate-x-0.5 enabled:hover:translate-y-0.5 enabled:hover:shadow-[2px_2px_0px_#0A0A0A] enabled:active:translate-x-1 enabled:active:translate-y-1 enabled:active:shadow-none disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>{t('settings.profile.btn_saving', 'Saving...')}</span>
              </>
            ) : (
              <>
                <Check size={15} />
                <span>{t('settings.profile.btn_save', 'Save Changes')}</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
