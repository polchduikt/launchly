import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React, { useEffect } from 'react';
import { LanguageProvider, useTranslation } from './config';

const ChildComponent = () => {
  const { currentLanguage, changeLanguage } = useTranslation();
  const [mountCount, setMountCount] = React.useState(0);

  useEffect(() => {
    setMountCount((c) => c + 1);
  }, []);

  return (
    <div>
      <span data-testid="lang">{currentLanguage}</span>
      <span data-testid="mounts">{mountCount}</span>
      <button onClick={() => changeLanguage('uk')}>Set UK</button>
      <button onClick={() => changeLanguage('en')}>Set EN</button>
    </div>
  );
};

describe('LanguageProvider', () => {
  it('renders children without remounting when language changes', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }));

    render(
      <LanguageProvider>
        <ChildComponent />
      </LanguageProvider>
    );

    const langSpan = screen.getByTestId('lang');
    const mountsSpan = screen.getByTestId('mounts');

    expect(mountsSpan.textContent).toBe('1');

    await act(async () => {
      screen.getByText('Set UK').click();
    });

    expect(langSpan.textContent).toBe('uk');
    expect(mountsSpan.textContent).toBe('1');
  });
});
