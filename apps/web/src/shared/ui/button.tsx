"use client";

import { Button as AntButton, ButtonProps as AntButtonProps } from "antd";
import { cn } from "@/shared/lib/utils";

export interface ButtonProps extends AntButtonProps {
  className?: string;
}

export function Button({ className, ...props }: ButtonProps) {
  return <AntButton className={cn(className)} {...props} />;
}

