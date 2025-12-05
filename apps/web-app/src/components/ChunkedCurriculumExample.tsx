import React, { useState, useEffect } from 'react';
import { chunkedCurriculumService } from '@ita-rp/curriculum';
import { LoadingProgress } from '@ita-rp/shared-types';
import { LoadingStates } from './LoadingStates';

interface TopicCardSkeletonProps {
  count?: number;
}

const TopicCardSkeleton: React.FC<TopicCardSkeletonProps> = ({ count = 1 }) => {
  return (
    <div className="topic-card-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-item">
          <div className="skeleton-title" />
          <div className="skeleton-content" />
        </div>
      ))}
    </div>
  );
};

export const ChunkedCurriculumExample: React.FC = () => {
  const [progress, setProgress] = useState<LoadingProgress>({
    loaded: 0,
    total: 100,
    percentage: 0,
    status: 'loading',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCurriculum = async () => {
      try {
        await chunkedCurriculumService.loadCurriculum();
        setProgress({ loaded: 100, total: 100, percentage: 100, status: 'complete' });
        setIsLoading(false);
      } catch (error) {
        setProgress({ loaded: 0, total: 100, percentage: 0, status: 'error' });
        setIsLoading(false);
      }
    };

    loadCurriculum();
  }, []);

  if (isLoading) {
    return (
      <div>
        <LoadingStates progress={progress} />
        <TopicCardSkeleton count={5} />
      </div>
    );
  }

  return (
    <div>
      <h1>Chunked Curriculum Loaded</h1>
      {/* Render curriculum content here */}
    </div>
  );
};
