# Guia de port do ibivibe-expo

Este documento é um roteiro para reimplementar o app atual em React Native,
usando Expo e TypeScript, mantendo o backend existente. O objetivo é fazer um
port incremental e verificável, não uma tradução linha a linha do Dart.

## 1. O que existe hoje

O app possui aproximadamente 376 arquivos Dart e 28 mil linhas, organizados
por feature. As áreas principais são:

| Área | Telas/fluxos |
| --- | --- |
| Welcome | Welcome, seleção de contas salvas |
| Auth | Login, cadastro, Google, recuperação de senha, validação de e-mail |
| Onboarding | Perfil, interesses, gênero/slug do Google, dados empresariais |
| Contas | Perfil, interesses, gerenciamento de contas, alternância de conta |
| Home | Página inicial, categorias, busca e localização |
| Negócios | Lista, detalhe, perfil público, contato e edição |
| Cidades | Lista, detalhe e mapa |
| Eventos | Lista e detalhe |
| Favoritos | Lista, adicionar e remover favorito por conta |
| Busca | Busca expandida e pesquisas recentes |
| Mídia | Upload/listagem de imagens e avatar |
| WebViews | Conteúdo externo dentro do app |
| Configurações | Tema, cache, preferências e itens ainda em construção |

Há partes explicitamente incompletas no Flutter, como comentários, avaliações,
pagamentos, notificações, idioma e alguns redirects. Elas devem ser marcadas
como backlog, não tratadas como requisito oculto do port.

## 2. Stack recomendada

Comece com development builds do Expo desde o primeiro dia. O projeto usa
mapa, Google Sign-In, deep links, localização, mídia, WebViews e permissões;
Expo Go não cobre de forma confiável todos esses módulos.

```text
Expo + Expo Router
NativeWind + Tailwind CSS
@expo/ui              primitives e controles nativos
TypeScript
TanStack Query       estado remoto e cache de API
Zustand              sessão, conta ativa e estado local de UI
React Hook Form + Zod formulários e validação
expo-secure-store    access token e refresh token
expo-sqlite          cache estruturado por conta
expo-linking         deep links
Axios ou fetch       cliente HTTP
```

Não é obrigatório usar exatamente essa combinação. A separação importante é:

- TanStack Query para dados vindos da API;
- Zustand para sessão e estado efêmero;
- SecureStore exclusivamente para credenciais;
- SQLite para cache persistente que precise de consulta/invalidação.

## 3. Estrutura inicial do novo projeto

```text
app/
  _layout.tsx
  index.tsx
  (public)/welcome.tsx
  (public)/account-selection.tsx
  (auth)/login.tsx
  (auth)/register.tsx
  (auth)/verify-email.tsx
  (auth)/forgot-password.tsx
  (onboarding)/...
  (app)/_layout.tsx
  (app)/home.tsx
  (app)/accounts/...
  (app)/businesses/...
  (app)/cities/...
  (app)/events/...
  (app)/favorites.tsx
  (app)/search/...
src/
  api/
  components/
  features/
  hooks/
  stores/
  storage/
  theme/
  types/
  utils/
```

Não migre arquivos `.g.dart`. Eles são artefatos gerados pelo Riverpod e
serialização do Flutter.

## 4. Ordem de implementação

### Fase 0 — congelar contratos

- Registrar a lista de endpoints usados pelo mobile.
- Confirmar o formato JSON de `Account`, `Business`, `City`, `Event`, `Tag` e
  `Favorite`.
- Confirmar os códigos de erro da API.
- Manter o Flutter funcionando durante todo o port.
- Criar um arquivo `.env` para `EXPO_PUBLIC_API_BASE_URL`.

Endpoints de autenticação atualmente relevantes:

```text
POST /auth/login
POST /auth/register
POST /auth/google
POST /auth/google/complete
POST /auth/refresh
GET  /auth/me
GET  /auth/check-unique
GET  /auth/verify-email?token=...
POST /auth/resend-verification
POST /auth/change-unverified-email
POST /auth/forgot-password
POST /auth/reset-password
```

### Fase 1 — fundação visual e API

- Recriar tema claro/escuro, tipografia DM Sans, cores e espaçamentos.
- Criar componentes equivalentes aos mais usados do Forui: `Button`,
  `GhostButton`, `TextField`, `Select`, `Dialog`, `Sheet`, `Card`, `Badge`,
  `Tile`, `Scaffold` e `Toast`.
- Implementar cliente HTTP com base URL, logs e conversão de erros.
- Adicionar query keys centralizadas e tipos TypeScript.

Exemplo de query key:

```ts
export const queryKeys = {
  account: (id: string) => ['account', id] as const,
  interests: (id: string) => ['account-interests', id] as const,
  businesses: ['businesses'] as const,
  favorites: (id: string) => ['favorites', id] as const,
};
```

### Fase 2 — sessão e autenticação

Implementar primeiro a máquina de estados abaixo:

```text
boot
├─ tokens válidos ──> /auth/me
│                    ├─ e-mail não verificado ──> /auth/verify-email
│                    ├─ onboarding pendente ──> /onboarding/profile-select
│                    └─ pronto ──> /(app)/home
├─ sem tokens + contas em cache ──> /account-selection
└─ sem tokens + sem cache ──> /welcome
```

Regras obrigatórias:

- Nunca considerar uma conta autenticada apenas porque ela está no cache.
- Selecionar uma conta salva deve abrir login com o e-mail preenchido.
- O login deve substituir os tokens seguros e atualizar a conta ativa.
- Logout deve remover apenas a conta ativa do cache, preservando as demais.
- Conta nova deve ficar bloqueada na validação de e-mail antes do onboarding.

### Fase 3 — validação de e-mail e deep link

Configuração no `app.json`/`app.config.ts`:

```json
{
  "expo": {
    "scheme": "ibivibe",
    "plugins": ["expo-router"]
  }
}
```

Rota:

```text
ibivibe:///auth/verify-email?token=<url-encoded-token>
```

A tela deve:

1. Ler o token da rota.
2. Chamar `GET /auth/verify-email`.
3. Atualizar a conta ativa em memória e no cache como verificada.
4. Remover o bloqueio sem exigir novo `/auth/me`.
5. Navegar para onboarding ou home conforme a preferência da conta.
6. Oferecer inserção manual do token.
7. Oferecer “Enviar novamente” e “Corrigir e-mail”.

O reenvio deve exibir o rate limit de 3 e-mails por conta por hora. O token
manual continua necessário para ambientes em que o deep link não abre, como
alguns emuladores Linux.

### Fase 4 — onboarding por conta

Migrar as telas na ordem:

1. escolha de perfil;
2. interesses de negócios;
3. interesses de eventos;
4. dados empresariais;
5. fluxo especial do Google.

`needsOnboarding` não deve ser uma flag global. Use uma chave por conta, por
exemplo `onboarding:<accountId>`, ou uma tabela local de preferências.

Depois de cada mutação bem-sucedida:

- atualizar o estado da conta ativa;
- atualizar o cache da conta;
- invalidar queries dependentes;
- só então navegar para a próxima tela.

### Fase 5 — contas e dados da conta

Migrar perfil e múltiplas contas antes das telas de exploração. O seletor deve
mostrar nome e e-mail e ter itens com texto legível no tema escuro.

Ao alterar perfil ou interesses:

```text
API responde 200
  -> atualizar Account no Zustand
  -> persistir Account no SQLite
  -> invalidar account/<id> e interesses/<id>
  -> atualizar componentes dependentes
```

### Fase 6 — exploração do app

Ordem sugerida:

1. home;
2. cidades e localização;
3. negócios;
4. eventos;
5. favoritos;
6. busca e pesquisas recentes;
7. detalhes, mídia e WebViews.

Para listas públicas, use TanStack Query com `staleTime` definido por recurso.
Após criação ou edição, invalide explicitamente as queries relacionadas; não
confie apenas em TTL.

## 5. Mapeamento Flutter → React Native

| Flutter atual | React Native/Expo |
| --- | --- |
| `GoRouter` | Expo Router |
| `Riverpod` | TanStack Query + Zustand |
| `Dio` | Axios ou fetch wrapper |
| `flutter_secure_storage` | `expo-secure-store` |
| `Sembast` | `expo-sqlite` |
| `FTextFormField` | componente próprio + React Hook Form |
| `FButton` | `@expo/ui` `Button` encapsulado pelo design system |
| `FSelect` | controle `@expo/ui` quando suportado; wrapper próprio como fallback |
| `showModalBottomSheet` | `@expo/ui`/componente próprio conforme plataforma |
| `showDialog` | `@expo/ui`/`Modal` encapsulado pelo design system |
| `google_sign_in` | `expo-auth-session` ou módulo Google compatível |
| `permission_handler` | módulos Expo de permissões |
| `geolocator` | `expo-location` |
| `maplibre_gl` | MapLibre com development build/config plugin |
| `video_player` | `expo-video` |
| WebViews | `react-native-webview` |
| `url_launcher` | `expo-linking`/`Linking` |

### Uso do NativeWind

Use NativeWind para a maior parte dos estilos de tela e componentes, mantendo
tokens de cor, tipografia, espaçamento e radius em um único tema. Componentes
que dependem de estilos dinâmicos complexos podem usar `StyleSheet` junto com
NativeWind, mas não devem criar valores arbitrários espalhados pelas telas.

Exemplo de componente base:

```tsx
type ButtonProps = PressableProps & {
  variant?: 'default' | 'ghost';
};

export function Button({ variant = 'default', className, ...props }: ButtonProps) {
  const base = 'min-h-12 items-center justify-center rounded-xl px-4';
  const styles = variant === 'ghost'
    ? 'bg-transparent active:bg-white/10'
    : 'bg-primary active:opacity-80';

  return <Pressable className={`${base} ${styles} ${className ?? ''}`} {...props} />;
}
```

Instalação inicial:

```bash
npx expo install nativewind tailwindcss
npx tailwindcss init
```

Configure o `tailwind.config.js`, o `global.css` e o plugin do NativeWind
conforme a versão do Expo escolhida. Centralize as cores do tema claro/escuro
como tokens; não replique as cores do Flutter diretamente em cada componente.

### Uso do `@expo/ui`

Use `@expo/ui` nos primitives e controles que se beneficiem de comportamento
nativo, priorizando os componentes universais para manter Android, iOS e web
alinhados. Quando um componente universal não cobrir o caso, avalie a versão
específica da plataforma isolada atrás de um wrapper próprio. Componentes
universais devem ficar dentro de `Host`.

A divisão de responsabilidade será:

- `@expo/ui`: primitives, controles nativos e comportamento de interação;
- NativeWind: layout, composição, espaçamento, tokens e variantes visuais;
- componentes próprios: identidade do IbiVibe e compatibilidade entre plataformas.

Não substitua automaticamente todo o React Native por `@expo/ui`. Valide cada
componente em Android, iOS e web, especialmente `Select`, `Dialog`, `Sheet`,
formulários e navegação.

## 6. Cache e invalidação

O cache é a área com maior risco de bugs durante o port. Defina uma política
antes de criar as telas:

- tokens: SecureStore, nunca SQLite ou AsyncStorage;
- contas: SQLite, identificadas por `accountId`;
- favoritos: SQLite por `accountId`;
- onboarding: SQLite por `accountId`;
- cidades: cache com TTL, mas `forceRefresh` no onboarding;
- negócios: invalidar lista e item após edição/criação;
- dados remotos: sempre possuir uma ação explícita de `refetch`;
- logout: limpar queries da conta encerrada e resetar estado da sessão;
- troca de conta: cancelar ou ignorar respostas pendentes da conta anterior.

Toda chamada assíncrona que atualiza estado deve conferir se o `accountId` da
resposta ainda é a conta ativa. Isso evita que uma resposta atrasada de A
substitua os dados de B.

## 7. Testes mínimos por fase

### Auth

- cadastro envia nome e `display_name` corretamente;
- login salva tokens;
- refresh simultâneo não gera múltiplos refreshes;
- logout remove tokens;
- deep link com token válido verifica a conta;
- token expirado mostra erro;
- token manual funciona;
- reenvio bloqueia o quarto envio dentro de uma hora;
- correção de e-mail invalida o token anterior.

### Múltiplas contas

- startup sem tokens e com contas mostra o seletor;
- selecionar conta pede senha;
- conta selecionada substitui tokens e estado ativo;
- logout de A mantém B disponível;
- dados de A não aparecem durante o login de B.

### Onboarding e cache

- A concluída não marca B como concluída;
- interesses atualizados aparecem imediatamente;
- empresa recém-criada aparece sem reinstalar o app;
- favoritos de A não aparecem em B;
- cache expirado permite atualização remota;
- uma resposta atrasada não sobrescreve a conta atual.

### Dispositivos

- Android físico;
- iOS físico, se disponível;
- emulador Android;
- emulador Linux/desktop apenas para token manual e comportamento básico;
- cold start, background/foreground e deep link com app fechado.

## 8. Estratégia de branches e commits

Mantenha o Flutter como referência enquanto o port avança:

```text
develop
├─ feat/rn-foundation
├─ feat/rn-auth
├─ feat/rn-onboarding
├─ feat/rn-accounts-cache
├─ feat/rn-exploration
└─ feat/rn-release
```

Cada fase deve conter commits pequenos, por exemplo:

```text
feat(rn): add typed api client
feat(rn): add session restoration state machine
feat(rn): add email verification deep link
fix(rn): scope onboarding preference by account
feat(rn): add account selection login flow
```

Evite portar uma feature e trocar simultaneamente o contrato do backend. Se o
contrato precisar mudar, documente e implemente primeiro a compatibilidade no
cliente Flutter e no React Native.

## 9. Critério de conclusão

O port pode ser considerado pronto quando:

- os fluxos de auth, deep link, onboarding e múltiplas contas passarem nos
  testes acima;
- não houver leitura de dados protegidos somente pelo cache;
- cada mutação atualizar ou invalidar seu cache correspondente;
- Android e iOS abrirem o deep link com o app fechado;
- os endpoints existentes forem consumidos sem adaptações específicas de
  Flutter;
- as telas ainda incompletas do Flutter estiverem explicitamente marcadas
  como backlog ou implementadas no novo app;
- houver uma build de preview instalada no celular para teste manual.

## 10. Primeiro passo prático

Criar o projeto em uma pasta separada, sem mexer no Flutter:

```bash
npx create-expo-app@latest ibivibe-expo --template blank-typescript
cd ibivibe-expo
npx expo install expo-router expo-linking expo-secure-store expo-sqlite expo-dev-client @expo/ui
npm install @tanstack/react-query zustand react-hook-form zod @hookform/resolvers axios
npx expo start --dev-client
```

Depois implemente somente `boot → welcome → cadastro/login → validação de
e-mail → onboarding`. Quando esse circuito estiver equivalente ao Flutter,
avance para as features de exploração.
