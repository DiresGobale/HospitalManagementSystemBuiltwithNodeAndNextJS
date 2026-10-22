import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('caqms_access_token') : '';
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

    socket = io(socketUrl, {
      auth: { token },
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Socket.IO connected:', socket?.id);
      const activeClinicId = localStorage.getItem('caqms_active_clinic_id');
      if (activeClinicId) {
        socket?.emit('join:clinic', { clinicId: activeClinicId });
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
    });
  }

  return socket;
}

