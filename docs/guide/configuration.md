# Configuração e Tuning

Este microserviço foi projetado para ser altamente configurável por meio de variáveis de ambiente. Isso permite ajustar a sensibilidade das regras de validação (thresholds) e otimizar a performance do worker sem exigir novos deploys.

---

## 🎚️ Thresholds de Validação (Regras de Negócio)

Essas variáveis controlam o nível de rigor das validações automáticas. Valores maiores aumentam a segurança, mas podem gerar mais falsos negativos (reprovações indevidas por baixa qualidade da imagem).

| Variável                         | Padrão | Descrição                                                             | Impacto do Ajuste                                                                         |
| -------------------------------- | :----: | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `OCR_MIN_SCORE_IDENTITY`         | `0.75` | Similaridade mínima (0.0–1.0) para validar nomes em **RG** e **CNH**. | **Aumentar:** exige imagens nítidas.<br>**Diminuir:** aceita imagens piores, maior risco. |
| `OCR_MIN_SCORE_CPF_NAME`         | `0.80` | Similaridade mínima para validar o nome no **CPF**.                   | Mantido alto por ser documento de texto limpo.                                            |
| `OCR_MIN_SCORE_INCOME_NAME`      | `0.85` | Similaridade mínima para titularidade em **Comprovantes de Renda**.   | Ajuda a evitar uso de documentos de terceiros.                                            |
| `OCR_MAX_TOLERANCE_INCOME_VALUE` | `0.20` | Tolerância percentual (20%) para divergência no valor de renda.       | Ex.: R$ 1.000 → aceita entre R$ 800 e R$ 1.200.                                           |

### 🔧 Exemplo de Ajuste Fino

Se muitos RGs válidos forem rejeitados por "Nome Divergente":

```ini
# Relaxando a exigência para 65% de similaridade
OCR_MIN_SCORE_IDENTITY=0.65
```

---

## ⚡ Performance e Concorrência

Configurações que afetam consumo de recursos e velocidade de processamento.

| Variável            | Padrão | Descrição                                                   |
| ------------------- | :----: | ----------------------------------------------------------- |
| `QUEUE_CONCURRENCY` |  `1`   | Número de _jobs_ processados simultaneamente por instância. |

## 🔌 Serviços Externos

Variáveis responsáveis pela integração com a infraestrutura.

### 🗄 Banco de Dados (Postgres)

- `DATABASE_URL` — String de conexão (LibPQ/JDBC).
  Exemplo:

  ```text
  postgresql://user:pass@host:5432/db?schema=public
  ```

### 📨 Filas (Redis)

- `REDIS_HOST` — Ex.: `localhost` ou `redis`
- `REDIS_PORT` — _Padrão:_ `6379`
- `REDIS_PASSWORD` — Opcional

### 📦 Object Storage (MinIO / S3)

- `MINIO_ENDPOINT` — Ex.: `minio`
- `MINIO_BUCKET` — _Padrão:_ `docs`
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`

### 🔍 OCR Provider (Google Cloud Vision)

- `GOOGLE_APPLICATION_CREDENTIALS` — Caminho para o JSON da Service Account.
  _Padrão:_ `./secrets/gcp-keys.json`
