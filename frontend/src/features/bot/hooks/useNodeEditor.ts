import { useState, useEffect, useRef } from 'react';
import type { Node } from '@xyflow/react';
import type { CustomNodeData, ButtonData } from '../../../types/bot';
import apiClient from '../../../lib/axios';

export const getBlocks = (data: CustomNodeData): any[] => {
  let blocks: any[] = [];
  if (Array.isArray(data.blocks) && data.blocks.length > 0) {
    blocks = [...data.blocks];
  } else {
    if (data.text || (!data.text && !data.imageUrl)) {
      blocks.push({
        id: 'block_text_1',
        type: 'text',
        text: data.text || '',
        buttons: data.buttons || [],
      });
    }
    if (data.imageUrl) {
      blocks.push({
        id: 'block_image_1',
        type: 'image',
        imageUrl: data.imageUrl,
        buttons: blocks.length === 0 ? (data.buttons || []) : [],
      });
    }
  }

  const flatButtons = (data.buttons || []) as ButtonData[];
  const allBlockButtons = blocks.flatMap((b) => b.buttons || []);
  const missingButtons = flatButtons.filter((fb) => !allBlockButtons.some((bb) => bb.value === fb.value));

  if (missingButtons.length > 0) {
    const targetBlockIndex = blocks.findIndex((b) => b.type === 'text' || b.type === 'image' || b.type === 'file' || b.type === 'audio' || b.type === 'video');
    if (targetBlockIndex !== -1) {
      blocks[targetBlockIndex] = {
        ...blocks[targetBlockIndex],
        buttons: [...(blocks[targetBlockIndex].buttons || []), ...missingButtons],
      };
    } else if (blocks.length > 0) {
      blocks[0] = {
        ...blocks[0],
        buttons: [...(blocks[0].buttons || []), ...missingButtons],
      };
    }
  }

  return blocks;
};

export const useNodeEditor = (
  node: Node | undefined,
  onUpdateNodeData: (nodeId: string, newData: Record<string, unknown>) => void
) => {
  const [isBtnDialogOpen, setIsBtnDialogOpen] = useState(false);
  const [editingButton, setEditingButton] = useState<ButtonData | null>(null);
  const [editingButtonBlockId, setEditingButtonBlockId] = useState<string | null>(null);
  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);
  const [isNextStepDrawerOpen, setIsNextStepDrawerOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsBtnDialogOpen(false);
    setEditingButton(null);
    setEditingButtonBlockId(null);
    setIsNextStepDrawerOpen(false);
  }, [node?.id]);

  useEffect(() => {
    const handleEditButtonFromNode = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (node && customEvent.detail.nodeId === node.id) {
        const btn = customEvent.detail.button;
        setEditingButton(btn);
        
        // Find parent block
        const blocksList = getBlocks(node.data || {});
        const parentBlock = blocksList.find((b) => 
          ((b.buttons || []) as ButtonData[]).some((button) => button.value === btn.value)
        );
        setEditingButtonBlockId(parentBlock ? parentBlock.id : null);
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
    
    const newData = {
      ...data,
      [key]: value,
    };

    if (key === 'blocks' && Array.isArray(value)) {
      const blocks = value as any[];
      const firstText = blocks.find((b) => b.type === 'text');
      const firstImage = blocks.find((b) => b.type === 'image');
      
      const allButtons: any[] = [];
      blocks.forEach((b) => {
        if (Array.isArray(b.buttons)) {
          allButtons.push(...b.buttons);
        }
      });
      
      newData.text = firstText ? firstText.text : '';
      newData.imageUrl = firstImage ? firstImage.imageUrl : '';
      newData.buttons = allButtons;
    }

    onUpdateNodeData(node.id, newData);
  };

  const handleAddButton = (blockId?: string) => {
    if (blockId) {
      const blocks = getBlocks(data);
      const totalButtonsCount = blocks.reduce((sum, b) => sum + (b.buttons?.length || 0), 0);
      if (totalButtonsCount >= 10) return;

      const updatedBlocks = blocks.map((block) => {
        if (block.id === blockId) {
          const currentBtns = (block.buttons || []) as ButtonData[];
          const newBtn: ButtonData = {
            label: `Button ${currentBtns.length + 1}`,
            value: `btn_${Date.now()}`,
          };
          return { ...block, buttons: [...currentBtns, newBtn] };
        }
        return block;
      });
      handleChange('blocks', updatedBlocks);
    } else {
      const currentBtns = (data.buttons || []) as ButtonData[];
      if (currentBtns.length >= 10) return;
      const newBtn: ButtonData = {
        label: `Button ${currentBtns.length + 1}`,
        value: `btn_${Date.now()}`,
      };
      handleChange('buttons', [...currentBtns, newBtn]);
    }
  };

  const handleOpenEditButton = (btn: ButtonData, blockId?: string) => {
    setEditingButton(btn);
    setEditingButtonBlockId(blockId || null);
    setIsBtnDialogOpen(true);
  };

  const handleSaveButton = (updated: ButtonData) => {
    if (editingButtonBlockId) {
      const blocks = getBlocks(data);
      const updatedBlocks = blocks.map((block) => {
        if (block.id === editingButtonBlockId) {
          const currentBtns = (block.buttons || []) as ButtonData[];
          const newBtns = currentBtns.map((b) => (b.value === editingButton?.value ? updated : b));
          return { ...block, buttons: newBtns };
        }
        return block;
      });
      handleChange('blocks', updatedBlocks);
    } else {
      const currentBtns = (data.buttons || []) as ButtonData[];
      const newBtns = currentBtns.map((b) => (b.value === editingButton?.value ? updated : b));
      handleChange('buttons', newBtns);
    }
    setEditingButton(null);
    setEditingButtonBlockId(null);
  };

  const handleRemoveButton = () => {
    if (editingButtonBlockId) {
      const blocks = getBlocks(data);
      const updatedBlocks = blocks.map((block) => {
        if (block.id === editingButtonBlockId) {
          const currentBtns = (block.buttons || []) as ButtonData[];
          const newBtns = currentBtns.filter((b) => b.value !== editingButton?.value);
          return { ...block, buttons: newBtns };
        }
        return block;
      });
      handleChange('blocks', updatedBlocks);
    } else {
      const currentBtns = (data.buttons || []) as ButtonData[];
      const newBtns = currentBtns.filter((b) => b.value !== editingButton?.value);
      handleChange('buttons', newBtns);
    }
    setEditingButton(null);
    setEditingButtonBlockId(null);
  };

  const [uploadAccept, setUploadAccept] = useState('image/*');

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
      if (uploadingBlockId) {
        const blocks = getBlocks(data);
        const updatedBlocks = blocks.map((b) => {
          if (b.id === uploadingBlockId) {
            if (b.type === 'image') return { ...b, imageUrl: url };
            if (b.type === 'file') return { ...b, fileUrl: url, fileName: file.name };
            if (b.type === 'audio') return { ...b, audioUrl: url, fileName: file.name };
            if (b.type === 'video') return { ...b, videoUrl: url, fileName: file.name };
          }
          return b;
        });
        handleChange('blocks', updatedBlocks);
        setUploadingBlockId(null);
      } else {
        handleChange('imageUrl', url);
      }
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
    editingButtonBlockId,
    setEditingButtonBlockId,
    uploadingBlockId,
    setUploadingBlockId,
    uploadAccept,
    setUploadAccept,
    isNextStepDrawerOpen,
    setIsNextStepDrawerOpen,
  };
};
