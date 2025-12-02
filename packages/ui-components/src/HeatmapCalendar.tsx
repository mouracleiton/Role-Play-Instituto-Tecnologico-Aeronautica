import React from 'react';

interface DayData {
  date: string; // YYYY-MM-DD
  value: number; // 0-100 intensity
  label?: string;
}

interface HeatmapCalendarProps {
  title: string;
  data: DayData[];
  weeks?: number; // Number of weeks to show (default 12)
  colorScale?: string[]; // Array of colors from low to high
  theme: {
    colors: {
      primary: string;
      secondary: string;
      background: string;
      surface: string;
      text: string;
      textSecondary: string;
      success: string;
      error: string;
      border: string;
    };
    fonts: {
      primary: string;
      secondary: string;
    };
  };
}

export const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({
  title,
  data,
  weeks = 12,
  colorScale,
  theme,
}) => {
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Default color scale from low (grey) to high (primary color)
  const colors = colorScale || [
    theme.colors.background,
    `${theme.colors.primary}33`,
    `${theme.colors.primary}66`,
    `${theme.colors.primary}99`,
    theme.colors.primary,
  ];

  // Generate calendar grid
  const generateCalendarGrid = () => {
    const today = new Date();
    const grid: (DayData | null)[][] = [];

    // Start from 'weeks' weeks ago
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (weeks * 7) + (7 - today.getDay()));

    // Create a map for quick lookup
    const dataMap = new Map(data.map((d) => [d.date, d]));

    for (let week = 0; week < weeks; week++) {
      const weekData: (DayData | null)[] = [];
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + week * 7 + day);

        if (currentDate > today) {
          weekData.push(null);
        } else {
          const dateStr = currentDate.toISOString().split('T')[0];
          const dayData = dataMap.get(dateStr);
          weekData.push(dayData || { date: dateStr, value: 0 });
        }
      }
      grid.push(weekData);
    }

    return grid;
  };

  const getColorForValue = (value: number): string => {
    if (value === 0) return colors[0];
    const index = Math.min(
      Math.floor((value / 100) * (colors.length - 1)) + 1,
      colors.length - 1
    );
    return colors[index];
  };

  const grid = generateCalendarGrid();
  const cellSize = 14;
  const gap = 3;

  return (
    <div
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: '16px',
        padding: '20px',
        border: `1px solid ${theme.colors.border}`,
      }}
    >
      {/* Title */}
      <h3
        style={{
          fontFamily: theme.fonts.primary,
          fontSize: '1rem',
          color: theme.colors.text,
          margin: 0,
          marginBottom: '16px',
        }}
      >
        {title}
      </h3>

      {/* Calendar grid */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {/* Day labels */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: `${gap}px`,
            marginRight: '4px',
          }}
        >
          {dayNames.map((day, idx) => (
            <div
              key={idx}
              style={{
                height: `${cellSize}px`,
                display: 'flex',
                alignItems: 'center',
                fontFamily: theme.fonts.secondary,
                fontSize: '0.625rem',
                color: theme.colors.textSecondary,
                visibility: idx % 2 === 1 ? 'visible' : 'hidden',
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div style={{ display: 'flex', gap: `${gap}px` }}>
          {grid.map((week, weekIdx) => (
            <div
              key={weekIdx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: `${gap}px`,
              }}
            >
              {week.map((day, dayIdx) => (
                <div
                  key={dayIdx}
                  title={day ? `${day.date}: ${day.label || day.value}` : ''}
                  style={{
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                    borderRadius: '3px',
                    backgroundColor: day ? getColorForValue(day.value) : 'transparent',
                    cursor: day ? 'pointer' : 'default',
                    transition: 'transform 0.1s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (day) {
                      (e.target as HTMLDivElement).style.transform = 'scale(1.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLDivElement).style.transform = 'scale(1)';
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '4px',
          marginTop: '12px',
        }}
      >
        <span
          style={{
            fontFamily: theme.fonts.secondary,
            fontSize: '0.7rem',
            color: theme.colors.textSecondary,
            marginRight: '4px',
          }}
        >
          Menos
        </span>
        {colors.map((color, idx) => (
          <div
            key={idx}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '2px',
              backgroundColor: color,
            }}
          />
        ))}
        <span
          style={{
            fontFamily: theme.fonts.secondary,
            fontSize: '0.7rem',
            color: theme.colors.textSecondary,
            marginLeft: '4px',
          }}
        >
          Mais
        </span>
      </div>
    </div>
  );
};

export default HeatmapCalendar;
