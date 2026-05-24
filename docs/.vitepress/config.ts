import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';
import llmstxt, { copyOrDownloadAsMarkdownButtons } from 'vitepress-plugin-llms'

export default withMermaid(
  defineConfig({
    title: 'v2c-any',
    description:
      'Turn any device into V2C Dynamic Power Control',
    head: [['link', { rel: 'icon', href: '/images/v2c-any-icon-alpha.png' }]],

    vite: {
      plugins: [llmstxt()],
    },

    markdown: {
      config(md) {
        md.use(copyOrDownloadAsMarkdownButtons)
      }
    },

    mermaid: {
      theme: 'neutral'
    },

    themeConfig: {
      logo: '/images/v2c-any-icon-alpha.png',

      nav: [
        { text: 'Guide', link: '/guide/getting-started' },
        { text: 'Reference', link: '/reference/resilience' },
        {
          text: 'Links',
          items: [
            {
              text: 'Changelog',
              link: 'https://github.com/tvcsantos/v2c-any/releases',
            },
          ],
        },
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
        { icon: 'npm', link: 'https://www.npmjs.com/package/v2c-any' },
        { icon: 'github', link: 'https://github.com/tvcsantos/v2c-any' },
      ],

      footer: {
        message: 'Released under the MIT License.',
        copyright: 'Copyright \u00A9 2025 Tiago Santos',
      },

      search: {
        provider: 'local',
      },

      editLink: {
        pattern:
          'https://github.com/tvcsantos/v2c-any/edit/main/docs/:path',
      },
    },
  }),
);
