import React, { useMemo } from 'react';
import { useGameStore } from '@ita-rp/game-logic';
import { StatsCard } from '@ita-rp/ui-components';
import { ProgressChart } from '@ita-rp/ui-components';
import { HeatmapCalendar } from '@ita-rp/ui-components';

interface StatsPageProps {
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
      warning: string;
      border: string;
    };
    fonts: {
      primary: string;
      secondary: string;
    };
  };
}

export const StatsPage: React.FC<StatsPageProps> = ({ theme }) => {
  const player = useGameStore((state) => state.player);

  // Calculate derived statistics
  const stats = useMemo(() => {
    const achievements = player?.achievements || [];
    const completedSkills = player?.completedSkills || [];

    // Study time breakdown (mock data for now - could be enhanced with real tracking)
    const avgDailyStudyTime = player?.totalStudyTime
      ? Math.round(player.totalStudyTime / Math.max(player.currentStreak, 1))
      : 0;

    // Calculate level progress
    const currentLevelXP = Math.floor(100 * Math.pow(player?.level || 1, 1.5));
    const nextLevelXP = Math.floor(100 * Math.pow((player?.level || 1) + 1, 1.5));
    const levelProgress = player
      ? ((player.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
      : 0;

    // XP per skill average
    const xpPerSkill = completedSkills.length > 0
      ? Math.round((player?.xp || 0) / completedSkills.length)
      : 0;

    // Achievement completion rate
    const totalPossibleAchievements = 30; // Based on achievement-system.ts
    const achievementRate = Math.round((achievements.length / totalPossibleAchievements) * 100);

    return {
      avgDailyStudyTime,
      levelProgress,
      xpPerSkill,
      achievementRate,
      totalAchievements: achievements.length,
      totalPossibleAchievements,
    };
  }, [player]);

  // Generate activity heatmap data
  const activityData = useMemo(() => {
    const data: { date: string; value: number; label?: string }[] = [];
    const today = new Date();

    // Generate mock activity data based on streak
    // In a real app, this would come from study session history
    for (let i = 0; i < 84; i++) { // 12 weeks
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Generate value based on whether it's within streak
      let value = 0;
      if (i < (player?.currentStreak || 0)) {
        // Active streak days - higher values
        value = 50 + Math.random() * 50;
      } else if (i < 30 && Math.random() > 0.5) {
        // Random past activity
        value = Math.random() * 60;
      }

      data.push({
        date: dateStr,
        value: Math.round(value),
        label: value > 0 ? `${Math.round(value / 10)} habilidades` : 'Sem estudo',
      });
    }

    return data;
  }, [player?.currentStreak]);

  // Skill distribution by difficulty
  const skillDistribution = useMemo(() => {
    const completed = player?.completedSkills || [];
    // In a real implementation, we'd count actual difficulty distribution
    // For now, estimate based on total
    const total = completed.length;
    return [
      {
        label: 'Iniciante',
        value: Math.round(total * 0.4),
        color: theme.colors.success,
      },
      {
        label: 'Intermediário',
        value: Math.round(total * 0.35),
        color: theme.colors.warning,
      },
      {
        label: 'Avançado',
        value: Math.round(total * 0.25),
        color: theme.colors.error,
      },
    ];
  }, [player?.completedSkills, theme.colors]);

  // Weekly XP progress (mock data)
  const weeklyXP = useMemo(() => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const today = new Date().getDay();

    return days.map((day, idx) => ({
      label: day,
      value: idx <= today ? Math.round(50 + Math.random() * 150) : 0,
      color: idx === today ? theme.colors.primary : `${theme.colors.primary}80`,
    }));
  }, [theme.colors.primary]);

  if (!player) {
    return (
      <div
        style={{
          padding: '24px',
          color: theme.colors.text,
          fontFamily: theme.fonts.secondary,
        }}
      >
        Carregando estatísticas...
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '24px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1
          style={{
            fontFamily: theme.fonts.primary,
            fontSize: '1.75rem',
            color: theme.colors.text,
            margin: 0,
            marginBottom: '8px',
          }}
        >
          📊 Estatísticas
        </h1>
        <p
          style={{
            fontFamily: theme.fonts.secondary,
            fontSize: '0.95rem',
            color: theme.colors.textSecondary,
            margin: 0,
          }}
        >
          Acompanhe seu progresso de aprendizado
        </p>
      </div>

      {/* Main Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <StatsCard
          title="XP Total"
          value={player.xp.toLocaleString()}
          subtitle={`${stats.xpPerSkill} XP por habilidade`}
          icon="⚡"
          color={theme.colors.primary}
          theme={theme}
        />
        <StatsCard
          title="Nível"
          value={player.level}
          subtitle={`${Math.round(stats.levelProgress)}% para o próximo`}
          icon="🎯"
          color={theme.colors.secondary}
          theme={theme}
        />
        <StatsCard
          title="Streak Atual"
          value={`${player.currentStreak} dias`}
          subtitle={`Recorde: ${player.longestStreak} dias`}
          icon="🔥"
          trend={
            player.currentStreak > 0
              ? { value: player.currentStreak, isPositive: true }
              : undefined
          }
          color="#ff6b6b"
          theme={theme}
        />
        <StatsCard
          title="Tempo de Estudo"
          value={`${Math.floor(player.totalStudyTime / 60)}h`}
          subtitle={`~${stats.avgDailyStudyTime} min/dia`}
          icon="⏱️"
          color="#4ecdc4"
          theme={theme}
        />
        <StatsCard
          title="Habilidades"
          value={player.completedSkills.length}
          subtitle="Concluídas"
          icon="✅"
          color={theme.colors.success}
          theme={theme}
        />
        <StatsCard
          title="Conquistas"
          value={`${stats.totalAchievements}/${stats.totalPossibleAchievements}`}
          subtitle={`${stats.achievementRate}% desbloqueadas`}
          icon="🏆"
          color="#fbbf24"
          theme={theme}
        />
      </div>

      {/* Charts Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '24px',
        }}
      >
        {/* Activity Heatmap */}
        <div style={{ gridColumn: 'span 2' }}>
          <HeatmapCalendar
            title="📅 Atividade de Estudo (últimas 12 semanas)"
            data={activityData}
            weeks={12}
            theme={theme}
          />
        </div>

        {/* Weekly XP */}
        <ProgressChart
          title="📈 XP Esta Semana"
          data={weeklyXP}
          showLabels={true}
          showValues={true}
          barHeight={20}
          theme={theme}
        />

        {/* Skill Distribution */}
        <ProgressChart
          title="📊 Habilidades por Dificuldade"
          data={skillDistribution}
          showLabels={true}
          showValues={true}
          barHeight={28}
          theme={theme}
        />
      </div>

      {/* Detailed Stats */}
      <div
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: '16px',
          padding: '20px',
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        <h3
          style={{
            fontFamily: theme.fonts.primary,
            fontSize: '1rem',
            color: theme.colors.text,
            margin: 0,
            marginBottom: '16px',
          }}
        >
          📋 Detalhes do Progresso
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
          }}
        >
          {/* Rank Info */}
          <div
            style={{
              padding: '16px',
              backgroundColor: theme.colors.background,
              borderRadius: '12px',
            }}
          >
            <div
              style={{
                fontFamily: theme.fonts.secondary,
                fontSize: '0.875rem',
                color: theme.colors.textSecondary,
                marginBottom: '8px',
              }}
            >
              Patente Atual
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{player.currentRank.icon}</span>
              <div>
                <div
                  style={{
                    fontFamily: theme.fonts.primary,
                    fontSize: '1.125rem',
                    color: theme.colors.text,
                    fontWeight: 'bold',
                  }}
                >
                  {player.currentRank.name}
                </div>
                <div
                  style={{
                    fontFamily: theme.fonts.secondary,
                    fontSize: '0.8rem',
                    color: theme.colors.textSecondary,
                  }}
                >
                  Nível {player.currentRank.level}
                </div>
              </div>
            </div>
          </div>

          {/* Study Stats */}
          <div
            style={{
              padding: '16px',
              backgroundColor: theme.colors.background,
              borderRadius: '12px',
            }}
          >
            <div
              style={{
                fontFamily: theme.fonts.secondary,
                fontSize: '0.875rem',
                color: theme.colors.textSecondary,
                marginBottom: '8px',
              }}
            >
              Estatísticas de Estudo
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: theme.fonts.secondary,
                  fontSize: '0.9rem',
                }}
              >
                <span style={{ color: theme.colors.textSecondary }}>
                  Tempo Total:
                </span>
                <span style={{ color: theme.colors.text, fontWeight: 'bold' }}>
                  {Math.floor(player.totalStudyTime / 60)}h {player.totalStudyTime % 60}m
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: theme.fonts.secondary,
                  fontSize: '0.9rem',
                }}
              >
                <span style={{ color: theme.colors.textSecondary }}>
                  Média Diária:
                </span>
                <span style={{ color: theme.colors.text, fontWeight: 'bold' }}>
                  {stats.avgDailyStudyTime} min
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: theme.fonts.secondary,
                  fontSize: '0.9rem',
                }}
              >
                <span style={{ color: theme.colors.textSecondary }}>
                  Último Estudo:
                </span>
                <span style={{ color: theme.colors.text, fontWeight: 'bold' }}>
                  {player.lastStudyDate
                    ? new Date(player.lastStudyDate).toLocaleDateString('pt-BR')
                    : 'Nunca'}
                </span>
              </div>
            </div>
          </div>

          {/* Achievements Progress */}
          <div
            style={{
              padding: '16px',
              backgroundColor: theme.colors.background,
              borderRadius: '12px',
            }}
          >
            <div
              style={{
                fontFamily: theme.fonts.secondary,
                fontSize: '0.875rem',
                color: theme.colors.textSecondary,
                marginBottom: '8px',
              }}
            >
              Conquistas Recentes
            </div>
            {player.achievements.slice(-3).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {player.achievements.slice(-3).reverse().map((ach, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>{ach.icon}</span>
                    <span
                      style={{
                        fontFamily: theme.fonts.secondary,
                        fontSize: '0.875rem',
                        color: theme.colors.text,
                      }}
                    >
                      {ach.name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  fontFamily: theme.fonts.secondary,
                  fontSize: '0.875rem',
                  color: theme.colors.textSecondary,
                  fontStyle: 'italic',
                }}
              >
                Nenhuma conquista ainda
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPage;
