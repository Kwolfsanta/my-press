> 本文项目仓库地址：https://github.com/evankwolf/vue-fcp-example

首先，我们需要了解一下`首屏渲染`是个什么东西

大家可以这么想象一下——

> 现在你输入了一个url到浏览器，按下了回车，浏览器开始跳转，标签页上的小图标开始加载，但是目前页面仍然一片空白。

像上面这种场景我们碰到过非常多。有的时候空白的时间长，有的时候空白的时间短，那很明显空白时间越长用户的体验越差。不好的纬度非常多元，有首屏内容渲染（FCP）、最大内容渲染（LCP）、总共阻塞时长（TBT）等等的判断指标， `Lighthouse`一共设置了大概6项指标，而根据`Lighthouse`自身版本的不同，对其权重的设置也不一样，我们再这里放上两张图，具体的东西不再赘述
<img src="./images/lighthouse-6.png">

<img src="./images/lighthouse-8.png">

在这里我们使用MDN官网对首屏渲染的定义（目前中文只有机翻所以直接使用英文原文吧）

> **First Contentful Paint** (FCP) is when the browser renders the first bit of content from the DOM, providing the first feedback to the user that the page is actually loading. The question "Is it happening?" is "yes" when the first contentful paint completes.

> **The First Contentful Paint** time stamp is when the browser first rendered any text, image (including background images), video, canvas that had been drawn into, or non-empty SVG. This excludes any content of iframes, but includes text with pending webfonts. This is the first time users could start consuming page content.  

## 示例项目初始化
那么接下来在我们谈优化的方法之前，先直接使用[`vue-cli`](https://cli.vuejs.org/zh/guide/)去初始化一个项目  
```shell
vue create vue-fcp-example
```

主要配置如下所示

```shell
Vue CLI v5.0.8
? Please pick a preset: Manually select features
? Check the features needed for your project: Babel, Router, Vuex, Linter
? Choose a version of Vue.js that you want to start the project with 2.x
? Use history mode for router? (Requires proper server setup for index fallback in production) Yes
? Pick a linter / formatter config: Standard
? Pick additional lint features: Lint on save, Lint and fix on commit
? Where do you prefer placing config for Babel, ESLint, etc.? In dedicated config files
```
如果出现pnpm报错的话，全局搜索找到`.vuerc`文件，然后将packageManager字段由pnpm改为npm

鉴于平常我们除了上述的vue相关的生态，仍然需要`axios`、`element-ui`这样的库/框架，因此这里也进行安装与引入
```bash
npm install element-ui axios
```

如果出现依赖版本不匹配的报错，可以加上`--legacy-peer-deps`的后缀

到此为止我们就完成了最基础的需求了，然后我们来看下此时`main.js`以及`App.vue`长什么样子
```js
//main.js
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
Vue.config.productionTip = false

Vue.use(ElementUI)

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')

```

```vue
<!-- app.vue -->
<template>
  <div id="app">
    <nav>
      <router-link to="/"><el-button type="primary">Home</el-button></router-link> |
      <router-link to="/about"><el-button type="primary">About</el-button></router-link>
    </nav>
    <router-view/>
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

nav {
  padding: 30px;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
}

nav a.router-link-exact-active {
  color: #42b983;
}
</style>

```

这个时候，`npm run dev`之后的页面大概如下图所示  

<img src="./images/preview-0.png">  

我们可以看到其实页面上并没有什么东西，只是引入了`element-ui`的`el-button`，配合使用了`vue-router`而已。  

那么我们可以运行`npm run build`然后来看下打包文件的大小  

<img src="./images/build-route-lazy.png">  

可以看到就这么小的一个项目，打包出来的js文件居然足足有800+k，css也有200+k，这是不能忍受的。  

如果直接将这样的项目放到一个小水管服务器（此处以我的服务器为例），那么使用F12和`Lighthouse`或者是[pagespeed](https://pagespeed.web.dev/)进行评测，大概能够看到它的性能指标数据如下图所示  

<img src="./images/performance-0.png">  

可以看到目前的这个数据非常不理想，无论是`FCP`还是`LCP`的数据都低得令人发指。无论是作为用户还是开发者，我个人认为都是比较难以接受的。  

那既然如此，我们就来说几个`Vue`项目中经常使用到首屏加载的优化的方法  

## 路由懒加载/动态导入
现在我们先来回想一下平常在路由里面我们会怎么添加一个路由
```js
import Vue from 'vue'
import VueRouter from 'vue-router'
import SomeView from '@/view/someview/index.vue' // 引入组件
Vue.use(VueRouter)

const routes = [
  ...
  { // 注册路由
    path: '/some-view',
    component: SomeView
  }
  ...
]

const router = ...

export default router
```
我们会直接引入这个组件，然后在路由中注册一个对应的路径，该路径下会渲染该组件。  

那其实我们有个别的加载路由组件的方法，相信很多小伙伴也有了解了，也就是[路由懒加载](https://router.vuejs.org/zh/guide/advanced/lazy-loading.html)  

默认情况下，我们现在的`/router/index.js`文件应该如下所示  
```js
...
const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView // 直接注册的组件
  },
  {
    path: '/about',
    name: 'about',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue') // 懒加载注册的组件
  }
]
...
```
可以看到`HomeView`和`AboutView`的注册方式是不同的  

我们来仔细观察一下这两者的区别
```js
import A from 'A.vue'
const A = () => import('A.vue')
```
小伙伴们能看出上面两种引入的区别吗？  

没错，第一种是直接引入了一个组件(Module)，第二种是一个引入的方法，该方法返回一个import函数。  

这也就是路由懒加载的操作。  

刚刚应该已经有眼尖的小伙伴发现了，在上面的打包文件的截图中，除了常见到的`chunk-vendor.js`以及`app.js`，还包含了一个`about.js`

<img src="./images/build-route-lazy.png">

如果我们将`/router/index.js`改成下面的样子，打包出来的文件也会有相应的区别
```js
  ...
  {
    path: '/about',
    name: 'about',
    component: AboutView
  }
  ...
```

<img src="./images/build-0.png">

Vue-router官网文档是建议对所有的路由都使用动态导入的，但是具体需不需要这样做，要看团队是否有通过该方法优化包大小的体积。  

因为当你将所有路由都改为动态引入之后，实际上每进一个新页面就会加载一个js，那么接下来就会造成两个问题
1. 这新载入的js又是一次渲染，对于网速一般的用户而言，他除了第一次进App要等，之后每次切换页面都需要等待新加载的js请求完毕并执行，这在时间上又是一笔不小的开销。
2. 有可能因为缓存等原因造成路由文件加载不出来，并报`Loading Chunk Failed`的报错，这时候我们也需要在路由中注册一个监听方法帮助我们解决该问题
```js
// /router/index.js
/* 路由异常错误处理，尝试解析一个异步组件时发生错误，重新渲染目标页面 */
router.onError((error) => {
  const pattern = /Loading chunk (\d)+ failed/g
  const isChunkLoadFailed = error.message.match(pattern)
  const targetPath = router.history.pending.fullPath
  if (isChunkLoadFailed) {
    router.replace(targetPath)
  }
})
```

## 分析依赖大小，按需加载
说实在的，一次性引入所有路由确实是一笔开销，但是我们手写的各个`.vue`文件加起来可能也不会太大，那么这个时候我们一定会想知道到底是什么玩意儿这么大，那就让我们先来分析一下  

### 安装`webpack-bundle-analyzer`
使用`webpack`进行构建的项目都可以安装一个这个插件，使用方法也很简单
1. 安装插件
```shell
npm install --save-dev webpack-bundle-analyzer
```
2. 去进行webpack相应的配置
```js
//vue.config.js
const { defineConfig } = require('@vue/cli-service')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const IS_PROD = process.env.NODE_ENV === 'production'
module.exports = defineConfig({
  transpileDependencies: true,
  chainWebpack: (config) => {
    if (IS_PROD) {
      config.plugin('webpack-bundle-analyzer')
        .use(new BundleAnalyzerPlugin(
          {
            analyzerMode: 'static', // 可选值有server static disabled
            generateStatsFile: false,
            statsOptions: { source: false },
            openAnalyzer: false
          }
        ))
    }
  }
})

```
3. （可选）去`package.json`中给build指令添加操作符`--report`
```json
  "scripts": {
    ...
    "build": "vue-cli-service build --report",
    ...
  },
```
4. 运行`npm run build`查看效果

到了这一步，我们再进行打包之后就会看到`dist`文件夹下多出来了一个`report.html`文件，双击打开它，我们会看到打包出来的文件各个依赖占比
<img src="./images/build-report-0.png">
从图片中我们可以看到，`element-ui`真的太大了朋友们。这整个js就800+kb，一个element-ui就占了500+k。  

而且，最大的问题是，我们只是使用了一个`el-button`而已啊！  

至不至于啊！  

ok，那既然如此，我们就来进行按需加载

### 按需引入
以下的方法仅针对`element-ui`，其它场景也会有各自的做法，可以自行查阅
1. 安装`babel-plugin-component`
```shell
npm install babel-plugin-component -D
```
2. 修改`babel.config.js`配置如下
```js
// babel.config.js
module.exports = {
  presets: [
    ['@babel/preset-env', { modules: false }]
  ],
  plugins: [
    [
      'component',
      {
        libraryName: 'element-ui',
        styleLibraryName: 'theme-chalk'
      }
    ]
  ]
}

```
3. 注释掉原来`main.js`中的引入
```js
//main.js
// import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css' // css需要保留
// Vue.use(ElementUI)
```
4. 方法一：`main.js`中注册需要得组件
```js
import { Button, Dialog } from 'element-ui'
Vue.use(Button)
Vue.use(Dialog)
...
```
5. 方法二：在使用到的组件中进行对应`element-ui`组件的引入
```vue
<!-- App.vue -->
<template>
  <div id="app">
    <nav>
      <router-link to="/"><Button type="primary">Home</Button></router-link> |
      <router-link to="/about"><Button type="primary">About</Button></router-link>
    </nav>
    <router-view/>
  </div>
</template>

<script>
import { Button } from 'element-ui'
export default {
  components: {
    Button
  }
}
</script>
```
6. 打开页面看看效果，此时`element-ui`样式得按钮仍然能够正常显示
7. 再次进行`npm run build`
<img src="./images/build-import-by-needs.png">
朋友们！看看这大小！革命成功了！  

这个时候我们再打开`report.html`，就能看到之前大得离谱得`element-ui`已经消失不见了
<img src="./images/build-report-by-needs.png">

再跑一次`Lighthouse`的话，参数也已经变得十分可观了
<img src="./images/performance-by-needs.png">

## 开启gzip
那么现在问题来了，目前我们只是引入了一个`el-button`，如果我们使用了非常多element-ui里的组件，打包出来的文件是不是还会很大呢？——答案是肯定的，体积仍然会变大。如果你把所有的组件都引了，那跟之前不做按需加载可以说是没有什么区别了。所以现在，我们希望就算全部打包进来，也要尽可能弄小。那这时候就需要用到我们的`gzip`了。操作也很简单，直接在对应nginx配置下添加下面几行
```shell
server {
  ...
  gzip on; #很多情况下只写这一句话就行
  gzip_min_length 1k;  #gizp压缩起点，文件大于1k才进行压缩
  gzip_buffers 4 16; # 设置压缩所需要的缓冲区大小，以4k为单位，如果文件为7k则申请2*4k的缓冲区 
  gzip_comp_level 6; # gzip 压缩级别，1-9，数字越大压缩的越好，也越占用CPU时间
  gzip_types text/plain text/css application/json application/x-javascript text/xml application/javascript image/png image/gif; # 进行压缩的文件类型。
  gzip_vary on; # 是否在http header中添加Vary: Accept-Encoding，建议开启
  ...
}
```  

修改完nginx的配置之后，我们再`main.js`中解除element-ui引入的注释，并在`App.vue`里去除script标签，将`Button`改回`el-button`并进行打包。这个时候打包出来的文件由于`babel-plugin-component`的作用，虽然不会有之前800+k那么大，但是也有足足700k。我们仔细看命令行的打包文件提示，会发现最右边那一列是打包文件进行gzipped之后的大小
<img src="./images/gzipped-0.png">

此时将文件上传到开启了gzip的服务器之后，我们再次打开浏览器以及F12，就会发现JS仅仅加载了200k。
<img src="./images/gzipped-js-0.png">
点进去js的请求之后，会发现响应头中有一个`Content-Encoding: gzip`，这就表示gzip开启并且已经成功作用了
<img src="./images/gzipped-tip-0.png">
:::tip brotli
题外话，大家可能都知道gzip压缩，但其实gzip并不是效率最高的压缩。实际上还有另一种压缩格式是`brotli`，相对于gzip来说，这种格式更新，兼容性也就没有那么好。但说是这么说，实际上已经有蛮多网站在应用了，比如腾讯云、阿里云之类的cdn加速服务商，还有[爱奇艺网站](iqiyi.com)里的百度自动推送功能的js(push.js)，点开能看到该js有个响应头`content-encoding:br`，这也就是开启了brotli压缩。
具体可以参考  
https://juejin.cn/post/6966035328704446500
https://opensource.googleblog.com/2015/09/introducing-brotli-new-compression.html
https://github.com/google/brotli/
:::

## cdn引入依赖
先表明态度——我本人认为，如果要通过cdn引入依赖，最好不要去使用线上cdn比如bootcdn，因为一旦线上cdn崩了，你的项目也跟着崩了，那老板也崩了，那你一定是崩崩的了（不过个人项目可以不考虑这么多）。所以如果要使用该方法，我们要确保部署到自己公司的cdn上才最稳妥。另外我们是需要看情况使用cdn的。  

假设打包出来的文件为920k,其中包含了业务代码与3个依赖，其大小分别为20k，200k, 300k, 400k，那么在使用cdn进行引入之后，打包出来的js大小为20k，我们仍然要去引入200/300/400k的js，只不过是分成4个js去引入了。这样做有没有好处呢？那不一定。如果你只引入了一个`el-button`，还要这样通过cdn去引入整个`element-ui`那显然是得不偿失，还不如直接按需加载来得更好。但是如果你本身就用到了这个包的很多功能，且依赖本身不支持按需加载的话，那么外部cdn引入就显得很有意义了。  

话都说到这儿了，我们来改造一下项目，使用cdn引入。
```js 添加外部引入字段externals
// vue.config.js
let externals = {}
if (IS_PROD) {
  externals = {
    vue: 'Vue',
    'vue-router': 'VueRouter',
    vuex: 'Vuex',
    'element-ui': 'ELEMENT',
    axios: 'axios'
  }
}
module.exports = defineConfig({
  ...
  configureWebpack: {
    externals
  },
  ...
```
```html 添加对应的cdn链接
<!-- /public/index.html -->
...
    <div id="app"></div>
    <!-- built files will be auto injected -->
    <script src="https://cdn.bootcdn.net/ajax/libs/vue/2.6.11/vue.min.js"></script>
    <script src="https://cdn.bootcdn.net/ajax/libs/vue-router/3.5.2/vue-router.min.js"></script>
    <script src="https://cdn.bootcdn.net/ajax/libs/vuex/3.6.2/vuex.min.js"></script>
    <script src="https://cdn.bootcdn.net/ajax/libs/axios/0.21.1/axios.min.js"></script>
    <link rel="stylesheet" href="https://unpkg.com/element-ui/lib/theme-chalk/index.css"></link>
    <script src="https://unpkg.com/element-ui/lib/index.js"></script>
  </body>
...
```
```js  注释css
// main.js
// import 'element-ui/lib/theme-chalk/index.css'
```
```js 更改babel.config.js
// babel.config.js
module.exports = {
  presets: [
    ['@babel/preset-env', { modules: false }]
  ]
  // plugins: [
  //   [
  //     'component',
  //     {
  //       libraryName: 'element-ui',
  //       styleLibraryName: 'theme-chalk'
  //     }
  //   ]
  // ]
}

```  

之所以要注释掉babel.config.js中关于element-ui的这段，是因为`babel-plugin-component`对原始引入做了转换，导致定义的`element-ui`不会被匹配到。都做完了之后，我们再进行打包，会发现此时的代码小得惊人。而且`report.html`中也没有了之前那些繁杂的依赖  

<img src="./images/build-cdn.png">
<img src="./images/build-report-cdn.png">

> 参考资料https://juejin.cn/post/6898907771362607118

## 取消预加载
预加载是良药也是毒药，在不同场景下可能会造成不同的结果，我在这里直接上改造后的代码，有兴趣的小伙伴可以阅读下面的这个掘金文章去了解更多https://juejin.cn/post/6844903562070196237
```js
// vue.config.js
...
  chainWebpack: config => {
    // 移除prefetch插件，避免加载多余的资源
    config.plugins.delete('prefetch');
    // 移除 preload 插件，避免加载多余的资源
    config.plugins.delete('preload');
  }
...
```

## 字体保持可见
这个操作其实也很简单的。如果我们有特殊的字体的话，一般都是这样定义的
```css
@font-face {
  font-family: ...;
  ...
  ...
}
```
此时我们只需要添加上一条css`font-display: swap;`就能保证在字体资源未加载时，文字仍然能够显示了。
```css
@font-face {
  ...
  font-display: swap;
  ...
}
```

> 参考资料：https://web.dev/font-display/

弄到现在，SPA应用能对首屏进行的大部分优化也已经处理完了，根据该项目的形态，我们使用按需加载+gzip基本就已经接近了最优项目时间了，此时打包出来后放到服务器上再到[pagespeed](https://pagespeed.web.dev/)去进行，测试，能够得到如下的成绩
<img src="./images/build-final-mobile.png">
<img src="./images/build-final-desktop.png">
已经有了较大的优化了，但是有的时候，如果项目本身不大的话，其实你全量打包进来差别也不大，甚至还可能更快，因为不会有script卡住页面加载不让动的问题。FCP反倒会更佳。所以具体的取舍仍然是看个人以及项目组
<img src="./images/build-full-mobile.png">
<img src="./images/build-full-desktop.png">  

## SSR方案 
> 官方文档请参考这里https://v2.ssr.vuejs.org/#why-ssr  

ssr本身也是优秀的首屏解决方案，由于请求之后返回的直接就是html，这就使得页面加载异常地快（不需要等待js去执行渲染DOM元素）。  

大家可以直接跟着[起步文档](https://v2.ssr.vuejs.org/guide/#installation)来进行操作，这里我就不继续赘述了，毕竟我本人只用过`Nuxt`进行开发，没有过将vue项目通过`vue-server-renderer`进行改造的经历


