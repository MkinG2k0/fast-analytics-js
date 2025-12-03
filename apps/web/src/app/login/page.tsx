"use client";

import { LoginForm } from "@/features/auth/login";
import { Suspense } from "react";

function LoginFormWrapper() {
  return <LoginForm />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <LoginFormWrapper />
    </Suspense>
  );
}

