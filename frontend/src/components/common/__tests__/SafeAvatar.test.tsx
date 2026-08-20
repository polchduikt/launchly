import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SafeAvatar } from '../SafeAvatar';

describe('SafeAvatar Component', () => {
  it('renders initials when src is not provided', () => {
    render(<SafeAvatar name="John Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders image when valid http URL is provided', () => {
    render(<SafeAvatar src="https://example.com/avatar.jpg" alt="User Avatar" />);
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    expect(img).toHaveAttribute('alt', 'User Avatar');
  });

  it('falls back to default fallback letter U when no name or src given', () => {
    render(<SafeAvatar />);
    expect(screen.getByText('U')).toBeInTheDocument();
  });
});
