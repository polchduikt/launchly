import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContactAvatar } from './ContactAvatar';

describe('ContactAvatar Component', () => {
  it('renders initials when no photoUrl is given', () => {
    render(<ContactAvatar photoUrl={null} name="Sarah Connor" size="sm" />);
    expect(screen.getByText('SC')).toBeInTheDocument();
  });

  it('renders image when valid photoUrl is passed', () => {
    render(<ContactAvatar photoUrl="https://example.com/avatar.jpg" name="Sarah Connor" size="md" />);
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    expect(img).toHaveAttribute('alt', 'Sarah Connor');
  });
});
