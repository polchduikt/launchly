import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RandomizerNodeEditor } from '../RandomizerNodeEditor';
import { ReactFlowProvider } from '@xyflow/react';

vi.mock('../../../../../../../i18n/config', () => ({
  t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k) }),
}));

describe('RandomizerNodeEditor', () => {
  it('renders RandomizerNodeEditor with variations', () => {
    render(
      <ReactFlowProvider>
        <RandomizerNodeEditor
          nodeId="randomizer_1"
          data={{ variations: [{ id: 'var_0', label: 'A', percentage: 50, color: '#7C3AED' }] }}
          handleChange={vi.fn()}
        />
      </ReactFlowProvider>
    );

    expect(screen.getByText('node.randomizer.new_variation')).toBeInTheDocument();
  });
});
