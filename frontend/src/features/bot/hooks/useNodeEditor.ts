import { useState, useEffect, useRef } from 'react';
import type { Node } from '@xyflow/react';
import type { CustomNodeData, ButtonData } from '../../../types/bot';
import apiClient from '../../../lib/axios';

export const useNodeEditor = (
  node: Node | undefined,
  onUpdateNodeData: (nodeId: string, newData: Record<string, unknown>) => void
) => {
  const [isBtnDialogOpen, setIsBtnDialogOpen] = useState(false);
  const [editingButton, setEditingButton] = useState<ButtonData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleEditButtonFromNode = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (node && customEvent.detail.nodeId === node.id) {
        setEditingButton(customEvent.detail.button);
        setIsBtnDialogOpen(true);
      }
    };
    window.addEventListener('edit-flow-button', handleEditButtonFromNode);
    return () => {
      window.removeEventListener('edit-flow-button', handleEditButtonFromNode);
    };
  }, [node]);

  const data = (node?.data || {}) as CustomNodeData;
  const buttons = (data.buttons || []) as ButtonData[];

  const handleChange = (key: string, value: unknown) => {
    if (!node) return;
    onUpdateNodeData(node.id, {
      ...data,
      [key]: value,
    });
  };

  const handleAddButton = () => {
    const currentBtns = (data.buttons || []) as ButtonData[];
    if (currentBtns.length >= 10) return;
    const newBtn: ButtonData = {
      label: `Button ${currentBtns.length + 1}`,
      value: `btn_${Date.now()}`,
    };
    handleChange('buttons', [...currentBtns, newBtn]);
  };

  const handleOpenEditButton = (btn: ButtonData) => {
    setEditingButton(btn);
    setIsBtnDialogOpen(true);
  };

  const handleSaveButton = (updated: ButtonData) => {
    const currentBtns = (data.buttons || []) as ButtonData[];
    const newBtns = currentBtns.map((b) => (b.value === editingButton?.value ? updated : b));
    handleChange('buttons', newBtns);
    setEditingButton(null);
  };

  const handleRemoveButton = () => {
    const currentBtns = (data.buttons || []) as ButtonData[];
    const newBtns = currentBtns.filter((b) => b.value !== editingButton?.value);
    handleChange('buttons', newBtns);
    setEditingButton(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'bots');

    try {
      setIsUploading(true);
      const response = await apiClient.post('/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const url = response.data.url;
      handleChange('imageUrl', url);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isBtnDialogOpen,
    setIsBtnDialogOpen,
    editingButton,
    setEditingButton,
    isUploading,
    showImageUrlInput,
    setShowImageUrlInput,
    fileInputRef,
    data,
    buttons,
    handleChange,
    handleAddButton,
    handleOpenEditButton,
    handleSaveButton,
    handleRemoveButton,
    handleFileUpload,
  };
};
