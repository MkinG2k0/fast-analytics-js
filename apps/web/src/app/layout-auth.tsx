"use client";

import { Layout } from "antd";
import { Header } from "@/widgets/header";
import { Sidebar } from "@/widgets/sidebar";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const { Content } = Layout;

const PUBLIC_ROUTES = ["/login"];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || status === "loading") {
      return;
    }

    // Разрешаем доступ к API роутам NextAuth
    if (pathname.startsWith("/api/auth")) {
      return;
    }

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    if (!isPublicRoute && !session) {
      router.push("/login");
    } else if (isPublicRoute && session) {
      router.push("/projects");
    }
  }, [mounted, status, session, pathname, router]);

  if (!mounted || status === "loading") {
    return null;
  }

  if (PUBLIC_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

  if (!session) {
    return null;
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header />
      <Layout>
        <Sidebar />
        <Layout style={{ padding: "24px" }}>
          <Content>{children}</Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
