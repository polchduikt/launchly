import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserAvatar } from '../UserAvatar';

describe('UserAvatar Component', () => {
  it('renders initials fallback when photoUrl is missing', () => {
    render(<UserAvatar name="Anna Smith" size={32} />);
    expect(screen.getByText('AS')).toBeInTheDocument();
  });

  it('renders image when photoUrl is valid', () => {
    render(<UserAvatar name="Anna Smith" photoUrl="https://example.com/anna.jpg" size={32} />);
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/anna.jpg');
    expect(img).toHaveAttribute('alt', 'Anna Smith');
  });
});
