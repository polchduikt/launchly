import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReplyBar } from '../ReplyBar';

vi.mock('../../../../../i18n/config', () => ({
  useTranslation: () => ({ t: (k: string, fb?: string) => fb || k }),
  t: (k: string, fb?: string) => fb || k,
}));

vi.mock('@emoji-mart/react', () => ({
  default: () => <div data-testid="emoji-picker">Picker</div>,
}));

vi.mock('@emoji-mart/data', () => ({
  default: {},
}));

describe('ReplyBar', () => {
  it('renders reply tab with textarea and send button', () => {
    render(
      <ReplyBar
        bottomTab="reply"
        onTabChange={vi.fn()}
        typedMessage=""
        onTypedMessageChange={vi.fn()}
        onKeyPress={vi.fn()}
        onSend={vi.fn()}
        isSending={false}
        pendingImage={null}
        onClearPendingImage={vi.fn()}
        isRecording={false}
        onMicClick={vi.fn()}
        showEmojiPicker={false}
        onToggleEmojiPicker={vi.fn()}
        onEmojiSelect={vi.fn()}
        emojiRef={{ current: null }}
        imageInputRef={{ current: null }}
        fileInputRef={{ current: null }}
        onImageSelect={vi.fn()}
        onFileSelect={vi.fn()}
        isImageUploading={false}
        isFileUploading={false}
        typedNote=""
        onTypedNoteChange={vi.fn()}
        onSaveNote={vi.fn()}
        onScheduleClick={vi.fn()}
      />
    );
    expect(screen.getByPlaceholderText(/crm.reply.placeholder_reply/i)).toBeInTheDocument();
  });
});
