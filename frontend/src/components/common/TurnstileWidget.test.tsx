import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { TurnstileWidget } from './TurnstileWidget';

describe('TurnstileWidget', () => {
  it('renders container div', () => {
    const onVerify = vi.fn();
    const { container } = render(
      <TurnstileWidget onVerify={onVerify} />
    );

    expect(container.firstChild).toBeInTheDocument();
  });
});
