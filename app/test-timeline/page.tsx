'use client';

import Timeline from '@/components/Timeline';

export default function TestTimelinePage() {
  // Simulerer 15 årstal på tidslinjen - starter med 1980 og tilføjer årstal med forskellige intervaller
  const timelineYears = [
    1980, 1985, 1987, 1990, 1992, 1995, 1998, 2000, 2003, 2005, 2008, 2010, 2012, 2015, 2018
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Test: Tidslinje med 15 kort
          </h1>
          <p className="text-center text-gray-600">
            Dette viser hvordan tidslinjen ser ud med 15 årstal/kort
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Tidslinje</h2>
          <Timeline years={timelineYears} startYear={1980} />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Info</h2>
          <p className="text-gray-700 mb-2">
            <strong>Antal kort:</strong> {timelineYears.length}
          </p>
          <p className="text-gray-700 mb-2">
            <strong>Startår:</strong> 1980
          </p>
          <p className="text-gray-700">
            <strong>Slutår:</strong> {Math.max(...timelineYears)}
          </p>
        </div>
      </div>
    </div>
  );
}


