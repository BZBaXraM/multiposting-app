// Typed request/response models mirroring the deployed API's swagger.json
// (https://multiposting-fm82.onrender.com/swagger/v1/swagger.json).
// Response bodies are undocumented in the spec (no schema attached to any 200),
// so response types are intentionally `unknown` at the service layer and
// rendered as raw JSON in the UI rather than guessed at.

export enum SocialMedia {
  None = 'None',
  YouTube = 'YouTube',
  Instagram = 'Instagram',
  TikTok = 'TikTok',
  Vk = 'Vk',
  Google = 'Google',
  Telegram = 'Telegram',
}

export const SOCIAL_MEDIA_OPTIONS = Object.values(SocialMedia);

export interface SignInRequest {
  email: string;
  password: string;
  deviceToken?: string | null;
}

export interface AuthRequest {
  code?: string | null;
  email?: string | null;
  password?: string | null;
  deviceId?: string | null;
  state: SocialMedia;
  deviceToken?: string | null;
}

export interface CreateProjectRequest {
  name: string;
}

export interface UserAssetDto {
  id: string;
  userAssetId?: string | null;
  name?: string | null;
  imageUrl?: string | null;
  isSelected: boolean;
  socialMedia: SocialMedia;
  additionalId?: string | null;
  accessTokenId: string;
  projectId: string;
}

export interface CreateUserAssetRequest {
  projectId: string;
  userAssetDto: UserAssetDto[] | null;
}

export interface SendUserAssetInfoRequest {
  description?: string | null;
  title?: string | null;
  timeCode?: number | null;
  socialMedia: SocialMedia;
  id: string;
}

export interface CreatePushNotificationRequest {
  userId?: string | null;
  deviceToken?: string | null;
}

export interface TelegramBotConnectRequest {
  botToken: string;
  channelLink: string;
}

export interface ApiExceptionBody {
  Message?: string;
  ExceptionType?: string;
  Data?: Record<string, unknown>;
  StackTrace?: string;
}

// GET /api/Project returns the caller's single project (one project per account).
// Observed live: the asset array is called `userAssets` here but `userAsset` on
// GET /api/Project/{id} — both are handled defensively.
export interface Project {
  id: string;
  name: string;
  userId?: string;
  userAssets?: UserAssetDto[];
  userAsset?: UserAssetDto[];
}

export function projectAssets(project: Project | null | undefined): UserAssetDto[] {
  return project?.userAssets ?? project?.userAsset ?? [];
}

// GET /api/PushNotifications — publish history/notification log entries.
export interface PushNotificationItem {
  id: string;
  userId: string;
  title: string;
  imageUrl?: string | null;
  description: string;
  notificationStatus: 'Success' | 'Fail' | string;
  isRead: boolean;
  socialMedia: SocialMedia;
  pushTokenId: string;
}
