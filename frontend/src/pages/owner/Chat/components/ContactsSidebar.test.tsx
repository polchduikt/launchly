import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContactsSidebar } from './ContactsSidebar';

vi.mock('../../../../i18n/config', () => ({
  useTranslation: () => ({ t: (k: string, fb?: string) => fb || k }),
  t: (k: string, fb?: string) => fb || k,
}));

describe('ContactsSidebar', () => {
  it('renders sidebar with sequences list items', () => {
    const sequences = [
      { id: 'Seq 1', count: 5 },
      { id: 'Seq 2', count: 10 },
    ];
    render(<ContactsSidebar sequences={sequences as unknown as never} />);
    expect(screen.getByText('Seq 1')).toBeInTheDocument();
    expect(screen.getByText('Seq 2')).toBeInTheDocument();
  });
});
