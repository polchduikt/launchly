import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Skeleton,
  ConversationListSkeleton,
  MessageAreaSkeleton,
  TableSkeleton,
} from './Skeleton';

describe('Skeleton components', () => {
  it('renders basic Skeleton element with custom className', () => {
    render(<Skeleton className="w-20 h-4 custom-skeleton" />);
    const el = screen.getByTestId('skeleton');
    expect(el).toBeInTheDocument();
    expect(el).toHaveClass('custom-skeleton');
    expect(el).toHaveClass('animate-pulse');
  });

  it('renders ConversationListSkeleton with placeholder items', () => {
    const { container } = render(<ConversationListSkeleton />);
    const items = container.querySelectorAll('.w-full.px-4.py-3');
    expect(items.length).toBe(6);
  });

  it('renders MessageAreaSkeleton with chat bubble placeholders', () => {
    const { container } = render(<MessageAreaSkeleton />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(container.querySelectorAll('.rounded-2xl').length).toBeGreaterThan(1);
  });

  it('renders TableSkeleton with specified rows and columns', () => {
    const { container } = render(<TableSkeleton rows={4} columns={3} />);
    const rows = container.querySelectorAll('.h-16.px-6');
    expect(rows.length).toBe(4);
  });
});
