import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        allowedHosts: [
          'c.dev.91zuiai.com', // 允许特定域名
          'b.lpt.com',
          // 或者如果你想临时允许所有主机（不推荐，有安全风险）：
          // 'all'
        ],
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            // 后台接口代理目标地址（user-center 服务）
            // {{host}} = http://49.235.53.53:9001，rewrite 去掉 /api 前缀后拼出
            // http://49.235.53.53:9001/api/v1/user-center/...
            target: 'http://49.235.53.53:9001/api',
            ws: true,
          },
        },
      },
    },
  };
});
