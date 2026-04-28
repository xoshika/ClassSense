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

export const useGestureStream = (sessionId, numSeats = 20) => {
  const [gestures, setGestures] = useState([]);
  const [stats, setStats] = useState({});
  const sendRef = useRef(null);

  const wsUrl = sessionId
    ? `ws://localhost:8000/ws/gesture/${sessionId}/`
    : `ws://localhost:8000/ws/gesture/0/`;

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
    },
    onMessage: (data) => {
      if (data.type === "gesture_detected") {
        const gestureData = data.gestures?.[0] || data.data || data;
        setGestures((prev) => [gestureData, ...prev.slice(0, 49)]);
        setStats((prev) => ({
          ...prev,
          [gestureData.gesture]: (prev[gestureData.gesture] || 0) + 1,
        }));
      }
    },
  });

  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  const sendFrame = useCallback(
    (imageData) => {
      send({
        type: "frame",
        session_id: sessionId || 0,
        frame: imageData,
      });
    },
    [send, sessionId]
  );

  const sendMessage = useCallback((msg) => { send(msg); }, [send]);

  return { gestures, stats, isConnected, sendFrame, sendMessage, lastMessage };
};

export default useWebSocket;