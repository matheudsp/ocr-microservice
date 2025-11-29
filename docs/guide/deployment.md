# CI/CD e Versionamento

Este guia documenta o fluxo de entrega contínua (CI/CD) e o versionamento do microserviço, utilizando **GitHub Actions**, **Git Tags** e **Docker**. O objetivo é garantir entregas previsíveis, reprodutíveis e alinhadas às práticas modernas de DevOps.

---

## 🚀 Fluxo de Desenvolvimento

O projeto segue o modelo **trunk-based development**, no qual todo o código em produção parte sempre da branch `main`. Existem dois pipelines automáticos:

### **1. Snapshot (Desenvolvimento)**

Executado sempre que há um _push_ na branch `main`.

- **Trigger:** Push na `main`.
- **Artefato:** Imagem Docker com tag baseada no hash do commit (ex: `sha-abc1234`).
- **Propósito:** Homologação rápida, testes internos e debugging.

### **2. Release (Produção)**

Executado quando uma **Git Tag semântica** é criada.

- **Trigger:** Tags no formato `vX.Y.Z` (ex: `v1.0.0`).
- **Artefatos:**

  - `:1.0.0` → Imutável.
  - `:1.0` → Última release da série `1.0.x`.
  - `:latest` → Sempre aponta para a release mais recente.

- **Propósito:** Deploy para K8s, Compose ou ambientes críticos.

---

## 📦 Como Lançar uma Nova Versão

Siga este fluxo quando o código já estiver estável na `main`.

### **Passo 1 — Atualizar versão no `package.json`**

Utilize o `npm version`, mas **sem criar a tag automaticamente**:

```bash
# Correção de bug (1.0.0 → 1.0.1)
npm version patch --no-git-tag-version

# Nova funcionalidade (1.0.0 → 1.1.0)
npm version minor --no-git-tag-version
```

---

### **Passo 2 — Commitar a nova versão**

```bash
git add package.json
git commit -m "chore: release v1.1.0"
git push origin main
```

---

### **Passo 3 — Criar a Tag e Disparar o Deploy**

A criação da tag ativa o pipeline de produção.

```bash
# Criar tag (sempre iniciar com 'v')
git tag v1.1.0

# Enviar a tag para o repositório remoto
git push origin v1.1.0
```

---

## 🔍 Após o Deploy

Verifique na aba **Actions** do GitHub se o workflow _Build and Push Docker Image_ gerou as imagens esperadas:

| Tag Docker | Tipo          | Uso Recomendado                            |
| ---------- | ------------- | ------------------------------------------ |
| `1.1.0`    | Imutável      | Produção real — garante reprodutibilidade. |
| `1.1`      | Semi-imutável | Aceita patches automaticamente.            |
| `latest`   | Flutuante     | Não recomendado para produção.             |
