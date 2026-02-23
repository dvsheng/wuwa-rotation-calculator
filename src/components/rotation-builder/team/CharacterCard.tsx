import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Row, Stack } from '@/components/ui/layout';
import { ECHO_PIECE_COUNT } from '@/schemas/echo';

import { CharacterSelector } from './CharacterSelector';
import { EchoPieceEditor } from './EchoPieceEditor';
import { EchoSetSelector } from './EchoSetSelector';
import { PrimaryEchoSelector } from './PrimaryEchoSelector';
import { WeaponSelector } from './WeaponSelector';

interface CharacterCardProperties {
  index: number;
}

export const CharacterCard = ({ index }: CharacterCardProperties) => {
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
