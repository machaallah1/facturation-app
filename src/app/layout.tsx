// app/layout.tsx (Next.js 13+ avec app directory)

import { Inter } from 'next/font/google';
import { ConfigProvider } from 'antd';
import { antdTheme } from '@/styles/antd-theme';
import StyledComponentsRegistry from './lib/AntdRegistry';
import '../styles/globals.css';

// Chargement de la police Inter
const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <StyledComponentsRegistry>
          <ConfigProvider theme={antdTheme}>
            {children}
          </ConfigProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
