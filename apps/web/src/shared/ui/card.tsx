"use client";

import { Card as AntCard, CardProps as AntCardProps } from "antd";
import { cn } from "@/shared/lib/utils";

export interface CardProps extends AntCardProps {
  className?: string;
}

export function Card({ className, ...props }: CardProps) {
  return <AntCard className={cn(className)} {...props} />;
}

