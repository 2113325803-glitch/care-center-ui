# care-center-ui 项目学习笔记

> 写在最前面：这份笔记是写给「刚接触 Vue、大部分代码是 AI 生成的」同学的。
> 我不仅告诉你「代码在写什么」，更告诉你「为什么要这么写」「这些知识点叫什么」，
> 方便你以后自己写代码，也能在答辩 / 面试时把原理讲清楚。

---

## 目录

1. [项目是干什么的](#1-项目是干什么的)
2. [技术栈全景](#2-技术栈全景)
3. [目录结构：每个文件负责什么](#3-目录结构每个文件负责什么)
4. [怎么把项目跑起来](#4-怎么把项目跑起来)
5. [Vue 3 核心语法（对照本项目代码）](#5-vue-3-核心语法对照本项目代码)
6. [组件通信：props / emit / v-model](#6-组件通信props--emit--v-model)
7. [Element Plus 组件库用法](#7-element-plus-组件库用法)
8. [axios 与接口约定](#8-axios-与接口约定)
9. [样式体系：scoped、CSS 变量、毛玻璃、动画](#9-样式体系scopedcss-变量毛玻璃动画)
10. [主题切换 / 暗黑模式 / 本地持久化 / 文件上传](#10-主题切换--暗黑模式--本地持久化--文件上传)
11. [逐文件精读](#11-逐文件精读)
12. [代码走查：我发现的坑与改进建议](#12-代码走查我发现的坑与改进建议)
13. [新手学习路线与练习任务](#13-新手学习路线与练习任务)
14. [名词速查表](#14-名词速查表)

---

## 1. 项目是干什么的

这是一个 **护理中心（养老院）床位管理系统的前端**，纯浏览器端项目，所有数据都来自后端 HTTP 接口。
它一共只有 **两个业务页面** + **一个全局设置抽屉**：

| 功能 | 文件 | 说明 |
| --- | --- | --- |
| 床位示意图 | `src/views/BedMap.vue` | 选择楼层（一层/二层），把每个房间的每张床用**彩色小方块**画出来。绿色=空闲、蓝色=有人、橙色=外出。顶部还有总床位统计标签。 |
| 床位管理 | `src/views/BedManage.vue` | 一张表格，支持按「客户姓名」「入住日期」查询；用 Tab 切换「正在使用 / 使用历史」；正在使用的记录可以「修改结束时间」和「床位调换」。 |
| 外观设置 | `src/components/SettingsDrawer.vue` | 右侧抽屉。可切换白天/黑夜/跟随系统、设置自定义壁纸（填 URL 或本地上传图片）、调整壁纸透明度。 |
| 应用外壳 | `src/App.vue` | 顶部导航栏 + 页面切换 + 上面那些全局外观状态的「管理者」。 |

**一句话理解整体结构**：`App.vue` 是「壳」，负责导航、主题、壁纸这些**全局状态**；
`views/` 里的两个页面是「肉」，各自去调接口拿自己的数据。两者几乎不耦合，
唯一的关系是「App 决定当前显示哪一个」。

```
用户点击顶部菜单
      │
      ▼
App.vue  (activeMenu: '1' | '2')
      │  动态组件 <component :is="...">
      ├── 索引 '1' ──► views/BedMap.vue      ──► axios GET /bed/statistics、/bed/map
      └── 索引 '2' ──► views/BedManage.vue   ──► axios GET/PUT/POST /bed/manage/*
                          │
                          ▼
              components/SettingsDrawer.vue  (由 App.vue 通过 v-model 控制显隐)
```

## 2. 技术栈全景

来自 `package.json` 的真实版本：

| 分类 | 技术 | 版本 | 在本项目里干什么 |
| --- | --- | --- | --- |
| 核心框架 | **Vue** | ^3.5.42 | 数据驱动视图：数据变了，界面自动更新 |
| 构建工具 | **Vite** | ^8.3.0 | 开发服务器 + 打包工具（`npm run dev` / `npm run build`） |
| Vite 插件 | @vitejs/plugin-vue | ^6.0.8 | 让 Vite 能编译 `.vue` 单文件组件 |
| UI 组件库 | **Element Plus** | ^2.14.7 | 表格、弹窗、表单、抽屉、标签……几乎所有可见控件 |
| 图标库 | @element-plus/icons-vue | ^2.3.2 | `Setting` 等图标，在 `main.js` 里被全量注册 |
| HTTP 客户端 | **axios** | ^1.20.0 | 调后端接口（GET / PUT / POST） |
| 浏览器原生 API | localStorage / FileReader / matchMedia | — | 保存用户偏好、读取本地图片、监听系统深色模式 |

### 需要理解的几个基础概念

- **SPA（单页应用）**：整个网站只有一个 `index.html`，导航切换时**不刷新页面**，只是用 JS 把某个组件换上去。
  所以你会看到 `App.vue` 里的 `<component :is="...">` 而不是 `router-link`。
- **SFC（单文件组件）**：一个 `.vue` 文件 = `<template>`（结构）+ `<script setup>`（逻辑）+ `<style>`（样式）三块。
  这是 Vue 特有的写法，Vite 负责把它编译成浏览器能懂的 JS。
- **HMR（热模块替换）**：改了代码浏览器不刷新、局部更新，几毫秒就生效，是 Vite 的核心卖点之一。
- **`^3.5.42` 是什么意思**：这是 npm 的**语义化版本（semver）**范围，`^` 表示"允许升级到 3.x 的最高版本，但不跨大版本"。
  大版本（第一个数字）变化通常意味着**不兼容的破坏性改动**。
- **`dependencies` vs `devDependencies`**：前者是运行时也需要的包（Vue、Element Plus、axios），
  后者只在开发和打包时用（Vite、插件），部署到服务器时不需要。

---

## 3. 目录结构：每个文件负责什么

```
care-center-ui/
├─ index.html              # 唯一的 HTML 模板，body 里只有一个 <div id="app"></div>
├─ package.json            # 项目身份证 + 依赖清单 + 脚本命令
├─ vite.config.js          # Vite 配置：插件、开发端口、/api 代理、打包 base
├─ README.md               # 就是你正在看的这份
└─ src/
   ├─ main.js              # 【程序入口】创建 Vue 应用 → 装插件/图标 → 挂载到 #app
   ├─ App.vue              # 【根组件】顶部导航 + 页面切换 + 全局主题/壁纸状态
   ├─ style.css            # ⚠️ Vite 模板遗留样式，当前没有被任何文件 import（死代码）
   ├─ assets/
   │  ├─ hero.png  /  vite.svg  /  vue.svg     # ⚠️ 只有模板 demo 用到的图片
   ├─ components/
   │  ├─ SettingsDrawer.vue   # ✅ 外观设置抽屉（真正在用的子组件）
   │  └─ HelloWorld.vue       # ⚠️ Vite 模板 demo，未被任何组件引用
   └─ views/
      ├─ BedMap.vue         # ✅ 床位示意图页面
      └─ BedManage.vue      # ✅ 床位管理页面
```

**约定俗成的命名规范**（你以后自己建文件要遵守）：

- `views/`（有的项目叫 `pages/`）放**页面级组件**，一个页面对应一个路由。
- `components/` 放**可复用的小组件**，比如这里的设置抽屉。
- 组件文件名用 **大驼峰 PascalCase**（`BedMap.vue`），这样在模板里写 `<BedMap />` 一眼就知道是自定义组件。

> ⚠️ 小提醒：`src/style.css`、`src/components/HelloWorld.vue`、`src/assets/*` 是 `npm create vite` 模板自带的东西。
> `main.js` **并没有** `import './style.css'`，所以那份样式（包括 `#app { width: 1126px }`）实际上**一行都没生效**。
> 你现在能看到的布局效果，全部来自 `App.vue` 的全局 `<style>` 和 Element Plus。

---

## 4. 怎么把项目跑起来

```bash
# 1. 安装依赖（第一次 clone 下来必做，会生成 node_modules）
npm install

# 2. 启动开发服务器，默认 http://localhost:5173
npm run dev

# 3. 打包生产版本，产物在 dist/
npm run build

# 4. 本地预览打包结果
npm run preview
```

**重要前提**：这个前端默认连的是后端 `http://localhost:8080`（见 `vite.config.js` 的 proxy）。
后端没启动时，页面能打开，但表格会空、控制台会报接口错误（`404 / ECONNREFUSED`）——这是正常的，不是前端 bug。

### 为什么要配代理（proxy）？

浏览器有 **同源策略**：`localhost:5173` 的页面直接去请求 `localhost:8080` 属于「跨域」，会被浏览器拦截。
`vite.config.js` 里的配置让**开发服务器替你转发**：

```js
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:8080', // 凡是 /api 开头的请求，都转给 8080
      changeOrigin: true               // 把请求头里的 Host 改成目标地址，骗过对方校验
    }
  }
}
```

配合 `main.js` 里的 `axios.defaults.baseURL = '/api'`，你写 `axios.get('/bed/map')`，
实际发出的是 `/api/bed/map` → 被 Vite 转发到 `http://localhost:8080/api/bed/map`。

> 🔎 注意：这里**没有配 `rewrite`**，也就是 `/api` 这个前缀会被原样带给后端。
> 所以后端接口的真实路径必须长这样：`http://localhost:8080/api/bed/map`。
> 如果后端其实没有 `/api` 前缀，就要加一句 `rewrite: (p) => p.replace(/^\/api/, '')`。**联调时报 404 先查这里。**

## 5. Vue 3 核心语法（对照本项目代码）

### 5.1 `<script setup>` 是什么

你项目里每个 `.vue` 的 script 块都是 `<script setup>`，这是 Vue 3 的**组合式 API（Composition API）**语法糖。

```vue
<script setup>
import { ref } from 'vue'

const activeMenu = ref('2')

function handleMenuSelect(index) {
  activeMenu.value = index
}
</script>
```

三个要点：

1. `<script setup>` 里的**顶层变量和函数会自动暴露给模板**，不再需要写 `return { ... }`。
2. 它等价于 `setup()` 函数 + `return`，是官方推荐写法（样板代码更少）。
3. **一个组件只能有一个 `<script setup>`**，与 `<template>`、`<style>` 共同构成 SFC（单文件组件）。

（老写法叫「选项式 API」，用 `data() {}` / `methods: {}` / `computed: {}` 分块组织代码。
本项目完全没用，但你在网上看老教程时会遇到，知道它们是同一个东西就行。）

### 5.2 `ref` 与 `reactive`：响应式的两块基石

| 对比项 | `ref` | `reactive` |
| --- | --- | --- |
| 能装的数据 | 任意类型（数字、字符串、布尔、对象、数组） | 只能是对象 / 数组等引用类型 |
| 读写方式 | **JS 里必须 `.value`**；**模板里自动解包**，不用写 `.value` | 直接 `.属性` |
| 本项目例子 | `activeMenu`、`settingsVisible`、`tableData`、`themeMode`、`roomList` | `queryParams`、`editForm`、`swapForm` |

```js
// BedManage.vue 里的真实写法
const queryParams = reactive({ customerName: '', startDate: '' })  // 对象 → reactive
const tableData = ref([])                                           // 数组 → ref

// 读
tableData.value            // JS 里要 .value
queryParams.customerName   // reactive 直接点属性

// 写
tableData.value = res.data.data   // ✅ 正确
// tableData = res.data.data      // ❌ 错误：断开了响应式联系，界面不会更新
```

> 🧠 **原理一句话**：Vue 3 用 `Proxy` 包住数据对象，「读属性」时登记谁依赖了我，「写属性」时通知这些依赖重新渲染。
> 因此**必须通过 `.value` / `.属性` 去修改**；把整个变量重新赋值（对 `reactive` 而言）会断开这层联系。
>
> 口诀：**`ref` 是一个盒子，在 JS 里要用 `.value` 打开；模板里 Vue 帮你自动开盒。**

### 5.3 模板指令：本项目出现的全部指令

| 指令 | 作用 | 本项目实例 |
| --- | --- | --- |
| `{{ }}` 插值 | 把数据显示到页面 | `{{ stats.total }}`、`{{ Math.round(bgOpacity * 100) }}%` |
| `v-bind` / 简写 `:` | 把 JS 数据绑到 HTML 属性 | `:data="tableData"`、`:key="room.roomNo"`、`:style="{ backgroundImage: url(图片地址) }"` |
| `v-on` / 简写 `@` | 绑定事件处理函数 | `@click="settingsVisible = true"`、`@select="handleMenuSelect"`、`@change="fetchBedMap"` |
| `v-if` | 条件渲染（条件不成立时元素**不存在**） | `<div class="bg-layer" v-if="globalBgUrl">`、`v-if="roomList.length === 0"` |
| `v-for` | 列表渲染，**必须配 `:key`** | `v-for="room in roomList" :key="room.roomNo"` |
| `v-model` | 表单双向绑定 | `<el-input v-model="queryParams.customerName" />`、`<el-drawer v-model="visible">` |
| `v-loading` | Element Plus 的**自定义指令**，显示加载遮罩 | `<el-table ... v-loading="loading">` |

**新手最容易踩的三个点：**

1. **`v-for` 为什么必须写 `:key`？**
   Vue 更新列表时靠 `key` 判断「哪个元素还是原来那一个」。用数组下标当 key，在**增删/排序**时会错位复用旧的 DOM，
   所以本项目规范地用了业务 id：`:key="bed.id"`、`:key="room.roomNo"`、`:key="room.id"`、`:key="bed.id"`。

2. **`v-if` 和 `v-show` 的区别？**
   `v-if` 是「真创建 / 真销毁」DOM，切换开销大，适合偶尔切换；`v-show` 只是切 `display: none`，适合频繁切换。
   本项目全部用的 `v-if`（切换频率低，合理）。

3. **`:class` 的三种写法**（本项目里出现了两种）：
   ```vue
   <!-- 1) 静态字符串 -->
   <div class="bed-box status-free">
   <!-- 2) 对象：key 是类名，value 是布尔条件 —— App.vue 里用了 -->
   <el-button :class="{ 'rotate-anim': settingsVisible }" />
   <!-- 3) 函数返回类名字符串 —— BedMap.vue 里用了 -->
   <div class="bed-box" :class="getBedStatusClass(bed.bedStatus)">
   ```

**插值里可以写表达式**，例如 `BedManage.vue`：

```vue
{{ scope.row.startDate ? scope.row.startDate.split('T')[0] : '' }}
```

意思是：日期存在就按 `T` 切开取前半段（`2026-10-08T00:00:00` → `2026-10-08`），否则显示空字符串。
这是前端裁日期的「土办法」，能用；第 12 章我会给你更专业的替代方案。

### 5.4 侦听器 `watch` 与计算属性 `computed`

`watch` 的语义是：**盯着某个数据，它一变，我就去做一件事（副作用）**。`App.vue` 里：

```js
watch(globalBgUrl, (val) => {
  if (val) document.body.classList.add('has-bg')      // 有壁纸 → 给 body 加标记类
  else     document.body.classList.remove('has-bg')   // 没壁纸 → 移除
}, { immediate: true })   // immediate: true → 定义时立刻先执行一次，不用等到第一次变化
```

**为什么必须这么写？** 因为 CSS 里写着 `body.has-bg .el-card { ...毛玻璃... }`，
而 `<body>` 标签在 `index.html` 里、不在任何组件内部，Vue 管不到它。
所以只能手动 `document.body.classList` 加/删类名——这是**「逃出 Vue 世界去操作原生 DOM」**的典型场景，
要记住：能用数据驱动就别手动碰 DOM，但像 `body`、`document.title` 这种确实只能手动。

`computed` 的语义是：**由已有数据"算"出来的新数据**，有缓存，不会造成循环。本项目没用，
但你应该会写——例如顶部统计标签其实可以直接算出来：

```js
const freeCount = computed(() =>
  roomList.value.flatMap(r => r.beds).filter(b => b.bedStatus === 1).length
)
```

> **一句话区分**：`computed` 是「算出值给别人用」（纯计算，无副作用）；
> `watch` 是「数据变了，我要去做有副作用的事」（发请求、改 DOM、写 localStorage）。

### 5.5 生命周期钩子：`onMounted`

组件有「创建 → 挂载 → 更新 → 卸载」的过程，Vue 在每个节点都埋了钩子回调。本项目只用了最常用的一个：

```js
onMounted(() => {
  fetchStatistics()   // 组件第一次挂载到页面之后，立刻拉数据
  fetchBedMap()
})
```

**为什么请求要写在 `onMounted`？** 因为它保证组件已经渲染到页面上，这时再发请求、拿到数据更新变量，界面就能正确刷新。
本项目用到的 / 你以后会用到的钩子：

| 钩子 | 时机 | 本项目 |
| --- | --- | --- |
| `onMounted` | 挂载完成后 | ✅ `App.vue`、`BedMap.vue`、`BedManage.vue` 都用 |
| `onUnmounted` | 卸载前（清理定时器、解绑事件监听） | ❌ 应该用但没用（见第 12 章第 3 条） |
| `onUpdated` | 每次更新后 | ❌ |

### 5.6 动态组件与过渡动画（`App.vue` 的精华）

```vue
<Transition name="slide-fade" mode="out-in">
  <component :is="activeMenu === '1' ? BedMap : BedManage" :key="activeMenu" />
</Transition>
```

- **`<component :is="组件">`**：动态组件。`is` 的值决定当前渲染哪个组件。
  注意 `is` 的值必须是**组件对象**（这里是 `<script setup>` 顶部 `import` 进来的 `BedMap` / `BedManage`），
  写字符串 `'BedMap'` 是**不行**的，除非你把它注册成了全局组件。
- **`:key="activeMenu"`**：这是关键！`key` 变了，Vue 就认为「换了一个组件」，于是**销毁旧的、创建新的**。
  效果是两个页面各自重新执行 `onMounted` 去请求最新数据，状态不会互相污染。
  反过来说，如果你去掉 `:key`，两个页面切换时组件会被复用，数据可能是"上次的旧数据"。
- **`<Transition>`**：Vue 内置的过渡组件，负责在元素插入/移除时套用 CSS 动画类名。
  `mode="out-in"` 表示「旧的先离场，新的再进场」，避免两个页面同时存在时重叠、抖动。
- 配套 CSS 命名规则（**必须背下来**）：`name="slide-fade"` 前缀就是类名前缀，
  `-enter-from`（进场起点）/ `-enter-active`（进场过程，放 transition）/ `-enter-to`（进场终点），
  `-leave-*` 同理管离场。本项目只写了 `enter-from` 和 `leave-to`，因为默认状态下 opacity 就是 1、位移就是 0。

```css
.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.3s cubic-bezier(0.55, 0, 0.1, 1); }
.slide-fade-enter-from { opacity: 0; transform: translateY(20px) scale(0.98); }
.slide-fade-leave-to   { opacity: 0; transform: translateY(-20px) scale(0.98); }
```

补充：`cubic-bezier(0.55, 0, 0.1, 1)` 是自定义缓动曲线，控制动画的加减速节奏（前段快、后段缓）。

---

## 6. 组件通信：props / emit / v-model

本项目只有**一处**父子组件通信：`App.vue`（父）↔ `SettingsDrawer.vue`（子）。
把这一处彻底搞懂，Vue 的组件通信你就入门了。

```
App.vue（父组件）
   │  ① props 向下传（:current-theme="themeMode"）
   ▼
SettingsDrawer.vue（子组件）
   │  ② emit 向上报（emit('update:theme', val)）
   ▲
App.vue 收事件 → 改自己的 themeMode → 写 localStorage → 应用主题
```

### 6.1 父传子：`props`

父组件 `App.vue` 里的写法：

```vue
<SettingsDrawer
  v-model="settingsVisible"
  :current-theme="themeMode"
  :current-bg-url="globalBgUrl"
  :current-bg-opacity="globalBgOpacity"
  @update:theme="handleThemeUpdate"
  @update:bg-url="handleBgUrlUpdate"
  @update:bg-opacity="handleBgOpacityUpdate"
/>
```

子组件 `SettingsDrawer.vue` 里的声明：

```js
const props = defineProps({
  modelValue: Boolean,          // ← 对应模板里的 v-model
  currentTheme: String,         // ← 对应 :current-theme
  currentBgUrl: String,         // ← 对应 :current-bg-url
  currentBgOpacity: Number      // ← 对应 :current-bg-opacity
})
```

**必须掌握的两条规则：**

1. **命名自动转换**：模板里写「短横线 kebab-case」（`current-theme`），
   JS 里声明「小驼峰 camelCase」（`currentTheme`）。因为 HTML 属性名不区分大小写，所以模板里必须用短横线。
2. **props 是只读的（单向数据流）**：子组件**不允许**直接 `props.currentTheme = 'dark'`（控制台会警告）。
   想改，只能 `emit` 通知父组件去改。这是刻意设计的约束，目的是让「数据从哪来、被谁改」永远清晰可追踪。

补充：`defineProps` / `defineEmits` 是**编译器宏**，不用 `import`，Vue 在编译时就把它们处理掉了。

### 6.2 子传父：`emit` 自定义事件

子组件先"注册"它能发哪些事件，再在合适的时机"发射"：

```js
const emit = defineEmits(['update:modelValue', 'update:theme', 'update:bgUrl', 'update:bgOpacity'])

watch(themeMode, (val) => { emit('update:theme', val) })   // 内部值一变就报给父组件
const clearBgUrl = () => {
  bgUrl.value = ''
  emit('update:bgUrl', '')     // 清空壁纸也要报上去
  ElMessage.success('已恢复默认壁纸')
}
```

父组件用 `@update:theme="handleThemeUpdate"` 接住，事件名 `update:theme` 对应模板里的 `@update:theme`。

### 6.3 `v-model` 的语法糖本质（重点！）

`v-model="settingsVisible"` 写在**组件**上，会被 Vue 展开成：

```vue
<!-- 这两种写法完全等价 -->
<SettingsDrawer v-model="settingsVisible" />
<SettingsDrawer :modelValue="settingsVisible" @update:modelValue="settingsVisible = $event" />
```

这就解释了子组件里那两行看似奇怪的代码为什么是必须的：

```js
const visible = ref(false)
watch(() => props.modelValue, (val) => { visible.value = val })  // 父变 → 子跟着变
watch(visible, (val) => { emit('update:modelValue', val) })      // 子变 → 通知父
```

- `props.modelValue` 就是父组件传下来的 `settingsVisible`；
- `emit('update:modelValue', val)` 就是"请父组件把它改成 val"。

**为什么子组件要多一个内部 `visible` 而不直接用 props？**
因为 `el-drawer` 需要一个**可写的** `v-model`（用户点遮罩关闭时它会自己改），而 props 只读，
所以作者做了个"内部镜像变量"，两边互相同步。于是形成了**三层套娃**：

```
App.settingsVisible  ⇄  SettingsDrawer.visible  ⇄  el-drawer 内部的 visible
```

> 💡 更优雅的写法（推荐你重构时用）：**可写的 computed**，两行代码就能代替那 4 个 watch：
> ```js
> import { computed } from 'vue'
> const visible = computed({
>   get: () => props.modelValue,
>   set: (val) => emit('update:modelValue', val)
> })
> ```
> 原理：读它时走 `get`（拿到父组件的值），写它时走 `set`（把新值报给父组件）。

### 6.4 具名 `v-model`（Vue 3 新特性，本项目没用但要知道）

Vue 3 允许一个组件上挂多个 `v-model`：

```vue
<SettingsDrawer v-model:theme="themeMode" v-model:bg-url="globalBgUrl" />
<!-- 等价于 -->
<SettingsDrawer :theme="themeMode" @update:theme="themeMode = $event"
                :bg-url="globalBgUrl" @update:bg-url="globalBgUrl = $event" />
```

本项目是手动写 `:current-theme` + `@update:theme` 的"展开版"，效果一样，只是更啰嗦。
（顺带说明：`props` 里的 `default` 值本可以用 `withDefaults(defineProps(...), {...})` 或 `defineProps({ currentTheme: { type: String, default: 'light' } })` 来声明，
作者选择了在 `ref()` 初始化时兜底 `props.currentTheme || 'light'`，也能跑。）

---

## 7. Element Plus 组件库用法

Element Plus 是 Vue 3 生态里最主流的桌面端 UI 组件库（饿了么团队出品）。
它的价值是：**表格、弹窗、抽屉、表单这些又丑又难写的控件，别人已经写好了，你只负责传数据和接事件。**

### 7.1 三步走：安装 → 注册 → 使用

`main.js` 里做了三件事：

```js
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'                     // ① 组件的基础样式（必须引！）
import 'element-plus/theme-chalk/dark/css-vars.css'      // ② 暗黑模式用的 CSS 变量（配合 html.dark 生效）
app.use(ElementPlus)                                     // ③ 全局注册所有组件
```

- **为什么样式要单独 import？** 组件库的 JS 和 CSS 是分开的，不引 CSS 的话页面会"裸奔"（按钮变成原生灰色方块）。
- **`app.use(插件)`**：Vue 的插件机制。Element Plus 作为一个插件被安装后，
  `<el-button>`、`<el-table>` 这些标签就能在**任意组件**里直接用，不需要每个文件单独 import。

> 📌 进阶知识：这叫**全量引入**，优点是简单，缺点是打包体积大（虽然 Vite 会 tree-shaking，但样式是全量的）。
> 生产项目更常用 `unplugin-vue-components` + `ElementPlusResolver` 做**按需自动引入**。你现在不必改，但要知道有这么回事。

### 7.2 图标全局注册（`main.js` 里的小技巧）

```js
import * as ElementPlusIconsVue from '@element-plus/icons-vue'   // ① 命名空间导入

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {  // ② 遍历对象
  app.component(key, component)                                   // ③ 全局注册组件
}
```

一行行拆给你看：

- `import * as X from '...'`：**命名空间导入**，把模块里所有导出塞进一个对象 `X`（这里每个导出都是一个图标组件）。
- `Object.entries(obj)`：把对象转成 `[[key, value], ...]` 数组，配合 `for...of` + **数组解构**使用。
- `app.component(name, comp)`：**全局注册组件**。注册后模板里就能直接用 `<Setting />`，
  所以 `App.vue` 里可以写 `icon="Setting"`（字符串形式，Element Plus 内部会去找同名组件）。

> ⚠️ 代价：这会把**几百个图标组件**全部注册进来，略微增大打包体积。
> 更精细的做法是局部 import：`import { Setting } from '@element-plus/icons-vue'` 然后用 `<el-icon><Setting /></el-icon>`。

### 7.3 本项目用到的组件清单（照着查文档用）

| 组件 | 用在哪 | 关键属性 / 事件 |
| --- | --- | --- |
| `el-menu` / `el-menu-item` | `App.vue` | `mode="horizontal"`、`:default-active`、`@select` |
| `el-button` | 多处 | `type`、`circle`、`size`、`icon`、`plain`、`round` |
| `el-drawer` | `SettingsDrawer.vue` | `v-model`、`size="350px"`、`:with-header` |
| `el-radio-group` / `el-radio-button` | `SettingsDrawer.vue` | `v-model`、`@change` |
| `el-input` | `SettingsDrawer.vue`、`BedManage.vue` | `v-model`、`clearable`、`placeholder`、`@keyup.enter`、`@clear` |
| `el-upload` | `SettingsDrawer.vue` | `action`、`:show-file-list`、`:before-upload`、`accept` |
| `el-slider` | `SettingsDrawer.vue` | `v-model`、`:min`、`:max`、`:step` |
| `el-form` / `el-form-item` | `BedManage.vue` | `:inline`、`:model`、`label`、`label-width` |
| `el-tabs` / `el-tab-pane` | `BedManage.vue` | `v-model`、`@tab-click`、`name` |
| `el-table` / `el-table-column` | `BedManage.vue` | `:data`、`border`、`v-loading`、`prop`、`label`、`width` |
| `el-dialog` | `BedManage.vue` | `v-model`、`title`、`width`、`#footer` 插槽 |
| `el-select` / `el-option` | `BedMap.vue`、`BedManage.vue` | `v-model`、`@change`、`placeholder` |
| `el-date-picker` | `BedManage.vue` | `v-model`、`type="date"` |
| `el-tag` | `BedMap.vue` | `type="info" / "success" / "danger" / "warning"` 四种颜色 |
| `el-empty` | `BedMap.vue` | `description`，无数据时的友好占位 |
| `ElMessage` | `SettingsDrawer.vue`、`BedManage.vue` | **命令式**调用的轻提示 API |

### 7.4 三个必须掌握的套路

#### 套路 A：表格里自定义某一列的内容（作用域插槽）

```vue
<el-table-column prop="customerSex" label="性别" width="80">
  <template #default="scope">{{ scope.row.customerSex === 0 ? '男' : '女' }}</template>
</el-table-column>
```

- `prop="customerSex"`：默认直接显示这行的 `customerSex` 字段。
- 但你要把它翻译成「男/女」，就得用**插槽**把渲染权"抢回来"。
- `#default="scope"` 是 `v-slot:default="scope"` 的简写，`scope.row` 是**当前这一行的数据对象**，
  `scope.$index` 是行下标。
- 这是 Element Plus 表格最重要的能力：**只要给列加了插槽，就能渲染任意 HTML（按钮、标签、图片……）**。
  `BedManage.vue` 的「操作」列就是这么塞了两个按钮进去的。

#### 套路 B：弹窗 = `v-model` 控制显隐 + `#footer` 插槽放按钮

```vue
<el-dialog v-model="editDialogVisible" title="修改床位结束时间" width="400px">
  <el-form :model="editForm"> ... </el-form>
  <template #footer>
    <el-button @click="editDialogVisible = false">取消</el-button>
    <el-button type="primary" @click="submitEdit">保存</el-button>
  </template>
</el-dialog>
```

`v-model="editDialogVisible"` 一个变量同时控制"显示/隐藏"和"用户点 X 或遮罩后自动置 false"，
所以代码里想打开弹窗就是一句 `editDialogVisible.value = true`，非常省事。

#### 套路 C：命令式提示 `ElMessage`

```js
import { ElMessage } from 'element-plus'

ElMessage.success('修改成功')
ElMessage.warning('请选择新床位')
```

它是"函数式"调用，不需要在模板里写组件，用完自动消失。
必须**手动 `import`**——因为 `app.use(ElementPlus)` 只把「组件」注册成全局标签，没有把「API 函数」挂到全局。

另外补充一个项目里用的 `v-loading`：

```vue
<el-table :data="tableData" v-loading="loading">
```

它是 Element Plus 提供的**自定义指令**（不是组件），值为 `true` 时会在元素上覆盖一层转圈遮罩。
所以标准写法就是：请求前 `loading.value = true`，请求结束（`finally`）里 `loading.value = false`。

---

## 8. axios 与接口约定

axios 是一个基于 Promise 的 HTTP 客户端（可以理解成"更好用的 fetch/XMLHttpRequest 封装"）。
本项目**没有**做二次封装（没有 `request.js` 拦截器那一套），而是每个页面直接 `axios.get/post/put`。

### 8.1 全局配置：`axios.defaults.baseURL`

```js
// main.js
axios.defaults.baseURL = '/api'
```

这一行让所有请求都自动带上 `/api` 前缀。所以代码里写 `axios.get('/bed/map')`，
真实请求路径是 `/api/bed/map`，再配合 Vite 的 proxy 转发到后端 `http://localhost:8080`。

> 🧠 **为什么写相对路径 `/api` 而不是写死 `http://localhost:8080`？**
> 因为写死的地址在部署到生产环境后一定失效（总不能要求用户也在本机跑一个 8080 的后端）。
> 相对路径让「开发环境靠 Vite 代理、生产环境靠 Nginx 反向代理」都成立，这是行业标准做法。

### 8.2 请求的标准写法：`async / await` + `try / catch / finally`

`BedMap.vue` 里的 `fetchBedMap` 是教科书级别的模板，请背下来：

```js
const fetchBedMap = async () => {
  loading.value = true                                    // ① 开加载动画
  try {
    const res = await axios.get(`/bed/map?floor=${currentFloor.value}`)
    if (res.data.code === 200) roomList.value = res.data.data   // ② 成功：更新数据
  } catch (error) {
    console.error(error)                                   // ③ 失败：捕获异常
  } finally {
    loading.value = false                                  // ④ 无论成败都关动画
  }
}
```

逐个知识点：

- **`async`**：声明这个函数是异步的，它总是返回一个 `Promise`。
- **`await`**：暂停等待 Promise 出结果，拿到后再往下执行。它让异步代码看起来像同步代码，
  避免了以前嵌套回调的「回调地狱」。
- **`try / catch`**：网络错误（断网、后端 500、超时）会抛异常，被 `catch` 接住，防止整个页面崩掉。
- **`finally`**：**不管成功失败都会执行**，所以最适合关闭 loading。
  比在 try 末尾和 catch 里各写一遍更可靠（因为 try 里如果更新数据时报错就漏掉关闭逻辑了）。
- **`${currentFloor.value}`**：模板字符串插值。注意 JS 里访问 `ref` **必须带 `.value`**，模板里才不用。

### 8.3 两种传参方式：`params` 与请求体

**GET 请求：用 `{ params: {...} }` 让 axios 自动拼查询串**

```js
// BedManage.vue
const params = { status: activeStatus.value }
if (queryParams.customerName) params.customerName = queryParams.customerName
if (queryParams.startDate) params.startDate = queryParams.startDate
const res = await axios.get('/bed/manage/details', { params })
```

`{ params }` 是对象属性简写（等价于 `{ params: params }`）。
axios 会把对象拼成 `?status=1&customerName=张三`，还会**自动做 URL 编码**（中文、空格都不会出错）。

也可以手写模板字符串（`BedMap.vue` 和 `handleFloorChange` 就是这么干的）：

```js
await axios.get(`/bed/map?floor=${currentFloor.value}`)
```

两种都能用，但**推荐 `params` 写法**：可读性更好，也不用手动处理特殊字符。

**PUT / POST 请求：第二个参数直接是请求体（会被序列化成 JSON）**

```js
await axios.put('/bed/manage/updateEndTime', editForm)   // { id, endDate }
await axios.post('/bed/manage/swap', swapForm)           // { customerId, newFloor, newRoomNo, newBedId, swapDate }
```

注意 `editForm` / `swapForm` 是 `reactive(...)` 创建的**响应式对象**，
axios 在序列化时会读取它的属性，效果和普通对象一样，可以放心传。

### 8.4 后端统一返回格式：`res.data.code === 200`

本项目后端返回的 JSON 长这样：

```json
{ "code": 200, "msg": "success", "data": { "...": "..." } }
```

所以要写 `if (res.data.code === 200)`。这里有个**极其重要的认知**：

> **`res` 是 axios 包装过的响应对象，不是后端数据本身。**
> `res.data` 才是后端返回的 JSON body，`res.status` 是 HTTP 状态码（200/404/500），`res.headers` 是响应头。
>
> 而且：**HTTP 200 不等于业务成功**。本项目后端无论业务对错，HTTP 层都返回 200，
> 用 body 里的 `code` 表示业务结果。所以必须自己判断 `code`，不能只看请求有没有报错。

### 8.5 接口清单（本项目调用的全部后端接口）

| 方法 | 路径（含 baseURL） | 参数 | 用途 | 调用处 |
| --- | --- | --- | --- | --- |
| GET | `/api/bed/statistics` | 无 | 床位统计：`total / free / occupied / out` | `BedMap.vue` `fetchStatistics` |
| GET | `/api/bed/map` | `floor` | 某楼层的房间 + 床位列表 | `BedMap.vue` `fetchBedMap`、`BedManage.vue` `handleFloorChange` |
| GET | `/api/bed/manage/details` | `status`，可选 `customerName`、`startDate` | 入住明细列表（正在使用 / 历史） | `BedManage.vue` `fetchDetails` |
| PUT | `/api/bed/manage/updateEndTime` | `{ id, endDate }` | 修改入住结束时间 | `BedManage.vue` `submitEdit` |
| POST | `/api/bed/manage/swap` | `{ customerId, newFloor, newRoomNo, newBedId, swapDate }` | 床位调换 | `BedManage.vue` `submitSwap` |

### 8.6 顺带学两个 JS 语法：可选链与空值合并

`BedManage.vue` 的错误处理里有一句很"高级"的写法：

```js
ElMessage.error(error.response?.data?.msg || '调换失败')
```

- **可选链 `?.`**：安全地取深层属性。如果 `error.response` 是 `undefined`（比如断网，压根没有响应），
  整段表达式直接返回 `undefined`，**不会像 `error.response.data` 那样报"读取 undefined 的属性"的错**。
- **`||` 与 `??`**：`a || b` 表示"a 是假值（`undefined/null/''/0/false`）时用 b"；
  `a ?? b` 只在 `a` 是 `null/undefined` 时用 b。这里用 `||` 是合适的（msg 为空字符串时也走兜底文案）。

---

## 9. 样式体系：scoped、CSS 变量、毛玻璃、动画

这个项目的"颜值"其实由四样东西撑起来：**CSS 变量（主题） + 毛玻璃（背景） + Flex 布局 + 动画**。
本章把用到的 CSS 知识点全部列出来。

### 9.1 全局样式 vs `<style scoped>` 局部样式

| 写法 | 位置 | 生效范围 |
| --- | --- | --- |
| `<style>` | `App.vue` | **全局**，影响整个页面（包括 Element Plus 的组件） |
| `<style scoped>` | `BedMap.vue`、`BedManage.vue`、`SettingsDrawer.vue` | **只影响本组件自己模板里的元素** |

- **`scoped` 的原理**：编译时给本组件模板里的每个元素加上一个唯一属性（如 `data-v-7ba5bd90`），
  并把选择器改写成 `.room-item[data-v-7ba5bd90] { ... }`。别的组件没有这个属性，自然选中不了。
- **为什么 `App.vue` 要用全局样式？** 因为它要覆盖 `body`、`html.dark`、`.el-card` 这些**不属于任何组件的元素/类名**。
  scoped 会加属性选择器，根本选不中 `body`，所以全局样式必须写在非 scoped 的 `<style>` 里。

### 9.2 `:deep()` 深度选择器（穿透 scoped）

`BedManage.vue` 里这段：

```css
:deep(.transparent-table tr),
:deep(.transparent-table th.el-table__cell),
:deep(.transparent-table td.el-table__cell) {
  background-color: transparent !important;
  border-color: var(--glass-border) !important;
}
```

**为什么必须用 `:deep()`？**
因为 `<tr>`、`<td>` 是 Element Plus 在它**自己的组件内部**渲染出来的，
这些元素身上**没有** `BedManage.vue` 的 `data-v-xxx` 属性，普通 scoped 规则选不中它们。
`:deep(...)` 会把选择器编译成「父级[data-v-xxx] 后代」的形式，强行穿透进子组件内部。

> ⚠️ Vue 3 里写 `:deep()`，Vue 2 里写 `::v-deep` 或 `/deep/`——看教程时注意区分版本。

### 9.3 CSS 自定义属性（CSS 变量）：本项目主题切换的核心机制

```css
/* App.vue */
:root {                                    /* :root 就是 <html>，所有元素的祖先 */
  --glass-bg: rgba(255, 255, 255, 0.45);
  --glass-border: rgba(255, 255, 255, 0.4);
  --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
  --glass-hover: rgba(255, 255, 255, 0.65);
}
html.dark {                                /* 挂上 dark 类后，这些变量被"就地覆盖" */
  --glass-bg: rgba(20, 20, 20, 0.45);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  --glass-hover: rgba(255, 255, 255, 0.1);
}
```

使用时的写法是 `var(--glass-bg)`：

```css
body.has-bg .el-card { background: var(--glass-bg) !important; }
.room-item { border: 1px solid var(--glass-border); background: var(--glass-bg); }
```

**这就是"换主题只改一个 class"的秘密**：

- CSS 变量的值是可以被"继承 + 覆盖"的。`html.dark` 上的同名变量会**覆盖** `:root` 里的值。
- 所有使用了 `var(--glass-bg)` 的元素**自动**拿到新值，不需要改任何一条具体规则。
- 所以 JS 那边只需要一句 `document.documentElement.classList.add('dark')`，
  整个站点的玻璃卡片配色就全变了。**这就是"数据驱动样式"在 CSS 层的体现。**

补充两个细节：

1. `var(--x, #fff)` 的第二个参数是**兜底值**，变量不存在时使用。
2. Element Plus 自己也全靠这套机制，所以你在 `App.vue` 里看到它用了这些变量：
   `--el-bg-color`、`--el-border-color`、`--el-text-color-primary`、`--el-fill-color-blank`。
   而 `main.js` 里引的 `element-plus/theme-chalk/dark/css-vars.css`，
   就是**官方在 `html.dark` 作用域下重定义一整套 `--el-*` 变量的文件**——没有它，切暗色会非常难看。

### 9.4 毛玻璃效果（Glassmorphism）

```css
body.has-bg .el-card {
  background: var(--glass-bg) !important;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border) !important;
  box-shadow: var(--glass-shadow) !important;
  transition: all 0.3s ease;
}
body.has-bg .el-card:hover {
  transform: translateY(-4px);                       /* 悬浮上移 4 像素 */
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1) !important;
}
```

知识点逐个拆：

- **`backdrop-filter: blur(16px)`**：注意它模糊的是**元素背后的内容**（背景图），不是元素自己。
  再配上半透明背景色 `rgba(..., 0.45)`，就形成了"磨砂玻璃"的观感。这是近几年很流行的视觉风格。
- **`-webkit-backdrop-filter`**：给 Safari 加浏览器厂商前缀（兼容老版本 Safari）。写 CSS 时"标准属性 + 前缀属性"成对出现是常见习惯。
- **`!important`**：Element Plus 自己写了 `.el-card { background: var(--el-bg-color) }`，
  我们的规则优先级拼不过（同优先级但加载顺序靠前），所以用 `!important` 强制覆盖。
  **这是覆盖第三方库样式的常见妥协**，但日常业务代码里要克制使用（会让样式很难维护）。
- **`body.has-bg` 前缀的用意**：没有壁纸时**完全不应用毛玻璃**（`App.vue` 用 `watch` 动态加/删这个类）。
  这是"按需增强"的思路——没有背景图时做模糊既没效果又白耗性能。
- **`transition: all 0.3s ease`**：让 `background / transform / box-shadow` 的变化都有 0.3 秒平滑过渡，
  所以鼠标移上去卡片是"飘"起来而不是"跳"上去。

### 9.5 Flex 布局（本项目的主力布局方式）

`App.vue`、`BedMap.vue`、`SettingsDrawer.vue` 全都在用 Flex。常用的就这几行：

```css
/* 水平两端对齐 + 垂直居中（顶部导航栏、床位示意图的头部都用它） */
.header-bar { display: flex; justify-content: space-between; align-items: center; }

/* 换行 + 间隙（房间列表、床位列） */
.room-list { display: flex; flex-wrap: wrap; gap: 20px; }

/* 垂直居中 + 水平居中（床位小方块内部） */
.bed-box { display: flex; flex-direction: column; align-items: center; justify-content: center; }
```

需要理解的三个概念：

- **主轴 / 交叉轴**：`flex-direction: row`（默认）时主轴是横向、交叉轴是纵向；
  改成 `column` 之后主轴变纵向，于是 `justify-content` 控制**垂直**对齐、`align-items` 控制**水平**对齐。
  这就是为什么 `.bed-box` 里要用 `flex-direction: column` 才能"垂直排列文字并居中"。
- **`gap`**：现代 CSS 的间距方案，比用 `margin-right` 更干净（不会在最后一个元素留下多余间距）。
- **`flex: 1`**（`.nav-menu` 用的）：等价于 `flex: 1 1 0%`，意思是"**占满剩余空间**"，
  所以导航菜单会撑开，把右侧的设置按钮挤到最右边。配套的 `flex-shrink: 0`（`.right-action` 用的）表示"不许被压缩"。

### 9.6 定位与层叠顺序（背景图层的实现）

```css
.bg-layer {
  position: fixed;      /* 相对"视口"固定，滚动不动 */
  top: 0; left: 0;
  width: 100vw; height: 100vh;   /* vw/vh = 视口宽高的百分比 */
  z-index: -1;          /* 沉到最底层 */
  background-size: cover;        /* 铺满容器，多余部分裁掉，不变形 */
  background-position: center;   /* 居中显示 */
  background-repeat: no-repeat;
}
.content { position: relative; z-index: 1; }   /* 内容浮在背景层之上 */
```

- **`position` 的取值**：`static`（默认）/ `relative` / `absolute` / `fixed` / `sticky`。
  `fixed` 是"相对浏览器视口"，所以背景图不会跟着滚动。
- **`z-index`**：只在元素有定位（或 flex/grid 子项）时生效，数字越大越靠上。
  背景层用 `-1` 是"放到最底"，`.content` 用 `1` 保证实现内容压在上面。
- **`background-size: cover` vs `contain`**：`cover` 铺满（可能裁切），`contain` 完整显示（可能留白）。
- Vue 里给背景图赋值要用 `:style`（CSS 里的 `url()` 需要拼字符串）：

  ```vue
  <div class="bg-layer" :style="{ backgroundImage: `url(${globalBgUrl})`, opacity: globalBgOpacity }">
  ```

  注意 JS 对象里写 CSS 属性要用**小驼峰**（`backgroundImage`，而不是 `background-image`）。

### 9.7 动画三件套：transition / @keyframes / transform

```css
/* ① transition：属性变化时的平滑过渡（用于 hover、主题切换等） */
.el-button { transition: transform 0.1s ease, box-shadow 0.2s ease; }
.el-button:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); transform: translateY(-1px); }
.el-button:active { transform: scale(0.94) !important; }   /* 按下时缩小 → "按压感" */

/* ② @keyframes + animation：关键帧动画（用于"摇头"这种不能靠 hover 触发的复杂动作） */
.hover-shake:hover { animation: shake 0.4s ease-in-out; }
@keyframes shake {
  0%   { transform: translateX(0); }
  25%  { transform: translateX(-3px) rotate(-3deg); }
  50%  { transform: translateX(3px) rotate(3deg); }
  75%  { transform: translateX(-2px) rotate(-2deg); }
  100% { transform: translateX(0); }
}

/* ③ transform：位移 / 旋转 / 缩放 */
.rotate-anim { transform: rotate(180deg); transition: transform 0.5s ease; }
```

要点：

- **`:hover` / `:active` / `:focus-visible`** 是**伪类**，表示"鼠标悬停 / 按下去 / 键盘聚焦"这些状态。
- **`transform` 优于改 `left/top`**：`transform` 由 GPU 合成，不触发页面重排（reflow），动画更流畅。
  所以"让元素动起来"优先用 `transform: translate/scale/rotate`。
- **`!important` 用在 `.el-button:active`**：因为 Element Plus 自己也有 `:active` 样式，优先级相同，只好强压。
- **`animation` 的语法**：`动画名 时长 缓动 延迟 次数 方向`，本项目用的是最简形式。
- 小细节：`.rotate-anim` 让设置按钮（齿轮图标）旋转 180°，配合 `:class="{ 'rotate-anim': settingsVisible }"`
  就得到"点开设置时齿轮转半圈"的反馈效果——**用 CSS 表达状态，是很好的交互习惯**。

### 9.8 单位、颜色与其他杂项

| 写法 | 含义 |
| --- | --- |
| `px` | 像素，固定尺寸 |
| `%` | 相对父元素 |
| `vw` / `vh` | 视口宽 / 高的 1%（`100vw` = 整个视口宽） |
| `rem` / `em` | 相对根字号 / 相对自身字号（本项目 `style.css` 里用了 `18px/145%` 这种写法） |
| `rgba(255, 255, 255, 0.45)` | 带透明度的颜色，第 4 个参数是 alpha（0 全透明 → 1 不透明） |
| `linear-gradient(...)` | 线性渐变（本项目没用，但你会经常见到） |
| `border: 1px solid var(--glass-border)` | 边框三要素：宽度 / 线型 / 颜色 |
| `border-radius: 8px` | 圆角 |
| `box-shadow: x偏移 y偏移 模糊 扩展 颜色` | 阴影 |
| `font-size` / `font-weight: bold` | 字号 / 加粗 |

另外 `BedMap.vue` 里床位颜色用的是**语义化类名**，这是很好的写法：

```css
.status-free     { background-color: #67C23A; }   /* 绿 = 空闲 */
.status-occupied { background-color: #409EFF; }   /* 蓝 = 有人 */
.status-out      { background-color: #E6A23C; }   /* 橙 = 外出 */
```

配合 JS 里的映射函数（`getBedStatusClass` / `getBedStatusText`），
**"数据 → 类名 → 样式"三者的对应关系一目了然**，比在模板里写一堆 `v-if` 优雅得多。

> 📎 顺带一提：这三个颜色 `#67C23A / #409EFF / #E6A23C` 正是 Element Plus 的
> success / primary / warning 色值，所以整站配色是统一的。写 UI 时**优先复用组件的色板**，别自己乱挑颜色。

---

## 10. 主题切换 / 暗黑模式 / 本地持久化 / 文件上传

这一章讲本项目**最值得你写进简历的一段代码**：主题与壁纸系统。

### 10.1 暗黑模式实现全链路（三步）

| 步骤 | 在哪 | 做什么 |
| --- | --- | --- |
| ① 引入官方暗色变量 | `main.js` | `import 'element-plus/theme-chalk/dark/css-vars.css'` |
| ② 给 `<html>` 加/删 `dark` 类 | `App.vue` 的 `applyTheme` | `document.documentElement.classList.add('dark')` |
| ③ 自己写 `html.dark` 下的变量覆盖 | `App.vue` 的 `<style>` | 覆盖 `--glass-*` 那四个变量 |

```js
const applyTheme = (mode) => {
  const htmlEl = document.documentElement          // 就是 <html> 元素
  if (mode === 'dark') {
    htmlEl.classList.add('dark')
  } else if (mode === 'light') {
    htmlEl.classList.remove('dark')
  } else if (mode === 'system') {                  // 跟随操作系统
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    isDark ? htmlEl.classList.add('dark') : htmlEl.classList.remove('dark')
  }
}
```

需要掌握的知识点：

- **`document.documentElement`** 就是 `<html>` 元素，`document.body` 是 `<body>`。
  `classList.add/remove/toggle/contains` 是操作 class 的原生 API（比 `className += ' dark'` 安全得多）。
- **`window.matchMedia('(prefers-color-scheme: dark)')`**：查询"系统是否处于深色模式"。
  返回一个 `MediaQueryList`，它的 `.matches` 是布尔值。这是**读取用户操作系统偏好**的标准方式。
  （CSS 里也有对应的媒体查询：`@media (prefers-color-scheme: dark) { ... }`，
  你在没被引入的 `src/style.css` 里能看到这种写法。）
- **为什么要做"跟随系统"这一档？** 因为现在 Windows/macOS/iOS/Android 都能定时自动切换日夜模式，
  用户希望网页跟着一起变。监听系统变化才能做到"自动"，见下。

```js
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (themeMode.value === 'system') {
    e.matches
      ? document.documentElement.classList.add('dark')
      : document.documentElement.classList.remove('dark')
  }
})
```

- 上面这段让"用户中途改系统主题"时页面同步变化。**注意 `if (themeMode.value === 'system')` 这个判断很关键**，
  如果没有它，用户明明手动选了"白天"，系统切换时页面又会被强行改掉。
- ⚠️ 这段代码有个隐患：它写在 `<script setup>` 的**顶层**，每次组件重新创建都会**再注册一次监听**，
  而且**从不移除**。详见第 12 章。

### 10.2 用 `localStorage` 做状态持久化（刷新不丢设置）

**读取**（初始化时，作为默认值）：

```js
const themeMode = ref(localStorage.getItem('themeMode') || 'light')
const globalBgUrl = ref(localStorage.getItem('bgUrl') || '')
const globalBgOpacity = ref(parseFloat(localStorage.getItem('bgOpacity')) || 0.8)
```

**写入**（变化时，在 `App.vue` 的三个 handler 里）：

```js
const handleThemeUpdate = (val) => {
  themeMode.value = val                    // ① 更新响应式状态（界面立刻变）
  localStorage.setItem('themeMode', val)   // ② 持久化到本地（下次打开还记得）
  applyTheme(val)                          // ③ 应用到 DOM
}
```

要点：

- **`localStorage` 只能存字符串**。所以存数字/对象时要转换：数字用 `parseFloat/Number`，
  对象用 `JSON.stringify` / `JSON.parse`。这里 `bgOpacity` 就用了 `parseFloat`。
- **`||` 兜底的原因**：第一次访问时 `getItem` 返回 `null`，所以要给个默认值。
- ⚠️ **`||` 的经典陷阱**：`parseFloat('0')` 得到 `0`，而 `0 || 0.8` 会变成 `0.8`。
  也就是说"用户把透明度拖到 0"，刷新后会被"恢复"成 0.8。

  修复的关键是：**兜底要发生在"读取原始字符串"这一步，而不是 `parseFloat` 之后**。
  因为 `getItem` 只有在"从未存过"时才返回 `null`，而 `null` 才是真正需要兜底的情况：

  ```js
  // ❌ 有 bug：0 会被当成"没设置"
  const globalBgOpacity = ref(parseFloat(localStorage.getItem('bgOpacity')) || 0.8)

  // ✅ 推荐写法：让 ?? 作用在"原始字符串"上，而不是 parseFloat 之后的结果
  const globalBgOpacity = ref(Number(localStorage.getItem('bgOpacity') ?? 0.8))
  // getItem 没存过时返回 null → null ?? 0.8 → 0.8 ✓
  // 存过 '0' 时 → Number('0') → 0 ✓
  ```

  （**这是一个很好的"随手改 bug"练习**，见第 13 章。）

存储方案的对比（面试常问）：

| 对比项 | localStorage | sessionStorage | Cookie |
| --- | --- | --- | --- |
| 生命周期 | 永久（手动删才没） | 关闭标签页就清空 | 可设过期时间 |
| 容量 | 约 5MB | 约 5MB | 约 4KB |
| 会随请求发送给服务器 | ❌ | ❌ | ✅（每个请求都带，浪费带宽） |
| 典型用途 | 主题、语言、Token（有 XSS 风险） | 表单草稿、临时登录态 | 服务端会话标识 |

### 10.3 本地图片上传：`FileReader` + `dataURL`

```js
const handleUpload = (file) => {
  if (file.size / 1024 / 1024 > 2) {           // ① 大小校验：字节 → MB
    ElMessage.warning('图片大小不能超过2MB！')
    return false                               // ② 返回 false → 取消上传
  }
  const reader = new FileReader()              // ③ 浏览器提供的文件读取器
  reader.readAsDataURL(file)                   // ④ 异步读取为 data:image/...;base64,xxx
  reader.onload = () => {                      // ⑤ 读完后回调
    bgUrl.value = reader.result
    emit('update:bgUrl', bgUrl.value)
  }
  return false
}
```

搭配的模板：

```vue
<el-upload action="#" :show-file-list="false" :before-upload="handleUpload" accept="image/*">
  <el-button type="primary">本地上传图片</el-button>
</el-upload>
```

知识点：

- **`:before-upload`** 是 el-upload 的钩子，**返回 `false` 就会阻止上传**。
  本项目 `action="#"` 且永远返回 false，说明作者压根不想传到服务器，**只想拿到 `file` 对象**——很聪明的用法。
- **文件大小换算**：`file.size` 单位是**字节**，`/1024` 是 KB，`/1024/1024` 是 MB。
- **`FileReader`**：浏览器原生 API。`readAsDataURL(file)` 把文件读成
  `data:image/png;base64,iVBORw0...` 这种**自包含的字符串**，可以直接当图片 URL 用。
- **它是异步的**：结果只能通过 `reader.onload` 回调拿到。
  **不能**写 `reader.readAsDataURL(file); bgUrl.value = reader.result` —— 那时 `result` 还是 `null`。
  这是新手非常容易犯的错，本质是对"异步"理解不到位。
- **为什么限制 2MB？** 因为 base64 编码会让体积膨胀约 **1/3**，而 localStorage 只有 **约 5MB** 上限，
  存一张大图就可能抛 `QuotaExceededError`。抽屉里那句提示"建议图片大小不要超过 2MB"就是这么来的。
- **优点**：不需要后端、不需要 CORS、离线可用。
  **缺点**：字符串巨大、占本地空间、无法被 CDN 缓存。生产环境更推荐传到 OSS/后端拿返回的 URL。

### 10.4 完整链路复盘：点一下"黑夜"发生了什么

这条链路把前面所有知识串起来了，请务必理解：

```
用户在抽屉里点「黑夜」
   └─► el-radio-group 的 v-model 变成 'dark'（themeMode 变化）
        └─► watch(themeMode) 触发 → emit('update:theme', 'dark')      ← 子传父
             └─► 父组件 @update:theme → handleThemeUpdate('dark')
                  ├─ themeMode.value = 'dark'          （App 自己的状态更新）
                  ├─ localStorage.setItem('themeMode','dark')   （持久化）
                  └─ applyTheme('dark') → <html> 加 class="dark" （操作 DOM）
                       └─► CSS 变量层生效：
                           --el-*   被 dark/css-vars.css 覆盖
                           --glass-* 被 App.vue 的 html.dark 规则覆盖
                             └─► 所有 var(...) 的地方自动变色 → 界面变暗 ✅
```

**一句话总结**：用户操作 → 子组件 emit → 父组件改状态 → 状态驱动 UI + 副作用（存本地、改 DOM 类名）→ CSS 变量自动生效。
这就是 Vue「单向数据流 + 数据驱动视图」的完整闭环。

---

## 11. 逐文件精读

前面按知识点讲，这一章按**文件**再串一遍，方便你对着代码看。

### 11.1 `index.html`（唯一的 HTML 文件）

```html
<body>
  <div id="app"></div>                                     <!-- 挂载点 -->
  <script type="module" src="/src/main.js"></script>       <!-- 入口脚本 -->
</body>
```

- Vue 应用需要一个"挂载点"，`main.js` 里的 `app.mount('#app')` 就是找这个 div。
- `<script type="module">` 让浏览器以 ES Module 方式加载，Vite 在开发时拦截并即时编译。
- 可改进点：`<html lang="en">` 应该改成 `lang="zh-CN"`，`<title>` 也可以改得更业务化。

### 11.2 `main.js`：应用启动的 5 步（顺序不能乱）

```js
const app = createApp(App)                              // ① 创建应用实例
axios.defaults.baseURL = '/api'                         // ② 全局配置 axios
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)                         // ③ 全局注册图标
}
app.use(ElementPlus)                                    // ④ 安装插件
app.mount('#app')                                       // ⑤ 挂载（必须最后！）
```

> 记住：**`mount` 一定要放最后**。在挂载之前完成"注册组件、安装插件、设置全局配置"，
> 否则会出现"组件找不到 / 样式没生效"之类的怪问题。

### 11.3 `vite.config.js`：三个关键配置

```js
export default defineConfig({
  plugins: [vue()],          // ① 让 Vite 认识 .vue 文件
  base: './',                // ② 打包产物用相对路径引用资源
  server: { port: 5173, proxy: { '/api': { target: 'http://localhost:8080', changeOrigin: true } } }
})
```

- **`base: './'`**（默认是 `'/'`）：打包后 `dist/index.html` 里的资源路径会变成 `./assets/xxx.js`。
  好处是**可以直接把 dist 丢到任意子目录**（如 `http://xxx.com/care-center/`）都能跑，本地双击打开也不白屏。
  代价：将来如果引入 `vue-router` 的 history 模式，需要把这个配置和路由 base 一起考虑。
- **`changeOrigin: true`**：修改转发请求头里的 `Host`，避免后端因 Host 不匹配而拒绝（虚拟主机场景必需）。

### 11.4 `App.vue`：壳组件

| 区域 | 代码 | 说明 |
| --- | --- | --- |
| 背景层 | `<div class="bg-layer" v-if="globalBgUrl" :style="...">` | 全屏 fixed 背景图，透明度可控 |
| 顶部栏 | `<el-menu mode="horizontal" :default-active="activeMenu" @select="handleMenuSelect">` | 横向导航，`default-active` 控制高亮项 |
| 右侧按钮 | `<el-button circle icon="Setting" :class="{ 'rotate-anim': settingsVisible }">` | 齿轮按钮，打开设置抽屉 |
| 内容区 | `<component :is="..." :key="activeMenu">` | 动态组件切换页面（带过渡动画） |
| 抽屉 | `<SettingsDrawer v-model="settingsVisible" ... />` | 外观设置 |

**有意思的小细节**：`@click="settingsVisible = true"` —— 模板里可以直接给 `ref` 赋值，
因为 Vue 在模板中会**自动解包** ref，所以不用写 `.value = true`。这是新手常困惑的点。

**状态清单（一共 5 个）**：`activeMenu`、`settingsVisible`、`themeMode`、`globalBgUrl`、`globalBgOpacity`。
其中后三个是"全局外观状态"，会被持久化到 localStorage。

> 注意 `const activeMenu = ref('2')` 的初始值是 `'2'`，所以**打开页面默认停在「床位管理」**。
> 菜单项的顺序却是「床位示意图(1)」在前。如果希望默认看示意图，把初始值改成 `'1'` 即可。

### 11.5 `views/BedMap.vue`：只读的床位示意图

**它能工作的前提是后端返回这样的数据结构**（根据代码反推）：

```js
// GET /bed/statistics → res.data.data
stats = { total: 12, free: 5, occupied: 6, out: 1 }

// GET /bed/map?floor=1 → res.data.data
roomList = [
  {
    roomNo: '101',
    beds: [
      { id: 11, bedNo: '1', bedStatus: 1 },   // 1 = 空闲
      { id: 12, bedNo: '2', bedStatus: 2 },   // 2 = 有人
      { id: 13, bedNo: '3', bedStatus: 3 }    // 3 = 外出
    ]
  },
  { roomNo: '102', beds: [ /* ... */ ] }
]
```

**值得学习的一个技巧**：用「对象字面量 + 兜底」代替 `if/switch`：

```js
const getBedStatusClass = (status) => {
  return { 1: 'status-free', 2: 'status-occupied', 3: 'status-out' }[status] || 'status-free'
}
const getBedStatusText = (status) => {
  return { 1: '空闲', 2: '有人', 3: '外出' }[status] || '未知'
}
```

这叫**查表法（lookup table）**，比一串 `if / else if` 简洁得多，新增状态只要加一行。
但要注意：状态码 `1/2/3` 是**魔法数字**，更好的做法是抽成常量：

```js
const BED_STATUS = { FREE: 1, OCCUPIED: 2, OUT: 3 }
const BED_STATUS_TEXT = { [BED_STATUS.FREE]: '空闲', [BED_STATUS.OCCUPIED]: '有人', [BED_STATUS.OUT]: '外出' }
```

**为什么这里用 `<div>` 网格而不是 `el-table`？**
因为示意图要的是"自由排列 + 颜色块 + hover 放大的交互感"，而 `el-table` 是"数据表格"语义。
**选哪种组件要看交互意图，不是看有没有数据。**

**一个隐式依赖要注意**：`<el-select v-model="currentFloor" @change="fetchBedMap">`，
`@change` 触发时 `v-model` **已经**先把 `currentFloor` 更新了，所以 `fetchBedMap` 里读到的是新楼层。
这个顺序是 Vue 保证的，能跑；但"事件处理器隐式依赖另一个状态的更新时机"是容易埋坑的写法。
更显式的写法是：`@change="(val) => fetchBedMap(val)"`，把新值当参数传进去。

**两个请求其实是"并发"的**：`onMounted` 里连着调用 `fetchStatistics()` 和 `fetchBedMap()`，
两个都没 `await`，所以它们同时发出、互不等待。这在小页面上是好事（更快）；
但如果第二个请求依赖第一个的结果，就必须 `await` 串行。

### 11.6 `views/BedManage.vue`：交互最复杂的页面

**三段式 UI**：搜索表单 → 状态 Tabs → 表格；外加两个 `el-dialog`（修改结束时间、床位调换）。

**状态清单（10 个）**：

| 变量 | 类型 | 作用 |
| --- | --- | --- |
| `activeStatus` | `ref('1')` | 当前 Tab：`'1'` 正在使用 / `'0'` 使用历史，**直接当接口参数用** |
| `queryParams` | `reactive` | 搜索条件 `{ customerName, startDate }` |
| `tableData` | `ref([])` | 表格数据 |
| `loading` | `ref(false)` | 表格 loading |
| `editDialogVisible` + `editForm` | ref + reactive | 修改结束时间弹窗 |
| `swapDialogVisible` + `swapForm` | ref + reactive | 床位调换弹窗 |
| `roomOptions` | `ref([])` | 选中楼层下的房间列表（调换用） |
| `freeBedOptions` | `ref([])` | 选中房间下的空闲床位 |

**注意这个设计小技巧**：`activeStatus` 的值 `'1' / '0'` **直接就是接口要的 `status` 参数**，
所以 `fetchDetails` 里可以偷懒写成 `const params = { status: activeStatus.value }`，
不需要写 `activeStatus === 'using' ? 1 : 0` 这样的映射。**"让前端状态的值和接口参数保持一致"能省掉一堆转换代码。**

**核心亮点：楼层 → 房间 → 空闲床位的「三级联动」**

```js
// 第一级：选楼层 → 请求房间列表
const handleFloorChange = async (floor) => {
  swapForm.newRoomNo = ''      // ① 一定要清空下游选择！
  swapForm.newBedId = null
  freeBedOptions.value = []
  const res = await axios.get(`/bed/map?floor=${floor}`)
  if (res.data.code === 200) roomOptions.value = res.data.data
}

// 第二级 + 第三级：选房间 → 从已拿到的数据里筛出空闲床位（不用再发请求）
const fetchFreeBeds = (roomNo) => {
  const room = roomOptions.value.find(r => r.roomNo === roomNo)              // find：找第一个匹配项
  if (room) freeBedOptions.value = room.beds.filter(b => b.bedStatus === 1)  // filter：筛出空闲
}
```

这里有三个重要的工程思想：

1. **级联选择必须清空下游**。否则用户先选了"一层 101 房"，再切到二层，`newRoomNo` 还留着 `'101'`，
   提交时就会把人"调换"到一个不存在的房间。**这是级联表单最容易出的 bug。**
2. **能用前端过滤就别再发请求**。房间数据在选楼层时已经全拿到了，选房间只是"从数组里挑子集"，
   `find` + `filter` 足够。少一次网络请求 = 更快、更省。
3. **数据要"一次拿全，本地筛选"**，前提是数据量小；如果房间有几千个，就该改成"选一层请求一次"的分页/懒加载策略。

**其他值得注意的点**：

- **提交前先校验**：`if (!swapForm.newBedId) return ElMessage.warning('请选择新床位')`。
  一行完成"校验 + 提示 + 中断"（`ElMessage.warning()` 的返回值被 `return` 掉了，不影响逻辑）。
- **操作列的显隐**：`<el-table-column label="操作" v-if="activeStatus === '1'">`。
  历史记录本来就不能改，所以只在"正在使用"时渲染这一列，**比渲染出来再置灰更干净**。
- **列表复用**：两个 Tab 用的是**同一个** `fetchDetails`，只有 `status` 参数不同；
  而且 `fetchDetails` 里只在有值时才把搜索条件塞进 `params`——**空条件不传参**，后端就按"无过滤"处理。
- **弹窗打开时预置数据**：`openEditDialog` 把 `row.id` / `row.endDate` 拷进 `editForm`。
  ⚠️ 这是**浅拷贝**（基本类型没问题）。如果将来要改的是**对象/数组字段**，
  必须用 `structuredClone(obj)` 或 `JSON.parse(JSON.stringify(obj))` 做**深拷贝**，
  否则会直接改到表格里的数据（表格和弹窗同时变，用户点"取消"也回不去了）。
- **提交后刷新**：`submitEdit` / `submitSwap` 成功后都调用 `fetchDetails()` 重新拉列表。
  这叫"**以服务端数据为准**"，比手动去改 `tableData` 里那一行更可靠（后端可能有计算字段、关联更新）。
- **`handleTabChange` 不看参数**：它忽略了 el-tabs 传进来的 `tab` 对象，直接用 `activeStatus` 的当前值，
  因为 `v-model` 已经更新过了。能用，但和 11.5 那个坑是同一类问题。

### 11.7 `components/SettingsDrawer.vue`

三段设置：主题单选 → 壁纸（输入 URL / 本地上传 / 清除）→ 透明度滑块。

- **`v-if="bgUrl"` 控制透明度滑块的显隐**：没有壁纸时"调透明度"毫无意义，藏起来更合理。
  这类"**根据状态决定功能是否可见**"的细节，正是区分"能跑"和"好用"的地方。
- **输入框的两个事件**：`@keyup.enter="saveBgUrl"`（按回车才生效，避免边打字边改壁纸）、
  `@clear="clearBgUrl"`（点小叉清空输入时同步清除壁纸），配合 `clearable` 使用。
- **`el-slider` 的取值范围**：`:min="0" :max="1" :step="0.05"` → 每次拖 5%，共 21 档；
  显示时用 `Math.round(bgOpacity * 100)` 转成百分比整数（`0.35` → `35%`），
  **避免出现 `34.999999%` 这种浮点数误差**——这是处理小数时必学的技巧。
- **重复代码**：4 个 `watch` 的"父 → 子、子 → 父"镜像模式，可以用第 6 章讲的**可写 `computed`** 简化。
- **动画**：`.hover-shake:hover { animation: shake 0.4s }`，鼠标移上去"摇头"表示"警告，这是删除操作"。
  用动画表达操作的危险程度，是很好的交互习惯。

### 11.8 数据结构总览（自己画一遍就懂整体了）

```
床位（bed）         { id, bedNo, bedStatus: 1空闲 | 2有人 | 3外出 }
房间（room）        { roomNo, beds: bed[] }
住户明细（detail）  { id, customerId, customerName, customerSex: 0男 | 1女,
                      bedDetails, startDate, endDate }
床位统计（stats）   { total, free, occupied, out }
后端统一响应        { code: 200, msg, data }
```

> ⚠️ **有一个字段语义需要你亲自跟后端确认**：`BedManage.vue` 里写的是
> `{{ scope.row.customerSex === 0 ? '男' : '女' }}`，也就是"**0 是男，其它都算女**"。
> 如果后端实际是 `1=男 / 2=女`，这个判断就全反了。**遇到这种"隐式约定"，一定要去看接口文档或数据库字典，
> 别猜。** 更健壮的写法是查表 + 兜底：
> ```js
> const SEX_TEXT = { 0: '男', 1: '女' }
> {{ SEX_TEXT[scope.row.customerSex] ?? '未知' }}
> ```

---

## 12. 代码走查：我发现的坑与改进建议

下面是我通读代码后整理的"体检报告"。**这些不是让你立刻全改**，
而是让你知道"代码能跑"和"代码健壮"之间的距离——这才是真正的成长点。

| # | 位置 | 问题 | 影响 | 建议 |
| --- | --- | --- | --- | --- |
| 1 | `App.vue` 顶层 | `matchMedia(...).addEventListener('change', ...)` 写在 `<script setup>` 顶层，**从未移除** | 组件反复创建时监听器累积，内存泄漏 | 把它挪进 `onMounted`，并在 `onUnmounted` 里 `removeEventListener` |
| 2 | `App.vue` | `parseFloat(...) \|\| 0.8` 会把合法的 `0` 当成"没设置" | 透明度调到 0，刷新后变回 0.8 | 把兜底作用在 `getItem` 的原始结果上（`Number(getItem(...) ?? 0.8)`），详见 10.2 节 |
| 3 | `BedMap.vue` / `BedManage.vue` | `catch (error) { console.error(error) }`，只打日志不提示 | 用户看不到"请求失败"，以为系统卡了 | `ElMessage.error('加载失败，请稍后重试')`，并考虑给"重试"按钮 |
| 4 | 各页面 | 请求错误处理**风格不统一**（有的吞掉、有的提示 `msg`） | 体验不一致，不好维护 | 抽一个 `src/api/request.js`，用 axios 拦截器统一处理 |
| 5 | 全局 | axios 没有封装、没有拦截器、没有超时设置 | 每个页面重复写 `try/catch`、`code === 200` 判断 | 做一层 `request.js`：统一 baseURL、超时、`code` 判断、错误提示 |
| 6 | `BedMap.vue` `BedManage.vue` | 楼层下拉框的选项「一层/二层」**硬编码**在两处 | 改成三层楼要改两个文件；且后端如果返回楼层列表也得改前端 | 抽成常量或从接口获取楼层列表 |
| 7 | 全局 | 状态码 `1/2/3`（bedStatus）、`0/1`（customerSex）、`'1'/'0'`（status）都是**魔法数字** | 读代码要猜含义，容易写错 | 抽 `src/constants/bed.js` 统一建常量表 |
| 8 | `src/style.css` | 一整个 Vite 模板遗留文件（含 `#app { width: 1126px }` 等）**没有被任何文件引入** | 死代码，误导后来人（以为它在生效） | 直接删掉，或至少加一句注释说明 |
| 9 | `src/components/HelloWorld.vue`、`src/assets/*.svg/png` | 模板 demo，未被使用 | 打包时会因为"没被引用"而不进产物，但仓库变脏 | 删除 |
| 10 | `index.html` | `<html lang="en">` | 无障碍/SEO 不规范（拼音/中文页面被标为英文） | 改成 `lang="zh-CN"` |
| 11 | `SettingsDrawer.vue` | 4 个 `watch` 的镜像同步写法冗长 | 可读性差，容易漏同步 | 用可写 `computed` 或具名 `v-model` |
| 12 | `SettingsDrawer.vue` | `el-radio-button label="light"` | Element Plus 2.6+ 已把 `label` 作为"值"的用法**标记为废弃**，新版本要求用 `value` | 改成 `<el-radio-button value="light">白天</el-radio-button>` |
| 13 | `BedMap.vue` | `.bed-box` 有 `cursor: pointer` 和 `:hover` 放大，但**没有点击事件** | 用户以为能点，点了没反应，产生"功能坏了吗"的困惑 | 要么加点击查看详情，要么把 `cursor` 改成默认 |
| 14 | `BedManage.vue` | `openEditDialog` 把 `row.endDate` 原样放进 `date-picker` | 如果后端返回的是 ISO 字符串，DatePicker 能识别；但若格式不标准会显示空白 | 统一用 dayjs/Date 处理日期 |
| 15 | `BedManage.vue` | 日期显示用 `str.split('T')[0]` 手写截取 | 格式依赖后端，无法格式化/国际化 | 引入 `dayjs`（Element Plus 内部就依赖它），或在可控时用原生 `Intl.DateTimeFormat` |
| 16 | 全局 | 没有路由（vue-router），靠 `activeMenu` 字符串手动切换 | 无法刷新保持页面、无法分享链接、无浏览器前进后退 | 页面变多时引入 `vue-router`，并给每个页面配 URL |
| 17 | 全局 | 没有状态管理（Pinia），主题/壁纸状态挤在 `App.vue` 里 | 组件层级变深后，props/emit 会变得很长 | 引入 `pinia`，把主题、用户信息放 store |
| 18 | `vite.config.js` | 代理没有配 `rewrite` | 后端接口若不含 `/api` 前缀会 404 | 与后端约定好前缀；或加 `rewrite` 去掉 `/api` |
| 19 | 全局 | 没有 TypeScript、没有 ESLint/Prettier 配置 | 拼错变量名、格式混乱只能靠肉眼 | 新建项目时勾选 ESLint + Prettier；大项目再考虑 TS |
| 20 | `BedManage.vue` | 列表没有分页（`el-pagination`） | 数据量大了会一次性渲染很多行，卡顿 | 后端加分页参数，前端加 `el-pagination` |

### 12.1 挑两个最值得动手的改进（示范代码）

**① 把 `matchMedia` 监听从"顶层裸写"改成规范的生命周期管理**

```js
// App.vue
import { onMounted, onUnmounted } from 'vue'

let mediaQuery = null                        // 提到外面，方便卸载时引用
const handleSystemThemeChange = (e) => {     // 具名函数！匿名函数没法 removeEventListener
  if (themeMode.value !== 'system') return
  document.documentElement.classList.toggle('dark', e.matches)
}

onMounted(() => {
  applyTheme(themeMode.value)
  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', handleSystemThemeChange)   // 挂载时注册
})

onUnmounted(() => {
  mediaQuery?.removeEventListener('change', handleSystemThemeChange)  // 卸载时移除
})
```

两个知识点：
- **`addEventListener` 和 `removeEventListener` 必须传同一个函数引用**，
  所以事件处理函数要有名字（写成 `const xxx = () => {}`），不能用匿名箭头函数。
- **`classList.toggle(cls, force)`** 的第二个参数：为 `true` 时添加、为 `false` 时移除，
  一行代替 if/else —— 这个 API 你可能第一次见。

**② 统一 axios 请求：新建 `src/api/request.js`**

```js
import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000                   // 超时时间，避免请求一直挂着
})

// 响应拦截器：所有请求的统一出口
request.interceptors.response.use(
  (response) => {
    const { code, data, msg } = response.data
    if (code === 200) return data          // 直接把 data 给业务层，省掉 res.data.data
    ElMessage.error(msg || '业务处理失败')
    return Promise.reject(new Error(msg || 'Error'))
  },
  (error) => {                             // HTTP 层错误（404/500/超时/断网）
    ElMessage.error(error.response?.status === 404 ? '接口不存在' : '网络异常，请稍后重试')
    return Promise.reject(error)
  }
)

export default request
```

改造后页面里的代码会变得更短、更一致：

```js
// 改造前
const res = await axios.get('/bed/map', { params: { floor: 1 } })
if (res.data.code === 200) roomList.value = res.data.data

// 改造后
roomList.value = await request.get('/bed/map', { params: { floor: 1 } })
```

**这就是"拦截器"的价值：把每个页面都要写的重复逻辑，收敛到一个地方。**
（这也是面试高频考点：「axios 拦截器用过吗？用来做什么？」）

---

## 13. 新手学习路线与练习任务

### 13.1 四周补基础路线（本项目的知识点都在这四块里）

| 周次 | 主题 | 必须掌握的内容 |
| --- | --- | --- |
| 第 1 周 | **JavaScript (ES6+)** | `let/const`、箭头函数、模板字符串、解构、展开运算符、`map/filter/find/reduce`、`Promise` 与 `async/await`、`import/export` 模块化、`?.` 与 `??` |
| 第 2 周 | **Vue 3 基础** | `ref/reactive`、模板指令、`props/emit`、`v-model` 原理、生命周期、`watch/computed`、组件拆分思想 |
| 第 3 周 | **前端工程化** | `package.json`、npm 脚本、Vite（dev/build/proxy/base）、目录规范、Git 常用命令、浏览器调试（Console/Network/Application） |
| 第 4 周 | **进阶能力** | `vue-router`（路由）、`pinia`（状态管理）、axios 拦截器封装、组件库二次封装、性能优化（懒加载、分包） |

读官方文档的正确姿势：**先看「教程」和「API 参考」，暂时跳过「深入/原理」章节**。
本项目用到的 API 不超过 Vue 全部 API 的 15%，你先把这 15% 用熟，比囫囵吞枣强得多。

### 13.2 练习任务（从易到难，全部基于本项目改，做完就是你的作品）

**★☆☆ 入门级（各 5 分钟）**

1. **改默认页**：让打开时默认显示「床位示意图」而不是「床位管理」。（提示：`activeMenu` 初始值）
2. **加一个菜单项**：在顶部导航加「关于系统」，点它显示一个写死的静态页面。（练 `activeMenu` + 动态组件）
3. **换颜色**：把「外出」的橙色改成紫色，看看要改几个文件。（体会"硬编码颜色的代价"）
4. **清死代码**：删掉 `src/style.css`、`src/components/HelloWorld.vue` 和 `src/assets/` 里没用的图片，
   然后跑 `npm run build` 确认没有任何报错。**（这一步做完你会更有"这是我的项目"的感觉）**

**★★☆ 进阶级（各 30 分钟）**

5. **修 bug**：按第 12 章第 2 条，修掉 `bgOpacity` 的 `||` 陷阱，实测"透明度调到 0 → 刷新 → 还是 0"。
6. **消警告**：按第 12 章第 12 条，把 `el-radio-button` 的 `label` 改成 `value`，观察控制台警告消失。
7. **统一错误提示**：给 `BedMap.vue` / `BedManage.vue` 的所有 `catch` 加上 `ElMessage.error(...)`。
8. **加交互**：点击床位小方块，弹出一个 `el-dialog` 显示「房间号 + 床位号 + 状态」。
   （提示：给 `.bed-box` 加 `@click="handleBedClick(room, bed)"`，新增一个 `ref` 控制弹窗）
9. **加空状态**：`BedMap.vue` 已经有 `el-empty` 了，仿照它给 `BedManage.vue` 也加一个"没有数据"的提示。

**★★★ 挑战级（各 1~2 小时）**

10. **抽 axios 拦截器**：按第 12.1 节 ② 新建 `src/api/request.js`，把所有 `axios.get/post/put` 替换掉，
    并给每个业务接口写一个函数（如 `src/api/bed.js` 里的 `getBedMap(floor)`），让页面只调业务函数、不关心 URL。
11. **抽常量文件**：新建 `src/constants/bed.js`，把 `bedStatus`、`customerSex`、楼层选项、状态文案全部抽出来，
    替换所有"魔法数字"。这是**重构第一课**。
12. **修内存泄漏**：按第 12.1 节 ① 把 `matchMedia` 监听改成 `onMounted` 注册 / `onUnmounted` 移除。
13. **加路由**：安装 `vue-router`，把两个页面变成 `/bed-map` 和 `/bed-manage` 两个真实路由，
    要求刷新后停在当前页、能用浏览器前进/后退、能直接分享链接。
    （这个任务会逼你理解「SPA 为什么需要路由」）
14. **加状态管理**：安装 `pinia`，把 `themeMode / globalBgUrl / globalBgOpacity` 搬进 `useSettingsStore`，
    复习「为什么全局状态不该塞在 `App.vue` 里」。
15. **加分页**：给表格加 `el-pagination`（和后续的 mock 数据一起练），条件是数据超过一屏时才显示。

### 13.3 遇到报错时的「三步法」

```
1. 读报错 → 打开 F12 Console，看红色报错的第一行（最关键），并看它指向的文件行号
2. 定位   → 只关注 src/ 下的文件（node_modules 里的报错先忽略，那是别人库的问题）
3. 排查   → 常见三板斧：
           · 变量是不是 undefined / null？（打印一下：console.log(x)）
           · ref 忘了 .value？（"xxx is not a function / of undefined" 常见元凶）
           · 数据格式和预期不符？（Network 面板看接口真实返回的 Response）
```

**先花 5 分钟自己看，再去搜索/提问。** 提问时给出三样东西：**报错全文 + 相关代码 + 你已经试过什么**，
这样别人（或 AI）才能给你准确答案——这是将来工作中最重要的沟通能力。

### 13.4 调试工具速查

| 工具 | 位置 | 用来干什么 |
| --- | --- | --- |
| Console | F12 → Console | 看 JS 报错、`console.log` 输出 |
| Network | F12 → Network | 看请求 URL / 参数 / 响应（**联调排 404 的第一站**） |
| Application | F12 → Application → Local Storage | 看主题、壁纸是否真的存进去了 |
| 元素检查器 | F12 → Elements | 看生效的 CSS 规则、临时改样式试效果 |
| Vue Devtools | 浏览器插件 | 看组件树、props、响应式数据（比瞎猜快十倍） |
| 断点调试 | F12 → Sources → 点行号 | 一步步执行，看变量怎么变的 |

---

## 14. 名词速查表

看不懂术语时回来查这一张表。

### 14.1 框架与工程化

| 名词 | 一句话解释 |
| --- | --- |
| **Vue** | 渐进式前端框架，核心思想是"数据驱动视图"：你只管改数据，DOM 让 Vue 去更新 |
| **SFC 单文件组件** | `.vue` 文件，把 `template / script / style` 三块写在一个文件里 |
| **组合式 API** | Vue 3 的新写法，用 `ref/watch/onMounted` 等函数组织逻辑（对应老的"选项式 API"） |
| **`<script setup>`** | 组合式 API 的语法糖，顶层变量自动暴露给模板，不用 `return` |
| **响应式（Reactive）** | 数据变化能自动触发视图更新，底层是 `Proxy` |
| **Vite** | 基于 ESBuild/Rollup 的构建工具，开发时秒起、支持 HMR，是 Vue 官方脚手架默认选择 |
| **HMR** | 热模块替换：改代码后浏览器局部更新，不丢状态 |
| **npm** | 包管理器，`npm install` 装依赖、`npm run dev` 跑脚本 |
| **`package.json`** | 项目清单：名字、版本、依赖、可执行脚本 |
| **`node_modules`** | 依赖包存放目录，由 `npm install` 生成，一般不提交到 Git |
| **tree-shaking** | 打包时把"没被用到的代码"删掉，减小体积 |
| **同源策略** | 浏览器安全机制：协议 + 域名 + 端口 任一不同就算跨域，请求会被拦 |
| **代理（proxy）** | 开发时让 dev server 帮你去请求后端，绕过跨域 |
| **SPA 单页应用** | 全程只有一个 HTML，页面切换靠 JS 换组件 |
| **`base: './'`** | 打包后资源用相对路径引用，方便部署到任意子目录 |

### 14.2 Vue 语法

| 名词 | 一句话解释 |
| --- | --- |
| **`ref`** | 包装任意值的响应式"盒子"，JS 里用 `.value` 读写，模板里自动解包 |
| **`reactive`** | 把对象/数组变成响应式，直接改属性 |
| **`computed`** | 由已有数据算出的新值，有缓存（本项目未使用，但要会） |
| **`watch`** | 侦听某个数据，变化时执行副作用（如改 DOM、存 localStorage） |
| **`onMounted`** | 生命周期钩子：组件挂载完成后执行（常用来发请求） |
| **`onUnmounted`** | 生命周期钩子：组件卸载前执行（用来清理定时器/监听器） |
| **`props`** | 父组件传给子组件的数据，**只读**（单向数据流） |
| **`emit`** | 子组件向父组件"发射"自定义事件 |
| **`v-model`** | 双向绑定的语法糖，在组件上等价于 `:modelValue` + `@update:modelValue` |
| **动态组件 `<component :is>`** | 由变量决定当前渲染哪个组件 |
| **`<Transition>`** | 内置过渡组件，配合 `*-enter-from / *-leave-to` 等类名做动画 |
| **插槽（slot）** | 把"一块可替换的内容"交给父组件填，如 `#default="scope"`、`#footer` |
| **自定义指令** | 以 `v-` 开头的扩展，如 `v-loading` |
| **修饰符** | 事件/指令的后缀，如 `@keyup.enter`、`@click.stop` |

### 14.3 CSS 与浏览器 API

| 名词 | 一句话解释 |
| --- | --- |
| **scoped** | 让组件样式只作用于自己模板内的元素（编译时加 `data-v-xxx` 属性） |
| **`:deep()`** | 穿透 scoped，修改子组件（如 Element Plus）内部元素的样式 |
| **CSS 变量（自定义属性）** | `--name: value`，用 `var(--name)` 引用，可被后续规则覆盖 → 主题切换的基础 |
| **`:root`** | 等价于 `<html>` 选择器，所有元素的祖先 |
| **毛玻璃（backdrop-filter）** | 模糊"元素背后的内容"，配合半透明背景产生磨砂玻璃效果 |
| **Flexbox** | 一维布局方案，主轴/交叉轴 + `justify-content` / `align-items` |
| **`transform`** | 位移/旋转/缩放，GPU 加速、不触发重排，适合做动画 |
| **`transition`** | 属性变化时的平滑过渡 |
| **`@keyframes` + `animation`** | 关键帧动画 |
| **伪类 `:hover/:active/:focus-visible`** | 描述元素的交互状态 |
| **`z-index`** | 层叠顺序，越大越靠上（需配合定位或 flex/grid 子项） |
| **`localStorage`** | 浏览器本地永久存储（约 5MB，只能存字符串） |
| **`sessionStorage`** | 浏览器本地临时存储（关标签页即清空） |
| **`FileReader`** | 浏览器 API，把文件读成 `dataURL`（base64）或文本 |
| **`matchMedia`** | 查询媒体条件（如系统是否深色模式），`.matches` 是布尔值 |
| **`classList`** | 操作元素 class 的 API：`add / remove / toggle / contains` |
| **`documentElement`** | 就是 `<html>` 元素（`document.body` 是 `<body>`） |
| **`prefers-color-scheme`** | 媒体查询/媒体特性，表示用户系统的配色偏好（light / dark） |

### 14.4 请求与数据

| 名词 | 一句话解释 |
| --- | --- |
| **axios** | 基于 Promise 的 HTTP 客户端 |
| **`baseURL`** | 所有请求的公共前缀 |
| **`params`** | GET 的查询参数对象，axios 自动拼成 `?a=1&b=2` 并做 URL 编码 |
| **`async / await`** | 用同步写法写异步代码 |
| **`try / catch / finally`** | `finally` 无论成败都执行，最适合关 loading |
| **`res.data`** | axios 对象里的"后端返回的 JSON body"（`res` 本身是 axios 包装） |
| **拦截器（interceptor）** | 统一处理所有请求/响应的钩子，常用于加 token、统一错误提示 |
| **RESTful** | 用 HTTP 方法表达操作：GET 查 / POST 增 / PUT 改 / DELETE 删 |
| **`code: 200`** | 本项目后端业务码；**HTTP 200 不代表业务成功** |
| **可选链 `?.`** | 安全取深层属性，中途为 `null/undefined` 就返回 `undefined`，不报错 |
| **空值合并 `??`** | 只在左侧为 `null/undefined` 时取右侧（比 `\|\|` 更精确） |

---

## 附录 A：常用命令速查

```bash
# ---------- npm ----------
npm install                  # 安装 package.json 里的所有依赖
npm install dayjs            # 新增一个依赖
npm install -D eslint        # 新增一个"开发依赖"
npm run dev                  # 启动开发服务器（本项目默认 5173 端口）
npm run build                # 打包到 dist/
npm run preview              # 本地预览打包结果
npm run lint                 # 如果配置了 ESLint，用来检查代码

# ---------- Git（最基本的四步） ----------
git status                   # 看当前改了哪些文件
git add .                    # 把改动加入暂存区
git commit -m "feat: 新增床位点击详情弹窗"    # 提交（建议用 feat/fix/docs 前缀）
git push                     # 推送到远端

git log --oneline -10        # 看最近 10 条提交
git diff                     # 看还没 add 的具体改动
git checkout -- <文件>        # 丢弃某个文件的改动（危险操作）
```

## 附录 B：这份笔记的用法建议

1. **第一次读**：从第 1 章顺着读一遍，每读到一处代码就打开对应文件看一眼，**不要只读不点**。
2. **第二次读**：只挑第 5、6、9、10 章（Vue 语法 / 组件通信 / 样式 / 主题），边读边在代码里"复现"。
3. **动手时读**：遇到不会写的功能，回第 7 章（Element Plus）查组件用法，第 8 章查请求写法。
4. **重构时读**：第 12 章是"改进清单"，第 13 章是"练习清单"，从 ★☆☆ 开始一个个做掉。

> 🎓 **导师的最后一句叮嘱**：
> 用 AI 生成代码不是问题，**问题是不理解就交付**。
> 这份笔记里的每一个知识点，都是从这个项目真实代码里长出来的——
> 你把它们一个个搞懂，这个项目就真正变成"你写的"了。
> 每次改完代码，都问自己三个问题：
> **① 这行代码为什么必须在这儿？② 如果删掉会发生什么？③ 换个写法行不行？**
> 能回答这三个问题，你就从"抄代码的人"变成"写代码的人"了。

---

<sub>📖 本文档基于 `care-center-ui` 仓库当前代码（`src/`、`vite.config.js`、`package.json`、`index.html`）逐文件通读整理。
代码若有更新，请同步更新本文档对应章节。</sub>


