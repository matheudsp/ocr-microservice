import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "OCR Divergent",
  description: "Documentação ",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Guia", link: "/guide/getting-started" },
      { text: "API", link: "/api/endpoints" },
    ],

    sidebar: [
      {
        text: "Introdução",
        items: [
          { text: "Começando", link: "/guide/getting-started" },
          { text: "Arquitetura", link: "/guide/architecture" },
          { text: "Configuração (Env)", link: "/guide/configuration" },
        ],
      },
      {
        text: "Integração",
        items: [
          { text: "Referência da API", link: "/api/endpoints" },
          {
            text: "Webhooks",
            link: "/api/endpoints#webhooks-push-notification",
          },
        ],
      },
      {
        text: "Operação",
        items: [{ text: "CI/CD e Deploy", link: "/guide/deployment" }],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/matheudsp/ocr-divergent" },
      { icon: "instagram", link: "https://instagram.com/matheudsp" },
    ],
  },
});
