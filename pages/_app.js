// pages/_app.js
import React from 'react';

// 这是 Next.js 应用程序的入口文件，用于初始化所有页面。
// 对于只有 API 的应用，其内容可以很简单。
function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;