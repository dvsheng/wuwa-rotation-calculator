import { z } from 'zod';

import { CharacterSchema } from './character';

export const TEAM_SIZE = 3;

export const TeamSchema = z.array(CharacterSchema).length(TEAM_SIZE);

export type Team = z.infer<typeof TeamSchema>;
