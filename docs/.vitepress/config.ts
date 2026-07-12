import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';
import llmstxt, {
  copyOrDownloadAsMarkdownButtons,
} from 'vitepress-plugin-llms';

const rawBase = process.env.BASE_URL || '/'
const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`

export default withMermaid(
  defineConfig({
    base,
    title: 'v2c-any',
    description: 'Turn any device into V2C Dynamic Power Control',
    head: [['link', { rel: 'icon', href: `${base}favicon.ico` }]],

    vite: {
      plugins: [llmstxt()],
    },

    markdown: {
      config(md) {
        md.use(copyOrDownloadAsMarkdownButtons);
      },
    },

    mermaid: {
      theme: 'neutral',
    },

    themeConfig: {
      logo: '/images/v2ca-logo-200.png',

      nav: [
        { text: 'Guide', link: '/guide/getting-started' },
        { text: 'Reference', link: '/reference/resilience' },
      ],

      sidebar: {
        '/guide/': [
          {
            text: 'Introduction',
            items: [
              { text: 'Getting Started', link: '/guide/getting-started' },
              { text: 'Configuration', link: '/guide/configuration' },
            ],
          },
          {
            text: 'Operating Modes',
            items: [
              { text: 'REST Mode', link: '/guide/rest-mode' },
              { text: 'MQTT Mode', link: '/guide/mqtt-mode' },
            ],
          },
          {
            text: 'Deployment',
            items: [{ text: 'Docker', link: '/guide/docker' }],
          },
        ],
        '/reference/': [
          {
            text: 'Reference',
            items: [
              { text: 'Resilience', link: '/reference/resilience' },
              { text: 'API', link: '/reference/api' },
            ],
          },
        ],
      },

      socialLinks: [
        { icon: 'github', link: 'https://github.com/tvcsantos/v2c-any' },
        { icon: 'npm', link: 'https://www.npmjs.com/package/v2c-any' },
      ],

      footer: {
        message: 'Released under the MIT License.',
        copyright: 'Copyright \u00A9 2025 Tiago Santos',
      },

      search: {
        provider: 'local',
      },

      editLink: {
        pattern: 'https://github.com/tvcsantos/v2c-any/edit/main/docs/:path',
      },
    },
  })
);
