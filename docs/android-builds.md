# Builds Android

Este projeto tem dois caminhos de desenvolvimento: local, para iterar rápido
com o telefone conectado, e EAS, para gerar builds compartilháveis na nuvem.

## Desenvolvimento local

### `pnpm android:device`

Executa `expo run:android --device`. Escolha o aparelho conectado por USB; o
Expo sincroniza o projeto Android quando necessário, compila uma development
build debug, instala-a e a abre no dispositivo.

Use na primeira instalação local e sempre que houver alteração nativa, como
`app.json`, permissões, deep links, plugins Expo ou dependências nativas.

### `pnpm prebuild:android`

Executa `expo prebuild --platform android`. Regenera/sincroniza a pasta
`android/` a partir de `app.json` e dos plugins configurados. Normalmente é
chamado automaticamente por `android:device`; execute manualmente apenas para
inspecionar ou atualizar os arquivos nativos.

### `pnpm build:android:apk`

Executa o Gradle `assembleDebug` e cria um APK local em:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Use quando precisar do arquivo APK para instalar, arquivar ou compartilhar
manualmente. Antes, execute `pnpm prebuild:android` caso a configuração nativa
tenha mudado.

### `pnpm install:android:apk`

Instala ou atualiza o APK debug no telefone conectado usando ADB. O `-r`
preserva os dados do app quando a assinatura e o identificador do pacote são
compatíveis.

## Fast Refresh

Depois de instalar uma development build local, não é necessário gerar novo APK
para alterações em TypeScript, JavaScript, estilos ou assets já empacotados.

```bash
pnpm expo start --dev-client
```

Abra o app IbiVibe instalado e conecte-o ao Metro. As alterações JavaScript
devem aparecer por Fast Refresh.

## Builds EAS

### `pnpm dev:android`

Envia uma development build Android ao EAS. Use para gerar um APK instalável
por link/QR, sem depender do computador ou USB durante a instalação.

### `pnpm build:android:prod`

Envia a build de produção ao EAS. Ela é destinada à distribuição/release e não
substitui a development build para iteração com Fast Refresh.

## Fluxo recomendado

1. Conecte o Android via USB com depuração USB ativada.
2. Execute `pnpm android:device` uma vez.
3. No dia a dia, execute `pnpm expo start --dev-client`.
4. Reexecute `pnpm android:device` após mudanças nativas.
