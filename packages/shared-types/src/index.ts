// Re-export all types from a single file to avoid circular dependencies

// Core curriculum types
export interface CurriculumData {
  formatVersion: string;
  exportDate: string;
  appVersion: string;
  curriculumData: Curriculum;
}

export interface Curriculum {
  metadata: CurriculumMetadata;
  areas: Area[];
  infographics: null;
  settings: null;
}

export interface CurriculumMetadata {
  startDate: string;
  duration: string;
  dailyStudyHours: string;
  totalAtomicSkills: number;
  version: string;
  lastUpdated: string;
  institution: string;
  basedOn: string;
}

export interface Area {
  id: string;
  name: string;
  description: string;
  totalSkills: number;
  percentage: number;
  disciplines: Discipline[];
}

export interface Discipline {
  id: string;
  name: string;
  description: string;
  totalSkills: number;
  mainTopics: MainTopic[];
}

export interface MainTopic {
  id: string;
  name: string;
  description: string;
  totalSkills: number;
  atomicTopics: AtomicTopic[];
}

export interface AtomicTopic {
  id: string;
  name: string;
  description: string;
  individualConcepts: IndividualConcept[];
}

export interface IndividualConcept {
  id: string;
  name: string;
  description: string;
  specificSkills: SpecificSkill[];
}

export interface SpecificSkill {
  id: string;
  name: string;
  description: string;
  atomicExpansion: AtomicExpansion;
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  status: 'not_started' | 'in_progress' | 'completed';
  prerequisites: string[];
}

export interface AtomicExpansion {
  steps: LearningStep[];
  practicalExample: string;
  finalVerifications: string[];
  assessmentCriteria: string[];
  crossCurricularConnections: string[];
  realWorldApplication: string;
}

export interface LearningStep {
  stepNumber: number;
  title: string;
  subSteps: string[];
  verification: string;
  estimatedTime: string;
  materials: string[];
  tips: string;
  learningObjective: string;
  commonMistakes: string[];
}

// Player and game state
export interface PlayerState {
  id: string;
  name: string;
  level: number;
  xp: number;
  currentRank: Rank;
  completedSkills: string[];
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
  totalStudyTime: number;
  achievements: Achievement[];
  settings: PlayerSettings;
}

export interface Rank {
  id: string;
  name: string;
  level: number;
  icon: string;
  requirements: RankRequirements;
}

export interface RankRequirements {
  level: number;
  xp: number;
  completedDisciplines: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  category:
    | 'study'
    | 'streak'
    | 'completion'
    | 'social'
    | 'subject'
    | 'difficulty'
    | 'time'
    | 'special';
}

export interface PlayerSettings {
  theme: 'neonBlue' | 'matrixGreen' | 'cyberPurple' | 'retroOrange';
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  language: 'pt-BR' | 'en-US';
  studyReminders: boolean;
}

export interface GameState {
  player: PlayerState;
  currentDiscipline: Discipline | null;
  currentSkill: SpecificSkill | null;
  currentStep: number;
  studySession: StudySession | null;
  curriculum: Curriculum | null;
}

export interface StudySession {
  id: string;
  skillId: string;
  startTime: Date;
  endTime?: Date;
  completedSteps: number;
  totalSteps: number;
  performance: number;
  notes: string[];
}

export interface GameEvent {
  type: 'skill_completed' | 'level_up' | 'achievement_unlocked' | 'streak_updated' | 'discipline_completed';
  payload: any;
  timestamp: Date;
}

// Progress tracking
export interface ProgressState {
  totalSkills: number;
  completedSkills: number;
  skillsByDiscipline: Record<string, DisciplineProgress>;
  weeklyStats: WeeklyStats;
  monthlyStats: MonthlyStats;
}

export interface DisciplineProgress {
  disciplineId: string;
  completedSkills: number;
  totalSkills: number;
  completionPercentage: number;
  lastStudiedAt?: Date;
}

export interface WeeklyStats {
  weekStart: Date;
  studyTime: number;
  skillsCompleted: number;
  averagePerformance: number;
  streakDays: number;
}

export interface MonthlyStats {
  month: Date;
  studyTime: number;
  skillsCompleted: number;
  averagePerformance: number;
  longestStreak: number;
}

// Game engine interfaces
export interface GameEngine {
  initialize(): Promise<void>;
  startScene(sceneId: string): Promise<void>;
  stopScene(sceneId: string): Promise<void>;
  getCurrentScene(): Scene | null;
  getScenes(): Scene[];
}

export interface Scene {
  id: string;
  name: string;
  type: 'menu' | 'study' | 'progress' | 'settings' | 'achievement';
  initialize(): Promise<void>;
  update(deltaTime: number): void;
  render(): void;
  destroy(): void;
}

export interface SceneConfig {
  id: string;
  name: string;
  type: Scene['type'];
  assets?: AssetConfig[];
  backgroundColor?: string;
  music?: string;
}

export interface TransitionConfig {
  type: 'fade' | 'slide' | 'zoom' | 'none';
  duration: number;
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export interface AssetConfig {
  key: string;
  path: string;
  type: 'image' | 'audio' | 'video' | 'json';
  preload?: boolean;
}

export interface InputManager {
  initialize(): void;
  addKeyboardHandler(key: string, callback: () => void): void;
  addMouseHandler(event: string, callback: (event: MouseEvent) => void): void;
  addTouchHandler(event: string, callback: (event: TouchEvent) => void): void;
  removeHandler(id: string): void;
}

export interface AudioManager {
  initialize(): Promise<void>;
  playSound(soundKey: string, volume?: number): void;
  playMusic(musicKey: string, loop?: boolean, volume?: number): void;
  stopMusic(): void;
  setMasterVolume(volume: number): void;
  setMusicVolume(volume: number): void;
  setSoundVolume(volume: number): void;
}

export interface SceneManager {
  createScene(config: SceneConfig): Scene;
  getScene(sceneId: string): Scene | null;
  transitionTo(sceneId: string, transition?: TransitionConfig): Promise<void>;
  preloadAssets(assets: AssetConfig[]): Promise<void>;
}

export interface AnimationManager {
  createAnimation(config: AnimationConfig): string;
  playAnimation(target: any, animationKey: string): void;
  stopAnimation(target: any, animationKey: string): void;
  hasAnimation(animationKey: string): boolean;
}

export interface AnimationConfig {
  key: string;
  frames: number[] | string[];
  frameRate: number;
  repeat: number;
  yoyo?: boolean;
}

// UI Components
export interface UIComponent {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  visible: boolean;
  interactive: boolean;
  render(): void;
  update(deltaTime: number): void;
  destroy(): void;
}

export interface Button extends UIComponent {
  text: string;
  onClick: () => void;
  hoverState?: 'normal' | 'hover' | 'pressed';
}

export interface ProgressBar extends UIComponent {
  progress: number;
  maxValue: number;
  showText?: boolean;
  color?: string;
  backgroundColor?: string;
}

export interface Text extends UIComponent {
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  align: 'left' | 'center' | 'right';
}

export interface Modal extends UIComponent {
  title: string;
  content: string;
  buttons: Button[];
  closable: boolean;
  show(): void;
  hide(): void;
}

// Curriculum management
export interface CurriculumLoader {
  loadCurriculum(): Promise<CurriculumData>;
  loadDiscipline(disciplineId: string): Promise<Discipline>;
  loadSkill(skillId: string): Promise<SpecificSkill>;
}

export interface CurriculumValidator {
  validateCurriculum(data: CurriculumData): ValidationResult;
  validatePrerequisites(skill: SpecificSkill, completedSkills: string[]): boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  path: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  path: string;
}

export interface CurriculumFilter {
  discipline?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  status?: 'not_started' | 'in_progress' | 'completed';
  hasPrerequisites?: boolean;
  searchQuery?: string;
}

export interface CurriculumSearch {
  searchSkills(query: string, filter?: CurriculumFilter): Promise<SpecificSkill[]>;
  searchDisciplines(query: string): Promise<Discipline[]>;
  getRecommendedSkills(playerState: PlayerState): Promise<SpecificSkill[]>;
}

// Player management
export interface PlayerManager {
  createPlayer(name: string): Promise<PlayerState>;
  loadPlayer(playerId: string): Promise<PlayerState>;
  savePlayer(player: PlayerState): Promise<void>;
  deletePlayer(playerId: string): Promise<void>;
}

export interface ProgressCalculator {
  calculateLevel(xp: number): number;
  calculateXpForLevel(level: number): number;
  calculateXPReward(skill: SpecificSkill, performance: number, timeSpent: number): number;
  calculateStreakBonus(streak: number): number;
}

export interface RankSystem {
  getCurrentRank(level: number): Rank;
  getNextRank(currentRank: Rank): Rank | null;
  getAllRanks(): Rank[];
  checkRankUp(player: PlayerState): Rank | null;
}

export interface AchievementSystem {
  checkAchievements(player: PlayerState, event: GameEvent): Achievement[];
  unlockAchievement(playerId: string, achievementId: string): Promise<void>;
  getAchievementsByCategory(category: string): Achievement[];
  getTotalAchievements(): number;
}

export interface PlayerStats {
  totalStudyTime: number;
  averageSessionTime: number;
  skillsPerHour: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  favoriteDiscipline: string;
  mostProductiveHour: number;
  weeklyGoal: number;
  monthlyGoal: number;
}
