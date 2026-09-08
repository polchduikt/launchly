import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { MiniBarChart, SemiDonutChart, ActivityAreaChart } from './index';

vi.mock('../../i18n/config', () => ({
  t: (k: string, fb?: string) => fb || k,
  useTranslation: () => ({ t: (k: string, fb?: string) => fb || k }),
}));

describe('Charts components', () => {
  it('renders MiniBarChart SVG bars correctly', () => {
    const { container } = render(<MiniBarChart data={[10, 20, 30]} color="#6366f1" />);
    const rects = container.querySelectorAll('rect');
    expect(rects).toHaveLength(3);
  });

  it('renders SemiDonutChart SVG circles correctly', () => {
    const data = [
      { name: 'Direct', count: 40, pct: 40, color: '#6366f1' },
      { name: 'Referral', count: 60, pct: 60, color: '#10b981' },
    ];
    const { container, getByText } = render(<SemiDonutChart data={data} total={100} />);
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThan(1);
    expect(getByText('100')).toBeInTheDocument();
  });

  it('renders ActivityAreaChart with paths and labels', () => {
    const data = [
      { date: '2026-09-01', activeUsers: 10, clicks: 5 },
      { date: '2026-09-02', activeUsers: 20, clicks: 12 },
    ];
    const { container } = render(<ActivityAreaChart data={data} isLoaded={true} />);
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThan(0);
  });
});
