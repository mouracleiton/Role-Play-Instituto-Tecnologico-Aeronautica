import React from 'react';
import type { LoadingProgress } from '@ita-rp/shared-types';

interface LoadingProgressProps {
  progress: LoadingProgress;
  showPercentage?: boolean;
  showStage?: boolean;
}

export function CurriculumLoadingProgress({
  progress,
  showPercentage = true,
  showStage = true
}: LoadingProgressProps) {
  const getStageMessage = (stage: string) => {
    switch (stage) {
      case 'discovering':
        return 'Descobrindo disciplinas...';
      case 'loading-metadata':
        return 'Carregando metadados...';
      case 'loading-chunks':
        return 'Carregando conteúdo essencial...';
      case 'complete':
        return 'Currículo carregado!';
      default:
        return 'Carregando...';
    }
  };

  const getProgressPercentage = () => {
    if (progress.total === 0) return 0;
    return Math.round((progress.loaded / progress.total) * 100);
  };

  return (
    <div className="loading-container">
      <div className="loading-header">
        <h3 className="loading-title">Carregando Currículo</h3>
        {showStage && (
          <p className="loading-stage">{getStageMessage(progress.stage)}</p>
        )}
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
        {showPercentage && (
          <span className="progress-percentage">
            {getProgressPercentage()}%
          </span>
        )}
      </div>

      <div className="progress-details">
        <span className="progress-text">
          {progress.loaded} de {progress.total} disciplinas carregadas
        </span>
        {progress.currentFile && (
          <span className="current-file">
            {progress.currentFile}
          </span>
        )}
      </div>
    </div>
  );
}

interface SkeletonLoaderProps {
  lines?: number;
  height?: string;
  className?: string;
}

export function SkeletonLoader({
  lines = 3,
  height = '1rem',
  className = ''
}: SkeletonLoaderProps) {
  return (
    <div className={`skeleton-container ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="skeleton-line"
          style={{
            height: height,
            width: i === lines - 1 ? '60%' : '100%'
          }}
        />
      ))}
    </div>
  );
}

interface DisciplineCardSkeletonProps {
  count?: number;
}

export function DisciplineCardSkeleton({ count = 4 }: DisciplineCardSkeletonProps) {
  return (
    <div className="discipline-grid">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="discipline-card skeleton-card">
          <div className="card-header">
            <div className="skeleton-icon" />
            <SkeletonLoader lines={1} height="1.25rem" />
          </div>
          <div className="card-content">
            <SkeletonLoader lines={2} height="0.875rem" />
            <div className="skeleton-stats" />
          </div>
          <div className="card-footer">
            <SkeletonLoader lines={1} height="2rem" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface SkillCardSkeletonProps {
  count?: number;
}

export function SkillCardSkeleton({ count = 6 }: SkillCardSkeletonProps) {
  return (
    <div className="skills-grid">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skill-card skeleton-card">
          <div className="skill-header">
            <SkeletonLoader lines={1} height="1rem" />
            <div className="skeleton-difficulty" />
          </div>
          <div className="skill-content">
            <SkeletonLoader lines={3} height="0.875rem" />
          </div>
          <div className="skill-footer">
            <SkeletonLoader lines={1} height="1.5rem" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface TopicCardSkeletonProps {
  count?: number;
}

export function TopicCardSkeleton({ count = 3 }: TopicCardSkeletonProps) {
  return (
    <div className="topics-container">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="topic-card skeleton-card">
          <div className="topic-header">
            <SkeletonLoader lines={1} height="1.25rem" />
            <div className="topic-stats">
              <div className="skeleton-badge" />
              <div className="skeleton-badge" />
            </div>
          </div>
          <div className="topic-content">
            <SkeletonLoader lines={2} height="0.875rem" />
          </div>
          <div className="atomic-topics">
            {Array.from({ length: 2 }, (_, j) => (
              <div key={j} className="atomic-topic skeleton">
                <SkeletonLoader lines={1} height="0.75rem" />
                <SkeletonLoader lines={2} height="0.625rem" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface LazyLoadWrapperProps {
  children: React.ReactNode;
  isLoading: boolean;
  error?: string | null;
  skeleton?: React.ReactNode;
  fallback?: React.ReactNode;
  onRetry?: () => void;
}

export function LazyLoadWrapper({
  children,
  isLoading,
  error = null,
  skeleton,
  fallback = <SkeletonLoader />,
  onRetry
}: LazyLoadWrapperProps) {
  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
        </div>
        {onRetry && (
          <button onClick={onRetry} className="retry-button">
            Tentar novamente
          </button>
        )}
      </div>
    );
  }

  if (isLoading) {
    return <>{skeleton || fallback}</>;
  }

  return <>{children}</>;
}

interface InfiniteScrollLoaderProps {
  hasNext: boolean;
  isNextLoading: boolean;
  onLoadMore: () => void;
  children: React.ReactNode;
  loader?: React.ReactNode;
  endMessage?: string;
}

export function InfiniteScrollLoader({
  hasNext,
  isNextLoading,
  onLoadMore,
  children,
  loader = <SkeletonLoader lines={2} />,
  endMessage = 'Todos os itens foram carregados'
}: InfiniteScrollLoaderProps) {
  const observerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasNext && !isNextLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasNext, isNextLoading, onLoadMore]);

  return (
    <div className="infinite-scroll-container">
      {children}
      <div ref={observerRef} className="load-more-trigger">
        {isNextLoading && loader}
        {!hasNext && !isNextLoading && (
          <div className="end-message">{endMessage}</div>
        )}
      </div>
    </div>
  );
}

// Progress ring component for circular progress
interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  size = 60,
  strokeWidth = 4,
  className = '',
  children
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={`progress-ring ${className}`} style={{ width: size, height: size }}>
      <svg
        className="progress-ring-svg"
        width={size}
        height={size}
      >
        <circle
          className="progress-ring-circle-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="progress-ring-circle-progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      {children && (
        <div className="progress-ring-content">
          {children}
        </div>
      )}
    </div>
  );
}

// Shimmer loading effect
export function ShimmerLoader({
  width = '100%',
  height = '1rem',
  className = ''
}: {
  width?: string;
  height?: string;
  className?: string;
}) {
  return (
    <div
      className={`shimmer-loader ${className}`}
      style={{ width, height }}
    />
  );
}

// Loading states for different contexts
export const LoadingStates = {
  // Full page loading
  FullPage: () => (
    <div className="full-page-loading">
      <div className="loading-content">
        <div className="loading-spinner large" />
        <h2>Carregando currículo...</h2>
        <p>Isso pode levar alguns instantes</p>
      </div>
    </div>
  ),

  // Discipline loading
  Discipline: () => (
    <div className="discipline-loading">
      <div className="loading-spinner medium" />
      <span>Carregando disciplina...</span>
    </div>
  ),

  // Skills loading
  Skills: () => (
    <div className="skills-loading">
      <div className="loading-spinner small" />
      <span>Carregando habilidades...</span>
    </div>
  ),

  // Search loading
  Search: () => (
    <div className="search-loading">
      <div className="search-spinner" />
      <span>Buscando...</span>
    </div>
  ),

  // Quick loading spinner
  Spinner: ({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) => (
    <div className={`loading-spinner ${size}`} />
  )
};

export default LoadingStates;