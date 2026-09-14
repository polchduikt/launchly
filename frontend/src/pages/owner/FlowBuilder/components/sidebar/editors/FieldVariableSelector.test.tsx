import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FieldVariableSelector } from './FieldVariableSelector';

vi.mock('../../../../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
}));

vi.mock('../../../../../../store/useBotStore', () => ({
  useBotStore: () => 1,
}));

const mockCreateField = vi.fn();
vi.mock('../../../../../../hooks/bot/useCustomFieldsData', () => ({
  useCustomFieldsData: () => ({
    fields: [{ name: 'age', type: 'Number' }],
    createField: mockCreateField,
    saveFieldsData: vi.fn(),
  }),
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

  it('searches across all categories when typing in search query even while on system category', () => {
    const handleSelect = vi.fn();
    render(
      <FieldVariableSelector
        onSelect={handleSelect}
        nodeVariables={[
          { key: 'remaining', name: 'Час очікування', val: 'remaining' }
        ]}
        customFields={['user_plan']}
        tags={[{ id: '1', name: 'VIP_Customer' }]}
      />
    );

    const triggerBtn = screen.getByRole('button');
    fireEvent.click(triggerBtn);

    const searchInput = screen.getByPlaceholderText(/editor.gs.search|Пошук/i);
    expect(searchInput).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'Час' } });

    expect(screen.getByText('Час очікування')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Час очікування'));
    expect(handleSelect).toHaveBeenCalledWith('remaining');
  });

  it('shows not found message when search query yields 0 results', () => {
    const handleSelect = vi.fn();
    render(
      <FieldVariableSelector
        onSelect={handleSelect}
        nodeVariables={[
          { key: 'remaining', name: 'Час очікування', val: 'remaining' }
        ]}
      />
    );

    fireEvent.click(screen.getByRole('button'));
    const searchInput = screen.getByPlaceholderText(/editor.gs.search|Пошук/i);
    fireEvent.change(searchInput, { target: { value: 'nonexistent_xyz_123' } });

    expect(screen.getByText(/editor.gs.not_found|Нічого не знайдено/i)).toBeInTheDocument();
  });

  it('opens FieldModal when clicking create field button in custom fields category', () => {
    const handleSelect = vi.fn();
    render(
      <FieldVariableSelector
        onSelect={handleSelect}
        customFields={['user_hobby']}
      />
    );

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('editor.gs.custom_fields'));

    const createFieldBtn = screen.getByText(/Створити поле/i);
    expect(createFieldBtn).toBeInTheDocument();
    fireEvent.click(createFieldBtn);

    expect(screen.getByPlaceholderText(/settings.fields.placeholder_field_name|Введіть назву поля/i)).toBeInTheDocument();
  });
});
