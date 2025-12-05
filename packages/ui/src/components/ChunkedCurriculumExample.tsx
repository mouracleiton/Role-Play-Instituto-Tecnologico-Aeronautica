import React from 'react';
import {
  useChunkedCurriculum,
  useDiscipline,
  useSkill,
  useMultipleDisciplines,
  usePrefetch,
  useCurriculumSearch
} from '../hooks/useChunkedCurriculum';
import {
  CurriculumLoadingProgress,
  LazyLoadWrapper,
  DisciplineCardSkeleton,
  SkillCardSkeleton,
  LoadingStates
} from './LoadingStates';
import type { Discipline, SpecificSkill } from '@ita-rp/shared-types';

// Main curriculum component with chunked loading
export function ChunkedCurriculumExample() {
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
      <div className="error-container">
        <h2>Erro ao Carregar Currículo</h2>
        <p>{error}</p>
        <button onClick={retry} className="retry-button">
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <CurriculumLoadingProgress progress={progress} />
      </div>
    );
  }

  if (!curriculum) {
    return null;
  }

  return (
    <div className="curriculum-container">
      <header className="curriculum-header">
        <h1>Currículo ITA</h1>
        <p>{curriculum.curriculumData.metadata.institution}</p>
        <p>Total de Habilidades: {curriculum.curriculumData.metadata.totalAtomicSkills}</p>
      </header>

      <AreasList areas={curriculum.curriculumData.areas} />
    </div>
  );
}

// Component to display areas and disciplines
function AreasList({ areas }: { areas: any[] }) {
  const { prefetchDiscipline, prefetchMultiple } = usePrefetch();

  // Prefetch disciplines when mouse hovers over area
  const handleAreaHover = (area: any) => {
    const disciplineIds = area.disciplines.map((d: any) => d.id);
    prefetchMultiple(disciplineIds);
  };

  return (
    <div className="areas-container">
      {areas.map(area => (
        <div
          key={area.id}
          className="area-section"
          onMouseEnter={() => handleAreaHover(area)}
        >
          <h2 className="area-title">{area.name}</h2>
          <p className="area-description">{area.description}</p>
          <div className="disciplines-grid">
            {area.disciplines.map((discipline: any) => (
              <DisciplineCard
                key={discipline.id}
                discipline={discipline}
                onLoadDetails={() => {/* Details loaded on demand */}}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Individual discipline card with lazy loading
function DisciplineCard({
  discipline,
  onLoadDetails
}: {
  discipline: any;
  onLoadDetails: () => void;
}) {
  const { discipline: fullDiscipline, isLoading, error, loadDetails } = useDiscipline(discipline.id);

  const handleCardClick = async () => {
    if (!fullDiscipline && !isLoading) {
      await loadDetails();
      onLoadDetails();
    }
  };

  const getAreaIcon = (disciplineId: string) => {
    const prefix = disciplineId.split('-')[0]?.split('.')[1] || 'default';
    const iconMap: Record<string, string> = {
      'AT': '📐', 'CI': '💻', 'DI': '🏗️', 'EA': '✈️', 'EB': '⚙️',
      'ED': '📊', 'EO': '🏔️', 'ES': '🔧', 'IS': '🔬', 'MC': '📈',
      'MT': '🔧', 'PD': '📋', 'PG': '📐', 'PP': '🏭', 'PS': '🔄',
      'RA': '🛫', 'RJ': '🚀', 'RP': '⚡', 'SC': '💻', 'SI': '🌐',
      'SP': '🛰️', 'ST': '🏗️', 'TC': '🧮', 'TM': '🔬', 'TP': '⚙️',
      'UI': '🧪', 'UM': '📖', 'VO': '✈️', 'XT': '🎓'
    };
    return iconMap[prefix] || '📚';
  };

  const getAreaColor = (disciplineId: string) => {
    const prefix = disciplineId.split('-')[0]?.split('.')[1] || 'default';
    const colorMap: Record<string, string> = {
      'AT': '#ef4444', 'CI': '#3b82f6', 'DI': '#10b981', 'EA': '#8b5cf6',
      'EB': '#f59e0b', 'ED': '#14b8a6', 'EO': '#22c55e', 'ES': '#06b6d4',
      'IS': '#f97316', 'MC': '#ec4899', 'MT': '#84cc16', 'PD': '#6366f1',
      'PG': '#a855f7', 'PP': '#14b8a6', 'PS': '#f59e0b', 'RA': '#8b5cf6',
      'RJ': '#3b82f6', 'RP': '#ef4444', 'SC': '#22c55e', 'SI': '#06b6d4',
      'SP': '#f59e0b', 'ST': '#10b981', 'TC': '#f97316', 'TM': '#84cc16',
      'TP': '#6366f1', 'UI': '#ec4899', 'UM': '#a855f7', 'VO': '#3b82f6',
      'XT': '#14b8a6'
    };
    return colorMap[prefix] || '#6b7280';
  };

  if (error) {
    return (
      <div className="discipline-card error" onClick={handleCardClick}>
        <div className="card-header">
          <span className="card-icon">❌</span>
          <h3>{discipline.name}</h3>
        </div>
        <div className="card-error">
          <p>Erro ao carregar detalhes</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`discipline-card ${fullDiscipline ? 'loaded' : 'loading'}`}
      onClick={handleCardClick}
      style={{ borderColor: getAreaColor(discipline.id) }}
    >
      <div className="card-header">
        <span className="card-icon" style={{ color: getAreaColor(discipline.id) }}>
          {getAreaIcon(discipline.id)}
        </span>
        <h3>{discipline.name}</h3>
        {discipline.isChunked && (
          <span className="chunked-badge" title="Carregamento dinâmico">
            📦
          </span>
        )}
      </div>
      <div className="card-content">
        <p>{discipline.description}</p>
        <div className="card-stats">
          <span className="stat-item">
            📊 {discipline.totalSkills} habilidades
          </span>
          {fullDiscipline && (
            <span className="stat-item">
              📚 {fullDiscipline.mainTopics?.length || 0} tópicos
            </span>
          )}
        </div>
      </div>
      <LazyLoadWrapper
        isLoading={isLoading}
        skeleton={<DisciplineCardSkeleton count={1} />}
      >
        {fullDiscipline && (
          <div className="card-details">
            <div className="topics-preview">
              <h4>Tópicos Principais:</h4>
              <ul>
                {fullDiscipline.mainTopics?.slice(0, 3).map((topic: any) => (
                  <li key={topic.id}>{topic.name}</li>
                ))}
                {(fullDiscipline.mainTopics?.length || 0) > 3 && (
                  <li className="more-topics">
                    ... e mais {fullDiscipline.mainTopics.length - 3} tópicos
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}
      </LazyLoadWrapper>
    </div>
  );
}

// Component for displaying discipline details with skills
export function DisciplineDetails({ disciplineId }: { disciplineId: string }) {
  const { discipline, isLoading, error, loadDetails } = useDiscipline(disciplineId);

  if (error) {
    return (
      <div className="discipline-details error">
        <h3>Erro ao carregar disciplina</h3>
        <p>{error}</p>
        <button onClick={loadDetails}>Tentar novamente</button>
      </div>
    );
  }

  if (isLoading || !discipline) {
    return (
      <div className="discipline-details loading">
        <LoadingStates.Discipline />
        <TopicCardSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="discipline-details">
      <header className="discipline-header">
        <h2>{discipline.name}</h2>
        <p>{discipline.description}</p>
        <div className="discipline-stats">
          <span>📚 {discipline.mainTopics?.length || 0} tópicos</span>
          <span>📊 {discipline.totalSkills} habilidades</span>
        </div>
      </header>

      <div className="topics-container">
        {discipline.mainTopics?.map(topic => (
          <TopicCard key={topic.id} topic={topic} disciplineId={disciplineId} />
        ))}
      </div>
    </div>
  );
}

// Topic card with lazy-loaded skills
function TopicCard({ topic, disciplineId }: { topic: any; disciplineId: string }) {
  const [showSkills, setShowSkills] = React.useState(false);
  const { prefetchMultiple } = usePrefetch();

  const handleShowSkills = async () => {
    if (!showSkills) {
      // Prefetch skills when expanding
      const skillIds: string[] = [];
      topic.atomicTopics?.forEach((atomicTopic: any) => {
        atomicTopic.individualConcepts?.forEach((concept: any) => {
          concept.specificSkills?.forEach((skill: any) => {
            skillIds.push(skill.id);
          });
        });
      });
      prefetchMultiple([], skillIds);
    }
    setShowSkills(!showSkills);
  };

  return (
    <div className="topic-card">
      <div className="topic-header">
        <h3>{topic.name}</h3>
        <div className="topic-stats">
          <span className="stat-badge">
            📋 {topic.atomicTopics?.length || 0} tópicos atômicos
          </span>
          <span className="stat-badge">
            🎯 {topic.totalSkills || 0} habilidades
          </span>
        </div>
      </div>
      <p>{topic.description}</p>

      {topic.atomicTopics && (
        <div className="atomic-topics">
          {topic.atomicTopics.map((atomicTopic: any) => (
            <AtomicTopic
              key={atomicTopic.id}
              atomicTopic={atomicTopic}
              showSkills={showSkills}
            />
          ))}
        </div>
      )}

      <button
        className="expand-button"
        onClick={handleShowSkills}
      >
        {showSkills ? 'Ocultar habilidades ▲' : 'Mostrar habilidades ▼'}
      </button>
    </div>
  );
}

// Atomic topic component with lazy-loaded skills
function AtomicTopic({
  atomicTopic,
  showSkills
}: {
  atomicTopic: any;
  showSkills: boolean;
}) {
  const [skills, setSkills] = React.useState<SpecificSkill[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = React.useState(false);

  React.useEffect(() => {
    if (showSkills && skills.length === 0) {
      loadSkills();
    }
  }, [showSkills]);

  const loadSkills = async () => {
    setIsLoadingSkills(true);
    try {
      // Extract skill IDs from the atomic topic
      const skillIds: string[] = [];
      atomicTopic.individualConcepts?.forEach((concept: any) => {
        concept.specificSkills?.forEach((skill: any) => {
          skillIds.push(skill.id);
        });
      });

      // Load skills using the chunked service
      const { chunkedCurriculumService } = await import('@ita-rp/curriculum');
      const loadedSkills = await Promise.all(
        skillIds.map(id => chunkedCurriculumService.loadSkill(id))
      );
      setSkills(loadedSkills);
    } catch (error) {
      console.error('Failed to load skills:', error);
    } finally {
      setIsLoadingSkills(false);
    }
  };

  return (
    <div className="atomic-topic">
      <h4>{atomicTopic.name}</h4>
      <p>{atomicTopic.description}</p>

      {showSkills && (
        <LazyLoadWrapper
          isLoading={isLoadingSkills}
          skeleton={<SkillCardSkeleton count={3} />}
        >
          {skills.length > 0 && (
            <div className="skills-list">
              <h5>Habilidades Específicas:</h5>
              {skills.map(skill => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>
          )}
        </LazyLoadWrapper>
      )}
    </div>
  );
}

// Individual skill card
function SkillCard({ skill }: { skill: SpecificSkill }) {
  const [showDetails, setShowDetails] = React.useState(false);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#22c55e';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="skill-card">
      <div className="skill-header">
        <h6>{skill.name}</h6>
        <span
          className="difficulty-badge"
          style={{ backgroundColor: getDifficultyColor(skill.difficulty || 'beginner') }}
        >
          {skill.difficulty || 'beginner'}
        </span>
      </div>
      <p>{skill.description}</p>
      {showDetails && skill.atomicExpansion && (
        <div className="skill-details">
          <div className="skill-steps">
            <strong>Passos:</strong>
            <ol>
              {skill.atomicExpansion.steps?.map((step: any, index: number) => (
                <li key={index}>
                  <strong>{step.title}</strong>
                  {step.subSteps && (
                    <ul>
                      {step.subSteps.map((subStep: string, subIndex: number) => (
                        <li key={subIndex}>{subStep}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </div>
          {skill.atomicExpansion.practicalExample && (
            <div className="skill-example">
              <strong>Exemplo prático:</strong>
              <p>{skill.atomicExpansion.practicalExample}</p>
            </div>
          )}
        </div>
      )}
      <button
        className="skill-expand-button"
        onClick={() => setShowDetails(!showDetails)}
      >
        {showDetails ? 'Ocultar detalhes ▲' : 'Mostrar detalhes ▼'}
      </button>
    </div>
  );
}

// Search component using chunked curriculum
export function CurriculumSearch() {
  const [query, setQuery] = React.useState('');
  const { searchResults, isSearching, search } = useCurriculumSearch();

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      search(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, search]);

  return (
    <div className="search-container">
      <div className="search-input-container">
        <input
          type="text"
          placeholder="Buscar disciplinas e habilidades..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        {isSearching && <LoadingStates.Search />}
      </div>

      {query && (
        <div className="search-results">
          {searchResults.disciplines.length > 0 && (
            <div className="search-section">
              <h3>Disciplinas ({searchResults.disciplines.length})</h3>
              <div className="search-disciplines">
                {searchResults.disciplines.map(discipline => (
                  <DisciplineCard
                    key={discipline.id}
                    discipline={discipline}
                    onLoadDetails={() => {}}
                  />
                ))}
              </div>
            </div>
          )}

          {searchResults.skills.length > 0 && (
            <div className="search-section">
              <h3>Habilidades ({searchResults.skills.length})</h3>
              <div className="search-skills">
                {searchResults.skills.map(skill => (
                  <SkillCard key={skill.id} skill={skill} />
                ))}
              </div>
            </div>
          )}

          {searchResults.disciplines.length === 0 && searchResults.skills.length === 0 && !isSearching && (
            <div className="no-results">
              <p>Nenhum resultado encontrado para "{query}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ChunkedCurriculumExample;