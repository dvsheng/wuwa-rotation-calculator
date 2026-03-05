import { Card, CardContent } from '@/components/ui/card';
import { Stack } from '@/components/ui/layout';
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
    <Card className="w-120">
      <CardContent>
        <Stack className="gap-panel">
          <CharacterSelector index={index} />
          <WeaponSelector index={index} />
          <EchoSetSelector index={index} />
          <PrimaryEchoSelector index={index} />
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
