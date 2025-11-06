'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useRouter } from 'next/navigation';
import { Socket } from 'socket.io-client';

export default function CreateGame() {
  const { socket, isConnected } = useSocket();
  const router = useRouter();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleGameCreated = (data: { roomId: string }) => {
      setRoomId(data.roomId);
    };

    socket.on('host:game-created', handleGameCreated);

    // Create game automatically when connected
    socket.emit('host:create-game');

    return () => {
      socket.off('host:game-created', handleGameCreated);
    };
  }, [socket, isConnected]);

  useEffect(() => {
    if (roomId) {
      router.push(`/host/${roomId}`);
    }
  }, [roomId, router]);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Forbinder til server...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Opretter spil...</p>
      </div>
    </div>
  );
}

