import { describe, it, expect } from 'vitest';
import {
  groupButtonsByRow,
  addButtonToRow,
  addButtonInNewRow,
  reorderButtons,
  moveButtonToRow,
} from './useButtonLayout';
import type { ButtonData } from '../../types/bot';

describe('useButtonLayout helpers', () => {
  const sampleButtons: ButtonData[] = [
    { label: 'Btn 1', value: 'btn_1', row: '0' },
    { label: 'Btn 2', value: 'btn_2', row: '0' },
    { label: 'Btn 3', value: 'btn_3', row: '1' },
  ];

  it('groups buttons by row key correctly', () => {
    const groups = groupButtonsByRow(sampleButtons);
    expect(Object.keys(groups)).toEqual(['0', '1']);
    expect(groups['0']).toHaveLength(2);
    expect(groups['1']).toHaveLength(1);
  });

  it('adds button to specific row', () => {
    const updated = addButtonToRow(sampleButtons, '1');
    expect(updated).toHaveLength(4);
    expect(updated[3].row).toBe('1');
    expect(updated[3].label).toBe('Button 4');
  });

  it('adds button to a new incremented row', () => {
    const updated = addButtonInNewRow(sampleButtons);
    expect(updated).toHaveLength(4);
    expect(updated[3].row).toBe('2');
  });

  it('reorders buttons when dropping a button over another', () => {
    const reordered = reorderButtons(sampleButtons, 'btn_3', 'btn_1');
    expect(reordered[0].value).toBe('btn_3');
    expect(reordered[0].row).toBe('0'); // Adopted target button's row
    expect(reordered[1].value).toBe('btn_1');
  });

  it('moves button to target row', () => {
    const moved = moveButtonToRow(sampleButtons, 'btn_1', '1');
    expect(moved.find((b) => b.value === 'btn_1')?.row).toBe('1');
  });

  it('returns unchanged list if invalid source is passed', () => {
    const untouched = reorderButtons(sampleButtons, 'non_existent', 'btn_1');
    expect(untouched).toEqual(sampleButtons);
  });
});
