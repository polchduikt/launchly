import DOMPurify from 'dompurify';

export interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: string[];
  allowedProtocols?: string[];
}

const DEFAULT_ALLOWED_TAGS = [
  'div',
  'b',
  'strong',
  'i',
  'em',
  'u',
  's',
  'strike',
  'p',
  'br',
  'span',
  'code',
  'pre',
  'ul',
  'ol',
  'li',
  'blockquote',
  'a',
];

const DEFAULT_ALLOWED_ATTR = ['href', 'target', 'rel', 'class', 'title'];

const DEFAULT_ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

export const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const sanitizeUrl = (url: string): string => {
  if (!url) return '';
  const trimmed = url.trim();

  if (trimmed.startsWith('/') || trimmed.startsWith('#')) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed, 'https://launchly.app');
    if (DEFAULT_ALLOWED_PROTOCOLS.has(parsed.protocol)) {
      return trimmed;
    }
  } catch {
    return '';
  }

  return '';
};

let hookConfigured = false;
const ensurePurifyHook = () => {
  if (hookConfigured) return;
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      const href = node.getAttribute('href');
      if (href) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }
    }
  });
  hookConfigured = true;
};

export const sanitizeHtml = (dirtyHtml: string, options?: SanitizeOptions): string => {
  if (!dirtyHtml) return '';

  ensurePurifyHook();

  const allowedTags = options?.allowedTags || DEFAULT_ALLOWED_TAGS;
  const allowedAttributes = options?.allowedAttributes || DEFAULT_ALLOWED_ATTR;

  return DOMPurify.sanitize(dirtyHtml, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttributes,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|\/|#)/i,
    RETURN_TRUSTED_TYPE: false,
  }) as string;
};

export const createSafeHtml = (
  dirtyHtml: string,
  options?: SanitizeOptions
): { __html: string } => {
  return {
    __html: sanitizeHtml(dirtyHtml, options),
  };
};
