import { t as defaultT } from '../i18n/config';

type TranslateFn = (
  key: string,
  fallbackOrReplacements?: string | Record<string, string | number>,
  replacements?: Record<string, string | number>
) => string;

export const formatAuditTitle = (
  title: string,
  targetName?: string,
  t: TranslateFn = defaultT
): string => {
  if (!title) return targetName || '';

  let name = (targetName || '').trim();
  if (name === '{0}' || name === '{botName}' || name === 'null' || name === 'undefined') {
    name = '';
  }

  if (title.includes(':')) {
    const extracted = title.split(':')[1]?.trim() || '';
    if (
      extracted &&
      extracted !== '{0}' &&
      extracted !== '{botName}' &&
      extracted !== 'null' &&
      extracted !== 'undefined'
    ) {
      name = extracted;
    }
  }

  const cleanedTitle = title
    .replace(/:\s*\{0\}/g, '')
    .replace(/\s*\{0\}/g, '')
    .replace(/\{0\}/g, '')
    .trim();

  if (cleanedTitle.startsWith('Реєстрація у Launchly') || cleanedTitle.startsWith('Registered in Launchly')) {
    return t('audit.user_registration.title');
  }
  if (cleanedTitle.startsWith('Авторизація користувача') || cleanedTitle.startsWith('User Authentication')) {
    return t('audit.user_auth.title');
  }
  if (
    cleanedTitle.startsWith('Підключення бота') ||
    cleanedTitle.startsWith('Bot Connected') ||
    cleanedTitle.startsWith('Створено бота') ||
    cleanedTitle.startsWith('Created bot')
  ) {
    return name ? t('audit.bot_connected.title', { botName: name }) : t('audit.bot_created.title');
  }
  if (cleanedTitle.startsWith('Оновлено конфігурацію бота') || cleanedTitle.startsWith('Updated bot configuration')) {
    return t('audit.bot_updated.title');
  }
  if (cleanedTitle.startsWith('Створено автоворонку') || cleanedTitle.startsWith('Created flow schema')) {
    return t('audit.flow_schema_created.title');
  }
  if (
    cleanedTitle.startsWith('Модифікація автоматизації') ||
    cleanedTitle.startsWith('Automation Modified') ||
    cleanedTitle.startsWith('Updated flow schema')
  ) {
    return name
      ? t('audit.automation_modified.title', { botName: name })
      : (t('audit.automation_modified.title_simple') || 'Модифікація автоматизації');
  }
  if (
    cleanedTitle.startsWith('Запуск розсилки') ||
    cleanedTitle.startsWith('Broadcast Launched') ||
    cleanedTitle.startsWith('Запущено розсилку') ||
    cleanedTitle.startsWith('Launched broadcast')
  ) {
    return name ? `${t('audit.broadcast_launched.title')}: ${name}` : t('audit.broadcast_launched.title');
  }
  if (cleanedTitle.startsWith('Скасування розсилки') || cleanedTitle.startsWith('Broadcast Cancelled')) {
    return name ? `${t('audit.broadcast_cancelled.title')}: ${name}` : t('audit.broadcast_cancelled.title');
  }
  if (
    cleanedTitle.startsWith('Права доступу та роль') ||
    cleanedTitle.startsWith('Access Rights & Role') ||
    cleanedTitle.startsWith('Зміна ролі користувача') ||
    cleanedTitle.startsWith('User role updated')
  ) {
    return t('audit.access_role.title') || t('audit.user_role_updated.title');
  }
  if (
    cleanedTitle.startsWith('Адміністративне блокування') ||
    cleanedTitle.startsWith('Administrative Block') ||
    cleanedTitle.startsWith('Блокування акаунту') ||
    cleanedTitle.startsWith('Account blocked')
  ) {
    return t('audit.admin_block.title') || t('audit.user_blocked.title');
  }
  if (
    cleanedTitle.startsWith('Адміністративне розблокування') ||
    cleanedTitle.startsWith('Administrative Unblock') ||
    cleanedTitle.startsWith('Розблокування акаунту') ||
    cleanedTitle.startsWith('Account unblocked')
  ) {
    return t('audit.admin_unblock.title') || t('audit.user_unblocked.title');
  }

  return cleanedTitle;
};

export const formatAuditDescription = (
  desc: string,
  t: TranslateFn = defaultT
): string => {
  if (!desc) return '';

  if (desc.startsWith('Обліковий запис активовано через') || desc.startsWith('Account activated via')) {
    const parts = desc.split(/через|via/);
    const prov = parts[1]?.trim() || 'LOCAL';
    return t('audit.user_registration.desc', { provider: prov });
  }
  if (
    desc.startsWith('Успішна сесія авторизації в системі через Google OAuth') ||
    desc.startsWith('Successful authentication session via Google OAuth')
  ) {
    return t('audit.user_auth_oauth.desc');
  }
  if (desc.startsWith('Успішна сесія авторизації') || desc.startsWith('Successful authentication session')) {
    return t('audit.user_auth.desc');
  }
  if (
    desc.includes('Створено та активовано бота') ||
    desc.includes('Created and activated bot') ||
    desc.includes('Bot ID:')
  ) {
    const match = desc.match(/Bot ID:\s*#?(\d+)/i);
    const botId = match ? match[1] : '';
    return t('audit.bot_connected.desc', { botId });
  }
  if (desc.includes('Оновлено структуру бот-схеми') || desc.includes('Updated flow schema')) {
    return t('audit.automation_modified.desc');
  }
  if (desc.includes('Створено розсилку') || desc.includes('Created broadcast')) {
    const nameMatch = desc.match(/['"](.*?)['"]/);
    const statusMatch = desc.match(/Статус:\s*(\w+)|Status:\s*(\w+)/i);
    const name = nameMatch ? nameMatch[1] : '';
    const status = statusMatch ? statusMatch[1] || statusMatch[2] : 'ACTIVE';
    return t('audit.broadcast_launched.desc', { name, status });
  }
  if (desc.startsWith('Причина:') || desc.startsWith('Reason:')) {
    const reasonStr = desc.replace('Причина:', '').replace('Reason:', '').trim();
    return `${t('blocked.reason_title')} ${reasonStr}`;
  }
  if (desc.startsWith('Акаунт відновлено') || desc.startsWith('Account restored')) {
    return t('audit.admin_unblock.desc');
  }

  return desc;
};
