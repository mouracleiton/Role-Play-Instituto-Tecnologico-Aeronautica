import React, { useState, useEffect, useMemo } from 'react';
import {
  useTheme,
  Card,
  Text,
  Button,
  DisciplineCard,
  SkillCard,
  ProgressBar,
  type DisciplineData,
  type SkillData,
} from '@ita-rp/ui-components';
import { useCurriculum } from '@ita-rp/curriculum';

interface DisciplinesPageProps {
  completedSkillIds: string[];
  onStartSkill: (skillId: string, disciplineId: string) => void;
}

export const DisciplinesPage: React.FC<DisciplinesPageProps> = ({
  completedSkillIds,
  onStartSkill,
}) => {
  const { currentTheme } = useTheme();
  const { isLoading, error, getFormattedDisciplines, getFormattedSkills, refreshCurriculum } = useCurriculum();
  const [selectedDiscipline, setSelectedDiscipline] = useState<DisciplineData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [forceRefresh, setForceRefresh] = useState(0);

  // Get disciplines from curriculum service
  const disciplines = useMemo((): DisciplineData[] => {
    const formatted = getFormattedDisciplines();
    return formatted.map(d => ({
      id: d.id,
      name: d.name,
      description: d.description,
      totalSkills: d.totalSkills,
      completedSkills: completedSkillIds.filter(id => id.startsWith(d.id.toLowerCase().replace(/[^a-z0-9]/g, ''))).length,
      icon: d.icon,
      color: d.color,
    }));
  }, [getFormattedDisciplines, completedSkillIds]);

  // Get skills for selected discipline
  const skills = useMemo((): SkillData[] => {
    if (!selectedDiscipline) return [];

    const formatted = getFormattedSkills(selectedDiscipline.id);
    return formatted.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      difficulty: s.difficulty,
      status: completedSkillIds.includes(s.id) ? 'completed' as const : 'not_started' as const,
      estimatedTime: s.estimatedTime,
      prerequisitesMet: s.prerequisites.length === 0 || s.prerequisites.every(p => completedSkillIds.includes(p)),
      prerequisites: s.prerequisites,
    }));
  }, [selectedDiscipline, getFormattedSkills, completedSkillIds]);

  const filteredSkills = skills.filter(skill =>
    skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    skill.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalProgress = disciplines.reduce((acc, d) => acc + d.completedSkills, 0);
  const totalSkills = disciplines.reduce((acc, d) => acc + d.totalSkills, 0);

  // Auto-refresh if disciplines are empty and not loading/error (to handle race conditions)
  useEffect(() => {
    if (!isLoading && !error && disciplines.length === 0 && forceRefresh < 2) {
      console.log('[DisciplinesPage] No disciplines found, attempting refresh...');
      setTimeout(() => {
        setForceRefresh(prev => prev + 1);
        refreshCurriculum();
      }, 1000);
    }
  }, [disciplines.length, isLoading, error, forceRefresh, refreshCurriculum]);

  if (isLoading) {
    return (
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <Text variant="heading" size="xl" color={currentTheme.colors.primary}>
          Carregando currículo...
        </Text>
        <div style={{
          marginTop: '20px',
          width: '50px',
          height: '50px',
          border: `3px solid ${currentTheme.colors.border}`,
          borderTop: `3px solid ${currentTheme.colors.primary}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '20px auto',
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <Text variant="heading" size="xl" color={currentTheme.colors.error}>
          Erro ao carregar currículo
        </Text>
        <Text variant="body" color={currentTheme.colors.textSecondary} style={{ marginTop: '12px' }}>
          {error}
        </Text>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Text variant="heading" size="2xl" color={currentTheme.colors.primary} glow>
          Disciplinas
        </Text>
        <Text variant="body" color={currentTheme.colors.textSecondary}>
          Selecione uma disciplina para estudar
        </Text>
      </div>

      {/* Overall Progress */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ flex: 1 }}>
            <ProgressBar
              value={totalProgress}
              maxValue={totalSkills}
              label="Progresso Geral do Currículo"
              variant="primary"
              size="large"
            />
          </div>
          <div style={{ textAlign: 'right' }}>
            <Text variant="heading" size="xl" color={currentTheme.colors.primary}>
              {((totalProgress / totalSkills) * 100).toFixed(1)}%
            </Text>
            <Text variant="caption" color={currentTheme.colors.textSecondary}>
              {totalProgress}/{totalSkills} habilidades
            </Text>
          </div>
        </div>
      </Card>

      {!selectedDiscipline ? (
        /* Discipline Grid */
        disciplines.length === 0 ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Text variant="heading" size="lg" color={currentTheme.colors.textSecondary}>
                Nenhuma disciplina disponível
              </Text>
              <Text variant="body" color={currentTheme.colors.textSecondary} style={{ marginTop: '8px' }}>
                O currículo ainda está sendo carregado ou não há disciplinas cadastradas.
              </Text>
              <Button
                onClick={refreshCurriculum}
                variant="primary"
                style={{ marginTop: '16px' }}
              >
                🔄 Recarregar Currículo
              </Button>
            </div>
          </Card>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px',
            }}
          >
            {disciplines.map((discipline) => (
              <DisciplineCard
                key={discipline.id}
                discipline={discipline}
                onClick={() => setSelectedDiscipline(discipline)}
              />
            ))}
          </div>
        )
      ) : (
        /* Discipline Detail View */
        <div>
          {/* Back Button and Discipline Header */}
          <div style={{ marginBottom: '24px' }}>
            <Button
              onClick={() => setSelectedDiscipline(null)}
              variant="secondary"
              size="small"
              style={{ marginBottom: '16px' }}
            >
              ← Voltar às Disciplinas
            </Button>

            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <span style={{ fontSize: '3rem' }}>{selectedDiscipline.icon}</span>
                <div style={{ flex: 1 }}>
                  <Text variant="heading" size="xl" color={currentTheme.colors.text}>
                    {selectedDiscipline.name}
                  </Text>
                  <Text variant="body" color={selectedDiscipline.color}>
                    {selectedDiscipline.id}
                  </Text>
                  <Text variant="body" color={currentTheme.colors.textSecondary} style={{ marginTop: '8px' }}>
                    {selectedDiscipline.description}
                  </Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Text variant="heading" size="2xl" color={selectedDiscipline.color}>
                    {((selectedDiscipline.completedSkills / selectedDiscipline.totalSkills) * 100).toFixed(0)}%
                  </Text>
                  <Text variant="caption" color={currentTheme.colors.textSecondary}>
                    {selectedDiscipline.completedSkills}/{selectedDiscipline.totalSkills} habilidades
                  </Text>
                </div>
              </div>
              <ProgressBar
                value={selectedDiscipline.completedSkills}
                maxValue={selectedDiscipline.totalSkills}
                variant="primary"
                size="medium"
                style={{ marginTop: '16px' }}
              />
            </Card>
          </div>

          {/* Search */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="🔍 Buscar habilidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: currentTheme.colors.surface,
                border: `2px solid ${currentTheme.colors.border}`,
                borderRadius: '8px',
                color: currentTheme.colors.text,
                fontFamily: currentTheme.fonts.secondary,
                fontSize: '1rem',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = currentTheme.colors.primary;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = currentTheme.colors.border;
              }}
            />
          </div>

          {/* Skills List */}
          <Card title={`Habilidades (${filteredSkills.length})`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredSkills.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={{
                    ...skill,
                    status: completedSkillIds.includes(skill.id) ? 'completed' : skill.status,
                  }}
                  onClick={() => onStartSkill(skill.id, selectedDiscipline.id)}
                  compact
                />
              ))}
              {filteredSkills.length === 0 && (
                <Text variant="body" color={currentTheme.colors.textSecondary} style={{ textAlign: 'center', padding: '20px' }}>
                  Nenhuma habilidade encontrada
                </Text>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DisciplinesPage;
