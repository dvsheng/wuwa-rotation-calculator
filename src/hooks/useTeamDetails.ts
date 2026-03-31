import type { TeamCapabilities } from '@/services/game-data/get-team-capabilities';
import { getTeamCapabilities } from '@/services/game-data/get-team-capabilities';
import { useStore } from '@/store';

import { useEntityCapabilities } from './useCapabilities';
import { useEntities } from './useEntities';

export type UseTeamDetailsResult = {
  data: TeamCapabilities;
  isLoading: boolean;
  isError: boolean;
};

export const useTeamDetails = (): UseTeamDetailsResult => {
  const team = useStore((state) => state.team);
  const entityIds = team.flatMap((character) => [
    character.id,
    character.weapon.id,
    character.primarySlotEcho.id,
    ...character.echoSets.map((set) => set.id),
  ]);
  const { data: capabilities, ...rest } = useEntityCapabilities(entityIds);
  const { data: entities } = useEntities({});
  const teamCapabilities = getTeamCapabilities(team, capabilities, entities);
  return { data: teamCapabilities, ...rest };
};
