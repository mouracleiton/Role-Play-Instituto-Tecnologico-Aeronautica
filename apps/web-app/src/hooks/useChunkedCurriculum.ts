import { useState, useEffect } from 'react';
import { chunkedCurriculumService } from '@ita-rp/curriculum';
import {
  LoadingProgress,
  CurriculumData,
  Area,
  Discipline,
  MainTopic,
  AtomicTopic,
  IndividualConcept,
  SpecificSkill,
} from '@ita-rp/shared-types';

interface UseChunkedCurriculumReturn {
  curriculum: CurriculumData | null;
  progress: LoadingProgress;
  isLoading: boolean;
  error: string | null;
  loadCurriculum: () => Promise<void>;
  getArea: (areaId: string) => Area | undefined;
  getDiscipline: (disciplineId: string) => Discipline | undefined;
  getTopic: (topicId: string) => MainTopic | undefined;
  getAtomicTopic: (atomicTopicId: string) => AtomicTopic | undefined;
  getConcept: (conceptId: string) => IndividualConcept | undefined;
  getSkill: (skillId: string) => SpecificSkill | undefined;
}

export const useChunkedCurriculum = (): UseChunkedCurriculumReturn => {
  const [curriculum, setCurriculum] = useState<CurriculumData | null>(null);
  const [progress, setProgress] = useState<LoadingProgress>({
    loaded: 0,
    total: 100,
    percentage: 0,
    status: 'loading',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCurriculum = async () => {
    setIsLoading(true);
    setError(null);
    setProgress({ loaded: 0, total: 100, percentage: 0, status: 'loading' });

    try {
      const data = await chunkedCurriculumService.loadCurriculum();
      setCurriculum(data);
      setProgress({ loaded: 100, total: 100, percentage: 100, status: 'complete' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setProgress({ loaded: 0, total: 100, percentage: 0, status: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const getArea = (areaId: string): Area | undefined => {
    return curriculum?.curriculumData.areas?.find((area: Area) => area.id === areaId);
  };

  const getDiscipline = (disciplineId: string): Discipline | undefined => {
    for (const area of curriculum?.curriculumData.areas || []) {
      const discipline = area.disciplines?.find((d: Discipline) => d.id === disciplineId);
      if (discipline) return discipline;
    }
    return undefined;
  };

  const getTopic = (topicId: string): MainTopic | undefined => {
    for (const area of curriculum?.curriculumData.areas || []) {
      for (const discipline of area.disciplines || []) {
        const topic = discipline.mainTopics?.find((t: MainTopic) => t.id === topicId);
        if (topic) return topic;
      }
    }
    return undefined;
  };

  const getAtomicTopic = (atomicTopicId: string): AtomicTopic | undefined => {
    for (const area of curriculum?.curriculumData.areas || []) {
      for (const discipline of area.disciplines || []) {
        for (const topic of discipline.mainTopics || []) {
          const atomicTopic = topic.atomicTopics?.find(
            (at: AtomicTopic) => at.id === atomicTopicId
          );
          if (atomicTopic) return atomicTopic;
        }
      }
    }
    return undefined;
  };

  const getConcept = (conceptId: string): IndividualConcept | undefined => {
    for (const area of curriculum?.curriculumData.areas || []) {
      for (const discipline of area.disciplines || []) {
        for (const topic of discipline.mainTopics || []) {
          for (const atomicTopic of topic.atomicTopics || []) {
            const concept = atomicTopic.individualConcepts?.find(
              (c: IndividualConcept) => c.id === conceptId
            );
            if (concept) return concept;
          }
        }
      }
    }
    return undefined;
  };

  const getSkill = (skillId: string): SpecificSkill | undefined => {
    for (const area of curriculum?.curriculumData.areas || []) {
      for (const discipline of area.disciplines || []) {
        for (const topic of discipline.mainTopics || []) {
          for (const atomicTopic of topic.atomicTopics || []) {
            for (const concept of atomicTopic.individualConcepts || []) {
              const skill = concept.specificSkills?.find((s: SpecificSkill) => s.id === skillId);
              if (skill) return skill;
            }
            // Also check direct skills on atomicTopic
            const skill = (atomicTopic as any).specificSkills?.find(
              (s: SpecificSkill) => s.id === skillId
            );
            if (skill) return skill;
          }
        }
      }
    }
    return undefined;
  };

  useEffect(() => {
    if (!curriculum && !isLoading) {
      loadCurriculum();
    }
  }, [curriculum, isLoading]);

  return {
    curriculum,
    progress,
    isLoading,
    error,
    loadCurriculum,
    getArea,
    getDiscipline,
    getTopic,
    getAtomicTopic,
    getConcept,
    getSkill,
  };
};
