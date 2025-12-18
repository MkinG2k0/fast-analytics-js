import { useQuery } from "@tanstack/react-query";
import { getOnlineUsersCount } from "@/shared/api/page-visits";

const ONLINE_USERS_UPDATE_INTERVAL = 10000;

export function useOnlineUsersCount(projectId: string) {
  const { data = 0 } = useQuery({
    queryKey: ["online-users-count", projectId],
    queryFn: async () => {
      const result = await getOnlineUsersCount(projectId);
      return result.count;
    },
    enabled: !!projectId,
    refetchInterval: ONLINE_USERS_UPDATE_INTERVAL,
  });

  return data;
}
