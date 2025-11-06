'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-red-500">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-md w-full mx-4">
        <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Hitster Online
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Musik-gætte-spil med venner
        </p>
        
        <div className="space-y-4">
          <Link
            href="/host/create"
            className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-lg text-center transition-colors"
          >
            🎮 Vært - Opret spil
          </Link>
          
          <Link
            href="/player"
            className="block w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-4 px-6 rounded-lg text-center transition-colors"
          >
            📱 Spiller - Join spil
          </Link>
        </div>
      </div>
    </div>
  );
}

