import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScheduleMessageModal } from '../ScheduleMessageModal';

vi.mock('../../../../../i18n/config', () => ({
  useTranslation: () => ({ t: (k: string, fb?: string) => fb || k }),
  t: (k: string, fb?: string) => fb || k,
}));

describe('ScheduleMessageModal', () => {
  it('returns null when isOpen=false', () => {
    const { container } = render(
      <ScheduleMessageModal isOpen={false} onClose={vi.fn()} onSchedule={vi.fn()} initialText="" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders schedule form when open', () => {
    render(
      <ScheduleMessageModal isOpen={true} onClose={vi.fn()} onSchedule={vi.fn()} initialText="" />
    );
    expect(screen.getByText(/crm.reply.schedule_title/i)).toBeInTheDocument();
  });
});
