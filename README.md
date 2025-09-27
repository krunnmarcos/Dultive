# Dultive

Aplicativo mobile construído com Expo/React Native para conectar pessoas que desejam doar com quem precisa de ajuda. O projeto oferece autenticação, criação e gerenciamento de posts, busca refinada e integração com um backend Node/Express hospedado em MongoDB Atlas.

> **Status atual:** aplicação mobile funcional, com autenticação JWT, criação de posts com upload de imagens, curtir/descurtir, busca avançada e gerenciamento de perfil. O backend ainda não está neste repositório, mas pode ser clonado em um projeto irmão.

## ⚙️ Stack

- **Mobile:** Expo 54 (React Native 0.81), TypeScript, React Navigation, Safe Area Context.
- **State/Auth:** Context API + AsyncStorage para sessão JWT.
- **Networking:** Axios para consumo do backend.
- **UI:** Componentes customizados com StyleSheet e Ionicons.
- **Backend (externo):** Node.js + Express + MongoDB Atlas (veja instruções mais abaixo).

## 🗂 Estrutura principal

```
Workspace/Dultive
├── App.tsx
├── app.json
├── package.json
├── src
│   ├── components
│   ├── constants
│   ├── contexts
│   ├── navigation
│   ├── screens
│   ├── services
│   ├── types
│   └── utils
└── tsconfig.json
```

- `components/`: botões, campos de input e cartão de posts reutilizáveis.
- `contexts/AuthContext.tsx`: fluxo de autenticação, persistência em AsyncStorage e sincronização com `/users/me`.
- `navigation/`: navegação entre telas públicas (login/registro) e autenticadas (home, criar post, conta).
- `screens/`: telas principais, como `HomeScreen`, `SearchScreen`, `CreateScreen`, `AccountScreen` e `MyPostsScreen`.
- `services/api.ts`: instância do Axios configurável via variável de ambiente.

## 🔐 Variáveis de ambiente

Crie um arquivo `.env` na raiz do app (baseado em `.env.example`) e defina:

```
EXPO_PUBLIC_API_URL=https://seu-backend.com/api
```

Sem esse valor o app usa o fallback local (`http://192.168.x.x:5000/api`). Alinhe o IP com o da máquina que hospeda o backend quando estiver em desenvolvimento.

Após alterar variáveis, reinicie o Metro bundler (`npx expo start -c`).

## 🚀 Como rodar em desenvolvimento

1. **Pré-requisitos:** Node.js 18+ (recomendado 20), npm 9+, Expo CLI (`npm install -g expo-cli` opcional).
2. Instale as dependências
	```bash
	npm install
	```
3. Inicie o app
	```bash
	npx expo start
	```
4. Escaneie o QR Code (Expo Go) ou escolha um emulador iOS/Android.

### Verificações rápidas

- **TypeScript:** `npx tsc --noEmit`
- **Lint (se adicionar futuramente):** configure ESLint no repositório e adicione ao workflow.

## 🌐 Backend & Banco

O aplicativo espera um backend com os seguintes endpoints (prefixados por `/api`):

- `POST /auth/login`, `POST /auth/register`
- `GET /users/me`, `PUT /users/me`
- `GET /posts`, `GET /posts/search`, `GET /posts/my-posts`
- `POST /posts`, `POST /posts/:id/like`, `POST /posts/:id/unlike`, `DELETE /posts/:id`

Referência de stack utilizada:

- Express 5 + TypeScript
- Mongoose 8 com modelos `User`, `Post`, `Like`
- Autenticação JWT via Bearer Token
- Upload de imagens em base64 (limite de 15 MB configurado)
- MongoDB Atlas com connection string armazenada em `MONGO_URI`

### Configurando o backend (projeto irmão)

1. Clone o repositório do backend (caso ainda não exista, crie um com a pasta `Workspace/backend`).
2. Copie `.env.example` para `.env` e preencha `MONGO_URI`, `MONGO_DB_NAME` e `PORT`.
3. Instale dependências e suba o servidor:
	```bash
	npm install
	npm run dev
	```
4. Garanta que o endpoint `GET /api` responda com “Dultive API is running!” e atualize `EXPO_PUBLIC_API_URL` no app.

## 📦 Scripts úteis

| Comando | Descrição |
| ------- | --------- |
| `npm install` | instala dependências do app |
| `npx expo start` | inicia o Metro bundler |
| `npx expo start --clear` | limpa cache antes de iniciar |
| `npx expo prebuild` | gera projeto nativo (caso futuramente publique em lojas) |
| `npx tsc --noEmit` | verifica tipos TypeScript |

## 🧪 Boas práticas sugeridas

- Adicionar ESLint/Prettier para padronizar o código.
- Criar testes unitários (por exemplo com Jest + React Native Testing Library).
- Configurar um fluxo CI (GitHub Actions) para rodar `npm install`, `npx tsc --noEmit` e testes a cada PR.
- Publicar builds EAS para testes internos quando a lógica estabilizar.

## 📄 Licença

Projeto licenciado sob os termos definidos no arquivo `LICENSE` (atualmente padrão Expo/React Native — atualize conforme a licença desejada).

---

> 💬 **Dicas futuras:** automatize o deploy do backend (Render/Railway/Heroku), armazene segredos em variáveis de ambiente e considere adicionar analytics ou push notifications conforme o produto evoluir.