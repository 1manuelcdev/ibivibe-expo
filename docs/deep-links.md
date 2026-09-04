# Deep links

O app aceita a confirmação de e-mail pelo esquema nativo e pelo URL rastreado
inserido pelo provedor de e-mail:

```text
ibivibe:///auth/verify-email?token=<token>
http://links.updates.ibivibe.com.br/CL0/ibivibe:%2F%2F%2Fauth%2Fverify-email%3Ftoken=<token>
```

O Expo Router reescreve os dois formatos para a rota interna de validação e
preserva o token. O esquema nativo funciona em development/preview/production
builds; o Expo Go não registra o esquema `ibivibe`.

## Associação HTTPS para builds instaladas

Para o segundo URL abrir o app diretamente, publique no domínio
`links.updates.ibivibe.com.br`:

- `/.well-known/assetlinks.json`, contendo o package Android e o fingerprint
  SHA-256 do certificado de assinatura;
- `/.well-known/apple-app-site-association`, contendo o Apple Team ID e o
  bundle identifier iOS.

Os arquivos devem estar disponíveis por HTTPS, sem autenticação nem redirect.
Depois de publicados, gere uma nova development/preview build, pois alterações
em `app.json` não são aplicadas ao Expo Go ou a builds já instaladas.
