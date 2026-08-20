import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

globalThis.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
} as any;

window.HTMLElement.prototype.scrollIntoView = vi.fn();

const DummyIcon = () => null;

vi.mock('@icons-pack/react-simple-icons', () => ({
  SiClaude: DummyIcon,
  SiGooglegemini: DummyIcon,
  SiGooglesheets: DummyIcon,
  SiHubspot: DummyIcon,
  SiMailchimp: DummyIcon,
}));
