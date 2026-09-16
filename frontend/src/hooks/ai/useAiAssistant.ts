import { useEffect, useRef, useState, useCallback } from 'react';
import { useAiStore } from '../../store/useAiStore';
import { useAiUsageQuery, useAiChatMutation, useAiSchemaMutation } from './useAiQueries';
import { getAutoLayoutedElements } from '../../utils/flowLayout';
import type { Node, Edge } from '@xyflow/react';

import type { GroqMessage } from '../../types/ai';

export const useAiAssistant = () => {
  const {
    isOpen,
    setIsOpen,
    activeTab,
    setActiveTab,
    onGenerate,
    hasExistingNodes,
  } = useAiStore();

  const [messages, setMessages] = useState<GroqMessage[]>([]);
  const addMessage = (msg: GroqMessage) => setMessages((prev) => [...prev, msg]);

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

  const schemaMutationReset = schemaMutation.reset;
  useEffect(() => {
    if (!isOpen) {
      setDescription('');
      setConfirmOverwrite(false);
      schemaMutationReset();
    }
  }, [isOpen, schemaMutationReset]);

  const prevOnGenerateRef = useRef(onGenerate);
  useEffect(() => {
    const changed = prevOnGenerateRef.current !== onGenerate;
    prevOnGenerateRef.current = onGenerate;
    if (changed && !onGenerate && activeTab !== 'chat') {
      setActiveTab('chat');
    }
  }, [onGenerate, activeTab, setActiveTab]);

  const isLimitReached =
    Boolean(usage && (usage.tokensRemaining <= 0 || usage.remainingPercentage <= 0));

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    if (chatMutation.isPending) return;

    if (isLimitReached) {
      return;
    }

    setInputValue('');
    const userMsg = { role: 'user' as const, content: text };
    addMessage(userMsg);

    try {
      const historyToSend = messages.map((m) => ({ role: m.role, content: m.content }));

      const response = await chatMutation.mutateAsync({
        message: text,
        history: historyToSend,
      });

      addMessage({
        role: 'assistant',
        content: response.reply,
      });
      refetchUsage();
    } catch {
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
        prompt: description.trim(),
        description: description.trim(),
      });

      let parsedNodes: unknown[] = response.nodes as unknown[];
      let parsedEdges: unknown[] = response.edges as unknown[];

      if (typeof parsedNodes === 'string') {
        try {
          parsedNodes = JSON.parse(parsedNodes);
        } catch {
          parsedNodes = [];
        }
      }
      if (typeof parsedEdges === 'string') {
        try {
          parsedEdges = JSON.parse(parsedEdges);
        } catch {
          parsedEdges = [];
        }
      }

      if (parsedNodes && typeof parsedNodes === 'object' && !Array.isArray(parsedNodes)) {
        const parsedObj = parsedNodes as Record<string, unknown>;
        if (Array.isArray(parsedObj.nodes)) {
          parsedNodes = parsedObj.nodes;
        } else {
          const arrayKey = Object.keys(parsedObj).find(key => Array.isArray(parsedObj[key]));
          parsedNodes = arrayKey ? (parsedObj[arrayKey] as unknown[]) : [];
        }
      }
      if (parsedEdges && typeof parsedEdges === 'object' && !Array.isArray(parsedEdges)) {
        const parsedObj = parsedEdges as Record<string, unknown>;
        if (Array.isArray(parsedObj.edges)) {
          parsedEdges = parsedObj.edges;
        } else {
          const arrayKey = Object.keys(parsedObj).find(key => Array.isArray(parsedObj[key]));
          parsedEdges = arrayKey ? (parsedObj[arrayKey] as unknown[]) : [];
        }
      }

      if (!Array.isArray(parsedNodes)) {
        parsedNodes = [];
      }
      if (!Array.isArray(parsedEdges)) {
        parsedEdges = [];
      }

      const mappedNodes: Node[] = (parsedNodes as Record<string, unknown>[]).map((node, idx) => {
        let position = node.position as { x: number; y: number } | undefined;
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

        const supportedTypes = ['START', 'MESSAGE', 'INPUT', 'CONDITION', 'ACTION', 'ORDER', 'LEAD', 'API_CALL', 'SMART_DELAY', 'RANDOMIZER', 'END'];
        let type = (typeof node.type === 'string' ? node.type : 'MESSAGE').toUpperCase();
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
          id: (node.id as string) || `node_generated_${idx}_${Date.now()}`,
          type,
          position,
          data: data as Record<string, unknown>,
        } as Node;
      });

      const mappedEdges: Edge[] = (parsedEdges as Record<string, unknown>[])
        .map((edge, idx) => {
          let sourceHandle = edge.sourceHandle as string | undefined;
          if (!sourceHandle) {
            const sourceNode = mappedNodes.find((n) => n.id === edge.source);
            sourceHandle = sourceNode?.type === 'START' ? 'then' : 'next';
          }
          return {
            ...edge,
            id: (edge.id as string) || `edge_generated_${idx}_${Date.now()}`,
            source: (edge.source as string) || '',
            target: (edge.target as string) || '',
            sourceHandle,
          } as Edge;
        })
        .filter((edge) => edge.source && edge.target);

      const layouted = getAutoLayoutedElements(mappedNodes, mappedEdges, 'LR');
      onGenerate(layouted.nodes, layouted.edges);
      refetchUsage();
      setDescription('');
      setConfirmOverwrite(false);
      schemaMutation.reset();
    } catch {
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
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
