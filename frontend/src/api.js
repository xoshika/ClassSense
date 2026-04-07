const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8000/api";
const WS_BASE_URL =
  process.env.REACT_APP_WS_URL || "ws://localhost:8000";

const fetchAPI = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem("authToken");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Token ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  return response.json();
};

export const classesAPI = {
  list: (params = {}) =>
    fetchAPI(`/classes/?${new URLSearchParams(params).toString()}`),
  get: (id) => fetchAPI(`/classes/${id}/`),
  create: (data) =>
    fetchAPI("/classes/", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) =>
    fetchAPI(`/classes/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id) => fetchAPI(`/classes/${id}/`, { method: "DELETE" }),
  enroll: (id) =>
    fetchAPI(`/classes/${id}/enroll/`, { method: "POST" }),
  unenroll: (id) =>
    fetchAPI(`/classes/${id}/unenroll/`, { method: "POST" }),
  getStudents: (id) => fetchAPI(`/classes/${id}/students/`),
};

export const sessionsAPI = {
  list: (params = {}) =>
    fetchAPI(`/sessions/?${new URLSearchParams(params).toString()}`),
  get: (id) => fetchAPI(`/sessions/${id}/`),
  create: (data) =>
    fetchAPI("/sessions/", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) =>
    fetchAPI(`/sessions/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id) => fetchAPI(`/sessions/${id}/`, { method: "DELETE" }),
  start: (id) =>
    fetchAPI(`/sessions/${id}/start/`, { method: "POST" }),
  end: (id) =>
    fetchAPI(`/sessions/${id}/end/`, { method: "POST" }),
};

export const activitiesAPI = {
  list: (params = {}) =>
    fetchAPI(`/activities/?${new URLSearchParams(params).toString()}`),
  get: (id) => fetchAPI(`/activities/${id}/`),
  create: (data) =>
    fetchAPI("/activities/", { method: "POST", body: JSON.stringify(data) }),
  bySession: (sessionId) =>
    fetchAPI(`/activities/by_session/?session_id=${sessionId}`),
  byStudent: (studentId) =>
    fetchAPI(`/activities/by_student/?student_id=${studentId}`),
};

export const attendanceAPI = {
  list: (params = {}) =>
    fetchAPI(`/attendance/?${new URLSearchParams(params).toString()}`),
  get: (id) => fetchAPI(`/attendance/${id}/`),
  checkIn: (data) =>
    fetchAPI("/attendance/check_in/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  checkOut: (data) =>
    fetchAPI("/attendance/check_out/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const gestureStatsAPI = {
  list: (params = {}) =>
    fetchAPI(`/gesture-stats/?${new URLSearchParams(params).toString()}`),
  get: (id) => fetchAPI(`/gesture-stats/${id}/`),
  sessionSummary: (sessionId) =>
    fetchAPI(`/gesture-stats/session_summary/?session_id=${sessionId}`),
  studentSummary: (studentId) =>
    fetchAPI(`/gesture-stats/student_summary/?student_id=${studentId}`),
};

export const authAPI = {
  login: (username, password) =>
    fetchAPI("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  logout: () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  },
  getCurrentUser: () => fetchAPI("/auth/user/"),
};

export const createWebSocketURL = (path) => {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const host = window.location.host;
  return `${protocol}://${host}${path}`;
};

/**
 * Real-time gesture streaming
 */
export const createGestureWebSocket = (sessionId, onMessage, onError) => {
  const ws = new WebSocket(
    `${WS_BASE_URL}/ws/gesture/${sessionId}/`
  );

  ws.onopen = () => {
    console.log("Gesture WebSocket connected");
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };

  ws.onerror = (error) => {
    console.error("Gesture WebSocket error:", error);
    if (onError) onError(error);
  };

  ws.onclose = () => {
    console.log("Gesture WebSocket disconnected");
  };

  return ws;
};

export const createSessionWebSocket = (sessionId, onMessage, onError) => {
  const ws = new WebSocket(
    `${WS_BASE_URL}/ws/session/${sessionId}/`
  );

  ws.onopen = () => {
    console.log("Session WebSocket connected");
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };

  ws.onerror = (error) => {
    console.error("Session WebSocket error:", error);
    if (onError) onError(error);
  };

  ws.onclose = () => {
    console.log("Session WebSocket disconnected");
  };

  return ws;
};

export default {
  classesAPI,
  sessionsAPI,
  activitiesAPI,
  attendanceAPI,
  gestureStatsAPI,
  authAPI,
  createGestureWebSocket,
  createSessionWebSocket,
};
