import type { ButtonData } from '../../types/bot';
import { generateId } from '../../utils/id';

export const groupButtonsByRow = (buttons: ButtonData[] = []): Record<string, ButtonData[]> => {
  const groups: Record<string, ButtonData[]> = {};
  buttons.forEach((btn) => {
    const r = btn.row ?? '0';
    if (!groups[r]) groups[r] = [];
    groups[r].push(btn);
  });
  return groups;
};

export const addButtonToRow = (
  buttons: ButtonData[] = [],
  rowKey: string,
  labelPrefix = 'Button'
): ButtonData[] => {
  const newBtn: ButtonData = {
    label: `${labelPrefix} ${buttons.length + 1}`,
    value: generateId('btn'),
    row: rowKey,
  };
  return [...buttons, newBtn];
};

export const addButtonInNewRow = (
  buttons: ButtonData[] = [],
  labelPrefix = 'Button'
): ButtonData[] => {
  const rows = buttons.map((b) => parseInt(b.row || '0', 10));
  const nextRow = rows.length > 0 ? Math.max(...rows) + 1 : 0;
  const newBtn: ButtonData = {
    label: `${labelPrefix} ${buttons.length + 1}`,
    value: generateId('btn'),
    row: String(nextRow),
  };
  return [...buttons, newBtn];
};

export const reorderButtons = (
  buttons: ButtonData[] = [],
  sourceBtnValue: string,
  targetBtnValue: string
): ButtonData[] => {
  if (!sourceBtnValue || sourceBtnValue === targetBtnValue) return buttons;

  const currentBtns = [...buttons];
  const sourceIdx = currentBtns.findIndex((b) => b.value === sourceBtnValue);
  const targetIdx = currentBtns.findIndex((b) => b.value === targetBtnValue);

  if (sourceIdx === -1 || targetIdx === -1) return buttons;

  const sourceBtn = currentBtns[sourceIdx];
  const targetBtn = currentBtns[targetIdx];

  const updatedSourceBtn = { ...sourceBtn, row: targetBtn.row };

  currentBtns.splice(sourceIdx, 1);
  const insertIdx = targetIdx;
  currentBtns.splice(insertIdx, 0, updatedSourceBtn);

  return currentBtns;
};

export const moveButtonToRow = (
  buttons: ButtonData[] = [],
  sourceBtnValue: string,
  targetRowKey: string
): ButtonData[] => {
  if (!sourceBtnValue) return buttons;

  const currentBtns = [...buttons];
  const sourceIdx = currentBtns.findIndex((b) => b.value === sourceBtnValue);

  if (sourceIdx === -1) return buttons;

  const sourceBtn = currentBtns[sourceIdx];
  if (sourceBtn.row === targetRowKey) return buttons;

  const updatedSourceBtn = { ...sourceBtn, row: targetRowKey };
  currentBtns.splice(sourceIdx, 1);

  let lastIdx = -1;
  for (let i = currentBtns.length - 1; i >= 0; i--) {
    if ((currentBtns[i].row ?? '0') === targetRowKey) {
      lastIdx = i;
      break;
    }
  }

  if (lastIdx !== -1) {
    currentBtns.splice(lastIdx + 1, 0, updatedSourceBtn);
  } else {
    currentBtns.push(updatedSourceBtn);
  }

  return currentBtns;
};
