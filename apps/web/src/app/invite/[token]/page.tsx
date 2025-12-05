import { AcceptInvitationPage } from "@/page-components/invite";

export default AcceptInvitationPage;
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const token = params.token as string;
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInvitation = async () => {
    try {
      setLoading(true);
      setError(null);
      const { getInvitationByToken } = await import("@/shared/api/invitations");
      const data = await getInvitationByToken(token);
      setInvitation(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Ошибка загрузки приглашения";
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadInvitation();
    }
  }, [token]);

  const handleAccept = async () => {
    if (!session?.user?.id) {
      message.error("Необходимо войти в систему");
      router.push(`/login?callbackUrl=/invite/${token}`);
      return;
    }

    try {
      setAccepting(true);
      const { acceptInvitation } = await import("@/shared/api/invitations");
      await acceptInvitation(token);

      message.success("Приглашение принято! Вы добавлены в проект.");
      
      // Редирект на страницу проекта
      if (invitation?.projectId) {
        setTimeout(() => {
          router.push(`/project/${invitation.projectId}/logs`);
        }, 1500);
      } else {
        router.push("/projects");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Ошибка принятия приглашения";
      message.error(errorMessage);
      setError(errorMessage);
    } finally {
      setAccepting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="max-w-md w-full">
          <Space direction="vertical" size="large" className="w-full">
            <div className="text-center">
              <Title level={3}>Вход необходим</Title>
              <Paragraph>
                Для принятия приглашения необходимо войти в систему
              </Paragraph>
            </div>
            <Button
              type="primary"
              block
              onClick={() => router.push(`/login?callbackUrl=/invite/${token}`)}
            >
              Войти
            </Button>
          </Space>
        </Card>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="max-w-md w-full">
          <Alert
            message="Ошибка"
            description={error}
            type="error"
            showIcon
            action={
              <Button size="small" onClick={() => router.push("/projects")}>
                К проектам
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  const isExpired = new Date(invitation.expiresAt) < new Date();
  const isAccepted = invitation.status === "accepted";
  const isCancelled = invitation.status === "cancelled";
  const emailMismatch = session.user.email !== invitation.email;

  const roleLabels: Record<string, string> = {
    admin: "Администратор",
    member: "Участник",
    viewer: "Наблюдатель",
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <Space direction="vertical" size="large" className="w-full">
          <div className="text-center">
            <div className="mb-4">
              <Avatar
                size={64}
                icon={<MailOutlined />}
                className="bg-blue-500"
              />
            </div>
            <Title level={2}>Приглашение в проект</Title>
          </div>

          {isExpired && (
            <Alert
              message="Приглашение истекло"
              description="Срок действия приглашения истек. Обратитесь к владельцу проекта для получения нового приглашения."
              type="warning"
              showIcon
            />
          )}

          {isAccepted && (
            <Alert
              message="Приглашение уже принято"
              description="Это приглашение уже было принято ранее."
              type="info"
              showIcon
            />
          )}

          {isCancelled && (
            <Alert
              message="Приглашение отменено"
              description="Это приглашение было отменено отправителем."
              type="error"
              showIcon
            />
          )}

          {emailMismatch && !isExpired && !isAccepted && !isCancelled && (
            <Alert
              message="Неверный email"
              description={`Приглашение предназначено для ${invitation.email}, а вы вошли как ${session.user.email}. Войдите с правильной учетной записью.`}
              type="warning"
              showIcon
            />
          )}

          {!isExpired && !isAccepted && !isCancelled && !emailMismatch && (
            <>
              <div className="space-y-4">
                <div>
                  <Text type="secondary">Проект:</Text>
                  <div className="mt-1">
                    <Title level={4} className="!mb-0">
                      {invitation.project?.name || "Неизвестный проект"}
                    </Title>
                    {invitation.project?.description && (
                      <Paragraph className="!mb-0 text-gray-600">
                        {invitation.project.description}
                      </Paragraph>
                    )}
                  </div>
                </div>

                <div>
                  <Text type="secondary">Роль:</Text>
                  <div className="mt-1">
                    <Text strong>{roleLabels[invitation.role] || invitation.role}</Text>
                  </div>
                </div>

                {invitation.inviter && (
                  <div>
                    <Text type="secondary">Пригласил:</Text>
                    <div className="mt-1 flex items-center gap-2">
                      <Avatar icon={<UserOutlined />} size="small" />
                      <Text>
                        {invitation.inviter.name || invitation.inviter.email}
                      </Text>
                    </div>
                  </div>
                )}

                <div>
                  <Text type="secondary">Email:</Text>
                  <div className="mt-1">
                    <Text>{invitation.email}</Text>
                  </div>
                </div>
              </div>

              <Button
                type="primary"
                icon={<CheckOutlined />}
                block
                size="large"
                onClick={handleAccept}
                loading={accepting}
              >
                Принять приглашение
              </Button>
            </>
          )}

          {(isExpired || isAccepted || isCancelled || emailMismatch) && (
            <Button block onClick={() => router.push("/projects")}>
              Вернуться к проектам
            </Button>
          )}
        </Space>
      </Card>
    </div>
  );
}

