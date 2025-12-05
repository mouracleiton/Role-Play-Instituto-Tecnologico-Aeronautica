import { useState, useEffect, useCallback, useMemo } from 'react';
import { curriculumService } from './CurriculumService';
import type { CurriculumData, Discipline, SpecificSkill } from '@ita-rp/shared-types';

interface UseCurriculumReturn {
  curriculum: CurriculumData | null;
  disciplines: Discipline[];
  isLoading: boolean;
  error: string | null;
  loadCurriculum: () => Promise<void>;
  refreshCurriculum: () => Promise<void>;
  getSkillsForDiscipline: (disciplineId: string) => SpecificSkill[];
  getFormattedDisciplines: () => ReturnType<typeof curriculumService.getFormattedDisciplines>;
  getFormattedSkills: (disciplineId: string) => ReturnType<typeof curriculumService.getFormattedSkillsForDiscipline>;
  searchSkills: (query: string) => SpecificSkill[];
  getSkill: (skillId: string) => SpecificSkill | undefined;
}

export function useCurriculum(): UseCurriculumReturn {
  const [curriculum, setCurriculum] = useState<CurriculumData | null>(null);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCurriculum = useCallback(async () => {
    if (curriculumService.isLoaded()) {
      // Re-ensure the curriculum is loaded and caches are populated
      try {
        const data = await curriculumService.loadCurriculum();
        setCurriculum(data);
        setDisciplines(curriculumService.getAllDisciplines());
      } catch (err) {
        // If load fails after isLoaded, fallback to setting states with available data
        setDisciplines(curriculumService.getAllDisciplines());
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await curriculumService.loadCurriculum();
      setCurriculum(data);
      setDisciplines(curriculumService.getAllDisciplines());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load curriculum');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurriculum();
  }, [loadCurriculum]);

  // Add a global refresh method that can be called to reload curriculum
  const refreshCurriculum = useCallback(async () => {
    curriculumService.clearCache();
    await loadCurriculum();
  }, [loadCurriculum]);

  // Make refresh available globally for debugging
  if (typeof window !== 'undefined') {
    (window as any).refreshCurriculum = refreshCurriculum;
  }

  const getSkillsForDiscipline = useCallback((disciplineId: string): SpecificSkill[] => {
    return curriculumService.getSkillsByDiscipline(disciplineId);
  }, []);

  const getFormattedDisciplines = useCallback(() => {
    return curriculumService.getFormattedDisciplines();
  }, []);

  const getFormattedSkills = useCallback((disciplineId: string) => {
    return curriculumService.getFormattedSkillsForDiscipline(disciplineId);
  }, []);

  const searchSkills = useCallback((query: string): SpecificSkill[] => {
    return curriculumService.searchSkills(query);
  }, []);

  const getSkill = useCallback((skillId: string): SpecificSkill | undefined => {
    try {
      const allSkills = curriculumService.getAllSkills();
      return allSkills.find(s => s.id === skillId);
    } catch {
      return undefined;
    }
  }, []);

  return useMemo(() => ({
    curriculum,
    disciplines,
    isLoading,
    error,
    loadCurriculum,
    getSkillsForDiscipline,
    getFormattedDisciplines,
    getFormattedSkills,
    searchSkills,
    getSkill,
    refreshCurriculum,
  }), [
    curriculum,
    disciplines,
    isLoading,
    error,
    loadCurriculum,
    getSkillsForDiscipline,
    getFormattedDisciplines,
    getFormattedSkills,
    searchSkills,
    getSkill,
    refreshCurriculum,
  ]);
}
