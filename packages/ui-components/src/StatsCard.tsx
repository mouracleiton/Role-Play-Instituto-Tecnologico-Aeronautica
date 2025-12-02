import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
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

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color,
  theme,
}) => {
  const accentColor = color || theme.colors.primary;

  return (
    <div
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: '16px',
        padding: '20px',
        border: `1px solid ${theme.colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Accent line at top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${accentColor}, transparent)`,
        }}
      />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontFamily: theme.fonts.secondary,
            fontSize: '0.875rem',
            color: theme.colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {title}
        </span>
        {icon && (
          <span
            style={{
              fontSize: '1.25rem',
              opacity: 0.8,
            }}
          >
            {icon}
          </span>
        )}
      </div>

      {/* Value */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '8px',
        }}
      >
        <span
          style={{
            fontFamily: theme.fonts.primary,
            fontSize: '2rem',
            fontWeight: 'bold',
            color: accentColor,
          }}
        >
          {value}
        </span>
        {trend && (
          <span
            style={{
              fontFamily: theme.fonts.secondary,
              fontSize: '0.875rem',
              color: trend.isPositive ? theme.colors.success : theme.colors.error,
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            {trend.isPositive ? '↑' : '↓'}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <span
          style={{
            fontFamily: theme.fonts.secondary,
            fontSize: '0.8rem',
            color: theme.colors.textSecondary,
          }}
        >
          {subtitle}
        </span>
      )}
    </div>
  );
};

export default StatsCard;
