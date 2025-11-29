import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "OCR Divergent Docs",
  description: "Documentação de Integração e Operação",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Guia", link: "/guide/getting-started" },
      { text: "Examples", link: "/markdown-examples" },
    ],

    sidebar: [
      {
        text: "Começando",
        items: [
          { text: "Instalação e Docker", link: "/guide/getting-started" },
          { text: "Configuração (Thresholds)", link: "/guide/configuration" },
        ],
      },
      {
        text: "Integração",
        items: [
          { text: "API Endpoints", link: "/guide/integration" },
          {
            text: "Webhooks & Erros",
            link: "/guide/integration#recebendo-o-resultado-webhook",
          },
        ],
      },
      {
        text: "Examples",
        items: [
          { text: "Markdown Examples", link: "/markdown-examples" },
          { text: "Runtime API Examples", link: "/api-examples" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/matheudsp/ocr-divergent" },
    ],
  },
});
