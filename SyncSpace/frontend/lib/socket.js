import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
  if (!socket && typeof window !== 'undefined') {
    const token = localStorage.getItem('syncspace_token');
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

    socket = io(socketUrl, {
      auth: { token },
      autoConnect: false,
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (s) {
    const token = localStorage.getItem('syncspace_token');
    s.auth = { token };
    if (!s.connected) {
      s.connect();
    }
  }
  return s;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

