import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ThemeProvider,
  useTheme,
  Navbar,
  NotificationContainer,
  CelebrationModal,
  Onboarding,
  ErrorBoundary,
  PageTransition,
  type NavItem,
  type CelebrationType,
} from '@ita-rp/ui-components';
import { useGameStore, useGamePersistence, dailyChallengeSystem, useSoundEffects } from '@ita-rp/game-logic';
import { useCurriculum } from '@ita-rp/curriculum';
import type { LearningStep } from '@ita-rp/shared-types';

import DashboardPage from './pages/DashboardPage';
import DisciplinesPage from './pages/DisciplinesPage';
import AchievementsPage from './pages/AchievementsPage';
import ProfilePage from './pages/ProfilePage';
import StudyModePage from './pages/StudyModePage';
import LeaderboardPage from './pages/LeaderboardPage';
import SyncSettingsPage from './pages/SyncSettingsPage';
import DailyChallengesPage from './pages/DailyChallengesPage';
import SkillTreePage from './pages/SkillTreePage';
import StatsPage from './pages/StatsPage';

type PageType = 'dashboard' | 'disciplines' | 'achievements' | 'profile' | 'study' | 'leaderboard' | 'sync' | 'challenges' | 'skilltree' | 'stats';

interface StudySession {
  skillId: string;
  disciplineId: string;
  skillName: string;
  skillDescription: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  steps: LearningStep[];
  practicalExample: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 'disciplines', label: 'Disciplinas', icon: '📚' },
  { id: 'skilltree', label: 'Árvore', icon: '🌳' },
  { id: 'stats', label: 'Estatísticas', icon: '📊' },
  { id: 'leaderboard', label: 'Ranking', icon: '🏅' },
  { id: 'achievements', label: 'Conquistas', icon: '🏆' },
  { id: 'profile', label: 'Perfil', icon: '👤' },
];

const GameAppContent: React.FC = () => {
  const { currentTheme, setTheme } = useTheme();
  const store = useGameStore();
  const { getSkill, getFormattedSkills } = useCurriculum();
  const { sounds } = useSoundEffects();
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen for padding
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Stable callbacks for persistence
  const onSyncComplete = useCallback(() => {
    console.log('Data synced to decentralized storage');
  }, []);

  const onSyncError = useCallback((error: string) => {
    console.error('Sync error:', error);
  }, []);

  // Memoize persistence options to prevent re-renders
  const persistenceOptions = useMemo(() => ({
    autoSync: true,
    syncInterval: 30000,
    enableP2P: true,
    onSyncComplete,
    onSyncError,
  }), [onSyncComplete, onSyncError]);

  // Initialize decentralized persistence
  const persistence = useGamePersistence(persistenceOptions);

  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [studySession, setStudySession] = useState<StudySession | null>(null);

  // Celebration modal state
  const [celebration, setCelebration] = useState<{
    isOpen: boolean;
    type: CelebrationType;
    title: string;
    subtitle?: string;
    description?: string;
    icon?: string;
    rewards?: Array<{ type: string; value: string | number; icon: string }>;
  } | null>(null);

  // Onboarding state - check if user has completed onboarding
  const [showOnboarding, setShowOnboarding] = useState(() => {
    const hasCompletedOnboarding = localStorage.getItem('ita-rp-onboarding-completed');
    return !hasCompletedOnboarding;
  });

  const handleOnboardingComplete = () => {
    localStorage.setItem('ita-rp-onboarding-completed', 'true');
    setShowOnboarding(false);
    addNotification('success', 'Bem-vindo!', 'Sua jornada no ITA começa agora. Boa sorte, cadete!');
  };

  const handleOnboardingSkip = () => {
    localStorage.setItem('ita-rp-onboarding-completed', 'true');
    setShowOnboarding(false);
  };

  // Use store values directly - zustand persist handles localStorage
  const xp = store.player.xp;
  const level = store.player.level;
  const streak = store.player.currentStreak;
  const longestStreak = store.player.longestStreak || streak;
  const completedSkillIds = store.player.completedSkills;
  const totalStudyTime = store.player.totalStudyTime;

  // Track previous values for detecting changes using refs to avoid re-renders
  const prevLevelRef = React.useRef(level);
  const prevStreakRef = React.useRef(streak);

  // Show celebration for level up
  useEffect(() => {
    const prevLevel = prevLevelRef.current;
    if (level > prevLevel && prevLevel > 0) {
      sounds.levelUp();
      setCelebration({
        isOpen: true,
        type: 'level_up',
        title: 'Level Up!',
        subtitle: `Nível ${level}`,
        description: 'Parabéns! Você alcançou um novo nível. Continue estudando para progredir ainda mais!',
        icon: '⬆️',
        rewards: [
          { type: 'Novo Nível', value: level, icon: '🎯' },
        ],
      });
    }
    prevLevelRef.current = level;
  }, [level, sounds]);

  // Show celebration for streak milestones
  useEffect(() => {
    const prevStreak = prevStreakRef.current;
    const streakMilestones = [7, 14, 30, 60, 100, 365];
    if (streak > prevStreak && streakMilestones.includes(streak)) {
      sounds.streakBonus();
      setCelebration({
        isOpen: true,
        type: 'streak',
        title: 'Streak Incrível!',
        subtitle: `${streak} dias seguidos!`,
        description: `Você manteve sua sequência de estudos por ${streak} dias! Continue assim!`,
        icon: '🔥',
        rewards: [
          { type: 'Bônus de Streak', value: `+${Math.floor(streak * 5)} XP`, icon: '⚡' },
        ],
      });
      // Add bonus XP for streak milestone
      store.addXP(streak * 5);
    }
    prevStreakRef.current = streak;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streak]); // store.addXP is stable from zustand

  // Check streak on mount
  useEffect(() => {
    const streakStatus = store.checkAndUpdateStreak();
    if (streakStatus.streakLost && streak > 0) {
      addNotification('warning', 'Streak Perdido!', `Sua sequência de ${streak} dias foi reiniciada. Comece novamente!`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount - store methods are stable

  const addNotification = (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, title, message }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNavigate = (page: string) => {
    sounds.click();
    setCurrentPage(page as PageType);
  };

  const handleStartSkill = (skillId: string, disciplineId: string) => {
    // Try to get skill data from curriculum service
    const skill = getSkill(skillId);

    if (skill) {
      // Use real skill data from curriculum
      setStudySession({
        skillId,
        disciplineId,
        skillName: skill.name,
        skillDescription: skill.description,
        difficulty: skill.difficulty || 'beginner',
        estimatedTime: skill.estimatedTime || '1h',
        steps: skill.atomicExpansion?.steps || [],
        practicalExample: skill.atomicExpansion?.practicalExample || '',
      });
    } else {
      // Fallback: try to find skill in formatted skills for discipline
      const formattedSkills = getFormattedSkills(disciplineId);
      const formattedSkill = formattedSkills.find(s => s.id === skillId);

      if (formattedSkill) {
        setStudySession({
          skillId,
          disciplineId,
          skillName: formattedSkill.name,
          skillDescription: formattedSkill.description,
          difficulty: formattedSkill.difficulty,
          estimatedTime: formattedSkill.estimatedTime,
          steps: formattedSkill.steps,
          practicalExample: formattedSkill.practicalExample,
        });
      } else {
        // Ultimate fallback with default data
        setStudySession({
          skillId,
          disciplineId,
          skillName: 'Habilidade de Estudo',
          skillDescription: 'Continue seu aprendizado nesta habilidade.',
          difficulty: 'beginner',
          estimatedTime: '30 min',
          steps: [],
          practicalExample: '',
        });
      }
    }

    setCurrentPage('study');
  };

  const handleStudyComplete = (xpEarned: number, performance: number) => {
    if (!studySession) return;

    // Update XP using store
    store.addXP(xpEarned);

    // Mark skill as completed
    if (!completedSkillIds.includes(studySession.skillId)) {
      store.completeSkill(studySession.skillId);
    }

    // Update study time (estimate 30 min per skill)
    store.addStudyTime(30);

    // Update streak
    store.updateStreak();

    // Update daily challenges progress
    dailyChallengeSystem.updateProgress('complete_skills', 1);
    dailyChallengeSystem.updateProgress('study_time', 30);
    if (performance === 100) {
      dailyChallengeSystem.updateProgress('perfect_quiz', 1);
    }

    // Play sound and show skill completion celebration
    sounds.complete();
    setCelebration({
      isOpen: true,
      type: 'achievement',
      title: 'Habilidade Concluída!',
      subtitle: studySession.skillName,
      description: `Você completou esta habilidade com ${performance.toFixed(0)}% de performance!`,
      icon: '🎓',
      rewards: [
        { type: 'XP', value: xpEarned, icon: '⚡' },
        { type: 'Performance', value: `${performance.toFixed(0)}%`, icon: '📊' },
      ],
    });

    // Return to disciplines
    setStudySession(null);
    setCurrentPage('disciplines');
  };

  const handleStudyExit = () => {
    setStudySession(null);
    setCurrentPage('disciplines');
  };

  const handleChangeTheme = (themeId: string) => {
    setTheme(themeId as any);
    addNotification('info', 'Tema Alterado', `Tema ${themeId} aplicado com sucesso!`);
  };

  // Render study mode (full screen)
  if (currentPage === 'study' && studySession) {
    return (
      <>
        <StudyModePage
          skillId={studySession.skillId}
          skillName={studySession.skillName}
          skillDescription={studySession.skillDescription}
          difficulty={studySession.difficulty}
          estimatedTime={studySession.estimatedTime}
          steps={studySession.steps}
          practicalExample={studySession.practicalExample}
          streak={streak}
          onComplete={handleStudyComplete}
          onExit={handleStudyExit}
        />
        <NotificationContainer
          notifications={notifications}
          onClose={removeNotification}
          position="top-right"
        />
      </>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: currentTheme.colors.background,
        color: currentTheme.colors.text,
        paddingBottom: isMobile ? '80px' : '0', // Space for bottom nav on mobile
      }}
    >
      {/* Navigation */}
      <Navbar
        items={navItems}
        activeItem={currentPage}
        onNavigate={handleNavigate}
        playerStats={{
          xp,
          level,
          streak,
        }}
      />

      {/* Page Content with Transitions */}
      <PageTransition pageKey={currentPage} type="fade" duration={200}>
        <ErrorBoundary
          showDetails={process.env.NODE_ENV === 'development'}
          onError={(error) => {
            console.error('Page error:', error);
            addNotification('error', 'Erro', 'Ocorreu um erro inesperado. Tente novamente.');
          }}
        >
          {currentPage === 'dashboard' && (
            <DashboardPage
              xp={xp}
              level={level}
              streak={streak}
              completedSkills={completedSkillIds.length}
              totalSkills={176}
              studyTimeToday={45}
              onNavigate={handleNavigate}
              onAddXP={(amount) => store.addXP(amount)}
            />
          )}

          {currentPage === 'challenges' && (
            <DailyChallengesPage
              onNavigate={handleNavigate}
              onXPEarned={(amount) => {
                store.addXP(amount);
                addNotification('success', 'XP Recebido!', `+${amount} XP das missões diárias`);
              }}
            />
          )}

          {currentPage === 'disciplines' && (
            <DisciplinesPage
              completedSkillIds={completedSkillIds}
              onStartSkill={handleStartSkill}
            />
          )}

          {currentPage === 'skilltree' && (
            <SkillTreePage
              completedSkillIds={completedSkillIds}
              onStartSkill={handleStartSkill}
              onNavigate={handleNavigate}
            />
          )}

          {currentPage === 'leaderboard' && (
            <LeaderboardPage
              playerXP={xp}
              playerLevel={level}
              playerStreak={streak}
              playerSkills={completedSkillIds.length}
            />
          )}

          {currentPage === 'achievements' && (
            <AchievementsPage
              unlockedAchievementIds={[
                completedSkillIds.length >= 1 ? 'first-steps' : '',
                completedSkillIds.length >= 10 ? 'apprentice' : '',
                streak >= 7 ? 'first-week' : '',
              ].filter(Boolean)}
              completedSkillsCount={completedSkillIds.length}
              currentStreak={streak}
            />
          )}

          {currentPage === 'profile' && (
            <ProfilePage
              playerName={store.player.name}
              xp={xp}
              level={level}
              streak={streak}
              longestStreak={longestStreak}
              completedSkills={completedSkillIds.length}
              totalStudyTime={totalStudyTime}
              joinDate={new Date('2025-01-01')}
              currentThemeId={currentTheme.id}
              onChangeTheme={handleChangeTheme}
              onResetOnboarding={() => setShowOnboarding(true)}
            />
          )}

          {currentPage === 'sync' && (
            <SyncSettingsPage onNavigate={handleNavigate} />
          )}

          {currentPage === 'stats' && (
            <StatsPage theme={currentTheme} />
          )}
        </ErrorBoundary>
      </PageTransition>

      {/* Notifications */}
      <NotificationContainer
        notifications={notifications}
        onClose={removeNotification}
        position="top-right"
      />

      {/* Celebration Modal */}
      {celebration && (
        <CelebrationModal
          isOpen={celebration.isOpen}
          type={celebration.type}
          title={celebration.title}
          subtitle={celebration.subtitle}
          description={celebration.description}
          icon={celebration.icon}
          rewards={celebration.rewards}
          onClose={() => setCelebration(null)}
          autoCloseDelay={6000}
        />
      )}

      {/* Onboarding Tutorial */}
      <Onboarding
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
        playerName={store.player.name}
      />
    </div>
  );
};

export const GameApp: React.FC = () => {
  return (
    <ThemeProvider>
      <GameAppContent />
    </ThemeProvider>
  );
};

export default GameApp;
