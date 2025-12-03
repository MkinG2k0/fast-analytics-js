"use client";

import { ConfigProvider } from "antd";
import ruRU from "antd/locale/ru_RU";
import dayjs from "dayjs";
import "dayjs/locale/ru";

dayjs.locale("ru");

export function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider locale={ruRU}>
      {children}
    </ConfigProvider>
  );
}

