import { CharacterSelector } from '@/components/team/CharacterSelector';
import { EchoPieceEditor } from '@/components/team/EchoPieceEditor';
import { EchoSetSelector } from '@/components/team/EchoSetSelector';
import { PrimaryEchoSelector } from '@/components/team/PrimaryEchoSelector';
import { WeaponSelector } from '@/components/team/WeaponSelector';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Row, Stack } from '@/components/ui/layout';
import { ECHO_PIECE_COUNT } from '@/schemas/echo';

interface CharacterCardProps {
  index: number;
}

export const CharacterCard = ({ index }: CharacterCardProps) => {
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
          {Array.from({ length: ECHO_PIECE_COUNT }, (_, echoIndex) => (
            <EchoPieceEditor
              key={echoIndex}
              characterIndex={index}
              echoIndex={echoIndex}
            />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};
