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
    <div className="w-full py-2 overflow-x-auto">
      <div className="flex items-center justify-center flex-nowrap gap-1 px-1 min-w-max">
        {displayYears.map((year, index) => (
          <div key={year} className="flex items-center shrink-0">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded px-3 py-1 shadow-sm text-sm font-semibold whitespace-nowrap leading-tight">
              {year}
            </div>
            {index < displayYears.length - 1 && (
              <div className="w-2 h-0.5 bg-gradient-to-r from-purple-300 to-pink-300 shrink-0"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

