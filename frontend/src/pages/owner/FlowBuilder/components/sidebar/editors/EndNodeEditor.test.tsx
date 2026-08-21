import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EndNodeEditor } from './EndNodeEditor';

vi.mock('../../../../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
}));

describe('EndNodeEditor', () => {
  it('renders EndNodeEditor title and description', () => {
    render(<EndNodeEditor />);
    expect(screen.getByText('editor.end.title')).toBeInTheDocument();
    expect(screen.getByText('editor.end.desc')).toBeInTheDocument();
  });
});
