# IbiVibe Expo

Aplicação mobile multiplataforma do IbiVibe, reimplementada em React Native
com Expo e TypeScript. O app conecta usuários às cidades, negócios, eventos e
conteúdos da região do Ibiapaba, mantendo o backend existente.

> Este projeto é o port incremental do app Flutter em `../ibivibe-mobile`.
> O Flutter continua sendo a referência funcional durante a migração.

## Plataformas

- Android
- iOS
- Web para desenvolvimento e validações básicas

O projeto usa development builds desde o início. Expo Go pode ser usado para
fluxos compatíveis, mas não cobre de forma confiável todos os módulos nativos
planejados, como mapas, Google Sign-In, deep links e permissões.

## Funcionalidades migradas

- Welcome e seleção de contas salvas
- Cadastro, login, recuperação de senha e validação de e-mail
- Entrada inicial do onboarding
- Home com cidades, negócios, eventos e imagens remotas
- Busca agrupada e pesquisas recentes
- Contas pessoal e empresarial
- Favoritos por conta, conectados à API
- Listas e detalhes de cidades, negócios e eventos
- Configurações e tela de funcionalidades em desenvolvimento

Comentários, avaliações completas, pagamentos, notificações, idioma, mapas
interativos, mídia avançada e outros fluxos ainda incompletos permanecem como
backlog explícito do port.

## Stack

- Expo, Expo Router e development builds
- React Native, TypeScript e NativeWind
- TanStack Query para estado remoto, cache e invalidação
- Zustand para sessão e estado local de interface
- Axios para comunicação com a API
- React Hook Form + Zod para formulários
- Expo SecureStore para access token e refresh token
- Expo SQLite para cache persistente por conta (em evolução)
- Oxlint e Oxfmt para qualidade e formatação

## Pré-requisitos

- Node.js compatível com a versão do Expo instalada
- pnpm 11 ou superior
- Android Studio/Android SDK para Android ou Xcode para iOS
- Expo CLI via dependência do projeto
- Backend do IbiVibe acessível pela rede do dispositivo

## Começando

Clone o projeto e instale as dependências:

```bash
git clone https://github.com/1manuelcdev/ibivibe-expo.git
cd ibivibe-expo
pnpm install
```

Crie o arquivo de ambiente:

```bash
cp .env.example .env
```

Configure a URL do backend em `.env`:

```env
EXPO_PUBLIC_API_BASE_URL=https://api.example.com
```

Em um dispositivo físico, use um endereço acessível na rede local em vez de
`localhost`.

Inicie o projeto:

```bash
pnpm start
```

Para um development build:

```bash
pnpm expo run:android
pnpm expo run:ios
```

## Scripts

```bash
pnpm start          # inicia o Metro/Expo
pnpm android        # inicia no Android
pnpm ios            # inicia no iOS
pnpm web            # inicia a versão web
pnpm lint           # executa o Oxlint
pnpm lint:fix       # corrige problemas suportados pelo Oxlint
pnpm format         # formata com Oxfmt
pnpm format:check   # verifica a formatação
pnpm typecheck      # verifica os tipos TypeScript
```

## Estrutura

```text
app/                         # rotas do Expo Router
  (public)/                  # welcome e contas salvas
  (auth)/                    # autenticação
  (onboarding)/              # onboarding
  (app)/                     # área autenticada e navegação principal
src/
  api/                       # cliente HTTP e erros
  components/                # componentes compartilhados
  features/                  # módulos por domínio
    accounts/                # conta e troca de conta
    auth/                    # modelos, viewmodels e formulários
    exploration/             # listas públicas
    favorites/               # favoritos por conta
    home/                    # feed inicial e localização
    search/                  # busca e pesquisas recentes
    settings/                # configurações
  storage/                   # SecureStore e persistência local
  stores/                    # sessão e estado efêmero
  theme/                     # tokens visuais
  types/                     # tipos compartilhados
docs/                        # guia do port e arquitetura
```

## Arquitetura

As telas seguem uma separação inspirada no MVVM usado no Flutter:

```text
Route (app/)
    ↓
View (components/)
    ↓
ViewModel (features/*/viewmodels/)
    ↓
API / Query / Store
    ↓
Backend ou armazenamento local
```

Use TanStack Query para dados remotos, Zustand para sessão/estado de UI,
SecureStore exclusivamente para credenciais e SQLite para cache consultável.
O guia completo está em [`docs/architecture.md`](docs/architecture.md).

## Autenticação e segurança

O cliente usa JWT com refresh token:

1. login ou cadastro obtém os tokens;
2. tokens são armazenados no SecureStore;
3. requisições autenticadas recebem `Authorization: Bearer <token>`;
4. respostas `401` tentam refresh de forma compartilhada;
5. falha no refresh encerra a sessão e limpa as credenciais.

Contas presentes no cache nunca são consideradas autenticadas sem validação
com `/auth/me`.

## Deep link de validação

O esquema configurado é `ibivibe`:

```text
ibivibe:///auth/verify-email?token=<url-encoded-token>
```

O fluxo também aceita token manual para ambientes em que o deep link não abre,
como alguns emuladores Linux.

## Desenvolvimento

Mantenha o contrato do backend estável durante o port e valide mudanças com:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
```

Consulte o [guia do port](docs/guia-port-react-native-expo.md) para a ordem de
implementação, política de cache, testes mínimos e critérios de conclusão.

## Licença

Consulte o arquivo [LICENSE](LICENSE).
