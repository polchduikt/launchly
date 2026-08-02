import { useEffect, useRef, useState, useCallback, type Dispatch, type SetStateAction, type MutableRefObject } from 'react';
import { Client } from '@stomp/stompjs';
import type { Node, Edge } from '@xyflow/react';
import { useAuthStore } from '../../store/useAuthStore';

export interface Collaborator {
  userId: number;
  name: string;
  avatar: string | null;
  action: string | null;
  editingNodeId?: string | null;
  lastActive: number;
}

const PING_INTERVAL_MS = 1200;
const STALE_THRESHOLD_MS = 6000;
const NODE_MOVE_THROTTLE_MS = 50;
const STATE_UPDATE_DEBOUNCE_MS = 800;

export const useFlowCollaboration = (
  botId: number,
  nodes: Node[],
  edges: Edge[],
  setNodes: Dispatch<SetStateAction<Node[]>>,
  setEdges: Dispatch<SetStateAction<Edge[]>>,
  type: 'flow' | 'broadcast' = 'flow',
  isLocalChangeRef?: MutableRefObject<boolean>,
) => {
  const currentUser = useAuthStore((s) => s.user);
  const stompClientRef = useRef<Client | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const localActionRef = useRef<string | null>(null);
  const localEditingNodeIdRef = useRef<string | null>(null);
  const activeCollaboratorsRef = useRef<Record<number, Collaborator>>({});
  const isRemoteUpdateRef = useRef<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const lastPublishRef = useRef<number>(0);
  const pendingMovesRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const rafScheduledRef = useRef(false);
  const publishPresenceNowRef = useRef<(() => void) | null>(null);
  const lastCollabSnapshotRef = useRef<string>('');
  const recomputeCollaborators = useCallback(() => {
    const activeList = Object.values(activeCollaboratorsRef.current).filter(
      (c) => c.userId !== currentUser?.id && Date.now() - c.lastActive < STALE_THRESHOLD_MS
    );
    const snapshot = activeList
      .map((c) => `${c.userId}:${c.action || ''}:${c.editingNodeId || ''}`)
      .sort()
      .join('|');
    if (snapshot !== lastCollabSnapshotRef.current) {
      lastCollabSnapshotRef.current = snapshot;
      setCollaborators(activeList);
      const editingCollab = activeList
        .sort((a, b) => b.lastActive - a.lastActive)
        .find((c) => c.action);
      setActiveAction(editingCollab ? editingCollab.action : null);
    }
  }, [currentUser?.id]);
  const applyPendingMoves = useCallback(() => {
    rafScheduledRef.current = false;
    const updates = pendingMovesRef.current;
    if (updates.size === 0) return;
    const moveEntries = Array.from(updates.entries());
    updates.clear();

    isRemoteUpdateRef.current = true;
    setNodes((prev) => {
      let changed = false;
      const result = prev.map((n) => {
        const newPos = moveEntries.find(([id]) => id === n.id);
        if (newPos) {
          changed = true;
          return { ...n, position: newPos[1] };
        }
        return n;
      });
      return changed ? result : prev;
    });
    setTimeout(() => {
      isRemoteUpdateRef.current = false;
    }, 100);
  }, [setNodes]);

  const updateLocalAction = useCallback((action: string | null, nodeId: string | null = null) => {
    localActionRef.current = action;
    localEditingNodeIdRef.current = nodeId;
    publishPresenceNowRef.current?.();
  }, []);

  useEffect(() => {
    if (!botId || botId <= 0 || !currentUser) return;

    const token = useAuthStore.getState().accessToken;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = token
      ? `${protocol}//${host}/ws?token=${encodeURIComponent(token)}`
      : `${protocol}//${host}/ws`;

    const client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.debug = () => {};

    client.onStompError = (frame) => {
      console.error('[STOMP Error]', frame.headers['message'], frame.body);
    };

    client.onWebSocketError = (event) => {
      console.error('[STOMP WS Error]', event);
    };

    client.onConnect = () => {
      publishPresenceNowRef.current = () => {
        if (!client.connected || !currentUser) return;
        client.publish({
          destination: `/app/presence/${botId}/${type}`,
          body: JSON.stringify({
            userId: currentUser.id,
            name: currentUser.name,
            avatar: currentUser.avatar,
            action: localActionRef.current,
            editingNodeId: localEditingNodeIdRef.current,
            lastActive: Date.now(),
          }),
        });
      };

      publishPresenceNowRef.current();
      client.subscribe(`/topic/presence/${botId}/${type}`, (msg) => {
        try {
          const body = JSON.parse(msg.body) as Collaborator;
          if (body.userId === currentUser.id) return;

          activeCollaboratorsRef.current[body.userId] = {
            ...body,
            lastActive: Date.now(),
          };

          recomputeCollaborators();
        } catch (e) {
          console.error('[Collaboration] Presence parse error:', e);
        }
      });
      client.subscribe(`/topic/collaboration/${botId}/${type}/move`, (msg) => {
        try {
          const body = JSON.parse(msg.body) as {
            userId: number;
            nodeId: string;
            position: { x: number; y: number };
          };
          if (body.userId === currentUser.id) return;
          if (activeCollaboratorsRef.current[body.userId]) {
            activeCollaboratorsRef.current[body.userId] = {
              ...activeCollaboratorsRef.current[body.userId],
              editingNodeId: body.nodeId,
              lastActive: Date.now(),
            };
            recomputeCollaborators();
          }
          pendingMovesRef.current.set(body.nodeId, body.position);
          if (!rafScheduledRef.current) {
            rafScheduledRef.current = true;
            requestAnimationFrame(applyPendingMoves);
          }
        } catch (e) {
          console.error('[Collaboration] Move parse error:', e);
        }
      });
      client.subscribe(`/topic/collaboration/${botId}/${type}/update`, (msg) => {
        try {
          const body = JSON.parse(msg.body) as { userId: number; nodes: Node[]; edges: Edge[] };
          if (body.userId === currentUser.id) return;

          isRemoteUpdateRef.current = true;
          setNodes(body.nodes);
          setEdges(body.edges);
          setTimeout(() => {
            isRemoteUpdateRef.current = false;
          }, 400);
        } catch (e) {
          console.error('[Collaboration] Update parse error:', e);
        }
      });
    };

    client.activate();
    stompClientRef.current = client;
    const pingInterval = setInterval(() => {
      publishPresenceNowRef.current?.();
      recomputeCollaborators();
    }, PING_INTERVAL_MS);

    return () => {
      publishPresenceNowRef.current = null;
      clearInterval(pingInterval);
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [botId, currentUser, setNodes, setEdges, type, recomputeCollaborators, applyPendingMoves]);

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  nodesRef.current = nodes;
  edgesRef.current = edges;

  useEffect(() => {
    if (!botId || botId <= 0 || !currentUser) return;
    const syncInterval = setInterval(() => {
      if (isRemoteUpdateRef.current) return;
      if (isDraggingRef.current) return;
      if (isLocalChangeRef && !isLocalChangeRef.current) return;

      if (stompClientRef.current?.connected) {
        stompClientRef.current.publish({
          destination: `/app/collaboration/${botId}/${type}/update`,
          body: JSON.stringify({
            userId: currentUser.id,
            nodes: nodesRef.current,
            edges: edgesRef.current,
          }),
        });
      }
    }, STATE_UPDATE_DEBOUNCE_MS);

    return () => clearInterval(syncInterval);
  }, [botId, currentUser, type, isLocalChangeRef]);

  const publishNodeMove = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      const now = Date.now();
      if (now - lastPublishRef.current < NODE_MOVE_THROTTLE_MS) return;
      lastPublishRef.current = now;

      if (stompClientRef.current?.connected && currentUser) {
        stompClientRef.current.publish({
          destination: `/app/collaboration/${botId}/${type}/move`,
          body: JSON.stringify({
            userId: currentUser.id,
            nodeId,
            position,
          }),
        });
      }
    },
    [botId, currentUser, type]
  );
  const publishNodeMoveForce = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      lastPublishRef.current = Date.now();
      if (stompClientRef.current?.connected && currentUser) {
        stompClientRef.current.publish({
          destination: `/app/collaboration/${botId}/${type}/move`,
          body: JSON.stringify({
            userId: currentUser.id,
            nodeId,
            position,
          }),
        });
      }
    },
    [botId, currentUser, type]
  );

  const setDragging = useCallback((isDragging: boolean) => {
    isDraggingRef.current = isDragging;
  }, []);

  return {
    collaborators,
    activeAction,
    updateLocalAction,
    publishNodeMove,
    publishNodeMoveForce,
    setDragging,
  };
};