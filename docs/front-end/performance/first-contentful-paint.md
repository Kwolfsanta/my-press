## 首屏渲染优化
首先，我们需要了解一下`首屏渲染`是个什么东西

大家可以这么想象一下——

> 现在你输入了一个url到浏览器，按下了回车，浏览器开始跳转，标签页上的小图标开始加载，但是目前页面仍然一片空白。

像上面这种场景我们碰到过非常多。有的时候空白的时间长，有的时候空白的时间短，那很明显空白时间长的网页体验相对来说并不好。

不好的纬度非常多元，有首屏内容渲染（FCP）、最大内容渲染（LCP）、总共阻塞时长（TBT）等等的判断指标， `Lighthouse`一共设置了大概6项指标，而根据`Lighthouse`自身版本的不同，对其权重的设置也不一样，我们再这里放上两张图，具体的东西不再赘述
<img src="https://cdn.flowus.cn/oss/978b1e0a-a9d8-4733-9c45-d1581b711752/image.png?filename=image.png&time=1663510939&token=82d06edd1422f7295f4ab8fed5874eba">

<img src="https://cdn.flowus.cn/oss/6a77487b-9acc-45cb-a75b-b37fd4b60e05/image.png?filename=image.png&time=1663510952&token=1392b6a710ccd4553ef7db608845713d">

在这里我们使用MDN官网对首屏渲染的定义（目前中文只有机翻所以直接使用英文原文吧）

> **First Contentful Paint** (FCP) is when the browser renders the first bit of content from the DOM, providing the first feedback to the user that the page is actually loading. The question "Is it happening?" is "yes" when the first contentful paint completes.

> **The First Contentful Paint** time stamp is when the browser first rendered any text, image (including background images), video, canvas that had been drawn into, or non-empty SVG. This excludes any content of iframes, but includes text with pending webfonts. This is the first time users could start consuming page content.  

那么接下来我们来说几个`Vue`项目中经常使用到的优化的方法  

### cdn引入依赖

### 路由懒加载

### 按需加载

### 切分打包文件数量

### SSR方案 