import { useEffect } from 'react';
import { getLanguage, subscribeLanguageChange } from '../i18n/config';

const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, '') ?? 'https://launchly.app';
const SITE_NAME = 'Launchly';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export interface JsonLdObject {
  '@context': string;
  '@type': string;
  [key: string]: unknown;
}

export interface UseSEOOptions {
  title: string;
  description: string;
  keywords?: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
  jsonLd?: JsonLdObject | JsonLdObject[];
}

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string, extra?: Record<string, string>) {
  const hreflang = extra?.hreflang;
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]`;
  let el = document.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    if (extra) {
      Object.entries(extra).forEach(([k, v]) => el!.setAttribute(k, v));
    }
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function removeLinks(rel: string, selector?: string) {
  document
    .querySelectorAll<HTMLLinkElement>(selector ?? `link[rel="${rel}"]`)
    .forEach((el) => el.remove());
}

function upsertJsonLd(id: string, data: JsonLdObject | JsonLdObject[]) {
  let el = document.querySelector<HTMLScriptElement>(`script[data-seo-id="${id}"]`);
  if (!el) {
    el = document.createElement('script');
    el.setAttribute('type', 'application/ld+json');
    el.setAttribute('data-seo-id', id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(Array.isArray(data) ? data : data);
}

function removeJsonLd(id: string) {
  document.querySelector(`script[data-seo-id="${id}"]`)?.remove();
}

export function useSEO(options: UseSEOOptions) {
  const applyTags = () => {
    const lang = getLanguage();
    const path = options.canonicalPath ?? window.location.pathname;
    const canonicalUrl = `${SITE_URL}${path === '/' ? '' : path}`;
    const ogImage = options.ogImage ?? DEFAULT_OG_IMAGE;
    document.documentElement.setAttribute('lang', lang === 'uk' ? 'uk' : 'en');
    document.title = options.title;
    setMeta('description', options.description);
    if (options.keywords) {
      setMeta('keywords', options.keywords);
    }
    setMeta('robots', options.noindex ? 'noindex,nofollow' : 'index,follow');
    setMeta('language', lang === 'uk' ? 'Ukrainian' : 'English');
    setMeta('author', SITE_NAME);
    setLink('canonical', canonicalUrl);
    removeLinks('alternate', 'link[rel="alternate"][hreflang]');
    setLink('alternate', canonicalUrl, { hreflang: 'uk' });
    setLink('alternate', canonicalUrl, { hreflang: 'en' });
    setLink('alternate', canonicalUrl, { hreflang: 'x-default' });

    setMeta('og:type', options.ogType ?? 'website', 'property');
    setMeta('og:url', canonicalUrl, 'property');
    setMeta('og:title', options.title, 'property');
    setMeta('og:description', options.description, 'property');
    setMeta('og:image', ogImage, 'property');
    setMeta('og:site_name', SITE_NAME, 'property');
    setMeta('og:locale', lang === 'uk' ? 'uk_UA' : 'en_US', 'property');

    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', options.title);
    setMeta('twitter:description', options.description);
    setMeta('twitter:image', ogImage);
    setMeta('twitter:site', '@launchlyapp');

    if (options.jsonLd) {
      upsertJsonLd('page-schema', options.jsonLd);
    } else {
      removeJsonLd('page-schema');
    }
  };

  useEffect(() => {
    applyTags();
    const unsubscribe = subscribeLanguageChange(applyTags);
    return unsubscribe;
  }, [options.title, options.description, options.canonicalPath, options.noindex]);
}
