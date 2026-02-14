import type { IconRequest } from '@/schemas/game-data-service';

export interface IconResponse extends IconRequest {
  iconUrl?: string;
}

export type GetIconsResponse = Array<IconResponse>;

export type { GetIconsRequest } from '@/schemas/game-data-service';
