"use client";

import { Form, Input, Button, Card, message } from "antd";
import { UserOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";
import { register } from "@/shared/api/auth";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: {
    email: string;
    password: string;
    name?: string;
  }) => {
    try {
      setLoading(true);
      await register(values);
      message.success("Регистрация успешна");

      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        message.error("Ошибка входа после регистрации");
        router.push("/login");
        return;
      }

      if (result?.ok) {
        router.push("/projects");
        router.refresh();
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Регистрация" className="max-w-md mx-auto mt-20">
      <Form
        name="register"
        onFinish={onFinish}
        layout="vertical"
        size="large"
        autoComplete="off"
      >
        <Form.Item
          name="name"
          rules={[{ required: false }]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Имя (необязательно)"
            autoComplete="name"
          />
        </Form.Item>

        <Form.Item
          name="email"
          rules={[
            { required: true, message: "Введите email" },
            { type: "email", message: "Некорректный email" },
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="Email"
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: "Введите пароль" },
            { min: 6, message: "Пароль должен быть не менее 6 символов" },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Пароль"
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          dependencies={["password"]}
          rules={[
            { required: true, message: "Подтвердите пароль" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Пароли не совпадают"));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Подтвердите пароль"
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Зарегистрироваться
          </Button>
        </Form.Item>

        <div className="text-center">
          <a href="/login">Уже есть аккаунт? Войти</a>
        </div>
      </Form>
    </Card>
  );
}

