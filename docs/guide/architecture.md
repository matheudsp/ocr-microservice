# Arquitetura do Projeto

Documento resumido e prático que descreve a organização, princípios e padrões do projeto.

> **Princípio central:** as dependências apontam para dentro — código de infraestrutura **não** deve conter lógica de domínio.

## Estrutura de Pastas

```
src/
├── core/                     # Lógica de negócio pura (domain + usecases + ports)
│   ├── domain/               # Entidades e tipos (VerificationRequest, ApiKey, etc.)
│   ├── usecases/             # Casos de uso (ProcessVerification, CreateApiKey)
│   ├── ports/                # Interfaces (IRepository, IStorageProvider, IOcrClient)
│   ├── strategies/           # Estratégias de validação (RG, CNH, CPF, Renda)
│   └── factories/            # Fábricas para montar objetos complexos

├── infra/                    # Adaptadores e integrações
│   ├── http/                 # Fastify controllers, routes, middlewares
│   ├── database/             # Drizzle repositories, migrations
│   ├── storage/              # MinIO / S3 adapter
│   ├── queue/                # BullMQ adapters, workers
│   ├── ocr/                  # Google Vision / Tesseract adapters
│   └── config/               # Carregamento de env, logger (Pino)

└── main.ts                   # Ponto de composição (injeção de dependência)
```

## Padrões aplicados

- **Repository Pattern** — abstrai persistência; o core usa `IRepository`.
- **Strategy Pattern** — seleciona a `VerificationStrategy` correta para cada tipo de documento.
- **Dependency Injection** — composição centralizada em `main.ts`.
- **Factory** — construção de objetos complexos (ex.: `VerificationPipelineFactory`).

## Exemplo rápido: `ProcessVerificationUsecase`

```ts
class ProcessVerificationUsecase {
  constructor(
    private repo: IVerificationRepository,
    private ocr: IOcrClient,
    private storage: IStorageProvider,
    private strategies: VerificationStrategyRegistry
  ) {}

  async execute(input: ProcessVerificationInput) {
    const file = await this.storage.getFile(input.filePath);
    const text = await this.ocr.extractText(file);
    const strategy = this.strategies.for(input.documentType);
    return strategy.validate(text, input.expectedData);
  }
}
```
