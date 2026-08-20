import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PublicFooter } from '../PublicFooter';

describe('PublicFooter Component', () => {
  it('renders copyright with current year', () => {
    const currentYear = new Date().getFullYear();
    render(
      <MemoryRouter>
        <PublicFooter />
      </MemoryRouter>
    );

    expect(screen.getByText(new RegExp(String(currentYear)))).toBeInTheDocument();
  });

  it('renders links to Terms, Privacy, Blog and FAQ with valid hrefs', () => {
    render(
      <MemoryRouter>
        <PublicFooter />
      </MemoryRouter>
    );

    const termsLink = screen.getByRole('link', { name: /Умови користування|Terms/i });
    expect(termsLink).toHaveAttribute('href', '/terms');

    const privacyLink = screen.getByRole('link', { name: /Політика конфіденційності|Privacy/i });
    expect(privacyLink).toHaveAttribute('href', '/privacy');

    const blogLink = screen.getByRole('link', { name: /Блог|Blog/i });
    expect(blogLink).toHaveAttribute('href', '/blog');

    const faqLink = screen.getByRole('link', { name: /FAQ|Довідка/i });
    expect(faqLink).toHaveAttribute('href', '/faq');
  });
});
