#!/usr/bin/env node
/**
 * Script para processar PDF do Catálogo de Cursos do ITA e gerar arquivos JSON
 * estruturados com expansão atômica usando IA.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
// @ts-ignore - pdf-parse não tem tipos oficiais
import pdf from 'pdf-parse';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - tipos serão resolvidos após npm install
import OpenAI from 'openai';

// Resolve caminhos relativos ao diretório do script
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const scriptDir = __dirname;

// Configuração
const PDF_PATH = path.join(
  scriptDir,
  '..',
  'Catálogo dos Cursos de Graduação 2025 - digital Rev.25.07.18-páginas (1).pdf'
);
const OUTPUT_DIR = path.join(scriptDir, '..', 'packages', 'curriculum');
const ATOMIC_EXPAND_PROMPT_PATH = path.join(scriptDir, '..', 'ATOMIC_EXPAND_PROMPT.md');
const SCHEMA_EXAMPLE_PATH = path.join(scriptDir, '..', 'schema.json');
const VALIDATION_SCHEMA_PATH = path.join(scriptDir, '..', 'schema.json');
const CHECKPOINT_FILE = path.join(OUTPUT_DIR, '.process-catalog-checkpoint.json');
const MAX_CONCURRENT_REQUESTS = parseInt(process.env.MAX_CONCURRENT_REQUESTS || '10', 10);

interface AtomicExpansion {
  steps: Array<{
    stepNumber: number;
    title: string;
    subSteps: string[];
    verification: string;
    estimatedTime: string;
    materials: string[];
    tips: string;
    learningObjective: string;
    commonMistakes: string[];
  }>;
  practicalExample: string;
  finalVerifications: string[];
  assessmentCriteria: string[];
  crossCurricularConnections: string[];
  realWorldApplication: string;
}

interface SpecificSkill {
  id: string;
  name: string;
  description: string;
  atomicExpansion?: AtomicExpansion | {};
  estimatedTime?: string;
  difficulty?: string;
  status?: string;
  prerequisites?: string[];
}

interface IndividualConcept {
  id: string;
  name: string;
  description?: string;
  specificSkills: SpecificSkill[];
}

interface AtomicTopic {
  id: string;
  name: string;
  description?: string;
  individualConcepts?: IndividualConcept[];
  specificSkills?: SpecificSkill[];
}

interface MainTopic {
  id: string;
  name: string;
  description: string;
  totalSkills: number;
  atomicTopics: AtomicTopic[];
}

interface Discipline {
  id: string;
  name: string;
  description: string;
  totalSkills: number;
  mainTopics: MainTopic[];
}

interface Area {
  id: string;
  name: string;
  description: string;
  totalSkills: number;
  percentage: number;
  disciplines: Discipline[];
}

interface CurriculumData {
  metadata: {
    startDate: string;
    duration: string;
    dailyStudyHours: string;
    totalAtomicSkills: number;
    version: string;
    lastUpdated: string;
    institution: string;
    basedOn: string;
  };
  areas: Area[];
  infographics: null;
  settings: null;
}

interface CurriculumJSON {
  formatVersion: string;
  exportDate: string;
  appVersion: string;
  curriculumData: CurriculumData;
}

interface Checkpoint {
  processedDisciplines: string[];
  lastUpdate: string;
  totalDisciplines: number;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  missingFields: string[];
}

class CatalogProcessor {
  private openai: OpenAI;
  private atomicExpandPrompt: string = '';
  private schemaExample: CurriculumJSON | null = null;
  private validationSchema: any = null;
  private model: string;
  private supportsJsonMode: boolean;
  private maxRetries: number;
  private debug: boolean;
  private checkpoint: Checkpoint | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY || process.env.API_KEY;
    const baseURL = process.env.OPENAI_BASE_URL || process.env.BASE_URL;
    this.model = process.env.OPENAI_MODEL || process.env.MODEL || 'gpt-4o';
    this.supportsJsonMode = process.env.SUPPORTS_JSON_MODE !== 'false';
    this.maxRetries = parseInt(process.env.MAX_RETRIES || '3', 10);
    this.debug = process.env.DEBUG === 'true' || process.env.DEBUG === '1';

    if (this.debug) {
      console.log('🔍 [DEBUG] Modo debug ativado');
      console.log('🔍 [DEBUG] Variáveis de ambiente:');
      console.log(`  - OPENAI_API_KEY: ${apiKey ? '***' + apiKey.slice(-4) : 'não definida'}`);
      console.log(`  - OPENAI_BASE_URL: ${baseURL || 'não definida (usando padrão)'}`);
      console.log(`  - OPENAI_MODEL: ${this.model}`);
      console.log(`  - SUPPORTS_JSON_MODE: ${this.supportsJsonMode}`);
      console.log(`  - MAX_RETRIES: ${this.maxRetries}`);
    }

    if (!apiKey && !baseURL) {
      throw new Error(
        'OPENAI_API_KEY ou API_KEY não está definida. Configure a variável de ambiente.\n' +
          'Para APIs locais (Ollama, etc.), você pode usar apenas BASE_URL sem API_KEY.'
      );
    }

    const config: any = {};

    if (apiKey) {
      config.apiKey = apiKey;
      if (this.debug) {
        console.log('🔍 [DEBUG] API Key configurada');
      }
    }

    if (baseURL) {
      config.baseURL = baseURL;
      if (this.debug) {
        console.log(`🔍 [DEBUG] Base URL configurada: ${baseURL}`);
      }
    }

    this.openai = new OpenAI(config);

    console.log(`📡 Configurado para usar: ${baseURL || 'https://api.openai.com/v1'}`);
    console.log(`🤖 Modelo: ${this.model}`);
    console.log(`📄 JSON Mode: ${this.supportsJsonMode ? 'Suportado' : 'Não suportado'}`);
    console.log(`⚡ Requisições simultâneas: ${MAX_CONCURRENT_REQUESTS}`);
    if (this.debug) {
      console.log(`🔍 [DEBUG] Cliente OpenAI inicializado`);
    }
  }

  async loadCheckpoint(): Promise<Checkpoint | null> {
    try {
      const checkpointContent = await fs.readFile(CHECKPOINT_FILE, 'utf-8');
      this.checkpoint = JSON.parse(checkpointContent) as Checkpoint;
      console.log(
        `📋 Checkpoint carregado: ${this.checkpoint.processedDisciplines.length} disciplinas já processadas`
      );
      return this.checkpoint;
    } catch (error) {
      if (this.debug) {
        console.log(`🔍 [DEBUG] Nenhum checkpoint encontrado, iniciando do zero`);
      }
      return null;
    }
  }

  async saveCheckpoint(checkpoint: Checkpoint): Promise<void> {
    try {
      await fs.writeFile(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2), 'utf-8');
      if (this.debug) {
        console.log(
          `🔍 [DEBUG] Checkpoint salvo: ${checkpoint.processedDisciplines.length} disciplinas`
        );
      }
    } catch (error) {
      console.warn(`⚠️  Erro ao salvar checkpoint:`, error);
    }
  }

  async isDisciplineProcessed(disciplineCode: string): Promise<boolean> {
    // Verifica no checkpoint
    if (this.checkpoint?.processedDisciplines.includes(disciplineCode)) {
      return true;
    }

    // Verifica se o arquivo existe
    try {
      const files = await fs.readdir(OUTPUT_DIR);
      const matchingFile = files.find(
        (f: string) => f.startsWith(`${disciplineCode} - `) && f.endsWith('.json')
      );
      if (matchingFile) {
        const filepath = path.join(OUTPUT_DIR, matchingFile);

        // Valida contra o schema
        const { valid, curriculum, missingFields } = await this.validateExistingJSON(filepath);

        if (valid && curriculum) {
          return true;
        }

        // Se inválido mas tem curriculum, tenta preencher com IA
        if (!valid && curriculum && missingFields.length > 0) {
          console.log(`🔧 Tentando preencher campos faltantes em ${matchingFile}...`);
          const filledCurriculum = await this.fillMissingFieldsWithAI(curriculum, missingFields);

          // Salva o curriculum atualizado
          await fs.writeFile(filepath, JSON.stringify(filledCurriculum, null, 2), 'utf-8');
          console.log(`✅ Campos preenchidos e arquivo atualizado: ${matchingFile}`);

          // Re-valida após preenchimento
          const revalidation = await this.validateExistingJSON(filepath);
          if (revalidation.valid) {
            return true;
          }
        }

        // Se ainda inválido após AI fill, considera não processado para reprocessamento
        return false;
      }
    } catch (error) {
      // Erro ao ler diretório, assume que não está processado
    }

    return false;
  }

  async markDisciplineAsProcessed(disciplineCode: string): Promise<void> {
    if (!this.checkpoint) {
      this.checkpoint = {
        processedDisciplines: [],
        lastUpdate: new Date().toISOString(),
        totalDisciplines: 0,
      };
    }

    if (!this.checkpoint.processedDisciplines.includes(disciplineCode)) {
      this.checkpoint.processedDisciplines.push(disciplineCode);
      this.checkpoint.lastUpdate = new Date().toISOString();
      await this.saveCheckpoint(this.checkpoint);
    }
  }

  async loadPrompt(): Promise<string> {
    try {
      const prompt = await fs.readFile(ATOMIC_EXPAND_PROMPT_PATH, 'utf-8');
      this.atomicExpandPrompt = prompt;
      return prompt;
    } catch (error) {
      console.warn('Não foi possível carregar o prompt de atomic expand. Usando prompt padrão.');
      this.atomicExpandPrompt = this.getDefaultPrompt();
      return this.atomicExpandPrompt;
    }
  }

  async loadSchemaExample(): Promise<CurriculumJSON> {
    try {
      const schemaContent = await fs.readFile(SCHEMA_EXAMPLE_PATH, 'utf-8');
      this.schemaExample = JSON.parse(schemaContent) as CurriculumJSON;
      return this.schemaExample;
    } catch (error) {
      console.warn('Não foi possível carregar o schema de exemplo.');
      throw error;
    }
  }

  async loadValidationSchema(): Promise<any> {
    try {
      const schemaContent = await fs.readFile(VALIDATION_SCHEMA_PATH, 'utf-8');
      this.validationSchema = JSON.parse(schemaContent);
      console.log('✅ Schema de validação carregado');
      return this.validationSchema;
    } catch (error) {
      console.warn('⚠️ Não foi possível carregar o schema de validação:', VALIDATION_SCHEMA_PATH);
      return null;
    }
  }

  validateAgainstSchema(data: any, schema: any, path: string = ''): ValidationResult {
    const errors: string[] = [];
    const missingFields: string[] = [];

    if (!schema || !data) {
      return { valid: true, errors: [], missingFields: [] };
    }

    // Verifica campos obrigatórios do schema
    if (schema.required && Array.isArray(schema.required)) {
      for (const field of schema.required) {
        if (data[field] === undefined || data[field] === null) {
          missingFields.push(`${path}.${field}`.replace(/^\./, ''));
          errors.push(`Campo obrigatório ausente: ${path}.${field}`.replace(/^\./, ''));
        }
      }
    }

    // Verifica propriedades definidas no schema
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        const propPath = path ? `${path}.${key}` : key;

        if (data[key] !== undefined) {
          const propSchemaTyped = propSchema as any;

          // Validação recursiva para objetos
          if (
            propSchemaTyped.type === 'object' &&
            typeof data[key] === 'object' &&
            !Array.isArray(data[key])
          ) {
            const nestedResult = this.validateAgainstSchema(data[key], propSchemaTyped, propPath);
            errors.push(...nestedResult.errors);
            missingFields.push(...nestedResult.missingFields);
          }

          // Validação para arrays
          if (propSchemaTyped.type === 'array' && Array.isArray(data[key])) {
            if (propSchemaTyped.items) {
              data[key].forEach((item: any, index: number) => {
                if (typeof item === 'object') {
                  const itemResult = this.validateAgainstSchema(
                    item,
                    propSchemaTyped.items,
                    `${propPath}[${index}]`
                  );
                  errors.push(...itemResult.errors);
                  missingFields.push(...itemResult.missingFields);
                }
              });
            }
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      missingFields,
    };
  }

  async validateExistingJSON(
    filepath: string
  ): Promise<{ valid: boolean; curriculum: CurriculumJSON | null; missingFields: string[] }> {
    try {
      const content = await fs.readFile(filepath, 'utf-8');
      const curriculum = JSON.parse(content) as CurriculumJSON;

      if (!this.validationSchema) {
        await this.loadValidationSchema();
      }

      if (!this.validationSchema) {
        console.log(`⚠️ Schema de validação não disponível, considerando JSON válido`);
        return { valid: true, curriculum, missingFields: [] };
      }

      const validationResult = this.validateAgainstSchema(curriculum, this.validationSchema);

      if (validationResult.valid) {
        console.log(`✅ JSON válido: ${path.basename(filepath)}`);
        return { valid: true, curriculum, missingFields: [] };
      } else {
        console.log(`⚠️ JSON inválido: ${path.basename(filepath)}`);
        console.log(`   Campos faltando: ${validationResult.missingFields.length}`);
        if (this.debug) {
          validationResult.missingFields.slice(0, 10).forEach(field => {
            console.log(`   - ${field}`);
          });
          if (validationResult.missingFields.length > 10) {
            console.log(`   ... e mais ${validationResult.missingFields.length - 10} campos`);
          }
        }
        return { valid: false, curriculum, missingFields: validationResult.missingFields };
      }
    } catch (error: any) {
      console.error(`❌ Erro ao validar JSON: ${error.message}`);
      return { valid: false, curriculum: null, missingFields: [] };
    }
  }

  async fillMissingFieldsWithAI(
    curriculum: CurriculumJSON,
    missingFields: string[]
  ): Promise<CurriculumJSON> {
    console.log(`🤖 Usando IA para preencher ${missingFields.length} campos faltantes...`);

    // Agrupa campos por contexto para processamento mais eficiente
    const fieldsByPath: Map<string, string[]> = new Map();

    for (const field of missingFields) {
      const parts = field.split('.');
      const parentPath = parts.slice(0, -1).join('.');
      const fieldName = parts[parts.length - 1];

      if (!fieldsByPath.has(parentPath)) {
        fieldsByPath.set(parentPath, []);
      }
      fieldsByPath.get(parentPath)!.push(fieldName);
    }

    // Processa cada grupo de campos faltantes
    for (const [parentPath, fields] of fieldsByPath) {
      try {
        const parentObject = this.getNestedValue(curriculum, parentPath);
        if (!parentObject) continue;

        const filledFields = await this.generateMissingFields(
          parentObject,
          fields,
          parentPath,
          curriculum
        );

        // Aplica os campos preenchidos
        for (const [fieldName, value] of Object.entries(filledFields)) {
          this.setNestedValue(curriculum, `${parentPath}.${fieldName}`, value);
        }
      } catch (error: any) {
        console.warn(`⚠️ Erro ao preencher campos em ${parentPath}: ${error.message}`);
      }
    }

    return curriculum;
  }

  getNestedValue(obj: any, path: string): any {
    if (!path) return obj;

    const parts = path.split(/\.|\[|\]/).filter(p => p !== '');
    let current = obj;

    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }

    return current;
  }

  setNestedValue(obj: any, path: string, value: any): void {
    const parts = path.split(/\.|\[|\]/).filter(p => p !== '');
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (current[part] === undefined) {
        current[part] = isNaN(Number(parts[i + 1])) ? {} : [];
      }
      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
  }

  async generateMissingFields(
    context: any,
    missingFields: string[],
    contextPath: string,
    fullCurriculum: CurriculumJSON
  ): Promise<Record<string, any>> {
    const contextDescription = this.getContextDescription(contextPath, fullCurriculum);

    const prompt = `Você é um especialista em currículos educacionais.

Contexto: ${contextDescription}

Objeto atual (parcial):
${JSON.stringify(context, null, 2)}

Campos que precisam ser preenchidos: ${missingFields.join(', ')}

Com base no contexto e no objeto atual, gere valores apropriados para os campos faltantes.
Use o schema de currículo educacional do ITA como referência.

Retorne APENAS um JSON com os campos preenchidos, sem explicações:
{
  ${missingFields.map(f => `"${f}": <valor_apropriado>`).join(',\n  ')}
}`;

    const response = await this.makeAPIRequest(
      prompt,
      'Você é um especialista em estruturar conteúdo educacional.'
    );

    try {
      return JSON.parse(response);
    } catch (error) {
      console.warn(`⚠️ Erro ao parsear resposta da IA`);
      return {};
    }
  }

  getContextDescription(path: string, curriculum: CurriculumJSON): string {
    const parts = path.split('.');
    let description = `Currículo: ${curriculum.curriculumData.metadata.basedOn || 'ITA'}`;

    if (parts.includes('areas')) {
      const areaIndex = parseInt(parts[parts.indexOf('areas') + 1]?.replace(/[\[\]]/g, '') || '0');
      const area = curriculum.curriculumData.areas[areaIndex];
      if (area) {
        description += ` > Área: ${area.name}`;
      }
    }

    if (parts.includes('disciplines')) {
      description += ` > Disciplina`;
    }

    if (parts.includes('mainTopics')) {
      description += ` > Tópico Principal`;
    }

    if (parts.includes('atomicTopics')) {
      description += ` > Tópico Atômico`;
    }

    if (parts.includes('specificSkills')) {
      description += ` > Habilidade Específica`;
    }

    return description;
  }

  getDefaultPrompt(): string {
    return `# Prompt para Atomic Expand em Currículos JSON

## Objetivo
Expandir elementos specificSkills em arquivos JSON de currículo educacional com expansões atômicas detalhadas (atomicExpansion), transformando habilidades descritivas em passos de aprendizado estruturados e acionáveis.

## Quando Fazer Atomic Expand
- Um specificSkill não possui atomicExpansion
- Um atomicExpansion existe mas está incompleto (faltam campos importantes)
- Um atomicExpansion tem poucos detalhes ou subSteps insuficientes

## Estrutura Esperada
Cada atomicExpansion deve conter:
- steps: Array com 2-8 steps (geralmente 3-5)
- practicalExample: Exemplo concreto e prático
- finalVerifications: Lista de verificações finais (3-7 itens)
- assessmentCriteria: Critérios de avaliação (3-7 itens)
- crossCurricularConnections: Conexões interdisciplinares (2-5 itens)
- realWorldApplication: Aplicação prática no mundo real

## Campos Obrigatórios para cada step:
- stepNumber: Número sequencial (1, 2, 3...)
- title: Título claro e descritivo
- subSteps: Array com pelo menos 3-5 sub-passos detalhados
- verification: Como verificar conclusão do passo
- estimatedTime: Tempo estimado
- materials: Recursos necessários
- tips: Dica prática
- learningObjective: Objetivo específico
- commonMistakes: Erros comuns a evitar`;
  }

  async extractTextFromPDF(pdfPath: string): Promise<string> {
    console.log(`📄 Extraindo texto de ${pdfPath}...`);

    if (this.debug) {
      console.log(`🔍 [DEBUG] Verificando se arquivo existe...`);
    }

    try {
      const stats = await fs.stat(pdfPath);
      if (this.debug) {
        console.log(`🔍 [DEBUG] Arquivo encontrado: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      }

      const dataBuffer = await fs.readFile(pdfPath);
      if (this.debug) {
        console.log(`🔍 [DEBUG] Buffer lido: ${(dataBuffer.length / 1024 / 1024).toFixed(2)} MB`);
        console.log(`🔍 [DEBUG] Processando PDF...`);
      }

      const data = await pdf(dataBuffer);
      console.log(`✅ Texto extraído: ${data.text.length.toLocaleString()} caracteres`);
      if (this.debug) {
        console.log(`🔍 [DEBUG] Número de páginas: ${data.numpages}`);
        console.log(`🔍 [DEBUG] Primeiros 200 caracteres: ${data.text.substring(0, 200)}...`);
      }
      return data.text;
    } catch (error: any) {
      if (this.debug) {
        console.error(`🔍 [DEBUG] Erro detalhado:`, error);
      }
      throw new Error(`Erro ao extrair texto do PDF: ${error.message}`);
    }
  }

  async extractDisciplinesFromPDF(
    pdfText: string
  ): Promise<Array<{ code: string; name: string; content: string }>> {
    console.log('🔍 Extraindo disciplinas do texto do PDF...');

    if (this.debug) {
      console.log(`🔍 [DEBUG] Tamanho do texto: ${pdfText.length.toLocaleString()} caracteres`);
    }

    const disciplinePattern = /([A-Z]{2,4}-\d{2,3})\s*-\s*([^\n]+)/g;
    const disciplines: Array<{ code: string; name: string; content: string }> = [];

    const sections = pdfText.split(/(?=[A-Z]{2,4}-\d{2,3}\s*-)/);
    if (this.debug) {
      console.log(`🔍 [DEBUG] Seções encontradas: ${sections.length}`);
    }

    for (const section of sections) {
      const match = section.match(/^([A-Z]{2,4}-\d{2,3})\s*-\s*([^\n]+)/);
      if (match) {
        const code = match[1];
        const restOfLine = match[2].trim();

        const lines = section.split('\n');
        const firstLine = lines[0] || '';
        const nameMatch = firstLine.match(/-\s*(.+?)(?:\.|$)/);
        const name = nameMatch ? nameMatch[1].trim() : restOfLine.split('.')[0].trim();

        const contentStart = section.indexOf('\n');
        const content = contentStart > 0 ? section.substring(contentStart + 1).trim() : '';

        const cleanContent = content
          .split('\n')
          .filter(line => {
            if (/^\d+\.\d+(\.\d+)*\s*$/.test(line.trim())) {
              return false;
            }
            if (line.trim().length < 3) {
              return false;
            }
            return true;
          })
          .join('\n')
          .trim();

        if (name && cleanContent.length > 10) {
          disciplines.push({
            code,
            name,
            content: cleanContent,
          });
        }
      }
    }

    if (this.debug) {
      console.log(`🔍 [DEBUG] Disciplinas encontradas via regex: ${disciplines.length}`);
      if (disciplines.length > 0) {
        console.log(
          `🔍 [DEBUG] Primeiras 3 disciplinas:`,
          disciplines.slice(0, 3).map(d => d.code)
        );
      }
    }

    if (disciplines.length < 5) {
      console.log('⚠️  Poucas disciplinas encontradas. Tentando abordagem alternativa com IA...');
      return await this.extractDisciplinesWithAI(pdfText);
    }

    console.log(`✅ Encontradas ${disciplines.length} disciplinas`);
    return disciplines;
  }

  async extractDisciplinesWithAI(
    pdfText: string
  ): Promise<Array<{ code: string; name: string; content: string }>> {
    console.log('🤖 Usando IA para extrair disciplinas...');

    if (this.debug) {
      console.log(
        `🔍 [DEBUG] Tamanho do texto a processar: ${pdfText.length.toLocaleString()} caracteres`
      );
      const truncatedText = pdfText.substring(0, 50000);
      console.log(
        `🔍 [DEBUG] Usando primeiros ${truncatedText.length.toLocaleString()} caracteres para IA`
      );
    }

    const prompt = `Extraia todas as disciplinas do catálogo de cursos do ITA do texto abaixo.

Para cada disciplina, identifique:
- Código (ex: MAT-13, FIS-15, CMC-30)
- Nome completo
- Todo o conteúdo da disciplina (requisitos, horas semanais, descrição, bibliografia, etc.)

Retorne um JSON com o seguinte formato:
{
  "disciplines": [
    {
      "code": "MAT-13",
      "name": "Cálculo Diferencial e Integral I",
      "content": "Requisito: Não há. Horas Semanais: 4-0-0-4. ..."
    }
  ]
}

IMPORTANTE: Retorne APENAS um JSON válido, sem markdown, sem explicações.

Texto do catálogo:
${pdfText.substring(0, 50000)}${pdfText.length > 50000 ? '\n... (texto truncado)' : ''}`;

    let attempts = 0;
    while (attempts < this.maxRetries) {
      try {
        if (this.debug) {
          console.log(`🔍 [DEBUG] Tentativa ${attempts + 1}/${this.maxRetries} de extração com IA`);
          console.log(`🔍 [DEBUG] Modelo: ${this.model}`);
          console.log(`🔍 [DEBUG] JSON Mode: ${this.supportsJsonMode}`);
        }

        const requestConfig: any = {
          model: this.model,
          messages: [
            {
              role: 'system',
              content:
                'Você é um especialista em extrair informações estruturadas de documentos acadêmicos. Sempre retorne JSON válido.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.1,
        };

        if (this.supportsJsonMode) {
          requestConfig.response_format = { type: 'json_object' };
        }

        const startTime = Date.now();
        const response = await this.openai.chat.completions.create(requestConfig);
        const duration = Date.now() - startTime;

        if (this.debug) {
          console.log(`🔍 [DEBUG] Resposta recebida em ${duration}ms`);
          console.log(`🔍 [DEBUG] Tokens usados: ${response.usage?.total_tokens || 'N/A'}`);
        }

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('Resposta vazia da API');
        }

        if (this.debug) {
          console.log(`🔍 [DEBUG] Tamanho da resposta: ${content.length} caracteres`);
          console.log(`🔍 [DEBUG] Primeiros 200 caracteres: ${content.substring(0, 200)}...`);
        }

        let jsonContent = content.trim();
        if (jsonContent.startsWith('```json')) {
          if (this.debug) console.log(`🔍 [DEBUG] Removendo markdown code block (json)`);
          jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonContent.startsWith('```')) {
          if (this.debug) console.log(`🔍 [DEBUG] Removendo markdown code block`);
          jsonContent = jsonContent.replace(/```\n?/g, '');
        }

        const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          if (this.debug) console.log(`🔍 [DEBUG] JSON extraído do conteúdo`);
          jsonContent = jsonMatch[0];
        }

        if (this.debug) {
          console.log(`🔍 [DEBUG] Tentando fazer parse do JSON...`);
        }

        const result = JSON.parse(jsonContent) as {
          disciplines: Array<{ code: string; name: string; content: string }>;
        };
        console.log(`✅ Encontradas ${result.disciplines.length} disciplinas via IA`);

        if (this.debug) {
          console.log(
            `🔍 [DEBUG] Primeiras 5 disciplinas:`,
            result.disciplines.slice(0, 5).map(d => `${d.code} - ${d.name}`)
          );
        }

        return result.disciplines;
      } catch (error: any) {
        attempts++;
        if (this.debug) {
          console.error(`🔍 [DEBUG] Erro na tentativa ${attempts}:`, error.message);
          if (error.response) {
            console.error(`🔍 [DEBUG] Status: ${error.response.status}`);
            console.error(`🔍 [DEBUG] Data:`, error.response.data);
          }
        }

        if (attempts >= this.maxRetries) {
          console.error(
            `❌ Erro ao extrair disciplinas com IA após ${this.maxRetries} tentativas:`,
            error.message
          );
          throw error;
        }
        const delay = 2000 * attempts;
        console.warn(
          `⚠️  Tentativa ${attempts}/${this.maxRetries} falhou, tentando novamente em ${delay}ms...`
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Número máximo de tentativas excedido');
  }

  async generateCurriculumJSON(discipline: {
    code: string;
    name: string;
    content: string;
  }): Promise<CurriculumJSON> {
    console.log(`📝 Gerando JSON para ${discipline.code} - ${discipline.name}...`);

    if (this.debug) {
      console.log(
        `🔍 [DEBUG] Tamanho do conteúdo da disciplina: ${discipline.content.length} caracteres`
      );
    }

    const schemaExample = await this.loadSchemaExample();

    // Passo 1: Criar estrutura básica (metadata, área, disciplina)
    const basicStructure = await this.generateBasicStructure(discipline, schemaExample);

    // Passo 2: Identificar tópicos principais
    const mainTopics = await this.identifyMainTopics(discipline, basicStructure);

    // Passo 3: Para cada tópico principal, gerar estrutura detalhada (em paralelo)
    const detailedTopics = await Promise.all(
      mainTopics.map(async (mainTopic, i) => {
        console.log(`  📑 [${i + 1}/${mainTopics.length}] Processando tópico: ${mainTopic.name}`);

        const detailedTopic = await this.generateDetailedMainTopic(
          discipline,
          mainTopic,
          basicStructure,
          i + 1
        );

        if (this.debug) {
          console.log(
            `🔍 [DEBUG] Tópico ${mainTopic.name} processado com ${detailedTopic.atomicTopics.length} tópicos atômicos`
          );
        }

        return detailedTopic;
      })
    );

    basicStructure.curriculumData.areas[0].disciplines[0].mainTopics.push(...detailedTopics);

    // Recalcula totalSkills
    this.recalculateTotalSkills(basicStructure);

    return basicStructure;
  }

  async generateBasicStructure(
    discipline: { code: string; name: string; content: string },
    schemaExample: CurriculumJSON
  ): Promise<CurriculumJSON> {
    console.log(`  🏗️  Criando estrutura básica...`);

    const prompt = `Você é um especialista em currículos educacionais do ITA.

Tarefa: Criar APENAS a estrutura básica (metadata, área e disciplina) para a disciplina abaixo.

Disciplina: ${discipline.code} - ${discipline.name}

Conteúdo da disciplina:
${discipline.content.substring(0, 2000)}${discipline.content.length > 2000 ? '...' : ''}

Baseado no schema de exemplo, retorne um JSON com:
1. formatVersion, exportDate, appVersion
2. curriculumData.metadata (com baseOn referenciando "${discipline.code}")
3. curriculumData.areas[0] com:
   - id, name, description apropriados
   - disciplines[0] com:
     - id (ex: "10.1"), name, description
     - mainTopics: [] (vazio por enquanto)

IMPORTANTE:
- Use português
- IDs sequenciais (ex: área "10", disciplina "10.1")
- baseOn: "Catálogo dos Cursos de Graduação 2025 - ${discipline.code}"
- Retorne APENAS o JSON, sem markdown`;

    const response = await this.makeAPIRequest(
      prompt,
      'Você é um especialista em criar estruturas de currículo educacional.'
    );

    const structure = JSON.parse(response) as CurriculumJSON;
    structure.exportDate = new Date().toISOString();
    structure.curriculumData.metadata.lastUpdated = new Date().toISOString().split('T')[0];

    return structure;
  }

  async identifyMainTopics(
    discipline: { code: string; name: string; content: string },
    structure: CurriculumJSON
  ): Promise<Array<{ name: string; description: string }>> {
    console.log(`  🔍 Identificando tópicos principais...`);

    const prompt = `Analise o conteúdo da disciplina abaixo e identifique os TÓPICOS PRINCIPAIS (MainTopics).

Disciplina: ${discipline.code} - ${discipline.name}

Conteúdo completo:
${discipline.content}

Para cada tópico principal, identifique:
- Nome do tópico (ex: "Números Reais e Funções", "Limites e Continuidade", "Derivadas")
- Descrição breve (1-2 frases)

Retorne um JSON com este formato:
{
  "mainTopics": [
    {
      "name": "Nome do Tópico 1",
      "description": "Descrição do tópico 1"
    },
    {
      "name": "Nome do Tópico 2", 
      "description": "Descrição do tópico 2"
    }
  ]
}

IMPORTANTE:
- Identifique 3-8 tópicos principais
- Cada tópico deve ser um tema significativo da disciplina
- Use português
- Retorne APENAS o JSON, sem markdown`;

    const response = await this.makeAPIRequest(
      prompt,
      'Você é um especialista em análise de currículos educacionais.'
    );
    const result = JSON.parse(response) as {
      mainTopics: Array<{ name: string; description: string }>;
    };

    console.log(`  ✅ Identificados ${result.mainTopics.length} tópicos principais`);

    return result.mainTopics;
  }

  async generateDetailedMainTopic(
    discipline: { code: string; name: string; content: string },
    mainTopic: { name: string; description: string },
    structure: CurriculumJSON,
    topicIndex: number
  ): Promise<MainTopic> {
    const topicId = `${structure.curriculumData.areas[0].disciplines[0].id}.${topicIndex}`;

    // Primeiro, identifica tópicos atômicos
    const atomicTopics = await this.identifyAtomicTopics(discipline, mainTopic, topicId);

    // Para cada tópico atômico, gera estrutura detalhada (em paralelo)
    const detailedAtomicTopics = await Promise.all(
      atomicTopics.map(async (atomicTopic, i) => {
        const atomicId = `${topicId}.${i + 1}`;

        if (this.debug) {
          console.log(
            `    🔬 [${i + 1}/${atomicTopics.length}] Processando tópico atômico: ${atomicTopic.name}`
          );
        }

        return await this.generateDetailedAtomicTopic(discipline, mainTopic, atomicTopic, atomicId);
      })
    );

    // Calcula totalSkills do mainTopic
    const totalSkills = detailedAtomicTopics.reduce((sum, at) => {
      const conceptSkills =
        at.individualConcepts?.reduce((s, ic) => s + ic.specificSkills.length, 0) || 0;
      const directSkills = at.specificSkills?.length || 0;
      return sum + conceptSkills + directSkills;
    }, 0);

    return {
      id: topicId,
      name: mainTopic.name,
      description: mainTopic.description,
      totalSkills,
      atomicTopics: detailedAtomicTopics,
    };
  }

  async identifyAtomicTopics(
    discipline: { code: string; name: string; content: string },
    mainTopic: { name: string; description: string },
    topicId: string
  ): Promise<Array<{ name: string; description: string }>> {
    const prompt = `Analise o tópico principal abaixo e identifique os TÓPICOS ATÔMICOS (subtópicos específicos).

Disciplina: ${discipline.code} - ${discipline.name}
Tópico Principal: ${mainTopic.name}
Descrição: ${mainTopic.description}

Conteúdo relevante da disciplina:
${discipline.content.substring(0, 3000)}${discipline.content.length > 3000 ? '...' : ''}

Para cada tópico atômico, identifique:
- Nome específico (ex: "Propriedades dos Números Reais", "Definição Formal de Limite")
- Descrição breve

Retorne JSON:
{
  "atomicTopics": [
    {
      "name": "Nome do Tópico Atômico 1",
      "description": "Descrição"
    }
  ]
}

IMPORTANTE:
- Identifique 2-6 tópicos atômicos por tópico principal
- Cada tópico atômico deve ser um conceito específico e ensinável
- Use português
- Retorne APENAS JSON, sem markdown`;

    const response = await this.makeAPIRequest(
      prompt,
      'Você é um especialista em decomposição de tópicos educacionais.'
    );
    const result = JSON.parse(response) as {
      atomicTopics: Array<{ name: string; description: string }>;
    };

    return result.atomicTopics;
  }

  async generateDetailedAtomicTopic(
    discipline: { code: string; name: string; content: string },
    mainTopic: { name: string; description: string },
    atomicTopic: { name: string; description: string },
    atomicId: string
  ): Promise<AtomicTopic> {
    const prompt = `Crie a estrutura detalhada para um tópico atômico específico.

Disciplina: ${discipline.code} - ${discipline.name}
Tópico Principal: ${mainTopic.name}
Tópico Atômico: ${atomicTopic.name}
Descrição: ${atomicTopic.description}

Conteúdo relevante:
${discipline.content.substring(0, 4000)}${discipline.content.length > 4000 ? '...' : ''}

Crie:
1. individualConcepts (2-4 conceitos individuais)
   - Cada conceito com name, description
   - Cada conceito com specificSkills (2-5 habilidades)
     - Cada skill com: id, name, description, atomicExpansion: {}
     
2. OU specificSkills diretas (se não houver conceitos intermediários)
   - 3-8 habilidades com: id, name, description, atomicExpansion: {}

Retorne JSON:
{
  "individualConcepts": [
    {
      "id": "${atomicId}.1",
      "name": "Nome do Conceito",
      "description": "Descrição",
      "specificSkills": [
        {
          "id": "${atomicId}.1.1",
          "name": "Nome da Habilidade",
          "description": "Descrição detalhada",
          "atomicExpansion": {},
          "estimatedTime": "X horas",
          "difficulty": "beginner|intermediate|advanced",
          "status": "not_started",
          "prerequisites": []
        }
      ]
    }
  ]
}

OU se não houver conceitos intermediários:
{
  "specificSkills": [
    {
      "id": "${atomicId}.1",
      "name": "Nome da Habilidade",
      "description": "Descrição detalhada",
      "atomicExpansion": {},
      "estimatedTime": "X horas",
      "difficulty": "beginner|intermediate|advanced",
      "status": "not_started",
      "prerequisites": []
    }
  ]
}

IMPORTANTE:
- IDs sequenciais (${atomicId}.1, ${atomicId}.1.1, etc.)
- Descrições detalhadas e específicas
- Use português
- Retorne APENAS JSON, sem markdown`;

    const response = await this.makeAPIRequest(
      prompt,
      'Você é um especialista em estruturar conteúdo educacional em níveis atômicos.'
    );
    const result = JSON.parse(response) as {
      individualConcepts?: IndividualConcept[];
      specificSkills?: SpecificSkill[];
    };

    return {
      id: atomicId,
      name: atomicTopic.name,
      description: atomicTopic.description,
      individualConcepts: result.individualConcepts,
      specificSkills: result.specificSkills,
    };
  }

  async makeAPIRequest(prompt: string, systemMessage: string): Promise<string> {
    let attempts = 0;
    while (attempts < this.maxRetries) {
      try {
        if (this.debug && attempts === 0) {
          console.log(`🔍 [DEBUG] Fazendo requisição (prompt: ${prompt.length} chars)`);
        }

        const requestConfig: any = {
          model: this.model,
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
        };

        if (this.supportsJsonMode) {
          requestConfig.response_format = { type: 'json_object' };
        } else {
          requestConfig.messages[1].content =
            prompt +
            '\n\nIMPORTANTE: Retorne APENAS um JSON válido, sem markdown, sem explicações.';
        }

        const startTime = Date.now();
        const response = await this.openai.chat.completions.create(requestConfig);
        const duration = Date.now() - startTime;

        if (this.debug) {
          console.log(
            `🔍 [DEBUG] Resposta em ${duration}ms, tokens: ${response.usage?.total_tokens || 'N/A'}`
          );
        }

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('Resposta vazia da API');
        }

        let jsonContent = content.trim();
        if (jsonContent.startsWith('```json')) {
          jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonContent.startsWith('```')) {
          jsonContent = jsonContent.replace(/```\n?/g, '');
        }

        const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonContent = jsonMatch[0];
        }

        return jsonContent;
      } catch (error: any) {
        attempts++;
        if (attempts >= this.maxRetries) {
          throw error;
        }
        const delay = 1000 * attempts;
        if (this.debug) {
          console.warn(
            `🔍 [DEBUG] Tentativa ${attempts}/${this.maxRetries} falhou, retry em ${delay}ms...`
          );
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Número máximo de tentativas excedido');
  }

  recalculateTotalSkills(curriculum: CurriculumJSON): void {
    curriculum.curriculumData.areas.forEach(area => {
      let areaTotal = 0;

      area.disciplines.forEach(discipline => {
        let disciplineTotal = 0;

        discipline.mainTopics.forEach(topic => {
          let topicTotal = 0;

          topic.atomicTopics.forEach(atomicTopic => {
            const conceptSkills =
              atomicTopic.individualConcepts?.reduce(
                (sum, concept) => sum + concept.specificSkills.length,
                0
              ) || 0;
            const directSkills = atomicTopic.specificSkills?.length || 0;
            topicTotal += conceptSkills + directSkills;
          });

          topic.totalSkills = topicTotal;
          disciplineTotal += topicTotal;
        });

        discipline.totalSkills = disciplineTotal;
        areaTotal += disciplineTotal;
      });

      area.totalSkills = areaTotal;
    });

    const grandTotal = curriculum.curriculumData.areas.reduce(
      (sum, area) => sum + area.totalSkills,
      0
    );
    curriculum.curriculumData.metadata.totalAtomicSkills = grandTotal;
  }

  async expandAtomicSkills(curriculum: CurriculumJSON): Promise<CurriculumJSON> {
    console.log('🔧 Expandindo habilidades atômicas...');

    const skillsToExpand: Array<{ path: string[]; skill: SpecificSkill }> = [];

    const collectSkills = (
      area: Area,
      discipline: Discipline,
      mainTopic: MainTopic,
      atomicTopic: AtomicTopic,
      individualConcept?: IndividualConcept
    ) => {
      const needsExpansion = (expansion: AtomicExpansion | {} | undefined): boolean => {
        if (!expansion || Object.keys(expansion).length === 0) {
          return true;
        }
        if ('steps' in expansion && Array.isArray(expansion.steps)) {
          return expansion.steps.length < 3;
        }
        return true;
      };

      if (atomicTopic.specificSkills) {
        atomicTopic.specificSkills.forEach(skill => {
          if (needsExpansion(skill.atomicExpansion)) {
            skillsToExpand.push({
              path: [area.name, discipline.name, mainTopic.name, atomicTopic.name, skill.name],
              skill,
            });
          }
        });
      }

      if (atomicTopic.individualConcepts) {
        atomicTopic.individualConcepts.forEach(concept => {
          concept.specificSkills.forEach(skill => {
            if (needsExpansion(skill.atomicExpansion)) {
              skillsToExpand.push({
                path: [
                  area.name,
                  discipline.name,
                  mainTopic.name,
                  atomicTopic.name,
                  concept.name,
                  skill.name,
                ],
                skill,
              });
            }
          });
        });
      }
    };

    curriculum.curriculumData.areas.forEach(area => {
      area.disciplines.forEach(discipline => {
        discipline.mainTopics.forEach(mainTopic => {
          mainTopic.atomicTopics.forEach(atomicTopic => {
            collectSkills(area, discipline, mainTopic, atomicTopic);
          });
        });
      });
    });

    console.log(`📊 Encontradas ${skillsToExpand.length} habilidades para expandir`);

    if (this.debug) {
      console.log(`🔍 [DEBUG] Distribuição de habilidades por área:`);
      const byArea = new Map<string, number>();
      skillsToExpand.forEach(({ path }) => {
        const area = path[0];
        byArea.set(area, (byArea.get(area) || 0) + 1);
      });
      byArea.forEach((count, area) => {
        console.log(`🔍 [DEBUG]   ${area}: ${count} habilidades`);
      });
    }

    // Processamento paralelo com controle de concorrência
    await this.processInParallel(
      skillsToExpand,
      async ({ path, skill }, index, total) => {
        const progress = `[${index + 1}/${total}]`;
        console.log(`🔄 ${progress} Expandindo: ${path.join(' > ')}`);

        try {
          const startTime = Date.now();
          const expanded = await this.expandSingleSkill(skill, path);
          const duration = Date.now() - startTime;

          skill.atomicExpansion = expanded;

          if (this.debug) {
            const stepsCount =
              'steps' in expanded && Array.isArray(expanded.steps) ? expanded.steps.length : 0;
            console.log(`✅ ${progress} Concluído em ${duration}ms (${stepsCount} steps)`);
          }
        } catch (error: any) {
          console.error(`❌ ${progress} Erro ao expandir habilidade ${skill.name}:`, error.message);
          if (this.debug) {
            console.error(`🔍 [DEBUG] Erro completo:`, error);
          }
        }
      },
      MAX_CONCURRENT_REQUESTS
    );

    return curriculum;
  }

  async processInParallel<T>(
    items: T[],
    processor: (item: T, index: number, total: number) => Promise<void>,
    concurrency: number
  ): Promise<void> {
    if (items.length === 0) return;

    const executing = new Set<Promise<void>>();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Se atingiu o limite de concorrência, espera uma promise terminar
      while (executing.size >= concurrency) {
        await Promise.race(executing);
        // Remove promises já resolvidas do Set
        // Isso é feito automaticamente quando a promise resolve no .finally abaixo
      }

      const promise = processor(item, i + 1, items.length)
        .catch(() => {
          // Erro já foi logado no processor
        })
        .finally(() => {
          executing.delete(promise);
        });

      executing.add(promise);
    }

    // Espera todas as promises restantes terminarem
    await Promise.all(Array.from(executing));
  }

  async expandSingleSkill(skill: SpecificSkill, path: string[]): Promise<AtomicExpansion> {
    const prompt = `${this.atomicExpandPrompt}

Habilidade específica a expandir:
- Nome: ${skill.name}
- Descrição: ${skill.description || 'Sem descrição'}
- ID: ${skill.id}
- Contexto: ${path.join(' > ')}

Crie uma expansão atômica completa seguindo TODAS as diretrizes acima. Retorne APENAS o JSON da atomicExpansion, sem markdown, sem explicações.

Formato esperado:
{
  "steps": [...],
  "practicalExample": "...",
  "finalVerifications": [...],
  "assessmentCriteria": [...],
  "crossCurricularConnections": [...],
  "realWorldApplication": "..."
}`;

    let attempts = 0;
    while (attempts < this.maxRetries) {
      try {
        const requestConfig: any = {
          model: this.model,
          messages: [
            {
              role: 'system',
              content:
                'Você é um especialista em criar planos de aprendizado detalhados e estruturados. Sempre retorne JSON válido.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.5,
        };

        if (this.supportsJsonMode) {
          requestConfig.response_format = { type: 'json_object' };
        }

        const response = await this.openai.chat.completions.create(requestConfig);

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('Resposta vazia da API');
        }

        let jsonContent = content.trim();
        if (jsonContent.startsWith('```json')) {
          jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonContent.startsWith('```')) {
          jsonContent = jsonContent.replace(/```\n?/g, '');
        }

        const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonContent = jsonMatch[0];
        }

        const expansion = JSON.parse(jsonContent) as AtomicExpansion;
        return expansion;
      } catch (error: any) {
        attempts++;
        if (attempts >= this.maxRetries) {
          console.error(`Erro ao expandir habilidade após ${this.maxRetries} tentativas:`, error);
          return {
            steps: [],
            practicalExample: '',
            finalVerifications: [],
            assessmentCriteria: [],
            crossCurricularConnections: [],
            realWorldApplication: '',
          };
        }
        console.warn(`Tentativa ${attempts}/${this.maxRetries} falhou, tentando novamente...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }

    return {
      steps: [],
      practicalExample: '',
      finalVerifications: [],
      assessmentCriteria: [],
      crossCurricularConnections: [],
      realWorldApplication: '',
    };
  }

  async saveCurriculumJSON(
    curriculum: CurriculumJSON,
    disciplineCode: string,
    disciplineName: string
  ): Promise<string> {
    // Sanitize filename to replace invalid characters
    const sanitizedName = disciplineName.replace(/[\/:*?"<>|]/g, '-');
    const filename = `${disciplineCode} - ${sanitizedName}.json`;
    const filepath = path.join(OUTPUT_DIR, filename);

    await fs.writeFile(filepath, JSON.stringify(curriculum, null, 2), 'utf-8');
    console.log(`✓ Arquivo salvo: ${filename}`);

    return filepath;
  }

  async readExistingCurriculumFiles(): Promise<
    Array<{ filepath: string; curriculum: CurriculumJSON }>
  > {
    console.log('📂 Lendo arquivos JSON existentes do diretório curriculum...');

    const files = await fs.readdir(OUTPUT_DIR);
    const jsonFiles = files.filter(
      f => f.endsWith('.json') && f !== '.process-catalog-checkpoint.json'
    );

    const curricula: Array<{ filepath: string; curriculum: CurriculumJSON }> = [];

    for (const filename of jsonFiles) {
      const filepath = path.join(OUTPUT_DIR, filename);
      try {
        const content = await fs.readFile(filepath, 'utf-8');
        const curriculum = JSON.parse(content) as CurriculumJSON;
        curricula.push({ filepath, curriculum });
        console.log(`✅ Carregado: ${filename}`);
      } catch (error: any) {
        console.warn(`⚠️ Erro ao carregar ${filename}: ${error.message}`);
      }
    }

    console.log(`📊 Encontrados ${curricula.length} arquivos JSON válidos`);
    return curricula;
  }

  async processExistingCurriculumFiles(): Promise<string[]> {
    console.log('🚀 === Iniciando processamento de arquivos JSON existentes ===\n');

    const overallStartTime = Date.now();

    // Carrega recursos necessários
    await this.loadPrompt();
    await this.loadSchemaExample();
    await this.loadValidationSchema();

    // Lê todos os arquivos JSON existentes
    const existingCurricula = await this.readExistingCurriculumFiles();

    if (existingCurricula.length === 0) {
      console.log('⚠️ Nenhum arquivo JSON encontrado no diretório curriculum');
      return [];
    }

    const outputFiles: string[] = [];
    const errors: Array<{ filename: string; error: string }> = [];

    // Processa arquivos em paralelo
    await this.processInParallel(
      existingCurricula,
      async ({ filepath, curriculum }, index, total) => {
        const filename = path.basename(filepath);
        const startTime = Date.now();
        console.log(`\n📄 [${index + 1}/${total}] Processando ${filename}...`);

        try {
          // Verifica se precisa expandir skills
          const needsExpansion = this.checkIfCurriculumNeedsExpansion(curriculum);

          if (needsExpansion) {
            console.log(`🔧 Expandindo habilidades atômicas em ${filename}...`);
            const expandedCurriculum = await this.expandAtomicSkills(curriculum);

            // Salva o arquivo atualizado
            await fs.writeFile(filepath, JSON.stringify(expandedCurriculum, null, 2), 'utf-8');
            console.log(`✅ Arquivo atualizado: ${filename}`);

            // Recalcula totalSkills
            this.recalculateTotalSkills(expandedCurriculum);
            await fs.writeFile(filepath, JSON.stringify(expandedCurriculum, null, 2), 'utf-8');
          } else {
            console.log(`⏭️ ${filename} já está completo, pulando...`);
          }

          outputFiles.push(filepath);

          const duration = Date.now() - startTime;
          console.log(`✅ ${filename} concluído em ${(duration / 1000).toFixed(1)}s`);
        } catch (error: any) {
          const errorMsg = error.message || String(error);
          console.error(`❌ Erro ao processar ${filename}:`, errorMsg);
          errors.push({ filename, error: errorMsg });

          if (this.debug) {
            console.error(`🔍 [DEBUG] Stack trace:`, error.stack);
          }
        }
      },
      MAX_CONCURRENT_REQUESTS
    );

    const overallDuration = Date.now() - overallStartTime;
    console.log(`\n🎉 === Processamento concluído ===`);
    console.log(`✅ ${outputFiles.length} arquivo(s) processado(s) com sucesso`);
    if (errors.length > 0) {
      console.log(`⚠️  ${errors.length} erro(s) encontrado(s):`);
      errors.forEach(({ filename, error }) => {
        console.log(`   - ${filename}: ${error}`);
      });
    }
    console.log(`⏱️  Tempo total: ${(overallDuration / 1000 / 60).toFixed(1)} minutos`);

    return outputFiles;
  }

  checkIfCurriculumNeedsExpansion(curriculum: CurriculumJSON): boolean {
    let needsExpansion = false;

    const collectSkills = (
      area: Area,
      discipline: Discipline,
      mainTopic: MainTopic,
      atomicTopic: AtomicTopic,
      individualConcept?: IndividualConcept
    ) => {
      const needsExpansionCheck = (expansion: AtomicExpansion | {} | undefined): boolean => {
        if (!expansion || Object.keys(expansion).length === 0) {
          return true;
        }
        if ('steps' in expansion && Array.isArray(expansion.steps)) {
          return expansion.steps.length < 3;
        }
        return true;
      };

      if (atomicTopic.specificSkills) {
        atomicTopic.specificSkills.forEach(skill => {
          if (needsExpansionCheck(skill.atomicExpansion)) {
            needsExpansion = true;
          }
        });
      }

      if (atomicTopic.individualConcepts) {
        atomicTopic.individualConcepts.forEach(concept => {
          concept.specificSkills.forEach(skill => {
            if (needsExpansionCheck(skill.atomicExpansion)) {
              needsExpansion = true;
            }
          });
        });
      }
    };

    curriculum.curriculumData.areas.forEach(area => {
      area.disciplines.forEach(discipline => {
        discipline.mainTopics.forEach(mainTopic => {
          mainTopic.atomicTopics.forEach(atomicTopic => {
            collectSkills(area, discipline, mainTopic, atomicTopic);
          });
        });
      });
    });

    return needsExpansion;
  }

  async processAllDisciplines(): Promise<string[]> {
    console.log('🚀 === Iniciando processamento do catálogo ===\n');

    const overallStartTime = Date.now();

    // Garante que o diretório de saída existe
    try {
      await fs.mkdir(OUTPUT_DIR, { recursive: true });
      console.log(`📁 Diretório de saída: ${OUTPUT_DIR}`);
    } catch (error) {
      // Diretório já existe, ok
    }

    // Carrega checkpoint
    await this.loadCheckpoint();

    if (this.debug) {
      console.log(`🔍 [DEBUG] Carregando recursos...`);
    }

    await this.loadPrompt();
    await this.loadSchemaExample();
    await this.loadValidationSchema();

    if (this.debug) {
      console.log(`🔍 [DEBUG] Prompt carregado: ${this.atomicExpandPrompt.length} caracteres`);
      console.log(`🔍 [DEBUG] Schema exemplo carregado`);
      console.log(
        `🔍 [DEBUG] Schema de validação carregado: ${this.validationSchema ? 'sim' : 'não'}`
      );
    }

    const pdfText = await this.extractTextFromPDF(PDF_PATH);
    const disciplines = await this.extractDisciplinesFromPDF(pdfText);

    if (disciplines.length === 0) {
      throw new Error('Nenhuma disciplina encontrada no PDF');
    }

    // Filtra disciplinas já processadas
    const disciplinesToProcess: Array<{
      code: string;
      name: string;
      content: string;
      index: number;
    }> = [];
    for (let i = 0; i < disciplines.length; i++) {
      const discipline = disciplines[i];
      const isProcessed = await this.isDisciplineProcessed(discipline.code);
      if (!isProcessed) {
        disciplinesToProcess.push({ ...discipline, index: i });
      } else {
        console.log(
          `⏭️  [${i + 1}/${disciplines.length}] ${discipline.code} já processado, pulando...`
        );
      }
    }

    if (disciplinesToProcess.length === 0) {
      console.log(`\n✅ Todas as disciplinas já foram processadas!`);
      return [];
    }

    console.log(
      `\n📊 ${disciplinesToProcess.length} disciplina(s) para processar (${disciplines.length - disciplinesToProcess.length} já processada(s))`
    );

    // Atualiza checkpoint com total
    if (!this.checkpoint) {
      this.checkpoint = {
        processedDisciplines: [],
        lastUpdate: new Date().toISOString(),
        totalDisciplines: disciplines.length,
      };
    } else {
      this.checkpoint.totalDisciplines = disciplines.length;
    }
    await this.saveCheckpoint(this.checkpoint);

    const outputFiles: string[] = [];
    const errors: Array<{ code: string; error: string }> = [];

    // Processa disciplinas em paralelo com controle de concorrência
    await this.processInParallel(
      disciplinesToProcess,
      async (discipline, localIndex, total) => {
        const globalIndex = discipline.index + 1;
        const disciplineStartTime = Date.now();
        console.log(
          `\n📚 [${localIndex}/${total}] (${globalIndex}/${disciplines.length}) Processando ${discipline.code}...`
        );

        try {
          let curriculum = await this.generateCurriculumJSON(discipline);
          curriculum = await this.expandAtomicSkills(curriculum);
          const filepath = await this.saveCurriculumJSON(
            curriculum,
            discipline.code,
            discipline.name
          );
          outputFiles.push(filepath);
          await this.markDisciplineAsProcessed(discipline.code);

          const disciplineDuration = Date.now() - disciplineStartTime;
          console.log(
            `✅ ${discipline.code} concluído em ${(disciplineDuration / 1000).toFixed(1)}s`
          );

          if (this.debug) {
            const totalSkills = curriculum.curriculumData.metadata.totalAtomicSkills;
            console.log(`🔍 [DEBUG] Total de skills: ${totalSkills}`);
          }
        } catch (error: any) {
          const errorMsg = error.message || String(error);
          console.error(`❌ Erro ao processar ${discipline.code}:`, errorMsg);
          errors.push({ code: discipline.code, error: errorMsg });

          if (this.debug) {
            console.error(`🔍 [DEBUG] Stack trace:`, error.stack);
          }
        }
      },
      Math.max(1, Math.floor(MAX_CONCURRENT_REQUESTS / 3)) // Menos concorrência para disciplinas completas
    );

    const overallDuration = Date.now() - overallStartTime;
    console.log(`\n🎉 === Processamento concluído ===`);
    console.log(`✅ ${outputFiles.length} arquivo(s) gerado(s) com sucesso`);
    if (errors.length > 0) {
      console.log(`⚠️  ${errors.length} erro(s) encontrado(s):`);
      errors.forEach(({ code, error }) => {
        console.log(`   - ${code}: ${error}`);
      });
    }
    console.log(`⏱️  Tempo total: ${(overallDuration / 1000 / 60).toFixed(1)} minutos`);

    if (this.debug) {
      console.log(`\n🔍 [DEBUG] Estatísticas finais:`);
      console.log(`  - Disciplinas processadas: ${outputFiles.length}`);
      console.log(`  - Disciplinas com erro: ${errors.length}`);
      console.log(
        `  - Taxa de sucesso: ${((outputFiles.length / disciplinesToProcess.length) * 100).toFixed(1)}%`
      );
      if (disciplinesToProcess.length > 0) {
        console.log(
          `  - Tempo médio por disciplina: ${(overallDuration / disciplinesToProcess.length / 1000).toFixed(1)}s`
        );
      }
    }

    return outputFiles;
  }
}

async function main() {
  try {
    const processor = new CatalogProcessor();

    // Verifica se deve processar arquivos existentes ou gerar novos do PDF
    const processExisting =
      process.env.PROCESS_EXISTING === 'true' || process.argv.includes('--existing');

    if (processExisting) {
      console.log('🔄 Modo: Processando arquivos JSON existentes');
      const files = await processor.processExistingCurriculumFiles();
      console.log('\nArquivos processados:');
      files.forEach(file => console.log(`  - ${file}`));
    } else {
      console.log('📄 Modo: Processando catálogo do PDF');
      const files = await processor.processAllDisciplines();
      console.log('\nArquivos gerados:');
      files.forEach(file => console.log(`  - ${file}`));
    }
  } catch (error) {
    console.error('Erro fatal:', error);
    process.exit(1);
  }
}

const isDirectExecution =
  process.argv[1]?.includes('process-catalog') ||
  process.argv[1]?.endsWith('process-catalog.ts') ||
  process.argv[1]?.endsWith('process-catalog.js');

if (isDirectExecution) {
  main();
}

export { CatalogProcessor };
