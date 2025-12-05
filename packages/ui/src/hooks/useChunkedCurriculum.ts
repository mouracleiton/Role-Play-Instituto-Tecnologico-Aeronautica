import { useState, useEffect, useCallback, useMemo } from 'react';
import { chunkedCurriculumService } from '@ita-rp/curriculum';
import type { CurriculumData, Discipline, SpecificSkill, LoadingProgress } from '@ita-rp/shared-types';

interface UseChunkedCurriculumReturn {
  curriculum: CurriculumData | null;
  isLoading: boolean;
  error: string | null;
  progress: LoadingProgress;
  loadDiscipline: (disciplineId: string) => Promise<Discipline>;
  loadSkill: (skillId: string) => Promise<SpecificSkill>;
  retry: () => void;
}

interface UseDisciplineReturn {
  discipline: Discipline | null;
  isLoading: boolean;
  error: string | null;
  loadDetails: () => Promise<void>;
}

interface UseSkillReturn {
  skill: SpecificSkill | null;
  isLoading: boolean;
  error: string | null;
  loadDetails: () => Promise<void>;
}

export function useChunkedCurriculum(): UseChunkedCurriculumReturn {
  const [curriculum, setCurriculum] = useState<CurriculumData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<LoadingProgress>({
    loaded: 0,
    total: 0,
    stage: 'discovering'
  });

  const loadCurriculum = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setProgress({ loaded: 0, total: 0, stage: 'discovering' });

    try {
      // Subscribe to progress updates
      const unsubscribe = chunkedCurriculumService.subscribeToProgress(setProgress);

      const data = await chunkedCurriculumService.loadCurriculum();
      setCurriculum(data);

      unsubscribe();
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar currículo');
      setIsLoading(false);
    }
  }, []);

  const loadDiscipline = useCallback(async (disciplineId: string): Promise<Discipline> => {
    try {
      return await chunkedCurriculumService.loadDiscipline(disciplineId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Falha ao carregar disciplina';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const loadSkill = useCallback(async (skillId: string): Promise<SpecificSkill> => {
    try {
      return await chunkedCurriculumService.loadSkill(skillId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Falha ao carregar habilidade';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const retry = useCallback(() => {
    loadCurriculum();
  }, [loadCurriculum]);

  useEffect(() => {
    loadCurriculum();
  }, [loadCurriculum]);

  return {
    curriculum,
    isLoading,
    error,
    progress,
    loadDiscipline,
    loadSkill,
    retry
  };
}

export function useDiscipline(disciplineId: string | null): UseDisciplineReturn {
  const [discipline, setDiscipline] = useState<Discipline | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    if (!disciplineId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await chunkedCurriculumService.loadDiscipline(disciplineId);
      setDiscipline(data);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar disciplina');
      setIsLoading(false);
    }
  }, [disciplineId]);

  useEffect(() => {
    if (disciplineId) {
      loadDetails();
    } else {
      setDiscipline(null);
      setError(null);
      setIsLoading(false);
    }
  }, [disciplineId, loadDetails]);

  return {
    discipline,
    isLoading,
    error,
    loadDetails
  };
}

export function useSkill(skillId: string | null): UseSkillReturn {
  const [skill, setSkill] = useState<SpecificSkill | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    if (!skillId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await chunkedCurriculumService.loadSkill(skillId);
      setSkill(data);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar habilidade');
      setIsLoading(false);
    }
  }, [skillId]);

  useEffect(() => {
    if (skillId) {
      loadDetails();
    } else {
      setSkill(null);
      setError(null);
      setIsLoading(false);
    }
  }, [skillId, loadDetails]);

  return {
    skill,
    isLoading,
    error,
    loadDetails
  };
}

// Hook for batch loading multiple disciplines
export function useMultipleDisciplines(disciplineIds: string[]): {
  disciplines: Map<string, Discipline>;
  isLoading: boolean;
  errors: Map<string, string>;
  loadAll: () => Promise<void>;
  loadDiscipline: (id: string) => Promise<void>;
} {
  const [disciplines, setDisciplines] = useState<Map<string, Discipline>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Map<string, string>>(new Map());

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setErrors(new Map());

    const loadPromises = disciplineIds.map(async (id) => {
      try {
        const discipline = await chunkedCurriculumService.loadDiscipline(id);
        return { id, discipline, error: null };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Falha ao carregar';
        return { id, discipline: null, error: errorMessage };
      }
    });

    const results = await Promise.allSettled(loadPromises);

    const newDisciplines = new Map<string, Discipline>();
    const newErrors = new Map<string, string>();

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { id, discipline, error } = result.value;
        if (discipline) {
          newDisciplines.set(id, discipline);
        }
        if (error) {
          newErrors.set(id, error);
        }
      }
    });

    setDisciplines(newDisciplines);
    setErrors(newErrors);
    setIsLoading(false);
  }, [disciplineIds]);

  const loadDiscipline = useCallback(async (id: string) => {
    try {
      const discipline = await chunkedCurriculumService.loadDiscipline(id);
      setDisciplines(prev => new Map(prev).set(id, discipline));
      setErrors(prev => {
        const newErrors = new Map(prev);
        newErrors.delete(id);
        return newErrors;
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Falha ao carregar';
      setErrors(prev => new Map(prev).set(id, errorMessage));
    }
  }, []);

  return {
    disciplines,
    isLoading,
    errors,
    loadAll,
    loadDiscipline
  };
}

// Hook for prefetching data
export function usePrefetch() {
  const prefetchDiscipline = useCallback(async (disciplineId: string) => {
    // Start loading discipline in background without showing loading states
    try {
      await chunkedCurriculumService.loadDiscipline(disciplineId);
    } catch (err) {
      // Silently fail prefetches
      console.warn(`Failed to prefetch discipline ${disciplineId}:`, err);
    }
  }, []);

  const prefetchSkill = useCallback(async (skillId: string) => {
    try {
      await chunkedCurriculumService.loadSkill(skillId);
    } catch (err) {
      console.warn(`Failed to prefetch skill ${skillId}:`, err);
    }
  }, []);

  const prefetchMultiple = useCallback(async (disciplineIds: string[], skillIds: string[] = []) => {
    const promises = [
      ...disciplineIds.map(id => prefetchDiscipline(id)),
      ...skillIds.map(id => prefetchSkill(id))
    ];

    await Promise.allSettled(promises);
  }, [prefetchDiscipline, prefetchSkill]);

  return {
    prefetchDiscipline,
    prefetchSkill,
    prefetchMultiple
  };
}

// Hook for curriculum search with lazy loading
export function useCurriculumSearch() {
  const [searchResults, setSearchResults] = useState<{
    disciplines: Discipline[];
    skills: SpecificSkill[];
  }>({ disciplines: [], skills: [] });
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults({ disciplines: [], skills: [] });
      return;
    }

    setIsSearching(true);

    try {
      // For now, implement basic search
      // This could be enhanced with server-side search
      const curriculum = await chunkedCurriculumService.loadCurriculum();
      const lowerQuery = query.toLowerCase();

      const disciplines: Discipline[] = [];
      const skills: SpecificSkill[] = [];

      // Search through areas and disciplines
      curriculum.curriculumData.areas?.forEach(area => {
        area.disciplines?.forEach(discipline => {
          if (discipline.name.toLowerCase().includes(lowerQuery) ||
              discipline.description.toLowerCase().includes(lowerQuery)) {
            disciplines.push(discipline);
          }

          // Search in skills if discipline matches or if dedicated skill search
          discipline.mainTopics?.forEach(topic => {
            topic.atomicTopics?.forEach(atomicTopic => {
              atomicTopic.individualConcepts?.forEach(concept => {
                concept.specificSkills?.forEach(skill => {
                  if (skill.name.toLowerCase().includes(lowerQuery) ||
                      skill.description.toLowerCase().includes(lowerQuery)) {
                    skills.push(skill);
                  }
                });
              });
            });
          });
        });
      });

      setSearchResults({ disciplines, skills });
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults({ disciplines: [], skills: [] });
    } finally {
      setIsSearching(false);
    }
  }, []);

  return {
    searchResults,
    isSearching,
    search
  };
}