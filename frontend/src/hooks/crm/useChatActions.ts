import { useState, useRef, useCallback } from 'react';
import { useSendMessageMutation } from './useCrmQueries';
import { useMediaUpload } from '../bot/useMediaUpload';

interface UseChatActionsParams {
  selectedConvId: number | null;
  botId: number;
}

export const useChatActions = ({ selectedConvId, botId }: UseChatActionsParams) => {
  const sendMessageMut = useSendMessageMutation(selectedConvId || 0, botId);
  const mediaUpload = useMediaUpload('chat');
  const fileUpload = useMediaUpload('chat');

  const [typedMessage, setTypedMessage] = useState('');
  const [pendingImage, setPendingImage] = useState<{ url: string; file: File } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const emojiRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleSend = useCallback(() => {
    if ((!typedMessage.trim() && !pendingImage) || !selectedConvId) return;
    const content = typedMessage.trim() || (pendingImage ? '📷 Photo' : '');
    sendMessageMut.mutate({
      content,
      mediaUrl: pendingImage?.url,
      mediaType: pendingImage ? 'image' : undefined,
    });
    setTypedMessage('');
    setPendingImage(null);
  }, [typedMessage, pendingImage, selectedConvId, sendMessageMut]);

  const handleScheduleSend = useCallback((scheduledAtIso: string) => {
    if ((!typedMessage.trim() && !pendingImage) || !selectedConvId) return;
    const content = typedMessage.trim() || (pendingImage ? '📷 Photo' : '');
    sendMessageMut.mutate({
      content,
      mediaUrl: pendingImage?.url,
      mediaType: pendingImage ? 'image' : undefined,
      scheduledAt: scheduledAtIso,
    });
    setTypedMessage('');
    setPendingImage(null);
  }, [typedMessage, pendingImage, selectedConvId, sendMessageMut]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await mediaUpload.mutateAsync(file);
      setPendingImage({ url: result.url, file });
    } catch (err) {
      console.error('Image upload failed:', err);
    }
    e.target.value = '';
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await fileUpload.mutateAsync(file);
      const isImg = file.type.startsWith('image/');
      sendMessageMut.mutate({
        content: isImg ? '📷 Photo' : `📎 ${file.name}`,
        mediaUrl: result.url,
        mediaType: isImg ? 'image' : 'document',
      });
    } catch (err) {
      console.error('File upload failed:', err);
    }
    e.target.value = '';
  };

  const handleEmojiSelect = (emoji: { native: string }) => {
    setTypedMessage(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  const handleMicClick = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setIsRecording(false);
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], 'voice.webm', { type: 'audio/webm' });
        try {
          const result = await mediaUpload.mutateAsync(file);
          sendMessageMut.mutate({ content: '🎤 Voice message', mediaUrl: result.url, mediaType: 'voice' });
        } catch (err) {
          console.error('Voice upload failed:', err);
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Please allow microphone access to record voice messages.');
    }
  };

  return {
    typedMessage,
    setTypedMessage,
    pendingImage,
    setPendingImage,
    isRecording,
    showEmojiPicker,
    setShowEmojiPicker,
    imageInputRef,
    fileInputRef,
    emojiRef,
    sendMessageMut,
    mediaUpload,
    fileUpload,
    handleSend,
    handleScheduleSend,
    handleKeyPress,
    handleImageSelect,
    handleFileSelect,
    handleEmojiSelect,
    handleMicClick,
  };
};
