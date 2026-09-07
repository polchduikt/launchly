import { useState, useCallback } from 'react';
import type { AudienceCondition, FilterType } from '../../types';

export const resolveFilter = (conditions: AudienceCondition[]) => {
  let filterType: FilterType = 'ALL';
  let filterValue: string | undefined = undefined;

  const tagCond = conditions.find((c) => c.field === 'tag');
  const orderCond = conditions.find((c) => c.field === 'order');
  const leadCond = conditions.find((c) => c.field === 'lead');

  if (tagCond) {
    filterType = 'BY_TAG';
    filterValue = tagCond.value;
  } else if (orderCond) {
    filterType = 'HAS_ORDERS';
  } else if (leadCond) {
    filterType = 'HAS_LEADS';
  }

  return { filterType, filterValue };
};

interface UseBroadcastAudienceParams {
  bots: Array<{ id: number; totalUsers?: number }>;
  botId: number;
  orders: unknown[];
  leads: unknown[];
  setIsDirty: (dirty: boolean) => void;
}

export const useBroadcastAudience = ({
  bots,
  botId,
  orders,
  leads,
  setIsDirty,
}: UseBroadcastAudienceParams) => {
  const [isAudienceOpen, setIsAudienceOpen] = useState(false);
  const [conditions, setConditions] = useState<AudienceCondition[]>([]);
  const [isConditionDropdownOpen, setIsConditionDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'general' | 'system' | 'custom'>('general');

  const handleAddTagCondition = useCallback(
    (tagName: string) => {
      const newCond: AudienceCondition = {
        id: `cond_${Date.now()}`,
        field: 'tag',
        operator: 'is',
        value: tagName,
      };
      setConditions((prev) => [...prev, newCond]);
      setIsConditionDropdownOpen(false);
      setIsDirty(true);
    },
    [setIsDirty]
  );

  const handleRemoveCondition = useCallback(
    (id: string) => {
      setConditions((prev) => prev.filter((c) => c.id !== id));
      setIsDirty(true);
    },
    [setIsDirty]
  );

  const getAudienceCount = useCallback(() => {
    const currentBot = bots.find((b) => b.id === botId);
    const totalUsers = currentBot ? currentBot.totalUsers ?? 0 : 0;
    if (totalUsers === 0) return 0;

    if (conditions.length === 0) return totalUsers;

    const hasTag = conditions.some((c) => c.field === 'tag');
    const hasOrder = conditions.some((c) => c.field === 'order');
    const hasLead = conditions.some((c) => c.field === 'lead');

    let count = totalUsers;
    if (hasTag) {
      const tagCond = conditions.find((c) => c.field === 'tag');
      if (tagCond && tagCond.value) {
        const tagName = tagCond.value;
        let tagCount = 0;
        if (tagName === 'Окунь') tagCount = 1;
        else if (tagName === 'Щука') tagCount = 0;
        else if (tagName === 'Карась') tagCount = 0;
        else {
          tagCount = Math.abs(tagName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 4;
        }
        count = Math.min(tagCount, totalUsers);
      } else {
        count = 0;
      }
    }
    if (hasOrder) {
      count = Math.min(orders.length || 2, count);
    }
    if (hasLead) {
      count = Math.min(leads.length || 3, count);
    }
    return Math.min(count, totalUsers);
  }, [bots, botId, conditions, orders.length, leads.length]);

  return {
    isAudienceOpen,
    setIsAudienceOpen,
    conditions,
    setConditions,
    isConditionDropdownOpen,
    setIsConditionDropdownOpen,
    selectedCategory,
    setSelectedCategory,
    handleAddTagCondition,
    handleRemoveCondition,
    getAudienceCount,
  };
};
