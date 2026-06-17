import { useEffect, useRef, useState, useCallback } from 'react';
import { useAiStore } from '../../../store/useAiStore';
import { useAiUsageQuery, useAiChatMutation, useAiSchemaMutation } from './useAiQueries';
import { getAutoLayoutedElements } from '../../bot/utils/flowLayout';

export const useAiAssistant = () => {
  const {
    isOpen,
    setIsOpen,
    messages,
    addMessage,
    activeTab,
    setActiveTab,
    onGenerate,
    hasExistingNodes,
  } = useAiStore();

  const [inputValue, setInputValue] = useState('');
  const [description, setDescription] = useState('');
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: usage, isLoading: isUsageLoading, refetch: refetchUsage } = useAiUsageQuery();
  const chatMutation = useAiChatMutation();
  const schemaMutation = useAiSchemaMutation();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      scrollToBottom();
    }
  }, [isOpen, messages, chatMutation.isPending, activeTab, scrollToBottom]);

  useEffect(() => {
    if (!isOpen) {
      setDescription('');
      setConfirmOverwrite(false);
      schemaMutation.reset();
    }
  }, [isOpen, schemaMutation]);

  useEffect(() => {
    if (!onGenerate) {
      setActiveTab('chat');
    }
  }, [onGenerate, setActiveTab]);

  const isLimitReached =
    usage && usage.requestsLimit > 0 && usage.requestsUsed >= usage.requestsLimit;

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    if (chatMutation.isPending) return;

    if (usage && usage.requestsLimit > 0 && usage.requestsUsed >= usage.requestsLimit) {
      return;
    }

    setInputValue('');
    const userMsg = { role: 'user' as const, content: text };
    addMessage(userMsg);

    try {
      const historyToSend = messages
        .filter((_, idx) => idx > 0)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await chatMutation.mutateAsync({
        message: text,
        history: historyToSend,
      });

      addMessage({
        role: 'assistant',
        content: response.reply,
      });
      refetchUsage();
    } catch (err) {
      addMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again or check your internet connection.',
      });
    }
  };

  const handleGenerate = async () => {
    if (!description.trim() || isLimitReached || !onGenerate) return;

    if (hasExistingNodes && !confirmOverwrite) {
      setConfirmOverwrite(true);
      return;
    }

    try {
      const response = await schemaMutation.mutateAsync({
        description: description.trim(),
      });

      let parsedNodes = response.nodes;
      let parsedEdges = response.edges;

      if (typeof parsedNodes === 'string') {
        try {
          parsedNodes = JSON.parse(parsedNodes);
        } catch (e) {
          parsedNodes = [];
        }
      }
      if (typeof parsedEdges === 'string') {
        try {
          parsedEdges = JSON.parse(parsedEdges);
        } catch (e) {
          parsedEdges = [];
        }
      }

      if (parsedNodes && typeof parsedNodes === 'object' && !Array.isArray(parsedNodes)) {
        if (Array.isArray((parsedNodes as any).nodes)) {
          parsedNodes = (parsedNodes as any).nodes;
        } else {
          const arrayKey = Object.keys(parsedNodes).find(key => Array.isArray((parsedNodes as any)[key]));
          parsedNodes = arrayKey ? (parsedNodes as any)[arrayKey] : [];
        }
      }
      if (parsedEdges && typeof parsedEdges === 'object' && !Array.isArray(parsedEdges)) {
        if (Array.isArray((parsedEdges as any).edges)) {
          parsedEdges = (parsedEdges as any).edges;
        } else {
          const arrayKey = Object.keys(parsedEdges).find(key => Array.isArray((parsedEdges as any)[key]));
          parsedEdges = arrayKey ? (parsedEdges as any)[arrayKey] : [];
        }
      }

      if (!Array.isArray(parsedNodes)) {
        parsedNodes = [];
      }
      if (!Array.isArray(parsedEdges)) {
        parsedEdges = [];
      }

      parsedNodes = parsedNodes.map((node: any, idx: number) => {
        let position = node.position;
        if (!position || typeof position !== 'object') {
          const x = typeof node.x === 'number' ? node.x : idx * 250 + 100;
          const y = typeof node.y === 'number' ? node.y : 150;
          position = { x, y };
        } else {
          const x = typeof position.x === 'number' ? position.x : (typeof position.x === 'string' ? parseFloat(position.x) : idx * 250 + 100);
          const y = typeof position.y === 'number' ? position.y : (typeof position.y === 'string' ? parseFloat(position.y) : 150);
          position = {
            x: isNaN(x) ? idx * 250 + 100 : x,
            y: isNaN(y) ? 150 : y,
          };
        }

        let data = node.data;
        if (!data || typeof data !== 'object') {
          data = {};
        }

        const supportedTypes = ['START', 'MESSAGE', 'INPUT', 'CONDITION', 'ORDER', 'LEAD', 'API_CALL', 'END'];
        let type = (node.type || 'MESSAGE').toUpperCase();
        if (type === 'API' || type === 'INTEGRATION') {
          type = 'API_CALL';
        } else if (type === 'TRIGGER') {
          type = 'START';
        } else if (type === 'BUTTON' || type === 'TAG') {
          type = 'MESSAGE';
        } else if (!supportedTypes.includes(type)) {
          type = 'MESSAGE';
        }

        return {
          ...node,
          id: node.id || `node_generated_${idx}_${Date.now()}`,
          type,
          position,
          data,
        };
      });

      parsedEdges = parsedEdges
        .map((edge: any, idx: number) => {
          let sourceHandle = edge.sourceHandle;
          if (!sourceHandle) {
            const sourceNode = parsedNodes.find((n: any) => n.id === edge.source);
            sourceHandle = sourceNode?.type === 'START' ? 'then' : 'next';
          }
          return {
            ...edge,
            id: edge.id || `edge_generated_${idx}_${Date.now()}`,
            source: edge.source || '',
            target: edge.target || '',
            sourceHandle,
          };
        })
        .filter((edge: any) => edge.source && edge.target);

      const layouted = getAutoLayoutedElements(parsedNodes, parsedEdges, 'LR');
      onGenerate(layouted.nodes, layouted.edges);
      refetchUsage();
      setDescription('');
      setConfirmOverwrite(false);
      schemaMutation.reset();
    } catch (err) {
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleQuickQuestion = (question: string) => {
    handleSend(question);
  };

  return {
    isOpen,
    setIsOpen,
    messages,
    activeTab,
    setActiveTab,
    onGenerate,
    hasExistingNodes,
    inputValue,
    setInputValue,
    description,
    setDescription,
    confirmOverwrite,
    setConfirmOverwrite,
    isUsageLoading,
    usage,
    isLimitReached,
    chatMutation,
    schemaMutation,
    messagesEndRef,
    refetchUsage,
    handleSend,
    handleGenerate,
    handleKeyDown,
    handleQuickQuestion,
  };
};
