"use client";

import { Button, Card, message } from "antd";
import { GoogleOutlined } from "@ant-design/icons";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const error = searchParams.get("error");

  useEffect(() => {
    if (error === "Callback") {
      message.error("Ошибка авторизации. Попробуйте еще раз.");
    }
  }, [error]);

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/projects");
      router.refresh();
    }
  }, [status, session, router]);

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/projects" });
  };

  return (
    <Card title="Вход в систему" className="max-w-md mx-auto mt-20">
      <div className="flex flex-col gap-4">
        <Button
          type="primary"
          icon={<GoogleOutlined />}
          size="large"
          block
          onClick={handleGoogleSignIn}
          loading={status === "loading"}
        >
          Войти через Google
        </Button>
        {error && (
          <div className="text-red-500 text-sm text-center">
            Произошла ошибка при авторизации. Проверьте настройки Google OAuth.
          </div>
        )}
      </div>
    </Card>
  );
}

