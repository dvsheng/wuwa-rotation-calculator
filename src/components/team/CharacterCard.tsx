import { CharacterSelector } from '@/components/team/CharacterSelector';
import { EchoPieceEditor } from '@/components/team/EchoPieceEditor';
import { EchoSetSelector } from '@/components/team/EchoSetSelector';
import { PrimaryEchoSelector } from '@/components/team/PrimaryEchoSelector';
import { WeaponSelector } from '@/components/team/WeaponSelector';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Row, Stack } from '@/components/ui/layout';
import { useTeamStore } from '@/store/useTeamStore';

interface CharacterCardProps {
  index: number;
}

export const CharacterCard = ({ index }: CharacterCardProps) => {
  const character = useTeamStore((state) => state.team[index]);
  const updateCharacter = useTeamStore((state) => state.updateCharacter);

  return (
    <Card className="flex h-full flex-col shadow-lg">
      <CardHeader className="bg-secondary/20 pb-2">
        <Stack>
          <Row className="w-full justify-between gap-2">
            <CharacterSelector index={index} />
          </Row>
          <WeaponSelector index={index} />
          <EchoSetSelector index={index} />
          <PrimaryEchoSelector index={index} />
        </Stack>
      </CardHeader>
      <CardContent className="p-4">
        <Stack className="mt-4">
          {character.echoStats.map((echo, echoIndex) => (
            <EchoPieceEditor
              key={echoIndex}
              echo={echo}
              onUpdate={(updater) =>
                updateCharacter(index, (draft) => {
                  updater(draft.echoStats[echoIndex]);
                })
              }
            />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};
