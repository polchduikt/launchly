import { useState, useEffect } from 'react';
import { lsGet, lsSet } from '../utils/chat';
import {
  LS_LABELS,
  LS_FAVS,
  LS_TAGS,
  LS_NOTES,
  LS_UNREAD,
  LS_LAST_SEEN,
} from '../config/chat';
import type { ConversationResponse } from '../../../types/crm';

interface UseChatLocalStorageParams {
  conversations: ConversationResponse[];
  selectedConvId: number | null;
}

export const useChatLocalStorage = ({
  conversations,
  selectedConvId,
}: UseChatLocalStorageParams) => {
  const [labels, setLabels] = useState<string[]>(() => lsGet(LS_LABELS, []));
  const [showAddLabel, setShowAddLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [favorites, setFavorites] = useState<number[]>(() => lsGet(LS_FAVS, []));
  const [contactTags, setContactTags] = useState<Record<number, string[]>>(() => lsGet(LS_TAGS, {}));
  const [showAddTag, setShowAddTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [contactNotes, setContactNotes] = useState<Record<number, string>>(() => lsGet(LS_NOTES, {}));
  const [unreadConvIds, setUnreadConvIds] = useState<number[]>(() => lsGet(LS_UNREAD, []));
  const [lastSeenAt, setLastSeenAt] = useState<Record<number, string>>(() => lsGet(LS_LAST_SEEN, {}));

  useEffect(() => { lsSet(LS_LABELS, labels); }, [labels]);
  useEffect(() => { lsSet(LS_FAVS, favorites); }, [favorites]);
  useEffect(() => { lsSet(LS_TAGS, contactTags); }, [contactTags]);
  useEffect(() => { lsSet(LS_NOTES, contactNotes); }, [contactNotes]);
  useEffect(() => { lsSet(LS_UNREAD, unreadConvIds); }, [unreadConvIds]);
  useEffect(() => { lsSet(LS_LAST_SEEN, lastSeenAt); }, [lastSeenAt]);

  useEffect(() => {
    conversations.forEach(c => {
      if (c.id !== selectedConvId && c.lastMessageAt) {
        const seen = lastSeenAt[c.id];
        if (!seen || new Date(c.lastMessageAt).getTime() > new Date(seen).getTime()) {
          setUnreadConvIds(prev => prev.includes(c.id) ? prev : [...prev, c.id]);
        }
      }
    });
  }, [conversations]);

  const markAsRead = (convId: number) => {
    setUnreadConvIds(prev => prev.filter(uid => uid !== convId));
    setLastSeenAt(prev => ({ ...prev, [convId]: new Date().toISOString() }));
  };

  const toggleFavorite = (convId: number) =>
    setFavorites(prev => prev.includes(convId) ? prev.filter(id => id !== convId) : [...prev, convId]);

  const addLabel = () => {
    if (newLabelName.trim() && !labels.includes(newLabelName.trim())) {
      setLabels([...labels, newLabelName.trim()]);
    }
    setNewLabelName('');
    setShowAddLabel(false);
  };

  const addTag = () => {
    if (!selectedConvId || !newTagName.trim()) return;
    const cur = contactTags[selectedConvId] || [];
    if (!cur.includes(newTagName.trim())) {
      setContactTags({ ...contactTags, [selectedConvId]: [...cur, newTagName.trim()] });
    }
    setNewTagName('');
    setShowAddTag(false);
  };

  const removeTag = (tag: string) => {
    if (!selectedConvId) return;
    setContactTags({
      ...contactTags,
      [selectedConvId]: (contactTags[selectedConvId] || []).filter(t => t !== tag),
    });
  };

  const saveNote = (note: string) => {
    if (!selectedConvId) return;
    setContactNotes({ ...contactNotes, [selectedConvId]: note });
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
    addTag,
    removeTag,
    saveNote,
  };
};
