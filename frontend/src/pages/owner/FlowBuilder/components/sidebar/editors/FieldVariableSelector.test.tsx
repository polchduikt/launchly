import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FieldVariableSelector } from './FieldVariableSelector';

vi.mock('../../../../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
}));

describe('FieldVariableSelector', () => {
  it('renders trigger button and opens selector popup on click', () => {
    const handleSelect = vi.fn();
    render(
      <FieldVariableSelector
        onSelect={handleSelect}
        tags={[]}
        customFields={['custom_var_1']}
      />
    );

    const triggerBtn = screen.getByRole('button');
    expect(triggerBtn).toBeInTheDocument();
    fireEvent.click(triggerBtn);

    expect(screen.getByText('editor.gs.system_fields')).toBeInTheDocument();
    expect(screen.getByText('editor.gs.custom_fields')).toBeInTheDocument();
  });
});
