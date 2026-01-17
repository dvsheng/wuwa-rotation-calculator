import { z } from 'zod';

import { CharacterSchema } from './character';

export const TeamSchema = z.tuple([CharacterSchema, CharacterSchema, CharacterSchema]);

export type Team = z.infer<typeof TeamSchema>;
