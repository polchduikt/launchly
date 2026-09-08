import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BlogEditorView } from './BlogEditorView';

vi.mock('../../../../i18n/config', () => ({
  t: (_k: string, fb?: string) => (typeof fb === 'string' ? fb : _k),
  useTranslation: () => ({
    t: (_k: string, fb?: string) => (typeof fb === 'string' ? fb : _k),
  }),
  getLanguage: () => 'uk',
}));

vi.mock('../../../../hooks/admin/useAdminBlogQueries', () => ({
  useCreateBlogArticleMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateBlogArticleMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../../../../hooks/bot/useMediaUpload', () => ({
  useMediaUpload: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe('BlogEditorView', () => {
  const defaultProps = {
    initialArticle: null,
    currentUser: { name: 'Author Name' },
    onBack: vi.fn(),
    onSuccess: vi.fn(),
  };

  it('renders create mode with general info form and blocks editor', () => {
    render(<BlogEditorView {...defaultProps} />);

    expect(screen.getByText('Створити нову статтю')).toBeInTheDocument();
    expect(screen.getByText('1. Основна інформація')).toBeInTheDocument();
    expect(screen.getByText(/2\. Блоки статті/)).toBeInTheDocument();
    expect(screen.getByText('Опублікувати статтю')).toBeInTheDocument();
  });

  it('switches between builder and preview tabs', () => {
    render(<BlogEditorView {...defaultProps} />);

    const previewTab = screen.getByText('Попередній перегляд');
    fireEvent.click(previewTab);

    expect(screen.getByText('Article Title')).toBeInTheDocument();

    const builderTab = screen.getByText('Конструктор');
    fireEvent.click(builderTab);
    expect(screen.getByText('1. Основна інформація')).toBeInTheDocument();
  });

  it('adds a new block when block buttons are clicked', () => {
    render(<BlogEditorView {...defaultProps} />);

    const addQuoteBtn = screen.getByText('+ Цитата');
    fireEvent.click(addQuoteBtn);

    expect(screen.getByText('Цитата')).toBeInTheDocument();
  });
});
