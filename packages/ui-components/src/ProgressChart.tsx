import React from 'react';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface ProgressChartProps {
  title: string;
  data: DataPoint[];
  maxValue?: number;
  showLabels?: boolean;
  showValues?: boolean;
  barHeight?: number;
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
      warning: string;
      border: string;
    };
    fonts: {
      primary: string;
      secondary: string;
    };
  };
}

export const ProgressChart: React.FC<ProgressChartProps> = ({
  title,
  data,
  maxValue,
  showLabels = true,
  showValues = true,
  barHeight = 24,
  theme,
}) => {
  const max = maxValue || Math.max(...data.map((d) => d.value));

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
          marginBottom: '20px',
        }}
      >
        {title}
      </h3>

      {/* Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {data.map((item, index) => (
          <div key={index}>
            {/* Label row */}
            {showLabels && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                }}
              >
                <span
                  style={{
                    fontFamily: theme.fonts.secondary,
                    fontSize: '0.875rem',
                    color: theme.colors.textSecondary,
                  }}
                >
                  {item.label}
                </span>
                {showValues && (
                  <span
                    style={{
                      fontFamily: theme.fonts.secondary,
                      fontSize: '0.875rem',
                      color: theme.colors.text,
                      fontWeight: 'bold',
                    }}
                  >
                    {item.value}
                  </span>
                )}
              </div>
            )}

            {/* Bar */}
            <div
              style={{
                height: `${barHeight}px`,
                backgroundColor: theme.colors.background,
                borderRadius: `${barHeight / 2}px`,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${(item.value / max) * 100}%`,
                  backgroundColor: item.color || theme.colors.primary,
                  borderRadius: `${barHeight / 2}px`,
                  transition: 'width 0.5s ease',
                  minWidth: item.value > 0 ? '8px' : '0',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressChart;
