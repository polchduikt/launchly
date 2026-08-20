import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GoogleSheetsConfigModal } from '../GoogleSheetsConfigModal';

vi.mock('../../../../../../../i18n/config', () => ({
  t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k) }),
}));

describe('GoogleSheetsConfigModal', () => {
  const defaultProps: any = {
    isOpen: false,
    onClose: vi.fn(),
    sheetsAction: { type: 'INSERT_ROW' },
    isGoogleSheetsConnected: true,
    isLoadingSpreadsheets: false,
    spreadsheets: [],
    spreadsheetsError: undefined,
    isLoadingWorksheets: false,
    worksheets: [],
    worksheetsError: undefined,
    isLoadingHeaders: false,
    headers: [],
    tags: [],
    customFields: [],
    handleSpreadsheetChange: vi.fn(),
    handleWorksheetChange: vi.fn(),
    handleRefreshHeaders: vi.fn(),
    handleMappingValueChange: vi.fn(),
    handleSaveSheetsConfig: vi.fn(),
    handleReconnectGoogleSheets: vi.fn(),
    handleLookupColumnChange: vi.fn(),
    handleLookupValueChange: vi.fn(),
  };

  it('returns null when isOpen is false', () => {
    const { container } = render(
      <GoogleSheetsConfigModal {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal when open', () => {
    render(
      <GoogleSheetsConfigModal {...defaultProps} isOpen={true} />
    );
    expect(screen.getByText('editor.gs.modal_title')).toBeInTheDocument();
  });
});
