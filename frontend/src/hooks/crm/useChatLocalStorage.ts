import { useState, useEffect } from 'react';
import {
  getLabelsApi,
  addLabelApi,
  deleteLabelApi,
  updateConversationApi,
} from '../../api/crm';
import type { ConversationResponse } from '../../types/crm';

interface UseChatLocalStorageParams {
  conversations: ConversationResponse[];
  selectedConvId: number | null;
}

export const useChatLocalStorage = ({
  conversations,
  selectedConvId,
}: UseChatLocalStorageParams) => {
  const [labels, setLabels] = useState<string[]>([]);
  const [showAddLabel, setShowAddLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [contactTags, setContactTags] = useState<Record<number, string[]>>({});
  const [showAddTag, setShowAddTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [contactNotes, setContactNotes] = useState<Record<number, string>>({});
  const [unreadConvIds, setUnreadConvIds] = useState<number[]>([]);

  // Fetch labels from API on mount
  useEffect(() => {
    getLabelsApi()
      .then(setLabels)
      .catch((err) => console.error('Failed to load CRM labels:', err));
  }, []);

  // Sync favorites, contactTags, contactNotes, unread from conversations prop
  useEffect(() => {
    const newFavs: number[] = [];
    const newTags: Record<number, string[]> = {};
    const newNotes: Record<number, string> = {};
    const newUnread: number[] = [];

    conversations.forEach((c) => {
      if (c.favorite) newFavs.push(c.id);
      if (c.tags && c.tags.length > 0) newTags[c.id] = c.tags;
      if (c.notes) newNotes[c.id] = c.notes;
      if (c.unread) newUnread.push(c.id);
    });

    setFavorites(newFavs);
    setContactTags(newTags);
    setContactNotes(newNotes);
    setUnreadConvIds(newUnread);
  }, [conversations]);

  const markAsRead = (convId: number) => {
    setUnreadConvIds((prev) => prev.filter((uid) => uid !== convId));
    updateConversationApi(convId, { unread: false }).catch((err) =>
      console.error('Failed to mark conversation as read:', err)
    );
  };

  const toggleFavorite = (convId: number) => {
    const isFav = favorites.includes(convId);
    const updated = !isFav;
    setFavorites((prev) =>
      updated ? [...prev, convId] : prev.filter((id) => id !== convId)
    );
    updateConversationApi(convId, { favorite: updated }).catch((err) =>
      console.error('Failed to update favorite:', err)
    );
  };

  const addLabel = () => {
    if (newLabelName.trim() && !labels.includes(newLabelName.trim())) {
      const name = newLabelName.trim();
      setLabels((prev) => [...prev, name]);
      addLabelApi(name)
        .then(setLabels)
        .catch((err) => console.error('Failed to add label:', err));
    }
    setNewLabelName('');
    setShowAddLabel(false);
  };

  const addLabelByName = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !labels.includes(trimmed)) {
      setLabels((prev) => [...prev, trimmed]);
      addLabelApi(trimmed)
        .then(setLabels)
        .catch((err) => console.error('Failed to add label:', err));
    }
  };

  const deleteLabelByName = (name: string) => {
    setLabels((prev) => prev.filter((l) => l !== name));
    deleteLabelApi(name)
      .then(setLabels)
      .catch((err) => console.error('Failed to delete label:', err));
  };

  const addTag = () => {
    if (!selectedConvId || !newTagName.trim()) return;
    const cur = contactTags[selectedConvId] || [];
    if (!cur.includes(newTagName.trim())) {
      const updatedTags = [...cur, newTagName.trim()];
      setContactTags({ ...contactTags, [selectedConvId]: updatedTags });
      updateConversationApi(selectedConvId, { tags: updatedTags }).catch((err) =>
        console.error('Failed to add tag:', err)
      );
    }
    setNewTagName('');
    setShowAddTag(false);
  };

  const removeTag = (tag: string) => {
    if (!selectedConvId) return;
    const updatedTags = (contactTags[selectedConvId] || []).filter((t) => t !== tag);
    setContactTags({ ...contactTags, [selectedConvId]: updatedTags });
    updateConversationApi(selectedConvId, { tags: updatedTags }).catch((err) =>
      console.error('Failed to remove tag:', err)
    );
  };

  const saveNote = (note: string) => {
    if (!selectedConvId) return;
    setContactNotes({ ...contactNotes, [selectedConvId]: note });
    updateConversationApi(selectedConvId, { notes: note }).catch((err) =>
      console.error('Failed to save note:', err)
    );
  };

  return {
    labels,
    showAddLabel,
    setShowAddLabel,
    newLabelName,
    setNewLabelName,
    favorites,
    contactTags,
    showAddTag,
    setShowAddTag,
    newTagName,
    setNewTagName,
    contactNotes,
    unreadConvIds,
    markAsRead,
    toggleFavorite,
    addLabel,
    addLabelByName,
    deleteLabelByName,
    addTag,
    removeTag,
    saveNote,
  };
};
