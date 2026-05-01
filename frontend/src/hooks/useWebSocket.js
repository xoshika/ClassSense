import { useEffect, useRef, useState, useCallback } from "react";

export const useWebSocket = (url, options = {}) => {
  const { onMessage, onError, onOpen, onClose, autoConnect = true } = options;

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);

  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);

  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);
  useEffect(() => { onOpenRef.current = onOpen; }, [onOpen]);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000;

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;
    try {
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        if (onOpenRef.current) onOpenRef.current(wsRef.current);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          if (onMessageRef.current) onMessageRef.current(data);
        } catch (err) {
          if (onErrorRef.current) onErrorRef.current(err);
        }
      };

      wsRef.current.onerror = () => {
        const err = new Error("WebSocket connection error");
        setError(err);
        if (onErrorRef.current) onErrorRef.current(err);
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        if (onCloseRef.current) onCloseRef.current();
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => connect(), RECONNECT_DELAY);
        }
      };
    } catch (err) {
      setError(err);
      if (onErrorRef.current) onErrorRef.current(err);
    }
  }, [url]);

  const disconnect = useCallback(() => {
    reconnectAttemptsRef.current = MAX_RECONNECT_ATTEMPTS;
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const send = useCallback((data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(data));
      } catch (err) {
        if (onErrorRef.current) onErrorRef.current(err);
      }
    }
  }, []);

  useEffect(() => {
    if (autoConnect) connect();
    return () => disconnect();
  }, [autoConnect, connect, disconnect]);

  return { isConnected, lastMessage, error, send, connect, disconnect };
};

export const useGestureStream = (sessionId, numSeats = 20, onGestureSave) => {
  const [gestures, setGestures] = useState([]);
  const [stats, setStats] = useState({});
  const [persons, setPersons] = useState([]);
  const sendRef = useRef(null);
  const pendingGesturesRef = useRef([]);
  const sessionIdRef = useRef(sessionId);

  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

  const wsUrl = sessionId
    ? `ws://localhost:8000/ws/gesture/${sessionId}/`
    : `ws://localhost:8000/ws/gesture/0/`;

  const saveGestureViaHttp = useCallback(async (gestureData) => {
    const currentSessionId = sessionIdRef.current;
    if (!currentSessionId || currentSessionId === 0) return false;
    try {
      const response = await fetch('http://localhost:8000/api/gestures/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: currentSessionId,
          chair_rank: gestureData.chair_rank || 1,
          gesture: gestureData.gesture,
          confidence: gestureData.confidence || 0
        })
      });
      if (response.ok) {
        const savedGesture = await response.json();
        return { ...gestureData, log_id: savedGesture.id };
      }
      return false;
    } catch (err) {
      console.error('HTTP gesture save failed:', err);
      return false;
    }
  }, []);

  const { isConnected, lastMessage, send } = useWebSocket(wsUrl, {
    autoConnect: true,
    onOpen: () => {
      if (sendRef.current) {
        sendRef.current({
          type: "config",
          num_seats: numSeats,
          session_id: sessionId || 0,
        });
      }
      while (pendingGesturesRef.current.length > 0) {
        const pending = pendingGesturesRef.current.shift();
        sendRef.current(pending);
      }
    },
    onMessage: async (data) => {
      if (data.type === "landmarks_update") {
        if (Array.isArray(data.persons)) {
          setPersons(data.persons);
        }
        return;
      }

      if (data.type === "gesture_detected") {
        const gestureList = Array.isArray(data.gestures) ? data.gestures : [data.data || data];
        for (const gestureData of gestureList) {
          if (!gestureData || !gestureData.gesture) continue;
          if (!gestureData.log_id && sessionIdRef.current && sessionIdRef.current !== 0) {
            const savedData = await saveGestureViaHttp(gestureData);
            if (savedData) {
              gestureData.log_id = savedData.log_id;
            }
          }
          setGestures((prev) => [gestureData, ...prev.slice(0, 49)]);
          setStats((prev) => ({
            ...prev,
            [gestureData.gesture]: (prev[gestureData.gesture] || 0) + 1,
          }));
          if (onGestureSave && gestureData.log_id) {
            onGestureSave(gestureData);
          }
        }
      }
    },
  });

  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  const sendFrame = useCallback(
    (imageData) => {
      const msg = {
        type: "frame",
        session_id: sessionId || 0,
        frame: imageData,
      };
      if (!isConnected && sessionId && sessionId !== 0) {
        pendingGesturesRef.current.push(msg);
      }
      send(msg);
    },
    [send, sessionId, isConnected]
  );

  const sendMessage = useCallback((msg) => { send(msg); }, [send]);

  const flushPending = useCallback(() => {
    if (isConnected) {
      while (pendingGesturesRef.current.length > 0) {
        send(pendingGesturesRef.current.shift());
      }
    }
  }, [isConnected, send]);

  return { gestures, stats, persons, isConnected, sendFrame, sendMessage, lastMessage, flushPending };
};

export default useWebSocket;