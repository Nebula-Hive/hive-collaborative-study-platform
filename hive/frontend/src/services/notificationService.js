import instance from "../lib/axios";

export const getMyNotifications = async (page = 1, limit = 20) => {
  const response = await instance.notificationService.get(`/api/notifications`, {
    params: { page, limit },
    headers: instance.defaultHeaders(),
  });
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await instance.notificationService.get(`/api/notifications/unread-count`, {
    headers: instance.defaultHeaders(),
  });
  return response.data;
};

export const markOneAsRead = async (notificationId) => {
  const response = await instance.notificationService.put(
    `/api/notifications/${encodeURIComponent(notificationId)}/read`,
    {},
    {
      headers: instance.defaultHeaders(),
    }
  );
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await instance.notificationService.put(
    `/api/notifications/read-all`,
    {},
    {
      headers: instance.defaultHeaders(),
    }
  );
  return response.data;
};

export const deleteNotification = async (notificationId) => {
  const response = await instance.notificationService.delete(
    `/api/notifications/${encodeURIComponent(notificationId)}`,
    {
      headers: instance.defaultHeaders(),
    }
  );
  return response.data;
};

export const clearReadNotifications = async () => {
  const response = await instance.notificationService.delete(`/api/notifications/clear-read`, {
    headers: instance.defaultHeaders(),
  });
  return response.data;
};
