export interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: string[];
  allowedProtocols?: string[];
}

const DEFAULT_ALLOWED_TAGS = new Set([
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
]);

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

export const sanitizeHtml = (dirtyHtml: string, options?: SanitizeOptions): string => {
  if (!dirtyHtml) return '';

  const allowedTags = options?.allowedTags
    ? new Set(options.allowedTags.map((t) => t.toLowerCase()))
    : DEFAULT_ALLOWED_TAGS;

  if (typeof DOMParser === 'undefined') {
    return escapeHtml(dirtyHtml);
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(dirtyHtml, 'text/html');

    const cleanNode = (node: Node) => {
      const children = Array.from(node.childNodes);
      for (const child of children) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const element = child as HTMLElement;
          const tagName = element.tagName.toLowerCase();

          if (!allowedTags.has(tagName)) {
            element.remove();
            continue;
          }

          const attributes = Array.from(element.attributes);
          for (const attr of attributes) {
            const attrName = attr.name.toLowerCase();

            if (attrName.startsWith('on') || attrName === 'style') {
              element.removeAttribute(attr.name);
              continue;
            }

            if (tagName === 'a' && attrName === 'href') {
              const safeHref = sanitizeUrl(attr.value);
              if (!safeHref) {
                element.removeAttribute('href');
              } else {
                element.setAttribute('href', safeHref);
                element.setAttribute('rel', 'noopener noreferrer');
                element.setAttribute('target', '_blank');
              }
            } else if (attrName !== 'class' && attrName !== 'title') {
              element.removeAttribute(attr.name);
            }
          }

          cleanNode(element);
        } else if (child.nodeType !== Node.TEXT_NODE) {
          child.remove();
        }
      }
    };

    cleanNode(doc.body);
    return doc.body.innerHTML;
  } catch {
    return escapeHtml(dirtyHtml);
  }
};

export const createSafeHtml = (
  dirtyHtml: string,
  options?: SanitizeOptions
): { __html: string } => {
  return {
    __html: sanitizeHtml(dirtyHtml, options),
  };
};
