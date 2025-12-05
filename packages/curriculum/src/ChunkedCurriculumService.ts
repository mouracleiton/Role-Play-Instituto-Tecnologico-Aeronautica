import type {
  CurriculumData,
  Discipline,
  SpecificSkill,
  CurriculumLoader,
  CurriculumValidator,
  ValidationResult,
} from '@ita-rp/shared-types';

interface DisciplineMetadata {
  id: string;
  name: string;
  description: string;
  totalSkills: number;
  totalTopics: number;
  totalAtomicTopics: number;
  fileName: string;
  fileSize: number;
  isChunked: boolean;
  chunks?: string[];
}

interface ChunkedData {
  metadata: DisciplineMetadata;
  chunks: {
    topics: Map<string, any>;
    skills: Map<string, SpecificSkill>;
    concepts: Map<string, any>;
  };
  loadedChunks: Set<string>;
}

interface LoadingProgress {
  loaded: number;
  total: number;
  currentFile?: string;
  stage: 'discovering' | 'loading-metadata' | 'loading-chunks' | 'complete';
}

export class ChunkedCurriculumService implements CurriculumLoader, CurriculumValidator {
  private disciplineMetadata: Map<string, DisciplineMetadata> = new Map();
  private chunkedData: Map<string, ChunkedData> = new Map();
  private baseUrl: string = '/';
  private loadingProgress: LoadingProgress = {
    loaded: 0,
    total: 0,
    stage: 'discovering'
  };

  constructor() {
    // Detect base URL for GitHub Pages or local deployment
    if (typeof window !== 'undefined') {
      const meta = (import.meta as any);
      this.baseUrl = meta?.env?.BASE_URL || '/';

      if (this.baseUrl === '/') {
        const pathname = window.location.pathname;
        const match = pathname.match(/^(\/[^/]+\/)/);
        if (match && window.location.hostname.includes('github.io')) {
          this.baseUrl = match[1];
        }
      }
    }
  }

  async loadCurriculum(): Promise<CurriculumData> {
    console.log('[ChunkedCurriculumService] Starting chunked curriculum loading');

    try {
      // Step 1: Discover and load metadata for all disciplines
      this.loadingProgress.stage = 'discovering';
      const metadata = await this.discoverDisciplinesMetadata();

      // Step 2: Create curriculum structure with metadata only
      this.loadingProgress.stage = 'loading-metadata';
      const areas = this.createCurriculumStructure(metadata);

      // Step 3: Load only essential data initially, rest on-demand
      this.loadingProgress.stage = 'loading-chunks';
      await this.loadEssentialData(metadata);

      this.loadingProgress.stage = 'complete';

      const curriculumData: CurriculumData = {
        formatVersion: '1.0',
        exportDate: new Date().toISOString(),
        appVersion: '2.0.0',
        curriculumData: {
          metadata: {
            startDate: '2025-01-01',
            duration: '1 Semestre',
            dailyStudyHours: '6-8 hours',
            totalAtomicSkills: areas.reduce((sum, area) => sum + area.totalSkills, 0),
            version: '2.0 - ITA RP Reborn (Chunked)',
            lastUpdated: new Date().toISOString().split('T')[0],
            institution: 'Instituto Tecnológico de Aeronáutica (ITA)',
            basedOn: 'Catálogo dos Cursos de Graduação 2025 - CC201',
          },
          areas,
          infographics: null,
          settings: null,
        },
      };

      return curriculumData;
    } catch (error) {
      console.error('[ChunkedCurriculumService] Failed to load curriculum:', error);
      throw new Error('Não foi possível carregar o currículo');
    }
  }

  async loadDiscipline(disciplineId: string): Promise<Discipline> {
    // Check if discipline is already loaded
    const chunkedData = this.chunkedData.get(disciplineId);
    if (chunkedData && this.isFullyLoaded(chunkedData)) {
      return this.reconstructDiscipline(chunkedData);
    }

    // Load discipline on-demand
    await this.loadDisciplineData(disciplineId);

    const loadedData = this.chunkedData.get(disciplineId);
    if (!loadedData) {
      throw new Error(`Disciplina ${disciplineId} não encontrada`);
    }

    return this.reconstructDiscipline(loadedData);
  }

  async loadSkill(skillId: string): Promise<SpecificSkill> {
    // Find which discipline contains this skill
    const disciplineId = this.findDisciplineForSkill(skillId);
    if (!disciplineId) {
      throw new Error(`Habilidade ${skillId} não encontrada`);
    }

    // Load the discipline if not already loaded
    await this.loadDiscipline(disciplineId);

    // Find and return the skill
    const chunkedData = this.chunkedData.get(disciplineId);
    if (chunkedData) {
      const skill = chunkedData.chunks.skills.get(skillId);
      if (skill) {
        return skill;
      }
    }

    throw new Error(`Habilidade ${skillId} não encontrada`);
  }

  validateCurriculum(data: CurriculumData): ValidationResult {
    const errors = [];
    const warnings = [];

    if (!data.curriculumData) {
      errors.push({
        code: 'MISSING_CURRICULUM_DATA',
        message: 'Dados do currículo não encontrados',
        path: 'curriculumData',
      });
    }

    if (!data.curriculumData.areas || data.curriculumData.areas.length === 0) {
      errors.push({
        code: 'MISSING_AREAS',
        message: 'Nenhuma área de conhecimento encontrada',
        path: 'curriculumData.areas',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  validatePrerequisites(skill: SpecificSkill, completedSkills: string[]): boolean {
    if (!skill.prerequisites || skill.prerequisites.length === 0) {
      return true;
    }
    return skill.prerequisites.every(prereq => completedSkills.includes(prereq));
  }

  // Progress tracking
  getLoadingProgress(): LoadingProgress {
    return { ...this.loadingProgress };
  }

  subscribeToProgress(callback: (progress: LoadingProgress) => void): () => void {
    const interval = setInterval(() => {
      callback({ ...this.loadingProgress });
    }, 100);
    return () => clearInterval(interval);
  }

  // Private methods
  private async discoverDisciplinesMetadata(): Promise<DisciplineMetadata[]> {
    const curriculumIndexUrl = `${this.baseUrl}curriculum/index.json`;
    const metadata: DisciplineMetadata[] = [];

    try {
      const response = await fetch(curriculumIndexUrl);
      if (response.ok) {
        const indexData = await response.json();
        if (Array.isArray(indexData.files)) {
          console.log(`[ChunkedCurriculumService] Processing ${indexData.files.length} files`);

          for (const filename of indexData.files) {
            try {
              const fileMetadata = await this.loadDisciplineMetadata(filename);
              if (fileMetadata) {
                metadata.push(fileMetadata);
                this.disciplineMetadata.set(fileMetadata.id, fileMetadata);
              }
            } catch (error) {
              console.warn(`[ChunkedCurriculumService] Failed to load metadata for ${filename}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error('[ChunkedCurriculumService] Failed to load curriculum index:', error);
    }

    this.loadingProgress.total = metadata.length;
    return metadata;
  }

  private async loadDisciplineMetadata(filename: string): Promise<DisciplineMetadata | null> {
    try {
      const fileUrl = `${this.baseUrl}curriculum/${encodeURIComponent(filename)}`;

      // For large files, try to get metadata via HEAD request first
      const headResponse = await fetch(fileUrl, { method: 'HEAD' });
      if (!headResponse.ok) {
        return null;
      }

      const fileSize = parseInt(headResponse.headers.get('content-length') || '0', 10);
      const disciplineCode = filename.split(' ')[0];

      // For files larger than 1MB, create chunked metadata
      if (fileSize > 1024 * 1024) {
        return {
          id: `${disciplineCode}.1`,
          name: filename.split(' - ').slice(2).join(' - ').replace('.json', ''),
          description: `Disciplina ${disciplineCode} - Carregamento dinâmico`,
          totalSkills: 0, // Will be determined when loaded
          totalTopics: 0,
          totalAtomicTopics: 0,
          fileName: filename,
          fileSize,
          isChunked: true,
          chunks: this.generateChunkList(disciplineCode)
        };
      }

      // For smaller files, load and parse partially to get metadata
      const response = await fetch(fileUrl);
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data.curriculumData?.areas?.[0]?.disciplines?.[0]) {
        const discipline = data.curriculumData.areas[0].disciplines[0];
        return {
          id: discipline.id,
          name: discipline.name,
          description: discipline.description,
          totalSkills: this.countSkills(discipline),
          totalTopics: discipline.mainTopics?.length || 0,
          totalAtomicTopics: this.countAtomicTopics(discipline),
          fileName: filename,
          fileSize,
          isChunked: false
        };
      }

      return null;
    } catch (error) {
      console.error(`[ChunkedCurriculumService] Error loading metadata for ${filename}:`, error);
      return null;
    }
  }

  private generateChunkList(disciplineCode: string): string[] {
    // Generate chunk identifiers based on typical structure
    return [
      `${disciplineCode}.metadata`,
      `${disciplineCode}.topics`,
      `${disciplineCode}.skills.1`,
      `${disciplineCode}.skills.2`,
      `${disciplineCode}.skills.3`,
      `${disciplineCode}.skills.4`,
      `${disciplineCode}.concepts`
    ];
  }

  private createCurriculumStructure(metadata: DisciplineMetadata[]): any[] {
    const areasMap = new Map<string, any>();

    metadata.forEach(disciplineMeta => {
      const prefix = disciplineMeta.id.split('-')[0];
      const areaName = this.getAreaName(prefix);

      if (!areasMap.has(areaName)) {
        areasMap.set(areaName, {
          id: this.getAreaId(prefix),
          name: areaName,
          description: this.getAreaDescription(areaName),
          totalSkills: 0,
          disciplines: []
        });
      }

      const area = areasMap.get(areaName);
      area.disciplines.push({
        id: disciplineMeta.id,
        name: disciplineMeta.name,
        description: disciplineMeta.description,
        totalSkills: disciplineMeta.totalSkills,
        isChunked: disciplineMeta.isChunked,
        metadata: disciplineMeta
      });
      area.totalSkills += disciplineMeta.totalSkills;
    });

    return Array.from(areasMap.values());
  }

  private getAreaName(prefix: string): string {
    const areaNames: Record<string, string> = {
      'AT': 'Matemática Aplicada',
      'CI': 'Computação',
      'DI': 'Engenharia de Infraestrutura',
      'EA': 'Engenharia Aeronáutica',
      'EB': 'Engenharia Básica',
      'ED': 'Estatística e Decisão',
      'EO': 'Engenharia de Obras',
      'ES': 'Engenharia de Software',
      'ID': 'Engenharia de Infraestrutura',
      'IS': 'Ciências Exatas',
      'MC': 'Matemática Computacional',
      'MT': 'Máquinas e Turbinas',
      'PD': 'Projeto e Desenvolvimento',
      'PG': 'Projeto Gráfico',
      'PP': 'Projeto e Produção',
      'PS': 'Processos e Sistemas',
      'RA': 'Engenharia Aeronáutica',
      'RJ': 'Engenharia Aeroespacial',
      'RP': 'Propulsão',
      'SC': 'Sistemas de Computação',
      'SI': 'Sistemas de Informação',
      'SP': 'Sistemas Espaciais',
      'ST': 'Estruturas',
      'TC': 'Teoria da Computação',
      'TM': 'Materiais',
      'TP': 'Tecnologia e Produção',
      'UI': 'Química',
      'UM': 'Humanidades',
      'VO': 'Voo e Operações',
      'XT': 'Extensão'
    };
    return areaNames[prefix] || 'Outra Área';
  }

  private getAreaId(prefix: string): string {
    const areaIds: Record<string, string> = {
      'AT': '1', 'CI': '2', 'DI': '3', 'EA': '4', 'EB': '5', 'ED': '6',
      'EO': '7', 'ES': '8', 'ID': '9', 'IS': '10', 'MC': '11', 'MT': '12',
      'PD': '13', 'PG': '14', 'PP': '15', 'PS': '16', 'RA': '17', 'RJ': '18',
      'RP': '19', 'SC': '20', 'SI': '21', 'SP': '22', 'ST': '23', 'TC': '24',
      'TM': '25', 'TP': '26', 'UI': '27', 'UM': '28', 'VO': '29', 'XT': '30'
    };
    return areaIds[prefix] || '99';
  }

  private getAreaDescription(areaName: string): string {
    const descriptions: Record<string, string> = {
      'Matemática Aplicada': 'Fundamentos matemáticos para engenharia',
      'Computação': 'Ciência da computação e programação',
      'Engenharia de Infraestrutura': 'Construções civis e infraestrutura',
      'Engenharia Aeronáutica': 'Projetos e sistemas aeronáuticos',
      'Engenharia Básica': 'Fundamentos de engenharia',
      'Estatística e Decisão': 'Análise de dados e tomada de decisão',
      'Engenharia de Obras': 'Projetos e gerenciamento de obras',
      'Engenharia de Software': 'Desenvolvimento de software',
      'Ciências Exatas': 'Física, química e ciências básicas',
      'Matemática Computacional': 'Métodos computacionais aplicados',
      'Máquinas e Turbinas': 'Sistemas mecânicos e propulsão',
      'Projeto e Desenvolvimento': 'Metodologia de projetos',
      'Projeto Gráfico': 'Representação gráfica e desenho',
      'Projeto e Produção': 'Processos produtivos e industriais',
      'Processos e Sistemas': 'Sistemas e processos industriais',
      'Engenharia Aeronáutica': 'Operações aeroportuárias',
      'Engenharia Aeroespacial': 'Projetos espaciais',
      'Propulsão': 'Motores e sistemas de propulsão',
      'Sistemas de Computação': 'Arquitetura e sistemas',
      'Sistemas de Informação': 'Sistemas de informação empresarial',
      'Sistemas Espaciais': 'Tecnologia espacial',
      'Estruturas': 'Análise e projeto estrutural',
      'Teoria da Computação': 'Fundamentos teóricos',
      'Materiais': 'Ciência e engenharia de materiais',
      'Tecnologia e Produção': 'Processos produtivos',
      'Química': 'Fundamentos químicos',
      'Humanidades': 'Ciências humanas e sociais',
      'Voo e Operações': 'Operações aéreas',
      'Extensão': 'Atividades de extensão universitária'
    };
    return descriptions[areaName] || 'Área de conhecimento';
  }

  private async loadEssentialData(metadata: DisciplineMetadata[]): Promise<void> {
    // Load only non-chunked disciplines initially
    const nonChunked = metadata.filter(m => !m.isChunked);

    for (const meta of nonChunked) {
      try {
        await this.loadDisciplineData(meta.id);
        this.loadingProgress.loaded++;
      } catch (error) {
        console.warn(`[ChunkedCurriculumService] Failed to load ${meta.id}:`, error);
      }
    }

    console.log(`[ChunkedCurriculumService] Loaded ${nonChunked.length} disciplines initially`);
  }

  private async loadDisciplineData(disciplineId: string): Promise<void> {
    const metadata = this.disciplineMetadata.get(disciplineId);
    if (!metadata) {
      throw new Error(`Metadata not found for discipline ${disciplineId}`);
    }

    if (metadata.isChunked) {
      await this.loadChunkedDiscipline(metadata);
    } else {
      await this.loadCompleteDiscipline(metadata);
    }
  }

  private async loadCompleteDiscipline(metadata: DisciplineMetadata): Promise<void> {
    const fileUrl = `${this.baseUrl}curriculum/${encodeURIComponent(metadata.fileName)}`;
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to load ${metadata.fileName}`);
    }

    const data = await response.json();
    if (data.curriculumData?.areas?.[0]?.disciplines?.[0]) {
      const discipline = data.curriculumData.areas[0].disciplines[0];

      const chunkedData: ChunkedData = {
        metadata,
        chunks: {
          topics: new Map(),
          skills: new Map(),
          concepts: new Map()
        },
        loadedChunks: new Set(['complete'])
      };

      // Extract all data into maps for easy access
      this.extractDisciplineData(discipline, chunkedData.chunks);
      this.chunkedData.set(disciplineId, chunkedData);
    }
  }

  private async loadChunkedDiscipline(metadata: DisciplineMetadata): Promise<void> {
    // For now, load the complete file but in chunks
    // In a future implementation, this could load separate chunk files
    const fileUrl = `${this.baseUrl}curriculum/${encodeURIComponent(metadata.fileName)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
      const response = await fetch(fileUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to load ${metadata.fileName}`);
      }

      const data = await response.json();
      if (data.curriculumData?.areas?.[0]?.disciplines?.[0]) {
        const discipline = data.curriculumData.areas[0].disciplines[0];

        const chunkedData: ChunkedData = {
          metadata: {
            ...metadata,
            totalSkills: this.countSkills(discipline),
            totalTopics: discipline.mainTopics?.length || 0,
            totalAtomicTopics: this.countAtomicTopics(discipline)
          },
          chunks: {
            topics: new Map(),
            skills: new Map(),
            concepts: new Map()
          },
          loadedChunks: new Set(['metadata', 'topics'])
        };

        // Load only essential data initially
        this.extractEssentialDisciplineData(discipline, chunkedData.chunks);
        this.chunkedData.set(disciplineId, chunkedData);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private extractDisciplineData(discipline: any, chunks: any): void {
    // Extract all data
    discipline.mainTopics?.forEach((topic: any) => {
      chunks.topics.set(topic.id, topic);

      topic.atomicTopics?.forEach((atomicTopic: any) => {
        atomicTopic.individualConcepts?.forEach((concept: any) => {
          chunks.concepts.set(concept.id, concept);

          concept.specificSkills?.forEach((skill: any) => {
            chunks.skills.set(skill.id, skill);
          });
        });

        // Handle skills directly under atomicTopic
        if (atomicTopic.specificSkills) {
          atomicTopic.specificSkills.forEach((skill: any) => {
            chunks.skills.set(skill.id, skill);
          });
        }
      });
    });
  }

  private extractEssentialDisciplineData(discipline: any, chunks: any): void {
    // Extract only topics and basic structure, skills loaded on demand
    discipline.mainTopics?.forEach((topic: any) => {
      chunks.topics.set(topic.id, {
        ...topic,
        atomicTopics: topic.atomicTopics?.map((at: any) => ({
          id: at.id,
          name: at.name,
          description: at.description,
          // Don't load detailed skills yet
        }))
      });
    });
  }

  private async loadDetailedSkillData(disciplineId: string, skillIds: string[]): Promise<void> {
    const chunkedData = this.chunkedData.get(disciplineId);
    const metadata = this.disciplineMetadata.get(disciplineId);

    if (!chunkedData || !metadata || !metadata.isChunked) {
      return;
    }

    // Load detailed data for specific skills
    const fileUrl = `${this.baseUrl}curriculum/${encodeURIComponent(metadata.fileName)}`;
    const response = await fetch(fileUrl);
    if (!response.ok) {
      return;
    }

    const data = await response.json();
    const discipline = data.curriculumData.areas[0].disciplines[0];

    // Extract only requested skills
    discipline.mainTopics?.forEach((topic: any) => {
      topic.atomicTopics?.forEach((atomicTopic: any) => {
        atomicTopic.individualConcepts?.forEach((concept: any) => {
          concept.specificSkills?.forEach((skill: any) => {
            if (skillIds.includes(skill.id)) {
              chunkedData.chunks.skills.set(skill.id, skill);
              chunkedData.chunks.concepts.set(concept.id, concept);
            }
          });
        });
      });
    });
  }

  private reconstructDiscipline(chunkedData: ChunkedData): Discipline {
    // Reconstruct discipline from chunked data
    const topics = Array.from(chunkedData.chunks.topics.values());

    return {
      id: chunkedData.metadata.id,
      name: chunkedData.metadata.name,
      description: chunkedData.metadata.description,
      mainTopics: topics.map(topic => {
        // Reconstruct atomic topics with skills
        const atomicTopics = topic.atomicTopics?.map((at: any) => {
          const skills: any[] = [];
          chunkedData.chunks.concepts.forEach((concept, conceptId) => {
            if (concept.specificSkills) {
              skills.push(...concept.specificSkills.filter((skill: any) =>
                chunkedData.chunks.skills.has(skill.id)
              ));
            }
          });

          return {
            ...at,
            individualConcepts: Array.from(chunkedData.chunks.concepts.values())
          };
        });

        return {
          ...topic,
          atomicTopics
        };
      }),
      totalSkills: chunkedData.metadata.totalSkills
    };
  }

  private isFullyLoaded(chunkedData: ChunkedData): boolean {
    return chunkedData.loadedChunks.has('complete') ||
           (chunkedData.loadedChunks.has('metadata') &&
            chunkedData.loadedChunks.has('topics') &&
            chunkedData.chunks.skills.size > 0);
  }

  private findDisciplineForSkill(skillId: string): string | null {
    for (const [disciplineId, chunkedData] of this.chunkedData.entries()) {
      if (chunkedData.chunks.skills.has(skillId)) {
        return disciplineId;
      }
    }
    return null;
  }

  private countSkills(discipline: any): number {
    let count = 0;
    discipline.mainTopics?.forEach((topic: any) => {
      topic.atomicTopics?.forEach((atomicTopic: any) => {
        atomicTopic.individualConcepts?.forEach((concept: any) => {
          count += concept.specificSkills?.length || 0;
        });
        count += atomicTopic.specificSkills?.length || 0;
      });
    });
    return count;
  }

  private countAtomicTopics(discipline: any): number {
    let count = 0;
    discipline.mainTopics?.forEach((topic: any) => {
      count += topic.atomicTopics?.length || 0;
    });
    return count;
  }
}

// Singleton instance
export const chunkedCurriculumService = new ChunkedCurriculumService();