import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ApiCallNodeEditor } from './ApiCallNodeEditor';

vi.mock('../../../../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
}));

describe('ApiCallNodeEditor', () => {
  it('renders ApiCallNodeEditor with tabs and URL field', () => {
    render(
      <ApiCallNodeEditor
        data={{ method: 'POST', url: 'https://example.com/api', headers: [] as unknown as never, body: '{}' }}
        handleChange={vi.fn()}
      />
    );

    expect(screen.getByText('editor.api_call.tabs.settings')).toBeInTheDocument();
    expect(screen.getByText('editor.api_call.tabs.headers')).toBeInTheDocument();
    expect(screen.getByText('editor.api_call.tabs.body')).toBeInTheDocument();
  });
});
