# React Admin Template

一个基于 React + Redux + React Router + Redux Toolkit + Sass + Ant Design + Axios 的现代化管理后台模板。

## 技术栈

- **React 18** - UI 框架
- **Redux Toolkit** - 状态管理
- **React Router v6** - 路由管理
- **Ant Design 5** - UI 组件库
- **Sass** - CSS 预处理器
- **Axios** - HTTP 客户端
- **Vite** - 构建工具

## 功能特性

- ✅ 用户登录/注册
- ✅ 路由守卫（受保护的路由）
- ✅ 后台管理布局
- ✅ 仪表盘页面
- ✅ 用户管理页面
- ✅ 系统设置页面
- ✅ 响应式设计
- ✅ 状态持久化（localStorage）

## 项目结构

```
react模板/
├── public/                 # 静态资源
├── src/
│   ├── components/         # 公共组件
│   │   └── ProtectedRoute.jsx
│   ├── pages/              # 页面组件
│   │   ├── Login/         # 登录页
│   │   ├── Register/      # 注册页
│   │   ├── Layout/        # 后台布局
│   │   ├── Dashboard/     # 仪表盘
│   │   ├── Users/         # 用户管理
│   │   └── Settings/      # 系统设置
│   ├── store/             # Redux store
│   │   ├── index.js
│   │   └── slices/
│   │       └── authSlice.js
│   ├── services/          # API 服务
│   │   └── api.js
│   ├── styles/            # 全局样式
│   │   └── index.scss
│   ├── App.jsx            # 根组件
│   └── main.jsx           # 入口文件
├── package.json
├── vite.config.js
└── README.md
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

应用将在 http://localhost:3000 启动

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist` 目录

### 预览生产构建

```bash
npm run preview
```

## 环境变量

创建 `.env` 文件配置 API 基础地址：

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

## 使用说明

### 登录/注册

- 登录页面：`/login`
- 注册页面：`/register`
- 默认用户名和密码：任意（当前为模拟登录，实际使用时需要连接真实API）

### 后台页面

- 仪表盘：`/dashboard` - 显示统计数据和最近用户列表
- 用户管理：`/users` - 用户列表管理
- 系统设置：`/settings` - 系统配置

### 状态管理

使用 Redux Toolkit 管理全局状态，当前包含：
- `auth` - 认证状态（token、用户信息等）

### API 配置

API 服务位于 `src/services/api.js`，当前为模拟实现。需要替换为真实的 API 调用：

```javascript
// 在 src/services/api.js 中修改
export const login = (credentials) => {
  return api.post('/auth/login', credentials)
}

export const register = (userData) => {
  return api.post('/auth/register', userData)
}
```

## 自定义开发

### 添加新页面

1. 在 `src/pages/` 创建新页面组件
2. 在 `src/App.jsx` 中添加路由
3. 在 `src/pages/Layout/index.jsx` 的菜单中添加导航项

### 添加新的 Redux Slice

1. 在 `src/store/slices/` 创建新的 slice
2. 在 `src/store/index.js` 中添加到 reducer

### 样式定制

- 全局样式：`src/styles/index.scss`
- 组件样式：各组件目录下的 `.scss` 文件
- Ant Design 主题：可以在 `src/main.jsx` 中通过 `ConfigProvider` 配置

## 注意事项

1. 当前登录/注册功能为模拟实现，需要连接真实后端 API
2. Token 存储在 localStorage 中，生产环境建议使用更安全的方式
3. API 拦截器会在 401 错误时自动跳转到登录页

## 许可证

MIT

