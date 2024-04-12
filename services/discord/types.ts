
export interface DiscordTaskEntity {
  _id: string;
  taskId: string;
  applicationId: string;
  channelId: string;
  guildId?: string | null;
  userId: string;
  createdAt: Date;
  completedAt: Date;
}