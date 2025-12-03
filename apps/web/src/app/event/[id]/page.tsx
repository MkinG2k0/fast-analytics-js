"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button, Spin, message } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { EventDetails } from "@/features/view-log-details";
import { getEvent } from "@/shared/api/events";
import type { Event } from "@repo/types";

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(false);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const data = await getEvent(eventId);
      setEvent(data);
    } catch (error) {
      message.error("Ошибка загрузки события");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!event) {
    return <div>Событие не найдено</div>;
  }

  return (
    <div className="p-6">
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => router.back()}
        className="mb-4"
      >
        Назад
      </Button>
      <EventDetails event={event} />
    </div>
  );
}

