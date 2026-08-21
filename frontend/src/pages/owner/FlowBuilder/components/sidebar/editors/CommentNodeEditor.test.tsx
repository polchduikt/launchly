import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommentNodeEditor } from './CommentNodeEditor';

vi.mock('../../../../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
}));

describe('CommentNodeEditor', () => {
  it('renders CommentNodeEditor with text and note size buttons', () => {
    const handleChange = vi.fn();
    render(
      <CommentNodeEditor
        data={{ text: 'Hello note', noteSize: 'M', fontSize: 'S' }}
        handleChange={handleChange}
      />
    );

    expect(screen.getByText('editor.comment.text_label')).toBeInTheDocument();
    expect(screen.getByText('editor.comment.note_size')).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText('editor.comment.placeholder');
    fireEvent.change(textarea, { target: { value: 'Updated note' } });
    expect(handleChange).toHaveBeenCalledWith('text', 'Updated note');
  });
});
