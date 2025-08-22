import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 启用独立输出模式，用于Docker部署
  output: 'standalone',
  
  // 服务器外部包配置
  serverExternalPackages: ['pdfjs-dist'],
  
  // 图片优化配置
  images: {
    // 允许的图片域名
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '10.81.117.115',
        port: '8501',
        pathname: '/mineru/**',
      },
    ],
  },
  
  // 环境变量配置
  env: {
    NEXT_PUBLIC_MINERU_API_URL: process.env.NEXT_PUBLIC_MINERU_API_URL || 'http://10.81.117.115:8501/mineru',
  },
};

export default nextConfig;
