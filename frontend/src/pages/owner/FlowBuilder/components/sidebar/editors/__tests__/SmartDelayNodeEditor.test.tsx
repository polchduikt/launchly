import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SmartDelayNodeEditor } from '../SmartDelayNodeEditor';

vi.mock('../../../../../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
}));

describe('SmartDelayNodeEditor', () => {
  it('renders SmartDelayNodeEditor with duration options', () => {
    render(
      <SmartDelayNodeEditor
        data={{ mode: 'duration', waitAmount: 5, waitUnit: 'Minutes' }}
        handleChange={vi.fn()}
      />
    );

    expect(screen.getByText('editor.smart_delay.duration')).toBeInTheDocument();
    expect(screen.getByText('editor.smart_delay.wait_for')).toBeInTheDocument();
  });
});
