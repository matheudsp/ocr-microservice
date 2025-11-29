# Guia de Instalação e Execução

Este guia descreve como configurar e executar o microserviço de OCR em ambiente local ou em servidor.

---

## 📦 Pré-requisitos

Antes de iniciar, garanta que possui as seguintes ferramentas instaladas:

- **Docker** e **Docker Compose** — _Essenciais para rodar toda a stack._
- **Node.js v20+** — _Apenas para execução local em modo desenvolvimento._
- **Git** — Para clonar o repositório.

---

## 1. 🛠 Configuração do Ambiente

O projeto utiliza variáveis de ambiente para configuração.

### 1.1 Clonar o Repositório

```bash
git clone https://github.com/matheudsp/ocr-divergent.git
cd ocr-divergent
```

### 1.2 Criar o Arquivo `.env`

Use o arquivo de exemplo:

```bash
cp .env.example .env
```

### 1.3 Configurar Credenciais do Google Vision

Para que o OCR funcione, é necessário um JSON de credenciais da Google Cloud.

1. Coloque o arquivo em `./secrets/`
2. Renomeie para **gcp-keys.json** ou ajuste a variável:

```
GOOGLE_APPLICATION_CREDENTIALS=./secrets/gcp-keys.json
```

---

## 2. 🐳 Executando com Docker (Recomendado)

A forma mais simples de subir todo o ambiente.

### 2.1 Iniciar os Serviços

```bash
docker compose up -d --build
```

Esse comando irá:

- Construir a imagem do microserviço
- Subir Postgres, Redis e MinIO
- Executar migrações do banco automaticamente
- Criar um usuário Admin padrão

### 2.2 Visualizar Logs

```bash
docker compose logs -f ocr-service
```

O serviço ficará disponível em:

```
http://localhost:3000
```

---

## 3. 🧪 Executando Localmente (Desenvolvimento)

Ideal para debugging ou desenvolvimento ativo.

### 3.1 Subir a Infraestrutura Básica

```bash
# Sobe apenas Redis, Postgres e MinIO
docker compose up -d redis postgres minio
```

### 3.2 Instalar Dependências

```bash
npm install
```

### 3.3 Rodar Migrações

```bash
npm run migrate   # ou
npx drizzle-kit push
```

### 3.4 Criar Administrador (Opcional)

```bash
npm run admin:create
```

### 3.5 Iniciar a Aplicação

```bash
npm run dev
```

O servidor rodará em modo _watch_.

---

## 4. 🔍 Verificando a Instalação

Para confirmar que a API está online:

```bash
curl -I http://localhost:3000/verification
```

### Resultado Esperado

```
HTTP/1.1 401 Unauthorized
content-type: application/json
...
```

O status **401** indica que o serviço está ativo e apenas exige autenticação — comportamento correto.

---

🎉 Agora você está pronto para usar o microserviço! Consulte também a **Referência da API** para explorar os endpoints disponíveis.
