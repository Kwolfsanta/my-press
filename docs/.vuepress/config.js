module.exports = {
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'External', link: 'https://google.com', target:'_self', rel:'' },
      {
        text: '前端',
        ariaLabel: 'Front End',
        items: [
          { text: 'Vue', link: '/front-end/vue/' },
          { text: 'React', link: '/front-end/react/' },
          { text: 'Javascript', link: '/front-end/js/' },
          { text: 'CSS', link: '/front-end/css/' },
          { text: '打包工具相关', link: '/front-end/build-tools/' },
          { text: '性能优化', link: '/front-end/performance/' }
        ]
      },
      {
        text: 'Languages',
        ariaLabel: 'Language Menu',
        items: [
          { text: 'Chinese', link: '/language/chinese/' },
          { text: 'Japanese', link: '/language/japanese/' }
        ]
      }
    ],
    sidebar: [
      {
        title: '前端',
        path: '/front-end/',
        collapsable: false,
        sidebarDepth: 3,
        children: [
          {
            title: '性能优化',
            path: '/front-end/performance/',
            sidebarDepth: 2,
            children: [
              { title: '首屏渲染优化', path: '/front-end/performance/first-contentful-paint' }
            ]
          }
        ]
      }
    ]
  }
}