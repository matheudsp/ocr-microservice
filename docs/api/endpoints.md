# Referência da API — Microserviço de OCR

Documentação oficial dos endpoints, formatos de dados e mecanismos de segurança do microserviço de OCR.

---

## 🔐 Autenticação

As requisições devem utilizar **API Key** no cabeçalho. Além da validação da chave, o middleware verifica se o IP de origem está na lista de permissões (`allowedIp`).

### Header Obrigatório

| Header      | Valor esperado  | Exemplo                 |
| ----------- | --------------- | ----------------------- |
| `x-api-key` | Chave de acesso | `sk_client_a1b2c3d4...` |

### Possíveis Erros de Autenticação

- **401 Unauthorized** — Ausência do header `x-api-key`.
- **403 Forbidden** — Chave inválida, expirada ou IP não autorizado.

---

## 📤 Upload e Verificação (Assíncrono)

Endpoint responsável por enviar o documento e iniciar o fluxo de OCR + validação.

- **Método:** `POST`
- **Rota:** `/verification`
- **Content-Type:** `multipart/form-data`

### Parâmetros do Body (multipart/form-data)

| Campo      | Tipo          | Obrigatório | Descrição                                                                                                       |
| ---------- | ------------- | ----------- | --------------------------------------------------------------------------------------------------------------- |
| `file`     | Binário       | Sim         | Imagem do documento. Aceita `image/jpeg`, `image/png`, `image/webp`. Máx: **5 MB**. Validado por Magic Numbers. |
| `metadata` | String (JSON) | Sim         | JSON string contendo configurações de validação.                                                                |

### Schema do Campo `metadata`

```json
{
  "externalReference": "uuid-v4", // Obrigatório — ID interno para rastreamento
  "documentType": "ENUM", // Obrigatório — Tipo do documento
  "expectedData": {
    "name": "Nome Completo", // Obrigatório — Para matching fuzzy
    "cpf": "000.000.000-00", // Obrigatório — Com ou sem formatação
    "declaredIncome": 5000.5 // Obrigatório apenas para COMPROVANTE_RENDA
  }
}
```

#### Valores aceitos para `documentType`

- `RG`
- `CNH`
- `CPF`
- `COMPROVANTE_RENDA`

### Exemplo de Requisição cURL

```bash
curl -X POST http://localhost:3000/verification \
  -H "x-api-key: sua_chave_aqui" \
  -F "file=@/home/user/docs/rg_frente.jpg" \
  -F 'metadata={"externalReference": "my-id-001", "documentType": "RG", "expectedData": {"name": "João Silva", "cpf": "12345678900"}}'
```

### Respostas

#### ✅ Sucesso — 202 Accepted

```json
{
  "verificationId": "e063f55a-2813-4809-a844-79d76d662d38",
  "status": "PENDING"
}
```

#### ❌ Erro de Validação — 400 Bad Request

```json
{
  "error": "Falha na verificação",
  "message": "Tipo de arquivo não permitido: application/pdf. Use JPG ou PNG"
}
```

---

## 🔎 Consultar Status da Verificação

Permite acompanhar o andamento ou obter o resultado final via **polling**.

- **Método:** `GET`
- **Rota:** `/verification/:id`

### Parâmetro de Rota

| Parâmetro | Tipo   | Descrição                                                                                |
| --------- | ------ | ---------------------------------------------------------------------------------------- |
| `id`      | String | Pode ser o `verificationId` (UUID gerado pelo sistema) ou o `externalReference` enviado. |

### Resposta de Sucesso — 200 OK

```json
{
  "id": "e063f55a-2813-4809-a844-79d76d662d38",
  "externalReference": "my-id-001",
  "documentType": "RG",
  "status": "COMPLETED", // PENDING, PROCESSING, COMPLETED, FAILED
  "confidenceScore": 98, // Score de 0 a 100
  "failReason": null, // Preenchido quando FAILED ou score insuficiente
  "createdAt": "2024-02-20T10:00:00.000Z",
  "updatedAt": "2024-02-20T10:00:05.000Z"
}
```

### Erro — 404 Not Found

Retornado quando nenhuma verificação corresponde ao ID informado.

---

## 🪝 Webhooks (Notificação Assíncrona)

Para evitar polling, sua aplicação pode receber notificações automáticas quando o processamento terminar.
A URL de webhook é configurada durante a criação da sua API Key.

### Payload Enviado

```json
{
  "verificationId": "e063f55a-2813-4809-a844-79d76d662d38",
  "externalReference": "my-id-001",
  "status": "COMPLETED", // ou FAILED
  "failReason": null, // Motivo textual em caso de falha
  "confidenceScore": 98,
  "processedAt": "2024-02-20T10:00:05.123Z"
}
```

### Política de Retentativa (Retry Policy)

| Item        | Detalhe                                                               |
| ----------- | --------------------------------------------------------------------- |
| Timeout     | Até 5 segundos para resposta.                                         |
| Tentativas  | Até **4** tentativas se houver erro (HTTP >= 400) ou timeout.         |
| Backoff     | Atrasos progressivos: **1s → 3s → 5s → 7s**.                          |
| Confirmação | Seu servidor deve responder com **2xx** para confirmar o recebimento. |

---

## 📘 Observações Finais

- Todas as datas seguem o padrão **ISO 8601 (UTC)**.
- Apenas formatos de imagem suportados serão aceitos.
- Em caso de dúvidas, entre em contato com o time responsável.
