import type {
  CurriculumData,
  Discipline,
  SpecificSkill,
  CurriculumLoader,
  CurriculumValidator,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from '@ita-rp/shared-types';

export class ChunkedCurriculumService implements CurriculumLoader, CurriculumValidator {
  private curriculumCache: CurriculumData | null = null;
  private disciplineCache: Map<string, Discipline> = new Map();
  private skillCache: Map<string, SpecificSkill> = new Map();

  async loadCurriculum(): Promise<CurriculumData> {
    // Similar to CurriculumService but with chunking logic
    if (this.curriculumCache) {
      return this.curriculumCache;
    }

    try {
      // Load all JSON files from the public/curriculum directory
      // Note: Filenames must match exactly what's in apps/web-app/public/curriculum/
      const curriculumFiles = [
        'AT-17 - 17 - Vetores  e  Geometria  Analítica.json',
        'AT-22 - 22 - Cálculo Diferencial e Integral II.json',
        'AT-27 - 27 - Álgebra Linear.json',
        'AT-32 - 32 - Equações  Diferenciais  Ordinárias.json',
        'AT-36 - 36 - Cálculo Vetorial.json',
        'AT-42 - 42 - Equações  Diferenciais  Parciais.json',
        'AT-46 - 46 - Funções  de  Variável  Complexa.json',
        'AT-52 - 52 - Espaços  Métricos.json',
        'AT-53 - 53 - Introdução à Teoria da Medida e Integração.json',
        'AT-54 - 54 - Introdução à Análise Funcional.json',
        'AT-55 - 55 - Álgebra   Linear   Computacional.json',
        'AT-56 - 56 - Introdução à Análise Diferencial.json',
        'AT-57 - 57 - Introdução  à Análise Integral.json',
        'AT-58 - 58 - Introdução à teoria de conjuntos.json',
        'AT-61 - 61 - Tópicos Avançados em Equações Diferenciais Ordinárias.json',
        'AT-71 - 71 - Introdução  à  Geometria  Diferencial.json',
        'AT-72 - 72 - Introdução à Topologia Diferencial.json',
        'AT-73 - 73 - Geometria  Euclidiana  Axiomática.json',
        'AT-80 - 80 - História da Matemática.json',
        'AT-81 - 81 - Introdução  à  Teoria  dos  Números.json',
        'AT-82 - 82 - Anéis e Corpos.json',
        'AT-83 - 83 - Grupos e Introdução à Teoria de Galois.json',
        'AT-91 - 91 - Análise Numérica I.json',
        'AT-92 - 92 - Análise Numérica II.json',
        'AT-93 - 93 - O método de simetrias em equações diferenciais (Nota 4).json',
        'CI-22 - 22 - Matemática  Computacional.json',
        'DI-31 - 31 - Análise Estrutural I.json',
        'DI-32 - 32 - Análise  Estrutural II.json',
        'DI-33 - 33 - Materiais e Processos Construtivos.json',
        'DI-37 - 37 - Soluções  Computacionais  de  Problemas  da Engenharia  Civil.json',
        'DI-38 - 38 - Concreto  Estrutural I.json',
        'DI-46 - 46 - Estruturas de Aço.json',
        'DI-48 - 48 - Planejamento e Gerenciamento de Obras.json',
        'DI-49 - 49 - Concreto Estrutural II.json',
        'DI-64 - 64 - Arquitetura e Urbanismo.json',
        'DI-65 - 65 - Pontes.json',
        'EA-01 - 01 - Colóquios em Engenharia Aeronáutica e Aeroespacial (Notas 3 e 6).json',
        'EB-01 - 01 - Termodinâmica.json',
        'EB-13 - 13 - Termodinâmica  Aplicada.json',
        'EB-22 - 22 - Mecânica  de  Fluidos  I.json',
        'EB-23 - 23 - Mecânica  de  Fluidos  II.json',
        'EB-25 - 25 - Transferência de Calor.json',
        'EB-32 - 32 - Ar Condicionado.json',
        'ED-01 - 01 - Mecânica dos Fluidos.json',
        'ED-11 - 11 - Aerodinâmica  Básica.json',
        'ED-13 - 13 - Probabilidade e Estatística.json',
        'ED-16 - 16 - Análise  de  Regressão  (Nota  6).json',
        'ED-17 - 17 - Análise de Séries Temporais (Nota 6).json',
        'ED-18 - 18 - Estatística Aplicada a Experimentos (Nota 6).json',
        'ED-19 - 19 - Métodos  de Análise  em  Negócios  (Nota 6).json',
        'ED-20 - 20 - Análise preditiva de dados em negócios.json',
        'ED-25 - 25 - Tópicos  em  Marketing  Analítico  (Nota  6).json',
        'ED-26 - 26 - Pesquisa  Operacional.json',
        'ED-28 - 28 - Aerodinâmica em Regime Supersônico.json',
        'ED-34 - 34 - Aerodinâmica Aplicada a Projeto de Aeronave.json',
        'ED-41 - 41 - Fundamentos de Ensaios em Túneis de Vento (Nota 4).json',
        'ED-45 - 45 - Gestão de Operações.json',
        'ED-51 - 51 - Fundamentos em Inovacao Empreendedorismo Desenvolvimento de Produtos e Servicos.json',
        'ED-53 - 53 - Gestão  Estratégica  da  Inovação  Tecnológica.json',
        'ED-54 - 54 - Inteligência Artificial para o Gestor Contemporâneo.json',
        'ED-61 - 61 - Administração em  Engenharia.json',
        'ED-62 - 62 - Pensamento  Estratégico.json',
        'ED-63 - 63 - Pensamento Sistêmico.json',
        'ED-64 - 64 - Criação de Negócios Tecnológicos.json',
        'ED-74 - 74 - Desenvolvimento Econômico.json',
        'EO-31 - 31 - Geologia de Engenharia.json',
        'EO-36 - 36 - Engenharia Geotécnica I.json',
        'EO-45 - 45 - Engenharia Geotécnica II.json',
        'EO-47 - 47 - Topografia  e  Geoprocessamento.json',
        'EO-48 - 48 - Engenharia de Pavimentos.json',
        'EO-53 - 53 - Engenharia  de  Fundações.json',
        'EO-55 - 55 - Projeto  e  Construção  de  Pistas.json',
        'ES-10 - 10 - Introdução à Computação.json',
        'ES-11 - 11 - Algoritmos e Estruturas de Dados.json',
        'ID-31 - 31 - Fenômenos de Transporte.json',
        'ID-32 - 32 - Hidráulica.json',
        'ID-41 - 41 - Hidrologia e Drenagem.json',
        'ID-43 - 43 - Instalações Prediais.json',
        'ID-44 - 44 - Saneamento.json',
        'ID-53 - 53 - Análise Ambiental de Projetos.json',
        'ID-65 - 65 - Engenharia para o Ambiente e Sustentabilidade.json',
        'IS-02 - 02 - Gestão de Projetos.json',
        'IS-04 - 04 - Engenharia de Sistemas.json',
        'IS-06 - 06 - Confiabilidade  de  Sistemas.json',
        'IS-08 - 08 - Verificação e Qualidade de Sistemas Aeroespaciais.json',
        'IS-10 - 10 - Análise  da  Segurança  de  Sistemas Aeronáuticos  e  Espaciais.json',
        'IS-15 - 15 - Mecânica  I.json',
        'IS-16 - 16 - Física Experimental I (Nota 4).json',
        'IS-20 - 20 - SISTEMAS DE SOLO.json',
        'IS-27 - 27 - Mecânica II.json',
        'IS-28 - 28 - Física  Experimental  II (Nota  4).json',
        'IS-32 - 32 - Eletricidade e Magnetismo.json',
        'IS-46 - 46 - Ondas  e  Física  Moderna.json',
        'IS-50 - 50 - Introdução à Física Moderna.json',
        'IS-55 - 55 - Detecção  de  Ondas  Gravitacionais.json',
        'IS-71 - 71 - Fundamentos de Gases Ionizados.json',
        'IS-80 - 80 - Fundamentos de Anatomia e Fisiologia Humanas para Engenheiros.json',
        'MC-11 - 11 - Fundamentos de Análise de Dados.json',
        'MC-13 - 13 - Introdução à Ciência de Dados.json',
        'MC-30 - 30 - Fundamentos de Computação Gráfica.json',
        'MC-37 - 37 - Simulação  de  Sistemas  Discretos.json',
        'MT-01 - 01 - Máquinas  de  Fluxo.json',
        'MT-02 - 02 - Turbinas  a  Gás.json',
        'MT-05 - 05 - Motores a Pistão.json',
        'MT-07 - 07 - Turbobombas.json',
        'PD-11 - 11 - Dinâmica  de  Máquinas.json',
        'PD-42 - 42 - Vibrações Mecânicas.json',
        'PD-43 - 43 - Introdução aos Materiais e Estruturas Inteligentes.json',
        'PG-03 - 03 - Desenho  Técnico.json',
        'PG-04 - 04 - Desenho  Assistido  por  Computador.json',
        'PG-05 - 05 - Fundamentos  de  Desenho  Técnico.json',
        'PP-17 - 17 - Introdução  à  Tecnologia  Aeronáutica.json',
        'PP-18 - 18 - Projeto  e  Construção  de  Veículos.json',
        'PP-22 - 22 - Elementos  de  Máquinas  I.json',
        'PP-23 - 23 - Elementos de Máquinas II.json',
        'PP-24 - 24 - Análise  Estrutural  I.json',
        'PP-30 - 30 - Manutenção.json',
        'PP-31 - 31 - Análise Estrutural II.json',
        'PP-34 - 34 - Elementos Finitos.json',
        'PS-22 - 22 - Sinais e Sistemas Dinâmicos.json',
        'PS-30 - 30 - Sistemas de Aeronaves.json',
        'PS-36 - 36 - Modelagem e Simulação de Sistemas Dinâmicos.json',
        'PS-39 - 39 - Dispositivos  de  Sistemas  Mecatrônicos.json',
        'PS-43 - 43 - Sistemas  de  Controle.json',
        'PS-46 - 46 - Projeto de Sistemas Mecatrônicos.json',
        'PS-76 - 76 - Controle Avançado de Sistemas Monovariáveis.json',
        'RA-39 - 39 - Planejamento  e  Projeto  de  Aeroportos.json',
        'RA-46 - 46 - Economia  Aplicada.json',
        'RA-57 - 57 - Operações  em  Aeroportos.json',
        'RJ-22 - 22 - Projeto Conceitual de Aeronave.json',
        'RJ-23 - 23 - Projeto Preliminar de Aeronave.json',
        'RJ-32 - 32 - Projeto e Construção de Sistemas Aeroespaciais.json',
        'RJ-34 - 34 - Engenharia de Veículos Espaciais.json',
        'RJ-70 - 70 - Fabricação em Material Compósito.json',
        'RJ-72 - 72 - Desenvolvimento, Construção e Teste de Sistema Aeroespacial A (Notas 2 e 3).json',
        'RJ-73 - 73 - Projeto  Conceitual  de  Sistemas  Aeroespaciais.json',
        'RJ-74 - 74 - Desenvolvimento, Construção e Teste de Sistema Aeroespacial B (Notas 2 e 3).json',
        'RJ-75 - 75 - Projeto  Avançado  de  Sistemas  Aeroespaciais.json',
        'RJ-78 - 78 - Valores, Empreendedorismo e Liderança.json',
        'RJ-81 - 81 - Evolução  da  Tecnologia  Aeronáutica.json',
        'RJ-85 - 85 - Certificação Aeronáutica.json',
        'RJ-87 - 87 - Manutenção  Aeronáutica.json',
        'RP-28 - 28 - Transferência   de   Calor   e   Termodinâmica   Aplicada.json',
        'RP-38 - 38 - Propulsão Aeronáutica I.json',
        'RP-40 - 40 - Propulsão Aeronáutica II.json',
        'RP-41 - 41 - Motor-Foguete  a  Propelente  Líquido.json',
        'RP-42 - 42 - Tópicos  Práticos  em  Propulsão  Aeronáutica.json',
        'RP-47 - 47 - Projeto  de  Motor  Foguete  Híbrido.json',
        'RP-63 - 63 - Meio Ambiente e Emissões do Setor Aeronáutico.json',
        'SC-02 - 02 - Computação  Móvel  e  Ubíqua.json',
        'SC-04 - 04 - Análise  e  Exploração  de  Códigos  Binários.json',
        'SC-07 - 07 - Fundamentos de Segurança Cibernética.json',
        'SC-25 - 25 - Arquiteturas  para  Alto  Desempenho.json',
        'SC-27 - 27 - Processamento Distribuído.json',
        'SC-33 - 33 - Sistemas Operacionais.json',
        'SC-35 - 35 - Redes de Computadores e Internet.json',
        'SC-64 - 64 - Programação Paralela.json',
        'SI-01 - 01 - Gerenciamento  Ágil  de  Projetos  de  TI.json',
        'SI-02 - 02 - Arquitetura  Orientada  a  Serviços.json',
        'SI-03 - 03 - Arquitetura de Software para Serviços de Informação Aeronáutica.json',
        'SI-22 - 22 - Programação Orientada a Objetos.json',
        'SI-26 - 26 - Desenvolvimento  de  Aplicações  para  a  Internet.json',
        'SI-28 - 28 - Fundamentos de Engenharia de Software.json',
        'SI-29 - 29 - Engenharia de Software.json',
        'SI-30 - 30 - Técnicas    de    Banco    de    Dados.json',
        'SI-65 - 65 - Projeto  de  Sistemas  Embarcados.json',
        'SP-04 - 04 - Integração  e  Testes  de  Veículos  Espaciais.json',
        'SP-06 - 06 - Ambiente Espacial.json',
        'SP-29 - 29 - Sinais  Aleatórios  e  Sistemas  Dinâmicos.json',
        'SP-65 - 65 - Navegação,  Posicionamento  e  Guiamento  com  Base  na  Fusão  de  Sensores.json',
        'ST-10 - 10 - Mecânica dos Sólidos.json',
        'ST-15 - 15 - Estruturas  Aeroespaciais  I.json',
        'ST-25 - 25 - Estruturas   Aeroespaciais   II.json',
        'ST-56 - 56 - Dinâmica Estrutural e Aeroelasticidade.json',
        'ST-57 - 57 - Dinâmica  de  Estruturas  Aeroespaciais  e  Aeroelasticidade.json',
        'TC-12 - 12 - Projeto  e  Análise  de  Algoritmos.json',
        'TC-23 - 23 - Análise de Algoritmos e Complexidade Computacional.json',
        'TC-34 - 34 - Automata e Linguagens Formais.json',
        'TC-41 - 41 - Compiladores.json',
        'TC-42 - 42 - Introdução à Criptografia.json',
        'TC-55 - 55 - Algoritmos  Avançados.json',
        'TM-15 - 15 - Engenharia  de  Materiais  I.json',
        'TM-25 - 25 - Engenharia de Materiais II.json',
        'TM-30 - 30 - Introdução a Materiais Aeroespaciais.json',
        'TM-31 - 31 - Seleção de Materiais em Engenharia Mecânica.json',
        'TM-33 - 33 - Tecnologia  de  Vácuo.json',
        'TM-34 - 34 - Tecnologia de Soldagem.json',
        'TM-35 - 35 - Engenharia  de  Materiais.json',
        'TP-03 - 03 - Introdução à Engenharia (Nota 4).json',
        'TP-34 - 34 - Processos  de  Fabricação  I.json',
        'TP-45 - 45 - Processos de Fabricação II.json',
        'TP-46 - 46 - Sustentabilidade  dos  Processos  de  Fabricação.json',
        'TP-47 - 47 - Processos  não  Convencionais  de  Fabricação.json',
        'UI-18 - 18 - Química Geral I.json',
        'UI-28 - 28 - Química  Geral  II.json',
        'UI-31 - 31 - Sistemas Eletroquímicos de Conversão e Armazenamento de Energia.json',
        'UI-32 - 32 - Fundamentos de Eletroquímica e Corrosão.json',
        'UM-01 - 01 - Epistemologia  e  Filosofia  da  Ciência.json',
        'UM-02 - 02 - Ética.json',
        'UM-04 - 04 - Filosofia e Ficção Científica.json',
        'UM-05 - 05 - Filosofia da história.json',
        'UM-06 - 06 - Filosofia política clássica.json',
        'UM-07 - 07 - Filosofia política moderna.json',
        'UM-08 - 08 - Bioética   Ambiental.json',
        'UM-09 - 09 - Ética na inteligência artificial.json',
        'UM-20 - 20 - Noções de Direito.json',
        'UM-22 - 22 - Aspectos  Técnicos-Jurídicos  de  Propriedade  Intelectual.json',
        'UM-23 - 23 - Inovação e Novos Marcos Regulatórios.json',
        'UM-24 - 24 - Direito  e  Economia.json',
        'UM-26 - 26 - Direito  Ambiental  para  a  Engenharia.json',
        'UM-32 - 32 - Redação Acadêmica.json',
        'UM-55 - 55 - Questões  do  Cotidiano  do Adulto  Jovem.json',
        'UM-61 - 61 - Construção de Projetos de Tecnologia Engajada.json',
        'UM-62 - 62 - Execução de Projeto de Tecnologia Engajada.json',
        'UM-63 - 63 - Manufatura Avançada e Transformações no Mundo do Trabalho.json',
        'UM-64 - 64 - História do Poder Aeroespacial brasileiro.json',
        'UM-66 - 66 - Geopolítica e Relações Internacionais.json',
        'UM-70 - 70 - Tecnologia e Sociedade.json',
        'UM-74 - 74 - Tecnologia e Educação.json',
        'UM-77 - 77 - História da Ciência e Tecnologia no Brasil.json',
        'UM-78 - 78 - Cultura Brasileira.json',
        'UM-79 - 79 - Teoria  Política.json',
        'UM-83 - 83 - Análise e Opiniões da Imprensa Internacional (Nota 6).json',
        'UM-84 - 84 - Política  Internacional  (Nota  6).json',
        'UM-86 - 86 - Gestão de Processos de Inovação (Nota 6).json',
        'UM-87 - 87 - Práticas   de   Empreendedorismo   (Nota   6).json',
        'UM-88 - 88 - Modelos de Negócio (Nota 6).json',
        'UM-89 - 89 - Formação de Equipes (Nota 6).json',
        'UM-90 - 90 - História e Filosofia da Lógica (Nota 6).json',
        'VO-20 - 20 - Controle I.json',
        'VO-22 - 22 - Controle II.json',
        'VO-31 - 31 - Desempenho  de  Aeronaves.json',
        'VO-32 - 32 - Estabilidade e Controle de Aeronaves.json',
        'VO-41 - 41 - Mecânica Orbital.json',
        'VO-50 - 50 - Técnicas de Ensaios em Voo.json',
        'VO-52 - 52 - Dinâmica e Controle de Veículos Espaciais.json',
        'VO-53 - 53 - Simulação e Controle de Veículos Espaciais.json',
        'VO-66 - 66 - Ensaio de Aeronaves Remotamente Operadas.json',
        'XT-01 - 01 - Extensão  em  STEM - Oficinas.json',
        'XT-02 - 02 - Extensão em STEM - Mentoria.json',
      ];

      const areas: any[] = [];

      // Get base URL for GitHub Pages or local deployment
      const meta = import.meta as any;
      let baseUrl = meta?.env?.BASE_URL || '/';

      if (typeof window !== 'undefined' && baseUrl === '/') {
        const pathname = window.location.pathname;
        const match = pathname.match(/^(\/[^/]+\/)/);
        if (match && window.location.hostname.includes('github.io')) {
          baseUrl = match[1];
        }
      }
      console.log('[ChunkedCurriculumService] Using base URL:', baseUrl);

      for (const filename of curriculumFiles) {
        try {
          const disciplineCode = filename.split(' ')[0];
          const fileUrl = `${baseUrl}curriculum/${encodeURIComponent(filename)}`;
          console.log('[ChunkedCurriculumService] Fetching:', fileUrl);
          const response = await fetch(fileUrl);
          if (!response.ok) {
            console.warn(`Failed to load ${filename}: ${response.statusText}`);
            continue;
          }

          const data = await response.json();
          if (data.curriculumData && data.curriculumData.areas) {
            const prefixedAreas = this.prefixIdsInAreas(data.curriculumData.areas, disciplineCode);
            areas.push(...prefixedAreas);
          }
        } catch (error) {
          console.error(`Error loading ${filename}:`, error);
        }
      }

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
            version: '2.0 - ITA RP Reborn',
            lastUpdated: new Date().toISOString().split('T')[0],
            institution: 'Instituto Tecnológico de Aeronáutica (ITA)',
            basedOn: 'Catálogo dos Cursos de Graduação 2025 - CC201',
          },
          areas,
          infographics: null,
          settings: null,
        },
      };

      this.curriculumCache = curriculumData;
      this.populateCaches(curriculumData);

      return curriculumData;
    } catch (error) {
      console.error('Failed to load chunked curriculum:', error);
      throw new Error(
        `Não foi possível carregar o currículo em chunks: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async loadDiscipline(disciplineId: string): Promise<Discipline> {
    if (this.disciplineCache.has(disciplineId)) {
      return this.disciplineCache.get(disciplineId)!;
    }

    await this.loadCurriculum();
    const discipline = this.disciplineCache.get(disciplineId);
    if (!discipline) {
      throw new Error(`Disciplina ${disciplineId} não encontrada`);
    }
    return discipline;
  }

  async loadSkill(skillId: string): Promise<SpecificSkill> {
    if (this.skillCache.has(skillId)) {
      return this.skillCache.get(skillId)!;
    }

    await this.loadCurriculum();
    const skill = this.skillCache.get(skillId);
    if (!skill) {
      throw new Error(`Habilidade ${skillId} não encontrada`);
    }
    return skill;
  }

  validateCurriculum(data: CurriculumData): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validation logic similar to CurriculumService

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

  private prefixIdsInAreas(areas: any[], disciplineCode: string): any[] {
    return areas.map(area => ({
      ...area,
      id: `${disciplineCode}.${area.id}`,
      disciplines: area.disciplines?.map((discipline: any) => ({
        ...discipline,
        id: `${disciplineCode}.${discipline.id}`,
        mainTopics: discipline.mainTopics?.map((topic: any) => ({
          ...topic,
          id: `${disciplineCode}.${topic.id}`,
          atomicTopics: topic.atomicTopics?.map((atomicTopic: any) => ({
            ...atomicTopic,
            id: `${disciplineCode}.${atomicTopic.id}`,
            individualConcepts: atomicTopic.individualConcepts?.map((concept: any) => ({
              ...concept,
              id: `${disciplineCode}.${concept.id}`,
              specificSkills: concept.specificSkills?.map((skill: any) => ({
                ...skill,
                id: `${disciplineCode}.${skill.id}`,
                prerequisites:
                  skill.prerequisites?.map((prereq: string) =>
                    prereq ? `${disciplineCode}.${prereq}` : prereq
                  ) || [],
              })),
            })),
            specificSkills: atomicTopic.specificSkills?.map((skill: any) => ({
              ...skill,
              id: `${disciplineCode}.${skill.id}`,
              prerequisites:
                skill.prerequisites?.map((prereq: string) =>
                  prereq ? `${disciplineCode}.${prereq}` : prereq
                ) || [],
            })),
          })),
        })),
      })),
    }));
  }

  private populateCaches(curriculumData: CurriculumData): void {
    this.disciplineCache.clear();
    this.skillCache.clear();

    curriculumData.curriculumData.areas?.forEach(area => {
      area.disciplines?.forEach(discipline => {
        this.disciplineCache.set(discipline.id, discipline);

        discipline.mainTopics?.forEach(topic => {
          topic.atomicTopics?.forEach(atomicTopic => {
            atomicTopic.individualConcepts?.forEach(concept => {
              concept.specificSkills?.forEach(skill => {
                this.skillCache.set(skill.id, skill);
              });
            });
            const atomicTopicAny = atomicTopic as any;
            atomicTopicAny.specificSkills?.forEach((skill: SpecificSkill) => {
              this.skillCache.set(skill.id, skill);
            });
          });
        });
      });
    });
  }

  // Additional methods for chunking
  getAllDisciplines(): Discipline[] {
    return Array.from(this.disciplineCache.values());
  }

  getAllSkills(): SpecificSkill[] {
    return Array.from(this.skillCache.values());
  }

  getSkillsByDiscipline(disciplineId: string): SpecificSkill[] {
    const discipline = this.disciplineCache.get(disciplineId);
    if (!discipline) return [];

    const skills: SpecificSkill[] = [];
    discipline.mainTopics?.forEach(topic => {
      topic.atomicTopics?.forEach(atomicTopic => {
        atomicTopic.individualConcepts?.forEach(concept => {
          if (concept.specificSkills) {
            skills.push(...concept.specificSkills);
          }
        });
        const atomicTopicAny = atomicTopic as any;
        if (atomicTopicAny.specificSkills) {
          skills.push(...atomicTopicAny.specificSkills);
        }
      });
    });
    return skills;
  }

  searchSkills(query: string): SpecificSkill[] {
    const allSkills = this.getAllSkills();
    const lowerQuery = query.toLowerCase();

    return allSkills.filter(
      skill =>
        skill.name.toLowerCase().includes(lowerQuery) ||
        skill.description.toLowerCase().includes(lowerQuery)
    );
  }

  getSkillsByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): SpecificSkill[] {
    return this.getAllSkills().filter(skill => skill.difficulty === difficulty);
  }

  clearCache(): void {
    this.curriculumCache = null;
    this.disciplineCache.clear();
    this.skillCache.clear();
  }

  isLoaded(): boolean {
    return this.curriculumCache !== null;
  }
}

// Singleton instance
export const chunkedCurriculumService = new ChunkedCurriculumService();
