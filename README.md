# 🚀 ENEM RP Game - Reimplementação Moderna

## 📋 Visão Geral

O ENEM RP Game é uma plataforma educacional gamificada desenvolvida para ajudar estudantes a se prepararem para o ENEM através de um sistema inspirado em patentes da Aeronáutica Brasileira. Esta reimplementação completa utiliza tecnologias modernas para proporcionar uma experiência imersiva e motivadora.

### 🎯 Objetivos Principais

- **Gamificação Educacional**: Transformar o estudo em uma jornada envolvente
- **Progressão Visual**: Sistema de patentes e níveis inspirado na hierarquia militar
- **Acompanhamento Detalhado**: Tracking granular de habilidades e competências
- **Motivação Contínua**: Sistema de conquistas e streaks de estudo

## 🏗️ Arquitetura

### Estrutura do Monorepo

```
enem-rp-game/
├── packages/                 # Pacotes compartilhados
│   ├── core-engine/         # Motor de jogos Phaser 3
│   ├── game-logic/          # Lógica de negócio e gamificação
│   ├── ui-components/       # Componentes UI React
│   ├── shared-types/        # Tipos TypeScript compartilhados
│   └── curriculum/          # Gestão de currículo
├── apps/                    # Aplicações
│   ├── web-app/            # Aplicação web principal
│   └── admin-dashboard/    # Painel administrativo (futuro)
└── docs/                    # Documentação
```

### 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| [Architecture](./docs/ARCHITECTURE.md) | Arquitetura do sistema e estrutura de pacotes |
| [Components](./docs/COMPONENTS.md) | Referência da API de componentes UI |
| [Store](./docs/STORE.md) | Guia de gerenciamento de estado com Zustand |
| [Types](./docs/TYPES.md) | Definições de tipos TypeScript |
| [Testing](./docs/TESTING.md) | Estratégia e exemplos de testes |
| [Contributing](./docs/CONTRIBUTING.md) | Fluxo de trabalho para contribuição |

### Stack Tecnológica

- **Frontend**: React 18 + TypeScript + Vite
- **Game Engine**: Phaser 3 para elementos interativos
- **State Management**: Zustand (leve e performático)
- **Styling**: CSS-in-JS com design system cyberpunk
- **Build System**: Vite + npm workspaces
- **Development**: ESLint + Prettier + TypeScript

## 🎮 Funcionalidades Principais

### 🎨 Interface Cyberpunk

- **4 Temas Disponíveis**:
  - Neon Blue: Azul futurista com efeitos de neon
  - Matrix Green: Verde inspirado no clássico cyberpunk
  - Cyber Purple: Roxo vibrante e tecnológico
  - Retro Orange: Laranja com estética retrô-futurista

### 🏆 Sistema de Gamificação

#### **Sistema de XP (Experiência)**
- Cálculo dinâmico baseado em:
  - Dificuldade da habilidade (beginner/intermediate/advanced)
  - Performance do estudante (0-100%)
  - Streak de dias consecutivos
  - Tempo gasto vs tempo esperado
  - Bônus de primeira conclusão

#### **19 Patentes da Aeronáutica**
- **Oficiais Superiores**: Marechal do Ar → Tenente-Brigadeiro → Major-Brigadeiro
- **Oficiais**: Coronel → Tenente-Coronel → Major → Capitão → Tenente → Aspirante
- **Graduações**: Suboficial → Sargentos → Cabo → Soldados → Recruta

#### **30+ Conquistas**
- **Estudo**: Primeiros Passos, Aprendiz, Mestre, Perfeccionista
- **Streak**: Primeira Semana, Mês Dedicado, Guerreiro, Lendário
- **Conclusão**: Especialista, Polímata, Formado
- **Social**: Ajudante, Líder Comunitário, Mentor

### 📊 Sistema de Progressão

#### **Níveis e XP**
- **Fórmula**: XP = 100 × level^1.5
- **Progresso Visual**: Barras animadas com feedback imediato
- **Level Ups**: Celebrações visuais e notificações

#### **Currículo Estruturado**
- Hierarquia: Áreas → Disciplinas → Tópicos → Habilidades Atômicas
- Sistema de pré-requisitos automático
- Validação de progresso em tempo real

## 🚀 Getting Started

### Pré-requisitos

- Node.js >= 18.0.0
- npm >= 9.0.0

### Instalação

```bash
# Clone o repositório
git clone <repository-url>
cd enem-rp-game

# Instale dependências
npm install

# Inicie o desenvolvimento
npm run dev
```

### Comandos Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento

# Build
npm run build            # Build de todos os pacotes
npm run build:packages   # Build apenas dos pacotes
npm run build:web-app    # Build apenas da aplicação web

# Testes
npm run test             # Executa todos os testes
npm run test:watch       # Testes em modo watch

# Code Quality
npm run lint             # Verificação ESLint
npm run lint:fix         # Correção automática
npm run typecheck        # Verificação TypeScript

# Limpeza
npm run clean            # Remove todos os arquivos de build
```

## 📱 Demonstração

A aplicação de demonstração está disponível em `http://localhost:3000` após executar `npm run dev`.

### Funcionalidades Demonstradas

1. **Mudança de Tema**: Troca instantânea entre 4 temas cyberpunk
2. **Sistema de XP**: Simulação de ganho de experiência e level ups
3. **Patentes**: Visualização da patente atual e progresso
4. **Conquistas**: Sistema de notificações e achievements
5. **Componentes UI**: Cards, botões, modais, progress bars

## 🎯 Desenvolvimento

### Adicionando Novos Componentes

1. **UI Components**:
```typescript
// packages/ui-components/src/NewComponent.tsx
export const NewComponent: React.FC<NewComponentProps> = ({ ...props }) => {
  const { currentTheme } = useTheme();
  // Implementação
};
```

2. **Lógica de Jogo**:
```typescript
// packages/game-logic/src/new-system.ts
export class NewSystem {
  static calculateSomething(params: Params): Result {
    // Implementação
  }
}
```

### Estendendo o Sistema de Gamificação

```typescript
// Nova conquista no AchievementSystem
export const NEW_ACHIEVEMENTS = [
  {
    id: 'custom_achievement',
    name: 'Nome da Conquista',
    description: 'Descrição detalhada',
    icon: '🏆',
    category: 'custom' as const,
  }
];
```

## 🧪 Testes

### Estrutura de Testes

```bash
packages/
├── core-engine/
│   └── src/
│       ├── GameEngine.test.ts
│       └── scenes/
├── game-logic/
│   └── src/
│       ├── xp-system.test.ts
│       ├── rank-system.test.ts
│       └── achievement-system.test.ts
└── ui-components/
    └── src/
        ├── Button.test.tsx
        └── ThemeProvider.test.tsx
```

### Executando Testes

```bash
# Todos os testes
npm run test

# Testes específicos
npm run test packages/game-logic
npm run test -- --grep "XPSystem"
```

## 📊 Performance

### Métricas

- **Bundle Size**: <200kb (minificado + gzipped)
- **First Load**: <3 segundos
- **Runtime Performance**: 60 FPS consistent
- **Accessibility**: WCAG 2.1 AA compliance

### Otimizações

- Code splitting por rota
- Lazy loading de componentes
- Memoização de cálculos pesados
- Virtualização para listas longas

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# .env.local
VITE_API_URL=http://localhost:3001
VITE_ENABLE_DEBUG=true
VITE_THEME_DEFAULT=neonBlue
```

### Configuração de Build

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'phaser'],
  },
});
```

## 🎨 Design System

### Tokens de Design

```typescript
const cyberpunkThemes = {
  neonBlue: {
    primary: '#00f3ff',
    secondary: '#1a237e',
    background: '#0a0a0a',
    // ... mais tokens
  },
  // ... outros temas
};
```

### Componentes

Todos os componentes seguem o padrão:
- **Props tipadas** com TypeScript
- **Acessibilidade** nativa
- **Responsividade** mobile-first
- **Tematização** automática

## 📱 Roadmap

### ✅ Implementado (Versão 2.0)

- [x] Monorepo com workspaces
- [x] Sistema de XP completo
- [x] 19 patentes da Aeronáutica
- [x] 30+ conquistas
- [x] 4 temas cyberpunk
- [x] UI components base
- [x] Game engine integration
- [x] Demo interativa

### 🚧 Em Desenvolvimento

- [ ] Modo de estudo completo com Phaser
- [ ] Sistema de currículo real
- [ ] Dashboard de progresso
- [ ] Mobile PWA

### 📋 Planejado

- [ ] Sistema social (leaderboards)
- [ ] Multiplayer features
- [ ] Analytics avançados
- [ ] Integração com sistemas externos
- [ ] App nativo (React Native)

## 🤝 Contribuição

### Fluxo de Trabalho

1. **Fork** o repositório
2. **Branch**: `feature/nova-funcionalidade`
3. **Commit**: Mensagens convencionais
4. **PR**: Pull request com template
5. **Review**: Code review obrigatório
6. **Merge**: Após aprovação

### Padrões de Código

- **TypeScript**: Tipagem estrita
- **ESLint**: Seguir regras configuradas
- **Prettier**: Formatação automática
- **Convenções**: Nomenclatura clara e consistente

### Commits

```
feat(gamification): add new achievement system
fix(ui): resolve theme switching issue
docs(readme): update installation guide
test(xp-system): add unit tests for calculation
```

## 📄 Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

## 🙏 Créditos

- **Inspiração**: Sistema de patentes da Aeronáutica Brasileira
- **Design**: Estética cyberpunk e sci-fi
- **Metodologia**: Gamificação educacional baseada em research

## 📞 Contato

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Email**: contact@enem-rp-game.com

---

**🚀 Pronto para revolucionar o aprendizado para o ENEM!**# RP-ENEM
