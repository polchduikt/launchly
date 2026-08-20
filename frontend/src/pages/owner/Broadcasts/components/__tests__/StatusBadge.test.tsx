import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../StatusBadge';

describe('StatusBadge Component', () => {
  it('renders completed status badge', () => {
    render(<StatusBadge status="COMPLETED" />);
    expect(screen.getByText(/Completed|Завершено/i)).toBeInTheDocument();
  });

  it('renders in progress status badge', () => {
    render(<StatusBadge status="IN_PROGRESS" />);
    expect(screen.getByText(/In Progress|процесі/i)).toBeInTheDocument();
  });

  it('renders failed status badge', () => {
    render(<StatusBadge status="FAILED" />);
    expect(screen.getByText(/Failed|Помилка/i)).toBeInTheDocument();
  });

  it('renders blocked status badge', () => {
    render(<StatusBadge status="BLOCKED" />);
    expect(screen.getByText(/Blocked|Заблоковано/i)).toBeInTheDocument();
  });
});
