import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChooseNextStepDrawer } from './ChooseNextStepDrawer';

vi.mock('../../../../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
}));

describe('ChooseNextStepDrawer', () => {
  it('renders drawer with step options and handles close', () => {
    const handleClose = vi.fn();
    const handleSelectStep = vi.fn();

    render(
      <ChooseNextStepDrawer
        onClose={handleClose}
        onSelectStep={handleSelectStep}
      />
    );

    expect(screen.getByText('flow_builder.choose_next_step')).toBeInTheDocument();
  });

  it('triggers onSelectStep when option clicked', () => {
    const handleClose = vi.fn();
    const handleSelectStep = vi.fn();

    render(
      <ChooseNextStepDrawer
        onClose={handleClose}
        onSelectStep={handleSelectStep}
      />
    );

    const firstOption = screen.getByText('step_option.MESSAGE.label');
    fireEvent.click(firstOption);

    expect(handleSelectStep).toHaveBeenCalledWith('MESSAGE');
    expect(handleClose).toHaveBeenCalled();
  });
});
