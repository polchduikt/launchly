import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StartNodeEditor } from './StartNodeEditor';

vi.mock('../../../../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
}));

describe('StartNodeEditor', () => {
  it('renders StartNodeEditor description', () => {
    render(<StartNodeEditor />);
    expect(screen.getByText('editor.start.desc')).toBeInTheDocument();
  });
});
