# Arquitetura do IbiVibe Expo

Este documento orienta agentes e desenvolvedores que continuarem o port do
Flutter para React Native com Expo. O port é incremental: o Flutter continua
sendo referência funcional até que cada fluxo seja validado no Expo.

## Princípios

- Não migrar arquivos `.g.dart` ou traduzir Dart linha a linha.
- Preservar os contratos existentes do backend.
- Manter as rotas do Expo Router pequenas e previsíveis.
- Colocar regras de negócio nos ViewModels, não nas telas.
- Usar tokens visuais centralizados; não espalhar cores e espaçamentos.
- Dados protegidos não podem ser considerados válidos apenas por existirem no cache.
- Depois de uma mutação, atualizar o estado local e invalidar o cache relacionado.
- Fazer alterações pequenas e validar com `pnpm format`, `pnpm lint` e `pnpm typecheck`.

## Estrutura

```text
app/                         # somente rotas e layouts do Expo Router
  _layout.tsx                # providers globais
  index.tsx                  # boot e redirecionamento da sessão
  (public)/                   # welcome e seleção de contas
  (auth)/                     # login, cadastro e recuperação
  (onboarding)/               # etapas do onboarding
  (app)/                      # área autenticada

src/
  api/                        # cliente HTTP, erros e interceptors
  components/                 # componentes visuais reutilizáveis
  features/<feature>/
    models/                   # tipos, schemas Zod e mapeadores
    repositories/             # acesso a dados da feature, quando necessário
    viewmodels/               # hooks com estado e regras da tela
    components/               # componentes específicos da feature
  hooks/                      # hooks compartilhados
  stores/                     # Zustand: sessão e estado local global
  storage/                    # SecureStore, SQLite e persistência
  theme/                      # tokens e tema visual
  types/                      # tipos compartilhados entre features
  utils/                      # funções puras e utilitários

docs/                         # decisões e guias do projeto
```

## MVVM

O MVVM é aplicado com hooks, não com classes obrigatórias.

| Camada | Local | Responsabilidade |
| --- | --- | --- |
| View | `app/` e `features/*/components` | Renderização, eventos visuais e acessibilidade |
| ViewModel | `features/*/viewmodels` | Formulário, loading, erros, chamadas e transições |
| Model | `features/*/models` e `src/types` | Tipos TypeScript, schemas e transformação de dados |
| Repository/API | `src/api` e `features/*/repositories` | Comunicação com backend e persistência |
| Estado global | `src/stores` | Sessão, conta ativa e estado efêmero compartilhado |

Exemplo de uma rota:

```tsx
import { LoginForm } from '@/features/auth/components/LoginForm';

export default function LoginRoute() {
  return <LoginForm />;
}
```

O componente deve consumir um ViewModel:

```tsx
const { control, formState, submit, error } = useLoginViewModel();
```

O ViewModel deve concentrar validação, submissão, tratamento de erro e
atualização da sessão. A View pode exibir um `Alert`, toast ou mensagem inline,
mas não deve conhecer detalhes do Axios ou do contrato HTTP.

## Rotas

- Use grupos entre parênteses para organizar áreas sem alterar a URL.
- Use `app/` apenas para pontos de entrada de rota.
- Componentes de tela devem ficar em `src/features/<feature>/components`.
- Redirecionamentos de sessão devem passar por `app/index.tsx`.
- Depois de login ou cadastro, use `router.replace('/')` para que o boot decida
  entre home, validação de e-mail ou onboarding.
- Não crie uma rota paralela para o mesmo fluxo sem documentar a razão.

## Sessão e autenticação

O estado atual da sessão é:

```text
boot
├─ tokens ausentes ───────────────> anonymous -> welcome
└─ tokens presentes -> /auth/me
   ├─ conta não verificada ───────> needs-verification
   ├─ onboarding pendente ────────> needs-onboarding
   └─ conta pronta ───────────────> authenticated -> home
```

Regras obrigatórias:

- Access token e refresh token ficam exclusivamente no `expo-secure-store`.
- A conta só é autenticada após `/auth/me` ou uma resposta bem-sucedida de
  login/cadastro.
- Logout limpa tokens e o estado da sessão.
- Respostas assíncronas devem ser associadas à conta ativa antes de atualizar
  estado, especialmente quando a troca de conta for implementada.
- O refresh deve ser deduplicado quando várias chamadas receberem 401 ao mesmo
  tempo.

Arquivos atuais:

```text
src/stores/session-store.ts
src/storage/token-storage.ts
src/api/client.ts
src/features/auth/auth-api.ts
```

## API e dados remotos

- A base da API inclui `/api/v1` e é configurada por
  `EXPO_PUBLIC_API_BASE_URL`.
- Use `apiClient` para chamadas HTTP; não crie instâncias Axios por tela.
- Defina tipos de request/response antes de integrar uma nova operação.
- Converta erros em mensagens por meio de `getApiErrorMessage` ou de um mapper
  específico da feature.
- Use TanStack Query para dados remotos, com query keys centralizadas.
- Após criar ou editar, invalide explicitamente as queries afetadas.
- Não use TTL como substituto de invalidação após mutação.

## Cache e persistência

| Dado | Armazenamento |
| --- | --- |
| Access/refresh tokens | SecureStore |
| Contas salvas | SQLite por `accountId` |
| Favoritos | SQLite por `accountId` |
| Preferências de onboarding | SQLite por `accountId` |
| Dados públicos remotos | TanStack Query e, quando necessário, SQLite |

Nunca use AsyncStorage ou SQLite para tokens. Toda tabela persistente de conta
deve conter ou ser indexada por `accountId`.

## Tema e componentes

- Tokens principais ficam em `src/theme/tokens.ts`.
- A fonte da interface é DM Sans, carregada em `app/_layout.tsx`.
- Use NativeWind para composição simples e `StyleSheet` para estilos dinâmicos
  ou componentes que precisem de precisão maior.
- Componentes compartilhados vão para `src/components`.
- Componentes exclusivos ficam dentro da feature.
- Ao portar uma tela do Figma, reutilize assets exportados e adapte o resultado
  ao React Native; não copie HTML/Tailwind web diretamente.
- Use o tema atualizado do Flutter como referência para tokens e o Figma como
  referência de composição visual quando os dois estiverem disponíveis.

## Processo para implementar uma feature

1. Ler a tela equivalente no Flutter e localizar os endpoints usados.
2. Confirmar request, response, erros e regras de autenticação.
3. Criar ou atualizar tipos e schemas em `models`.
4. Criar o acesso à API em `auth-api.ts` ou no repository da feature.
5. Criar o ViewModel com estado de loading, erro e submissão.
6. Criar componentes de apresentação em `src/features`.
7. Adicionar apenas a rota mínima em `app/`.
8. Definir o comportamento de cache e invalidação.
9. Validar fluxo normal, erro, cold start e retorno de background quando
   aplicável.
10. Rodar os comandos de qualidade antes de entregar.

## Comandos obrigatórios

```bash
pnpm format
pnpm format:check
pnpm lint
pnpm typecheck
```

Para iniciar o projeto:

```bash
pnpm start
```

Para desenvolvimento nativo, prefira development builds. Expo Go não deve ser
tratado como ambiente de validação final para mapa, Google Sign-In, deep links,
permissões, mídia e módulos nativos.

## Checklist para agentes

Antes de editar:

- A mudança está na feature correta?
- Existe um componente ou token que pode ser reutilizado?
- O contrato do backend foi confirmado?
- A mudança altera sessão, cache ou navegação?

Antes de finalizar:

- Nenhuma regra de negócio importante ficou dentro da rota.
- Nenhum token foi salvo fora do SecureStore.
- A mutação atualiza ou invalida seus dados derivados.
- O modo escuro continua legível.
- `pnpm format`, `pnpm lint` e `pnpm typecheck` passam.
- Fluxos incompletos do Flutter foram marcados como backlog, não inventados.
