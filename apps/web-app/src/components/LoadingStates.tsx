import React from 'react';
import { LoadingProgress } from '@ita-rp/shared-types';

interface LoadingStatesProps {
  progress: LoadingProgress;
}

export const LoadingStates: React.FC<LoadingStatesProps> = ({ progress }) => {
  return (
    <div className="loading-container">
      <div className="loading-progress">
        <div className="loading-bar" style={{ width: `${progress.percentage}%` }} />
      </div>
      <div className="loading-text">
        {progress.currentItem && <p>Loading: {progress.currentItem}</p>}
        <p>
          {progress.loaded} / {progress.total} ({progress.percentage}%)
        </p>
      </div>
    </div>
  );
};
