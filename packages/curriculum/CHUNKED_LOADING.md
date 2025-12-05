# Chunked Curriculum Loading System

This document describes the new chunked curriculum loading system designed to handle large JSON files efficiently while providing a smooth user experience.

## Overview

The chunked loading system addresses performance issues with large curriculum files (3-4MB each) by implementing:

- **Lazy Loading**: Load only essential data initially
- **On-Demand Loading**: Load detailed content when users request it
- **Progress Tracking**: Show loading progress to users
- **Error Handling**: Graceful degradation when files fail to load
- **Prefetching**: Smart background loading of likely-to-be-accessed content

## Architecture

### Core Components

1. **ChunkedCurriculumService** (`ChunkedCurriculumService.ts`)
   - Main service for managing chunked curriculum data
   - Handles metadata discovery and lazy loading
   - Manages caching and progress tracking

2. **React Hooks** (`useChunkedCurriculum.ts`)
   - `useChunkedCurriculum()`: Main hook for curriculum loading
   - `useDiscipline()`: Lazy loading of individual disciplines
   - `useSkill()`: Lazy loading of individual skills
   - `useMultipleDisciplines()`: Batch loading
   - `usePrefetch()`: Background prefetching
   - `useCurriculumSearch()`: Search functionality

3. **Loading Components** (`LoadingStates.tsx`)
   - Progress indicators and skeleton loaders
   - Error states and retry mechanisms
   - Different loading states for various contexts

## Usage Examples

### Basic Curriculum Loading

```tsx
import { useChunkedCurriculum } from '@ita-rp/ui/hooks/useChunkedCurriculum';
import { CurriculumLoadingProgress } from '@ita-rp/ui/components/LoadingStates';

function CurriculumApp() {
  const {
    curriculum,
    isLoading,
    error,
    progress,
    loadDiscipline,
    loadSkill,
    retry
  } = useChunkedCurriculum();

  if (error) {
    return (
      <div>
        <h2>Erro ao carregar currículo</h2>
        <p>{error}</p>
        <button onClick={retry}>Tentar novamente</button>
      </div>
    );
  }

  if (isLoading) {
    return <CurriculumLoadingProgress progress={progress} />;
  }

  return (
    <div>
      <h1>Currículo ITA</h1>
      <AreasList areas={curriculum.curriculumData.areas} />
    </div>
  );
}
```

### Lazy Loading Disciplines

```tsx
import { useDiscipline } from '@ita-rp/ui/hooks/useChunkedCurriculum';
import { LazyLoadWrapper, DisciplineCardSkeleton } from '@ita-rp/ui/components/LoadingStates';

function DisciplineCard({ disciplineId }: { disciplineId: string }) {
  const { discipline, isLoading, error, loadDetails } = useDiscipline(disciplineId);

  const handleClick = async () => {
    if (!discipline && !isLoading) {
      await loadDetails();
    }
  };

  return (
    <div onClick={handleClick}>
      <LazyLoadWrapper
        isLoading={isLoading}
        error={error}
        skeleton={<DisciplineCardSkeleton />}
        onRetry={loadDetails}
      >
        {discipline && (
          <div>
            <h3>{discipline.name}</h3>
            <p>{discipline.description}</p>
            <p>{discipline.totalSkills} habilidades</p>
          </div>
        )}
      </LazyLoadWrapper>
    </div>
  );
}
```

### Prefetching for Performance

```tsx
import { usePrefetch } from '@ita-rp/ui/hooks/useChunkedCurriculum';

function DisciplineList({ disciplines }) {
  const { prefetchDiscipline, prefetchMultiple } = usePrefetch();

  // Prefetch when hovering
  const handleMouseEnter = (disciplineIds: string[]) => {
    prefetchMultiple(disciplineIds);
  };

  return (
    <div>
      {disciplines.map(area => (
        <div
          key={area.id}
          onMouseEnter={() => handleMouseEnter(area.disciplines.map(d => d.id))}
        >
          <h2>{area.name}</h2>
          {area.disciplines.map(discipline => (
            <DisciplineCard key={discipline.id} disciplineId={discipline.id} />
          ))}
        </div>
      ))}
    </div>
  );
}
```

## File Structure

### Large Files Handling

Files larger than 1MB are automatically treated as "chunked" and handled specially:

```typescript
// Automatic detection in ChunkedCurriculumService
if (fileSize > 1024 * 1024) {
  return {
    id: `${disciplineCode}.1`,
    name: filename.split(' - ').slice(2).join(' - ').replace('.json', ''),
    description: `Disciplina ${disciplineCode} - Carregamento dinâmico`,
    isChunked: true,
    chunks: this.generateChunkList(disciplineCode)
  };
}
```

### Progress Tracking

The loading system provides detailed progress information:

```typescript
interface LoadingProgress {
  loaded: number;      // Number of items loaded
  total: number;       // Total number of items
  currentFile?: string; // Currently loading file
  stage: 'discovering' | 'loading-metadata' | 'loading-chunks' | 'complete';
}
```

## Performance Optimizations

### 1. Metadata-First Loading
- Load only discipline metadata initially
- Detailed content loaded on-demand
- Fast initial page load

### 2. Smart Caching
- In-memory caching of loaded content
- Avoids redundant network requests
- Maintains cache consistency

### 3. Prefetching Strategy
- Hover-based prefetching
- Batch loading for related content
- Background loading with error resilience

### 4. Error Recovery
- Graceful degradation
- Retry mechanisms
- Partial loading support

## Migration Guide

### From Original Service

Replace:

```typescript
import { curriculumService } from '@ita-rp/curriculum';

// Old way
const curriculum = await curriculumService.loadCurriculum();
const discipline = await curriculumService.loadDiscipline(disciplineId);
```

With:

```typescript
import { useChunkedCurriculum, useDiscipline } from '@ita-rp/ui/hooks/useChunkedCurriculum';

// New way - using hooks
const { curriculum, isLoading, error } = useChunkedCurriculum();
const { discipline: detailedDiscipline } = useDiscipline(disciplineId);

// Or direct service usage
import { chunkedCurriculumService } from '@ita-rp/curriculum';
const curriculum = await chunkedCurriculumService.loadCurriculum();
```

### Component Updates

1. **Add Loading States**: Use `LazyLoadWrapper` for smooth transitions
2. **Handle Errors**: Implement retry mechanisms
3. **Show Progress**: Use `CurriculumLoadingProgress` for initial load
4. **Add Prefetching**: Use `usePrefetch` for better UX

## Configuration

### File Size Limits

Default limits can be adjusted in `ChunkedCurriculumService.ts`:

```typescript
private async loadDisciplineMetadata(filename: string) {
  const fileSize = parseInt(headResponse.headers.get('content-length') || '0', 10);

  // Files larger than 1MB are chunked
  if (fileSize > 1024 * 1024) {
    // Handle as chunked
  }
}
```

### Timeout Settings

Adjust timeout values based on your environment:

```typescript
const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds
```

## CSS Classes

The system includes comprehensive CSS for loading states. Import in your main application:

```css
@import '@ita-rp/ui/components/LoadingStates.css';
```

Key classes:
- `.loading-container`: Main loading container
- `.progress-bar`: Progress indicator
- `.skeleton-*`: Skeleton loader variants
- `.error-container`: Error state styling
- `.discipline-card`: Discipline card styling

## Best Practices

1. **Use Hooks**: Prefer React hooks over direct service calls
2. **Handle Loading States**: Always show loading indicators
3. **Implement Error Boundaries**: Catch and handle loading errors gracefully
4. **Prefetch Strategically**: Prefetch likely-to-be-accessed content
5. **Monitor Performance**: Use the progress callbacks to track loading performance
6. **Test Error Scenarios**: Ensure your app handles network failures gracefully

## Troubleshooting

### Common Issues

1. **Large Files Not Loading**: Check file size limits and timeout settings
2. **Memory Issues**: Monitor browser memory usage with large datasets
3. **Slow Performance**: Implement more aggressive prefetching or chunking
4. **Caching Problems**: Clear cache or implement cache invalidation

### Debug Mode

Enable debug logging:

```typescript
console.log('[ChunkedCurriculumService] Loading progress:', progress);
```

## Future Enhancements

1. **Service Worker Integration**: Offline support and caching
2. **Web Workers**: Background processing for large datasets
3. **Streaming**: Progressive loading of very large files
4. **Compression**: Server-side compression for smaller transfers
5. **CDN Integration**: Distribute large files across CDN

## Examples

See `ChunkedCurriculumExample.tsx` for complete implementation examples including:

- Main curriculum loading with progress
- Discipline cards with lazy loading
- Topic expansion with skill details
- Search functionality
- Error handling and retry mechanisms