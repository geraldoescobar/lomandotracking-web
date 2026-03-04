declare module 'next-pwa' {
  import { NextConfig } from 'next';
  
  interface PWAOptions {
    dest: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    runtimeCaching?: any[];
  }
  
  function withPWA(config: PWAOptions): (nextConfig: NextConfig) => NextConfig;
  
  export default withPWA;
}
