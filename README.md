# 行测速算训练营

面向公务员、事业单位考试的本地速算练习工具。纯前端运行，答题记录保存在当前浏览器的 localStorage，不需要账号或业务服务器。

## 环境要求

- Node.js 20（推荐使用 nvm）
- npm

## 本地启动

```bash
nvm install 20
nvm use 20
npm install
npm run dev
```

浏览器打开终端显示的地址（通常是 http://localhost:5173）。

## 生产构建

```bash
npm run build
npm run preview
```

## 当前 MVP 功能

- 学习总览、速算技巧库
- 资料分析及数量关系示例题
- 参数化随机题：增长率、特征分数、截位直除、平均数
- 单题计时、自动判分、速算思路与完整解析
- 错题本、训练统计
- 本地记录、JSON 导入导出

## 数据说明

训练记录仅保存在浏览器本地。清理浏览器网站数据可能导致记录丢失，请在「设置与数据」中定期导出 JSON 备份。

## 技术栈

React、TypeScript、Vite、Lucide、CSS。
