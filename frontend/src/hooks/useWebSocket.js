import { useEffect, useRef, useState, useCallback } from "react";

export const useWebSocket = (url, options = {}) => {
  const {
    onMessage,
    onError,
    onOpen,
    onClose,
    autoConnect = true,
  } = options;

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000;

  const connect = useCallback(() => {
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        return;
      }

      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setError(null);
        setReconnectAttempts(0);
        console.log(`WebSocket connected to ${url}`);
        if (onOpen) onOpen(wsRef.current);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          if (onMessage) onMessage(data);
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
          if (onError) onError(err);
        }
      };

      wsRef.current.onerror = (event) => {
        console.error("WebSocket error:", event);
        const err = new Error("WebSocket connection error");
        setError(err);
        if (onError) onError(err);
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        console.log(`WebSocket disconnected from ${url}`);
        if (onClose) onClose();

        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts((prev) => prev + 1);
            connect();
          }, RECONNECT_DELAY);
        }
      };
    } catch (err) {
      console.error("Failed to create WebSocket connection:", err);
      setError(err);
      if (onError) onError(err);
    }
  }, [url, onMessage, onError, onOpen, onClose, reconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
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
        console.error("Failed to send WebSocket message:", err);
        if (onError) onError(err);
      }
    } else {
      console.warn("WebSocket is not connected");
    }
  }, [onError]);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    error,
    send,
    connect,
    disconnect,
    reconnectAttempts,
  };
};

export const useGestureStream = (sessionId, numSeats = 20) => {
  const [gestures, setGestures] = useState([]);
  const [stats, setStats] = useState({});

  const { isConnected, lastMessage, send } = useWebSocket(
    `ws://localhost:8000/ws/gesture/${sessionId}/`,
    {
      onOpen: () => {
        send({
          type: "config",
          num_seats: numSeats,
          session_id: sessionId,
        });
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
      autoConnect: !!sessionId,
    }
  );

  const sendFrame = useCallback(
    (imageData) => {
      if (!send) return;
      send({
        type: "frame",
        session_id: sessionId,
        frame: imageData,
      });
    },
    [send, sessionId]
  );

  return {
    gestures,
    stats,
    isConnected,
    sendFrame,
    lastMessage,
  };
};

export const useSessionUpdates = (sessionId) => {
  const [updates, setUpdates] = useState([]);

  const { isConnected, send } = useWebSocket(
    `ws://localhost:8000/ws/session/${sessionId}/`,
    {
      onMessage: (data) => {
        if (data.type === "session_update") {
          setUpdates((prev) => [data, ...prev.slice(0, 99)]);
        }
      },
      autoConnect: !!sessionId,
    }
  );

  const broadcastUpdate = useCallback(
    (message, type = "generic") => {
      send({ message, type });
    },
    [send]
  );

  return {
    updates,
    isConnected,
    broadcastUpdate,
  };
};

export default useWebSocket;