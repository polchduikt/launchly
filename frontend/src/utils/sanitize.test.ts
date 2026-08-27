import { describe, it, expect } from 'vitest';
import { sanitizeHtml, sanitizeUrl, escapeHtml, createSafeHtml } from './sanitize';

describe('sanitize utility', () => {
  it('escapes html entities correctly', () => {
    const raw = '<div class="test">&\'"</div>';
    const escaped = escapeHtml(raw);
    expect(escaped).toBe('&lt;div class=&quot;test&quot;&gt;&amp;&#039;&quot;&lt;/div&gt;');
  });

  it('sanitizes dangerous URLs and allows safe protocols', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
    expect(sanitizeUrl('vbscript:msgbox(1)')).toBe('');
    expect(sanitizeUrl('https://launchly.app/docs')).toBe('https://launchly.app/docs');
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
    expect(sanitizeUrl('/dashboard/chat')).toBe('/dashboard/chat');
    expect(sanitizeUrl('mailto:support@launchly.app')).toBe('mailto:support@launchly.app');
    expect(sanitizeUrl('tel:+380501234567')).toBe('tel:+380501234567');
  });

  it('strips script tags and executable attributes from HTML', () => {
    const malicious = '<p>Hello <script>alert("hack")</script><span onclick="alert(1)">World</span></p>';
    const sanitized = sanitizeHtml(malicious);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('onclick');
    expect(sanitized).toContain('<p>Hello <span>World</span></p>');
  });

  it('strips iframes, objects, and embed tags', () => {
    const dangerous = '<div>Safe text <iframe src="//evil.com"></iframe><object data="evil.swf"></object></div>';
    const sanitized = sanitizeHtml(dangerous);
    expect(sanitized).not.toContain('<iframe');
    expect(sanitized).not.toContain('<object');
    expect(sanitized).toContain('Safe text');
  });

  it('neutralizes javascript hrefs and adds security attributes to links', () => {
    const dangerousLink = '<a href="javascript:alert(document.cookie)">Click me</a>';
    const sanitized = sanitizeHtml(dangerousLink);
    expect(sanitized).not.toContain('javascript:');

    const safeLink = '<a href="https://launchly.app">Visit Launchly</a>';
    const sanitizedSafe = sanitizeHtml(safeLink);
    expect(sanitizedSafe).toContain('href="https://launchly.app"');
    expect(sanitizedSafe).toContain('rel="noopener noreferrer"');
    expect(sanitizedSafe).toContain('target="_blank"');
  });

  it('preserves safe formatting tags', () => {
    const formatted = '<strong>Bold</strong> and <em>Italic</em> and <code>const x = 1;</code>';
    const sanitized = sanitizeHtml(formatted);
    expect(sanitized).toBe(formatted);
  });

  it('returns safe object for dangerouslySetInnerHTML via createSafeHtml', () => {
    const dirty = '<b>Test</b><script>alert(1)</script>';
    const safeObject = createSafeHtml(dirty);
    expect(safeObject).toEqual({ __html: '<b>Test</b>' });
  });
});
