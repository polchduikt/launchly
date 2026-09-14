import React from 'react';

export interface TokenMatch {
  index: number;
  length: number;
  type: 'variable' | 'linkWithText' | 'rawUrl';
  displayName: string;
  url?: string;
}

export const renderTextWithBadges = (text: string): React.ReactNode => {
  if (!text) return '';

  const matches: TokenMatch[] = [];
  const varRegex = /\{{1,2}([^{}]+)\}{1,2}/g;
  let m;
  while ((m = varRegex.exec(text)) !== null) {
    const rawName = m[1].trim();
    let displayName = rawName;
    if (rawName === 'first_name' || rawName === 'found_user.first_name') displayName = 'First Name';
    else if (rawName === 'last_name' || rawName === 'found_user.last_name') displayName = 'Last Name';
    else if (rawName === 'phone' || rawName === 'found_user.phone') displayName = 'Phone';
    else if (rawName === 'email' || rawName === 'found_user.email') displayName = 'Email';
    else if (rawName === 'telegram_username' || rawName === 'found_user.telegram_username') displayName = 'Telegram Username';
    else if (rawName === 'telegram_user_id' || rawName === 'found_user.telegram_id' || rawName === 'found_user.telegram_user_id') displayName = 'Telegram User ID';
    else if (rawName === 'contact_id') displayName = 'Contact Id';
    else if (rawName === 'subscribed') displayName = 'Subscribed';
    else if (rawName === 'chat_type') displayName = 'Chat Type';
    else if (rawName === 'chat_title') displayName = 'Chat Title';
    else if (rawName === 'chat_id') displayName = 'Chat ID';
    else if (rawName === 'remaining') displayName = 'remaining';
    else if (rawName === 'photo' || rawName === 'found_user.photo') displayName = 'photo';
    else if (rawName === 'photo_url' || rawName === 'found_user.photo_url') displayName = 'photo_url';
    else if (rawName.startsWith('found_user.')) displayName = rawName.substring('found_user.'.length);

    matches.push({
      index: m.index,
      length: m[0].length,
      type: 'variable',
      displayName
    });
  }

  const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  while ((m = mdLinkRegex.exec(text)) !== null) {
    matches.push({
      index: m.index,
      length: m[0].length,
      type: 'linkWithText',
      displayName: m[1].trim(),
      url: m[2].trim()
    });
  }

  const rawUrlRegex = /(https?:\/\/[^\s()]+)/g;
  while ((m = rawUrlRegex.exec(text)) !== null) {
    const isPart = matches.some(existing => 
      m!.index >= existing.index && 
      (m!.index + m![0].length) <= (existing.index + existing.length)
    );
    if (!isPart) {
      matches.push({
        index: m.index,
        length: m[0].length,
        type: 'rawUrl',
        displayName: m[1].trim(),
        url: m[1].trim()
      });
    }
  }

  matches.sort((a, b) => a.index - b.index);

  const filteredMatches: TokenMatch[] = [];
  let lastEnd = 0;
  for (const match of matches) {
    if (match.index >= lastEnd) {
      filteredMatches.push(match);
      lastEnd = match.index + match.length;
    }
  }

  const parts: React.ReactNode[] = [];
  let currentIndex = 0;

  for (const match of filteredMatches) {
    if (match.index > currentIndex) {
      parts.push(text.substring(currentIndex, match.index));
    }

    if (match.type === 'variable') {
      parts.push(
        <span 
          key={match.index} 
          className="inline-flex items-center bg-[#0A0A0A] text-[#F2EBDD] rounded-lg px-2 py-0.5 mx-0.5 font-bold text-[10px] select-none align-baseline shrink-0 border border-[#0A0A0A] font-mono"
        >
          {match.displayName}
        </span>
      );
    } else if (match.type === 'linkWithText' || match.type === 'rawUrl') {
      parts.push(
        <a
          key={match.index}
          href={match.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline cursor-pointer font-bold inline-flex items-center"
          onClick={(e) => e.stopPropagation()}
        >
          {match.displayName}
        </a>
      );
    }

    currentIndex = match.index + match.length;
  }

  if (currentIndex < text.length) {
    parts.push(text.substring(currentIndex));
  }

  return parts.length > 0 ? parts : text;
};
