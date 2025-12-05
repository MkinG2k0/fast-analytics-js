import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App as AntdApp, ConfigProvider } from "antd";
import ruRU from "antd/locale/ru_RU";
import "./globals.css";
import AuthLayout from "./layout-auth";
import { QueryProvider, SessionProviderWrapper } from "./providers";

// Подавление предупреждения о совместимости antd v5 с React 19
if (typeof window !== "undefined") {
  // @ts-expect-error - подавление предупреждения о совместимости
  window.__ANTD_REACT_19_COMPATIBLE__ = true;
}

export const metadata: Metadata = {
  title: "Fast Analytics",
  description: "SaaS сервис для аналитики web-приложений",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <AntdRegistry>
          <ConfigProvider locale={ruRU}>
            <AntdApp>
              <QueryProvider>
                <SessionProviderWrapper>
                  <AuthLayout>{children}</AuthLayout>
                </SessionProviderWrapper>
              </QueryProvider>
            </AntdApp>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
