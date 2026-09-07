import React, { lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';

const LazyPicker = lazy(async () => {
  const [emojiDataModule, pickerModule] = await Promise.all([
    import('@emoji-mart/data'),
    import('@emoji-mart/react'),
  ]);
  const Picker = (pickerModule.default || pickerModule) as unknown as React.ComponentType<any>;
  const data = emojiDataModule.default || emojiDataModule;
  return {
    default: (props: {
      onEmojiSelect: (emoji: { native?: string }) => void;
      theme?: string;
      previewPosition?: string;
      skinTonePosition?: string;
      perLine?: number;
    }) => <Picker data={data} {...props} />,
  };
});

export interface EmojiPickerModalProps {
  isOpen: boolean;
  coords: { top: number; left: number } | null;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
}

export const EmojiPickerModal: React.FC<EmojiPickerModalProps> = ({
  isOpen,
  coords,
  onClose,
  onSelectEmoji,
}) => {
  if (!isOpen || !coords) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[99998]"
        onClick={onClose}
      />
      <div
        style={{
          position: 'absolute',
          top: `${coords.top}px`,
          left: `${coords.left}px`,
          zIndex: 99999,
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="shadow-2xl rounded-3xl overflow-hidden border-2 border-[#0A0A0A] bg-white animate-in zoom-in-95 duration-150 font-['JetBrains_Mono',monospace]"
      >
        <Suspense
          fallback={
            <div className="w-[352px] h-[435px] flex items-center justify-center bg-white">
              <Loader2 className="animate-spin text-[#0A0A0A]" size={24} />
            </div>
          }
        >
          <LazyPicker
            onEmojiSelect={(emoji: { native?: string }) => {
              if (emoji.native) {
                onSelectEmoji(emoji.native);
              }
            }}
            theme="light"
            previewPosition="none"
            skinTonePosition="none"
            perLine={8}
          />
        </Suspense>
      </div>
    </>,
    document.body
  );
};
