import { Achievement, GameEvent, PlayerState } from '@ita-rp/shared-types';

/**
 * Define todas as conquistas disponíveis no jogo
 * Categorizadas por tipo de comportamento que recompensam
 */
export const ALL_ACHIEVEMENTS: Achievement[] = [
  // CONQUISTAS DE ESTUDO (STUDY)
  {
    id: 'first_steps',
    name: 'Primeiros Passos',
    description: 'Complete sua primeira habilidade',
    icon: '👣',
    unlockedAt: new Date(),
    category: 'study',
  },
  {
    id: 'apprentice',
    name: 'Aprendiz',
    description: 'Complete 10 habilidades',
    icon: '🎓',
    unlockedAt: new Date(),
    category: 'study',
  },
  {
    id: 'dedicated_student',
    name: 'Estudante Dedicado',
    description: 'Complete 50 habilidades',
    icon: '📚',
    unlockedAt: new Date(),
    category: 'study',
  },
  {
    id: 'master',
    name: 'Mestre',
    description: 'Complete 100 habilidades',
    icon: '🏆',
    unlockedAt: new Date(),
    category: 'study',
  },
  {
    id: 'grandmaster',
    name: 'Grão-Mestre',
    description: 'Complete 250 habilidades',
    icon: '👑',
    unlockedAt: new Date(),
    category: 'study',
  },
  {
    id: 'legendary_scholar',
    name: 'Erudito Lendário',
    description: 'Complete 500 habilidades',
    icon: '🌟',
    unlockedAt: new Date(),
    category: 'study',
  },
  {
    id: 'perfectionist',
    name: 'Perfeccionista',
    description: 'Complete 10 habilidades com 100% de performance',
    icon: '💯',
    unlockedAt: new Date(),
    category: 'study',
  },
  {
    id: 'flawless_victory',
    name: 'Vitória Impecável',
    description: 'Complete 25 habilidades com 100% de performance',
    icon: '⭐',
    unlockedAt: new Date(),
    category: 'study',
  },
  {
    id: 'speed_learner',
    name: 'Aprendiz Rápido',
    description: 'Complete uma habilidade em menos da metade do tempo esperado',
    icon: '⚡',
    unlockedAt: new Date(),
    category: 'study',
  },
  {
    id: 'lightning_fast',
    name: 'Veloz como um Raio',
    description: 'Complete 5 habilidades em menos da metade do tempo esperado',
    icon: '🚀',
    unlockedAt: new Date(),
    category: 'study',
  },
  {
    id: 'explorer',
    name: 'Explorador',
    description: 'Complete habilidades de 5 disciplinas diferentes',
    icon: '🗺️',
    unlockedAt: new Date(),
    category: 'study',
  },
  {
    id: 'adventurer',
    name: 'Aventureiro',
    description: 'Complete habilidades de 10 disciplinas diferentes',
    icon: '🧭',
    unlockedAt: new Date(),
    category: 'study',
  },
  {
    id: 'globetrotter',
    name: 'Viajante Global',
    description: 'Complete habilidades de 20 disciplinas diferentes',
    icon: '🌍',
    unlockedAt: new Date(),
    category: 'study',
  },
  {
    id: 'specialist',
    name: 'Especialista',
    description: 'Complete todas as habilidades de uma única disciplina',
    icon: '🎯',
    unlockedAt: new Date(),
    category: 'study',
  },
  {
    id: 'discipline_expert',
    name: 'Expert em Disciplina',
    description: 'Complete todas as habilidades de 3 disciplinas',
    icon: '🏅',
    unlockedAt: new Date(),
    category: 'study',
  },
  {
    id: 'night_owl',
    name: 'Coruja',
    description: 'Estude durante 10 noites (após 22h)',
    icon: '🦉',
    unlockedAt: new Date(),
    category: 'study',
  },
  {
    id: 'early_bird',
    name: 'Pássaro Madrugador',
    description: 'Estude durante 10 manhãs (antes 6h)',
    icon: '🐦',
    unlockedAt: new Date(),
    category: 'study',
  },
  {
    id: 'marathon_session',
    name: 'Sessão Maratona',
    description: 'Estude por mais de 4 horas em uma única sessão',
    icon: '⏰',
    unlockedAt: new Date(),
    category: 'study',
  },
  {
    id: 'ultra_marathon',
    name: 'Ultra Maratona',
    description: 'Estude por mais de 8 horas em uma única sessão',
    icon: '🏃‍♂️',
    unlockedAt: new Date(),
    category: 'study',
  },

  // CONQUISTAS DE SEQUÊNCIA (STREAK)
  {
    id: 'first_week',
    name: 'Primeira Semana',
    description: 'Mantenha uma sequência de 7 dias de estudos',
    icon: '📅',
    unlockedAt: new Date(),
    category: 'streak',
  },
  {
    id: 'dedicated_month',
    name: 'Mês Dedicado',
    description: 'Mantenha uma sequência de 30 dias de estudos',
    icon: '📆',
    unlockedAt: new Date(),
    category: 'streak',
  },
  {
    id: 'warrior',
    name: 'Guerreiro',
    description: 'Mantenha uma sequência de 90 dias de estudos',
    icon: '⚔️',
    unlockedAt: new Date(),
    category: 'streak',
  },
  {
    id: 'legendary',
    name: 'Lendário',
    description: 'Mantenha uma sequência de 365 dias de estudos',
    icon: '👑',
    unlockedAt: new Date(),
    category: 'streak',
  },
  {
    id: 'immortal',
    name: 'Imortal',
    description: 'Mantenha uma sequência de 1000 dias de estudos',
    icon: '🔥',
    unlockedAt: new Date(),
    category: 'streak',
  },
  {
    id: 'comeback_king',
    name: 'Rei do Retorno',
    description: 'Recupere uma sequência após 7 dias de inatividade',
    icon: '🔄',
    unlockedAt: new Date(),
    category: 'streak',
  },
  {
    id: 'consistency_champion',
    name: 'Campeão da Consistência',
    description: 'Estude pelo menos 1 hora todos os dias por 30 dias',
    icon: '🏅',
    unlockedAt: new Date(),
    category: 'streak',
  },
  {
    id: 'iron_will',
    name: 'Vontade de Ferro',
    description: 'Estude pelo menos 2 horas todos os dias por 60 dias',
    icon: '💪',
    unlockedAt: new Date(),
    category: 'streak',
  },

  // CONQUISTAS DE CONCLUSÃO (COMPLETION)
  {
    id: 'first_discipline',
    name: 'Primeira Disciplina',
    description: 'Complete sua primeira disciplina',
    icon: '📖',
    unlockedAt: new Date(),
    category: 'completion',
  },
  {
    id: 'halfway_there',
    name: 'Metade do Caminho',
    description: 'Complete 50% de uma disciplina',
    icon: '📊',
    unlockedAt: new Date(),
    category: 'completion',
  },
  {
    id: 'discipline_master',
    name: 'Mestre de Disciplina',
    description: 'Complete 5 disciplinas inteiras',
    icon: '🎓',
    unlockedAt: new Date(),
    category: 'completion',
  },
  {
    id: 'polymath',
    name: 'Polímata',
    description: 'Complete 10 disciplinas inteiras',
    icon: '🧠',
    unlockedAt: new Date(),
    category: 'completion',
  },
  {
    id: 'graduate',
    name: 'Formado',
    description: 'Complete 15 disciplinas inteiras',
    icon: '🎖️',
    unlockedAt: new Date(),
    category: 'completion',
  },
  {
    id: 'master_scholar',
    name: 'Mestre Acadêmico',
    description: 'Complete 25 disciplinas inteiras',
    icon: '🎯',
    unlockedAt: new Date(),
    category: 'completion',
  },
  {
    id: 'ultimate_graduate',
    name: 'Formado Supremo',
    description: 'Complete todas as 57 disciplinas disponíveis',
    icon: '🏆',
    unlockedAt: new Date(),
    category: 'completion',
  },

  // CONQUISTAS POR ÁREA DE CONHECIMENTO (SUBJECT)
  {
    id: 'statistics_master',
    name: 'Mestre da Estatística',
    description: 'Complete todas as disciplinas de Estatística e Decisão (ED)',
    icon: '📊',
    unlockedAt: new Date(),
    category: 'subject',
  },
  {
    id: 'physics_wizard',
    name: 'Mago da Física',
    description: 'Complete todas as disciplinas de Física (IS)',
    icon: '⚛️',
    unlockedAt: new Date(),
    category: 'subject',
  },
  {
    id: 'humanities_scholar',
    name: 'Erudito das Humanidades',
    description: 'Complete todas as disciplinas de Humanidades (UM)',
    icon: '📚',
    unlockedAt: new Date(),
    category: 'subject',
  },
  {
    id: 'renaissance_person',
    name: 'Pessoa Renascentista',
    description: 'Complete pelo menos 5 disciplinas de cada área (ED, IS, UM)',
    icon: '🎨',
    unlockedAt: new Date(),
    category: 'subject',
  },
  {
    id: 'innovation_guru',
    name: 'Guru da Inovação',
    description: 'Complete todas as disciplinas de inovação e empreendedorismo',
    icon: '💡',
    unlockedAt: new Date(),
    category: 'subject',
  },
  {
    id: 'quantum_thinker',
    name: 'Pensador Quântico',
    description: 'Complete as disciplinas avançadas de física moderna',
    icon: '🔬',
    unlockedAt: new Date(),
    category: 'subject',
  },
  {
    id: 'philosophical_mind',
    name: 'Mente Filosófica',
    description: 'Complete 10 disciplinas de filosofia e humanidades',
    icon: '🤔',
    unlockedAt: new Date(),
    category: 'subject',
  },
  {
    id: 'legal_expert',
    name: 'Especialista Jurídico',
    description: 'Complete todas as disciplinas de direito e regulamentação',
    icon: '⚖️',
    unlockedAt: new Date(),
    category: 'subject',
  },

  // CONQUISTAS DE DIFICULDADE (DIFFICULTY)
  {
    id: 'beginner_master',
    name: 'Mestre do Início',
    description: 'Complete 20 habilidades de nível iniciante',
    icon: '🟢',
    unlockedAt: new Date(),
    category: 'difficulty',
  },
  {
    id: 'intermediate_champion',
    name: 'Campeão Intermediário',
    description: 'Complete 15 habilidades de nível intermediário',
    icon: '🟡',
    unlockedAt: new Date(),
    category: 'difficulty',
  },
  {
    id: 'advanced_conqueror',
    name: 'Conquistador Avançado',
    description: 'Complete 10 habilidades de nível avançado',
    icon: '🔴',
    unlockedAt: new Date(),
    category: 'difficulty',
  },
  {
    id: 'balanced_learner',
    name: 'Aprendiz Equilibrado',
    description: 'Complete habilidades de todos os níveis de dificuldade',
    icon: '⚖️',
    unlockedAt: new Date(),
    category: 'difficulty',
  },

  // CONQUISTAS DE TEMPO (TIME)
  {
    id: 'time_investor',
    name: 'Investidor de Tempo',
    description: 'Acumule 100 horas de estudo total',
    icon: '⏳',
    unlockedAt: new Date(),
    category: 'time',
  },
  {
    id: 'dedicated_scholar',
    name: 'Estudante Dedicado',
    description: 'Acumule 500 horas de estudo total',
    icon: '📚',
    unlockedAt: new Date(),
    category: 'time',
  },
  {
    id: 'time_master',
    name: 'Mestre do Tempo',
    description: 'Acumule 1000 horas de estudo total',
    icon: '⌚',
    unlockedAt: new Date(),
    category: 'time',
  },
  {
    id: 'century_study',
    name: 'Século de Estudos',
    description: 'Acumule 2000 horas de estudo total',
    icon: '📖',
    unlockedAt: new Date(),
    category: 'time',
  },

  // CONQUISTAS ESPECIAIS E SECRETAS (SPECIAL)
  {
    id: 'full_circle',
    name: 'Círculo Completo',
    description: 'Complete uma habilidade exatamente no tempo previsto',
    icon: '⭕',
    unlockedAt: new Date(),
    category: 'special',
  },
  {
    id: 'midnight_oil',
    name: 'Óleo da Meia-Noite',
    description: 'Estude até meia-noite por 5 noites seguidas',
    icon: '🌙',
    unlockedAt: new Date(),
    category: 'special',
  },
  {
    id: 'sunrise_learner',
    name: 'Estudante do Amanhecer',
    description: 'Comece a estudar antes das 5h por 5 manhãs seguidas',
    icon: '🌅',
    unlockedAt: new Date(),
    category: 'special',
  },
  {
    id: 'weekend_warrior',
    name: 'Guerreiro de Fim de Semana',
    description: 'Estude todos os fins de semana por um mês',
    icon: '🛡️',
    unlockedAt: new Date(),
    category: 'special',
  },
  {
    id: 'quick_thinker',
    name: 'Pensador Rápido',
    description: 'Complete 3 habilidades em menos de 2 horas cada',
    icon: '🧠',
    unlockedAt: new Date(),
    category: 'special',
  },

  // CONQUISTAS SOCIAIS (SOCIAL) - Para features futuras
  {
    id: 'helper',
    name: 'Ajudante',
    description: 'Ajude 10 outros estudantes (quando implementado)',
    icon: '🤝',
    unlockedAt: new Date(),
    category: 'social',
  },
  {
    id: 'community_leader',
    name: 'Líder Comunitário',
    description: 'Seja reconhecido pela comunidade 50 vezes',
    icon: '🌟',
    unlockedAt: new Date(),
    category: 'social',
  },
  {
    id: 'mentor',
    name: 'Mentor',
    description: 'Mentoreie 5 estudantes até a conclusão de disciplinas',
    icon: '👨‍🏫',
    unlockedAt: new Date(),
    category: 'social',
  },
  {
    id: 'team_player',
    name: 'Jogador de Equipe',
    description: 'Participe de 10 sessões de estudo em grupo',
    icon: '👥',
    unlockedAt: new Date(),
    category: 'social',
  },
  {
    id: 'knowledge_sharer',
    name: 'Compartilhador de Conhecimento',
    description: 'Compartilhe 50 notas de estudo úteis',
    icon: '📝',
    unlockedAt: new Date(),
    category: 'social',
  },
];

/**
 * Sistema de gerenciamento de conquistas
 */
export class AchievementSystem {
  /**
   * Verifica quais conquistas foram desbloqueadas com base em um evento
   */
  static checkAchievements(player: PlayerState, event: GameEvent): Achievement[] {
    const unlockedAchievements: Achievement[] = [];

    // Verifica conquistas baseadas no tipo de evento
    switch (event.type) {
      case 'skill_completed':
        unlockedAchievements.push(...this.checkStudyAchievements(player, event));
        unlockedAchievements.push(...this.checkDifficultyAchievements(player, event));
        break;
      case 'streak_updated':
        unlockedAchievements.push(...this.checkStreakAchievements(player, event));
        break;
      case 'level_up':
        unlockedAchievements.push(...this.checkLevelAchievements(player, event));
        break;
      case 'discipline_completed':
        unlockedAchievements.push(...this.checkCompletionAchievements(player, event));
        unlockedAchievements.push(...this.checkSubjectAchievements(player, event));
        break;
    }

    // Verifica conquistas gerais
    unlockedAchievements.push(...this.checkGeneralAchievements(player));
    unlockedAchievements.push(...this.checkTimeAchievements(player));
    unlockedAchievements.push(...this.checkSpecialAchievements(player, event));

    // Remove conquistas já desbloqueadas
    return unlockedAchievements.filter(
      achievement => !player.achievements.some(unlocked => unlocked.id === achievement.id)
    );
  }

  /**
   * Verifica conquistas relacionadas a estudo
   */
  private static checkStudyAchievements(player: PlayerState, event: GameEvent): Achievement[] {
    const achievements: Achievement[] = [];
    const completedSkills = player.completedSkills.length;

    // Primeiros Passos
    if (completedSkills === 1) {
      achievements.push(this.getAchievement('first_steps'));
    }

    // Aprendiz
    if (completedSkills === 10) {
      achievements.push(this.getAchievement('apprentice'));
    }

    // Estudante Dedicado
    if (completedSkills === 50) {
      achievements.push(this.getAchievement('dedicated_student'));
    }

    // Mestre
    if (completedSkills === 100) {
      achievements.push(this.getAchievement('master'));
    }

    // Grão-Mestre
    if (completedSkills === 250) {
      achievements.push(this.getAchievement('grandmaster'));
    }

    // Erudito Lendário
    if (completedSkills === 500) {
      achievements.push(this.getAchievement('legendary_scholar'));
    }

    // Aprendiz Rápido (se o evento tiver dados de performance)
    if (event.payload.timeSpent && event.payload.expectedTime) {
      if (event.payload.timeSpent < event.payload.expectedTime * 0.5) {
        achievements.push(this.getAchievement('speed_learner'));
      }
    }

    // Perfeccionista (se o evento tiver dados de performance)
    if (event.payload.performance === 1.0) {
      const perfectSkills = this.countPerfectSkills(player);
      if (perfectSkills === 10) {
        achievements.push(this.getAchievement('perfectionist'));
      }
      if (perfectSkills === 25) {
        achievements.push(this.getAchievement('flawless_victory'));
      }
    }

    // Explorador
    const uniqueDisciplines = this.getUniqueDisciplinesCount(player);
    if (uniqueDisciplines === 5) {
      achievements.push(this.getAchievement('explorer'));
    }
    if (uniqueDisciplines === 10) {
      achievements.push(this.getAchievement('adventurer'));
    }
    if (uniqueDisciplines === 20) {
      achievements.push(this.getAchievement('globetrotter'));
    }

    // Especialista
    if (this.hasCompletedFullDiscipline(player)) {
      achievements.push(this.getAchievement('specialist'));
    }

    const fullDisciplinesCount = this.countCompletedDisciplines(player);
    if (fullDisciplinesCount === 3) {
      achievements.push(this.getAchievement('discipline_expert'));
    }

    return achievements;
  }

  /**
   * Verifica conquistas relacionadas a streak
   */
  private static checkStreakAchievements(player: PlayerState, event: GameEvent): Achievement[] {
    const achievements: Achievement[] = [];
    const streak = player.currentStreak;

    // Primeira Semana
    if (streak === 7) {
      achievements.push(this.getAchievement('first_week'));
    }

    // Mês Dedicado
    if (streak === 30) {
      achievements.push(this.getAchievement('dedicated_month'));
    }

    // Guerreiro
    if (streak === 90) {
      achievements.push(this.getAchievement('warrior'));
    }

    // Lendário
    if (streak === 365) {
      achievements.push(this.getAchievement('legendary'));
    }

    // Imortal
    if (streak === 1000) {
      achievements.push(this.getAchievement('immortal'));
    }

    return achievements;
  }

  /**
   * Verifica conquistas relacionadas a nível
   */
  private static checkLevelAchievements(player: PlayerState, event: GameEvent): Achievement[] {
    const achievements: Achievement[] = [];
    const level = player.level;

    // Adicionar conquistas baseadas em nível aqui se necessário
    // Ex: nível 10, 25, 50, etc.

    return achievements;
  }

  /**
   * Verifica conquistas gerais
   */
  private static checkGeneralAchievements(player: PlayerState): Achievement[] {
    const achievements: Achievement[] = [];

    // Verifica disciplinas completas (precisaria de mais dados do jogador)
    // Por enquanto, implementações básicas

    return achievements;
  }

  /**
   * Obtém uma conquista pelo ID
   */
  private static getAchievement(id: string): Achievement {
    const achievement = ALL_ACHIEVEMENTS.find(a => a.id === id);
    if (!achievement) {
      throw new Error(`Achievement with id '${id}' not found`);
    }
    return achievement;
   }

   /**
   * Desbloqueia uma conquista para o jogador
   */
  static unlockAchievement(playerId: string, achievementId: string): Achievement {
    const achievement = this.getAchievement(achievementId);
    achievement.unlockedAt = new Date();
    return achievement;
  }

  /**
   * Obtém conquistas por categoria
   */
  static getAchievementsByCategory(category: Achievement['category']): Achievement[] {
    return ALL_ACHIEVEMENTS.filter(achievement => achievement.category === category);
  }

  /**
   * Obtém todas as conquistas
   */
  static getAllAchievements(): Achievement[] {
    return [...ALL_ACHIEVEMENTS];
  }

  /**
   * Calcula progresso para uma conquista (0.0 a 1.0)
   */
  static calculateAchievementProgress(achievementId: string, player: PlayerState): number {
    switch (achievementId) {
      case 'first_steps':
        return player.completedSkills.length >= 1 ? 1.0 : player.completedSkills.length;

      case 'apprentice':
        return Math.min(1.0, player.completedSkills.length / 10);

      case 'dedicated_student':
        return Math.min(1.0, player.completedSkills.length / 50);

      case 'master':
        return Math.min(1.0, player.completedSkills.length / 100);

      case 'first_week':
        return Math.min(1.0, player.currentStreak / 7);

      case 'dedicated_month':
        return Math.min(1.0, player.currentStreak / 30);

      case 'warrior':
        return Math.min(1.0, player.currentStreak / 90);

      case 'legendary':
        return Math.min(1.0, player.currentStreak / 365);

      default:
        return 0.0;
    }
  }

  /**
   * Obtém descrição do progresso para UI
   */
  static getProgressDescription(achievementId: string, player: PlayerState): string {
    const progress = this.calculateAchievementProgress(achievementId, player);
    const achievement = this.getAchievement(achievementId);

    switch (achievementId) {
      case 'first_steps':
        return `${player.completedSkills.length}/1 habilidades`;

      case 'apprentice':
        return `${player.completedSkills.length}/10 habilidades`;

      case 'dedicated_student':
        return `${player.completedSkills.length}/50 habilidades`;

      case 'master':
        return `${player.completedSkills.length}/100 habilidades`;

      case 'first_week':
        return `${player.currentStreak}/7 dias`;

      case 'dedicated_month':
        return `${player.currentStreak}/30 dias`;

      case 'warrior':
        return `${player.currentStreak}/90 dias`;

      case 'legendary':
        return `${player.currentStreak}/365 dias`;

      default:
        return `${Math.floor(progress * 100)}% completo`;
    }
  }

  /**
   * Verifica se uma conquista já foi desbloqueada
   */
  static isAchievementUnlocked(achievementId: string, player: PlayerState): boolean {
    return player.achievements.some(achievement => achievement.id === achievementId);
  }

  /**
   * Obtém conquistas desbloqueadas pelo jogador
   */
  static getUnlockedAchievements(player: PlayerState): Achievement[] {
    return player.achievements;
  }

  /**
   * Obtém conquistas não desbloqueadas pelo jogador
   */
  static getLockedAchievements(player: PlayerState): Achievement[] {
    return ALL_ACHIEVEMENTS.filter(
      achievement => !this.isAchievementUnlocked(achievement.id, player)
    );
  }

  /**
   * Obtém estatísticas de conquistas
   */
  static getAchievementStats(player: PlayerState): {
    total: number;
    unlocked: number;
    locked: number;
    completionRate: number;
    categoryStats: Record<string, { total: number; unlocked: number }>;
  } {
    const total = ALL_ACHIEVEMENTS.length;
    const unlocked = player.achievements.length;
    const locked = total - unlocked;
    const completionRate = unlocked / total;

    const categoryStats: Record<string, { total: number; unlocked: number }> = {};

    ALL_ACHIEVEMENTS.forEach(achievement => {
      if (!categoryStats[achievement.category]) {
        categoryStats[achievement.category] = { total: 0, unlocked: 0 };
      }
      categoryStats[achievement.category].total++;
    });

    player.achievements.forEach(achievement => {
      if (categoryStats[achievement.category]) {
        categoryStats[achievement.category].unlocked++;
      }
    });

    return { total, unlocked, locked, completionRate, categoryStats };
  }

  /**
   * Verifica conquistas relacionadas a dificuldade
   */
  private static checkDifficultyAchievements(player: PlayerState, event: GameEvent): Achievement[] {
    const achievements: Achievement[] = [];

    // This would need skill difficulty data from event payload
    // Implementation depends on available difficulty information

    return achievements;
  }

  /**
   * Verifica conquistas relacionadas a conclusão de disciplinas
   */
  private static checkCompletionAchievements(player: PlayerState, event: GameEvent): Achievement[] {
    const achievements: Achievement[] = [];
    const completedDisciplines = this.countCompletedDisciplines(player);

    // Primeira Disciplina
    if (completedDisciplines === 1) {
      achievements.push(this.getAchievement('first_discipline'));
    }

    // Mestre de Disciplina
    if (completedDisciplines === 5) {
      achievements.push(this.getAchievement('discipline_master'));
    }

    // Polímata
    if (completedDisciplines === 10) {
      achievements.push(this.getAchievement('polymath'));
    }

    // Formado
    if (completedDisciplines === 15) {
      achievements.push(this.getAchievement('graduate'));
    }

    // Mestre Acadêmico
    if (completedDisciplines === 25) {
      achievements.push(this.getAchievement('master_scholar'));
    }

    // Formado Supremo
    if (completedDisciplines === 57) {
      achievements.push(this.getAchievement('ultimate_graduate'));
    }

    return achievements;
  }

  /**
   * Verifica conquistas relacionadas a áreas de conhecimento
   */
  private static checkSubjectAchievements(player: PlayerState, event: GameEvent): Achievement[] {
    const achievements: Achievement[] = [];
    const disciplineStats = this.getDisciplineStats(player);

    // Mestre da Estatística (ED disciplines)
    if (disciplineStats.ED >= 16) {
      achievements.push(this.getAchievement('statistics_master'));
    }

    // Mago da Física (IS disciplines)
    if (disciplineStats.IS >= 10) {
      achievements.push(this.getAchievement('physics_wizard'));
    }

    // Erudito das Humanidades (UM disciplines)
    if (disciplineStats.UM >= 31) {
      achievements.push(this.getAchievement('humanities_scholar'));
    }

    // Pessoa Renascentista (5 of each area)
    if (disciplineStats.ED >= 5 && disciplineStats.IS >= 5 && disciplineStats.UM >= 5) {
      achievements.push(this.getAchievement('renaissance_person'));
    }

    return achievements;
  }

  /**
   * Verifica conquistas relacionadas a tempo de estudo
   */
  private static checkTimeAchievements(player: PlayerState): Achievement[] {
    const achievements: Achievement[] = [];
    const totalHours = player.totalStudyTime / (1000 * 60 * 60); // Convert milliseconds to hours

    if (totalHours >= 100) {
      achievements.push(this.getAchievement('time_investor'));
    }
    if (totalHours >= 500) {
      achievements.push(this.getAchievement('dedicated_scholar'));
    }
    if (totalHours >= 1000) {
      achievements.push(this.getAchievement('time_master'));
    }
    if (totalHours >= 2000) {
      achievements.push(this.getAchievement('century_study'));
    }

    return achievements;
  }

  /**
   * Verifica conquistas especiais
   */
  private static checkSpecialAchievements(player: PlayerState, event: GameEvent): Achievement[] {
    const achievements: Achievement[] = [];

    // Círculo Completo (exactly on time)
    if (event.payload.timeSpent && event.payload.expectedTime) {
      const difference = Math.abs(event.payload.timeSpent - event.payload.expectedTime);
      if (difference < 60000) {
        // Within 1 minute
        achievements.push(this.getAchievement('full_circle'));
      }
    }

    return achievements;
  }

  // === HELPER METHODS ===

  /**
   * Conta habilidades perfeitas
   */
  private static countPerfectSkills(player: PlayerState): number {
    // Implementation would need to track perfect performances
    // For now, return estimated value
    return Math.floor(player.completedSkills.length * 0.1);
  }

  /**
   * Conta disciplinas únicas completadas
   */
  private static getUniqueDisciplinesCount(player: PlayerState): number {
    // Extract unique discipline codes from completed skill IDs
    const disciplineCodes = new Set<string>();
    player.completedSkills.forEach(skillId => {
      const parts = skillId.split('-');
      if (parts.length >= 2) {
        disciplineCodes.add(parts[0]); // Add area code (ED, IS, UM)
      }
    });
    return disciplineCodes.size;
  }

  /**
   * Verifica se completou alguma disciplina integralmente
   */
  private static hasCompletedFullDiscipline(player: PlayerState): boolean {
    // Simplified implementation - would need discipline completion data
    return player.completedSkills.length >= 10;
  }

  /**
   * Conta disciplinas completadas
   */
  private static countCompletedDisciplines(player: PlayerState): number {
    // Simplified implementation - would need discipline completion data
    return Math.floor(player.completedSkills.length / 8);
  }

  /**
   * Obtém estatísticas por área de conhecimento
   */
  private static getDisciplineStats(player: PlayerState): Record<string, number> {
    const stats: Record<string, number> = { ED: 0, IS: 0, UM: 0 };

    player.completedSkills.forEach(skillId => {
      const parts = skillId.split('-');
      if (parts.length >= 2) {
        const areaCode = parts[0];
        if (stats.hasOwnProperty(areaCode)) {
          stats[areaCode]++;
        }
      }
    });

    return stats;
  }
}
