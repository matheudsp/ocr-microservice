---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "OCR Microservice"
  text: "Validação Documental Inteligente"
  tagline: Automatize a aprovação de documentos com OCR, Clean Architecture e processamento assíncrono resiliente.
  actions:
    - theme: brand
      text: Começar Agora
      link: /guide/getting-started
    - theme: alt
      text: Referência da API
      link: /api/endpoints

features:
  - title: Arquitetura Hexagonal
    details: Domínio isolado da infraestrutura. Use Cases puros, Ports & Adapters e injeção de dependência para máxima testabilidade.
    icon: hex

  - title: Estratégias de Validação
    details: Algoritmos específicos para RG, CNH, CPF e Comprovantes de Renda com tolerância a falhas de OCR e lógica fuzzy.
    icon: ⚡️

  - title: Processamento Assíncrono
    details: Upload de alta performance desacoplado do processamento pesado via filas (BullMQ/Redis) e Storage (MinIO).
    icon: 🚀

  - title: Segurança & Observabilidade
    details: Autenticação via API Key com Whitelist de IP, logs estruturados (Pino) e rastreamento de jobs.
    icon: 🛡️
---

## Sobre o Projeto

Este microserviço foi desenhado para eliminar o gargalo operacional na etapa de "Pendente Documentação". Ele substitui a conferência manual por um fluxo automatizado que extrai dados via OCR (Google Vision/Tesseract) e aplica regras de negócio para validar a titularidade e consistência dos dados.

### Stack Tecnológica

- **Runtime:** Node.js (v20+) & TypeScript
- **Web Framework:** Fastify
- **Filas:** BullMQ + Redis
- **Storage:** MinIO (S3 Compatible)
- **OCR:** Google Cloud Vision API
- **Validação:** Zod & Fuzzy Matching (Levenshtein)
- **Testes:** Vitest (Unitários & E2E)

### Fluxo de Dados

1. **Upload:** A API recebe o arquivo e metadados, salvando no Object Storage.
2. **Enfileiramento:** Um job é criado contendo a referência do arquivo.
3. **Processamento:** O Worker consome o job, baixa o arquivo e executa o OCR.
4. **Estratégia:** O texto extraído é validado pela `VerificationStrategy` correspondente (ex: Regra de 20% de tolerância para Renda).
5. **Callback:** O resultado (Score + Status) é enviado via Webhook para o cliente.
