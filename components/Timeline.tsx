'use client';

interface TimelineProps {
  years: number[];
  startYear?: number;
}

export default function Timeline({ years, startYear }: TimelineProps) {
  if (years.length === 0 && !startYear) {
    return (
      <div className="text-center text-gray-500 py-8">
        Ingen sange endnu
      </div>
    );
  }

  const displayYears = years.length > 0 
    ? years.sort((a, b) => a - b)
    : startYear 
    ? [startYear]
    : [];

  return (
    <div className="w-full overflow-x-auto py-4">
      <div className="flex items-center gap-2 min-w-max px-4">
        {displayYears.map((year, index) => (
          <div key={year} className="flex items-center">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-lg px-4 py-2 shadow-lg min-w-[80px] text-center font-semibold">
              {year}
            </div>
            {index < displayYears.length - 1 && (
              <div className="w-8 h-1 bg-gradient-to-r from-purple-300 to-pink-300 mx-1"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

