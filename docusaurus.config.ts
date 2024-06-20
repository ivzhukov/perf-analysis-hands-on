import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Performance Analysis',
  tagline: 'Hands-On',
  favicon: 'img/logo.ico',

  // Set the production url of your site here
  url: 'https://github.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/perf-analysis-hands-on/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'ivzhukov', // Usually your GitHub org/user name.
  projectName: 'perf-analysis-hands-on', // Usually your repo name.
  deploymentBranch: "gh-pages",

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          //editUrl:
          //  'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
    /*    blog: {
          showReadingTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },*/
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: [
    // ... Your other themes.
    [
      require.resolve("@easyops-cn/docusaurus-search-local"),
      /** @type {import("@easyops-cn/docusaurus-search-local").PluginOptions} */
      ({
        // ... Your options.
        // `hashed` is recommended as long-term-cache of index file is possible.
        hashed: true,
        // For Docs using Chinese, The `language` is recommended to set to:
        // ```
        // language: ["en", "zh"],
        // ```
        indexDocs: true,
      }),
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'light',
      disableSwitch: true,
 //     respectPrefersColorScheme: false,
    },

    // Replace with your project's social card
    //image: 'img/docusaurus.png',
    navbar: {
      title: 'Home',
/*      logo: {
        alt: 'My Site Logo',
        src: 'img/logo.svg',
      },*/
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Hands-On',
        },
        /*
        {to: '/blog', label: 'Blog', position: 'left'},
        */
      ],
    },
    footer: {
      style: 'dark',
      links: [
   /*     {
          title: 'Docs',
          items: [
            {
              label: 'Tutorial',
              to: '/docs/intro',
            },
          ],
        },*/
        {
          title: 'Tools',
          items: [
            {
              label: 'Score-P',
              href: 'https://score-p.org',
            },
            {
              label: 'CUBE',
              href: 'https://www.scalasca.org/scalasca/software/cube-4.x/download.html',
            },
            {
              label: 'Scalasca',
              href: 'https://www.scalasca.org/scalasca/software/scalasca-2.x/download.html',
            },
          ],
        },
        {
          title: 'Useful Links',
          items: [
            {
              label: 'Agenda',
              to: 'https://www.vi-hps.org/training/tws/tw45.html',
            },
            {
              label: 'TW45 info',
              to: 'https://tinyurl.com/vihps-2024',
            },
            {
              label: 'VI-HPS',
              href: 'https://www.vi-hps.org',
            },
            {
              label: 'POP CoE',
              href: 'https://pop-coe.eu',
            },
            {
              label: 'EPICURE',
              href: 'https://eurohpc-ju.europa.eu/epicure-new-ri-project-launched-eurohpc-ju-2024-02-07_en',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Forschungszentrum Jülich`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash']
    },
  } satisfies Preset.ThemeConfig,
};

export default config;