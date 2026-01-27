import { useQuery } from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
import {
  ChevronRight,
  Hammer,
  Layers,
  Loader2,
  Save,
  Search,
  Shield,
  Swords,
  User,
  Waves,
  Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCharacterDetails } from '@/services/game-data/character/get-character-details';
import { listCharacters } from '@/services/game-data/character/list-characters';
import { saveCharacterDetails } from '@/services/game-data/character/save-character-details';
import type { Character } from '@/services/game-data/character/types';
import { getEchoDetails } from '@/services/game-data/echo/get-echo-details';
import { listEchoes } from '@/services/game-data/echo/list-echoes';
import { saveEchoDetails } from '@/services/game-data/echo/save-echo-details';
import type { Echo } from '@/services/game-data/echo/types';
import { getEchoSetDetails } from '@/services/game-data/echo-set/get-echo-set-details';
import { listEchoSets } from '@/services/game-data/echo-set/list-echo-sets';
import { saveEchoSetDetails } from '@/services/game-data/echo-set/save-echo-set-details';
import type { EchoSet } from '@/services/game-data/echo-set/types';
import { getWeaponDetails } from '@/services/game-data/weapon/get-weapon-details';
import { listWeapons } from '@/services/game-data/weapon/list-weapons';
import { saveWeaponDetails } from '@/services/game-data/weapon/save-weapon-details';
import type { Weapon } from '@/services/game-data/weapon/types';
import { RefineLevel } from '@/services/game-data/weapon/types';

type EntityType = 'character' | 'weapon' | 'echo' | 'echoSet';

function AdminConsole() {
  const [activeEntityType, setEntityType] = useState<EntityType>('character');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [localEntity, setLocalEntity] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // List queries
  const { data: characters = [], isLoading: isLoadingCharacters } = useQuery({
    queryKey: ['characters'],
    queryFn: () => listCharacters(),
  });

  const { data: weapons = [], isLoading: isLoadingWeapons } = useQuery({
    queryKey: ['weapons'],
    queryFn: () => listWeapons(),
  });

  const { data: echoes = [], isLoading: isLoadingEchoes } = useQuery({
    queryKey: ['echoes'],
    queryFn: () => listEchoes(),
  });

  const { data: echoSets = [], isLoading: isLoadingEchoSets } = useQuery({
    queryKey: ['echoSets'],
    queryFn: () => listEchoSets(),
  });

  // Detail query
  const { isLoading: isLoadingDetails } = useQuery({
    queryKey: ['details', activeEntityType, selectedEntityId],
    queryFn: async () => {
      let details;
      if (activeEntityType === 'character') {
        details = await getCharacterDetails({ data: selectedEntityId! });
      } else if (activeEntityType === 'weapon') {
        details = await getWeaponDetails({ data: selectedEntityId! });
      } else if (activeEntityType === 'echo') {
        details = await getEchoDetails({ data: selectedEntityId! });
      } else {
        details = await getEchoSetDetails({ data: selectedEntityId! });
      }
      setLocalEntity(details);
      return details;
    },
    enabled: !!selectedEntityId,
  });

  const handleSave = async () => {
    if (!localEntity) return;
    setIsSaving(true);
    try {
      if (activeEntityType === 'character') {
        await saveCharacterDetails({ data: localEntity });
      } else if (activeEntityType === 'weapon') {
        await saveWeaponDetails({ data: localEntity });
      } else if (activeEntityType === 'echo') {
        await saveEchoDetails({ data: localEntity });
      } else {
        await saveEchoSetDetails({ data: localEntity });
      }
      alert(`${activeEntityType} saved successfully!`);
    } catch (error) {
      alert(`Failed to save ${activeEntityType}: ` + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const entities = useMemo(() => {
    if (activeEntityType === 'character') return characters;
    if (activeEntityType === 'weapon') return weapons;
    if (activeEntityType === 'echo') return echoes;
    return echoSets;
  }, [activeEntityType, characters, weapons, echoes, echoSets]);

  const filteredEntities = entities.filter((entity: any) =>
    entity.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const isLoadingList =
    isLoadingCharacters || isLoadingWeapons || isLoadingEchoes || isLoadingEchoSets;

  const selectedEntity = useMemo(
    () => entities.find((e: any) => e.id === selectedEntityId),
    [entities, selectedEntityId],
  );

  return (
    <div className="bg-background flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="bg-card flex w-64 flex-col border-r">
        <div className="flex flex-col border-b p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold">Admin</h2>
            <Link to="/">
              <Button variant="ghost" size="sm">
                Exit
              </Button>
            </Link>
          </div>
          <div className="flex gap-1">
            <Button
              variant={activeEntityType === 'character' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => {
                setEntityType('character');
                setSelectedEntityId(null);
                setLocalEntity(null);
              }}
              title="Characters"
            >
              <User className="h-4 w-4" />
            </Button>
            <Button
              variant={activeEntityType === 'weapon' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => {
                setEntityType('weapon');
                setSelectedEntityId(null);
                setLocalEntity(null);
              }}
              title="Weapons"
            >
              <Hammer className="h-4 w-4" />
            </Button>
            <Button
              variant={activeEntityType === 'echo' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => {
                setEntityType('echo');
                setSelectedEntityId(null);
                setLocalEntity(null);
              }}
              title="Echoes"
            >
              <Waves className="h-4 w-4" />
            </Button>
            <Button
              variant={activeEntityType === 'echoSet' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => {
                setEntityType('echoSet');
                setSelectedEntityId(null);
                setLocalEntity(null);
              }}
              title="Echo Sets"
            >
              <Layers className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="border-b p-4">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
            <Input
              placeholder={`Search ${activeEntityType}...`}
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {isLoadingList ? (
              <div className="flex justify-center p-4">
                <Loader2 className="text-primary h-6 w-6 animate-spin" />
              </div>
            ) : (
              filteredEntities.map((entity: any) => (
                <button
                  key={entity.id}
                  onClick={() => setSelectedEntityId(entity.id)}
                  className={`group flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition-colors ${
                    selectedEntityId === entity.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <span className="truncate">{entity.name}</span>
                  <ChevronRight
                    className={`h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100 ${
                      selectedEntityId === entity.id ? 'opacity-100' : ''
                    }`}
                  />
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {selectedEntityId ? (
          <>
            <header className="bg-card flex items-center justify-between border-b p-4">
              <div>
                <h1 className="text-2xl font-bold">
                  {localEntity?.name || selectedEntity?.name || selectedEntityId}
                </h1>
                <p className="text-muted-foreground text-sm">ID: {selectedEntityId}</p>
              </div>
              <Button
                onClick={handleSave}
                disabled={isSaving || !localEntity}
                className="gap-2"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </header>

            <main className="flex-1 overflow-auto p-6">
              {isLoadingDetails && !localEntity ? (
                <div className="flex h-full flex-col items-center justify-center gap-4">
                  <Loader2 className="text-primary h-10 w-10 animate-spin" />
                  <p className="text-muted-foreground">Loading details...</p>
                </div>
              ) : localEntity ? (
                activeEntityType === 'character' ? (
                  <CharacterEditor
                    character={localEntity}
                    onChange={(updated) => setLocalEntity(updated)}
                  />
                ) : activeEntityType === 'weapon' ? (
                  <WeaponEditor
                    weapon={localEntity}
                    onChange={(updated) => setLocalEntity(updated)}
                  />
                ) : activeEntityType === 'echo' ? (
                  <EchoEditor
                    echo={localEntity}
                    onChange={(updated) => setLocalEntity(updated)}
                  />
                ) : (
                  <EchoSetEditor
                    echoSet={localEntity}
                    onChange={(updated) => setLocalEntity(updated)}
                  />
                )
              ) : (
                <div className="text-muted-foreground flex h-full items-center justify-center">
                  Failed to load details.
                </div>
              )}
            </main>
          </>
        ) : (
          <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-4">
            {activeEntityType === 'character' && (
              <User className="h-16 w-16 opacity-20" />
            )}
            {activeEntityType === 'weapon' && (
              <Hammer className="h-16 w-16 opacity-20" />
            )}
            {activeEntityType === 'echo' && <Waves className="h-16 w-16 opacity-20" />}
            {activeEntityType === 'echoSet' && (
              <Layers className="h-16 w-16 opacity-20" />
            )}
            <p className="text-xl">
              Select a {activeEntityType} to view and edit details
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Character Editor
function CharacterEditor({
  character,
  onChange,
}: {
  character: Character;
  onChange: (updated: Character) => void;
}) {
  const updateAttack = (index: number, field: string, value: any) => {
    const newAttacks = [...character.attacks];
    newAttacks[index] = { ...newAttacks[index], [field]: value };
    onChange({ ...character, attacks: newAttacks });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
              Display Name
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={character.name}
              onChange={(e) => onChange({ ...character, name: e.target.value })}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
              Attribute
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={character.attribute}
              onChange={(e) =>
                onChange({ ...character, attribute: e.target.value as any })
              }
            />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="attacks" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="attacks" className="gap-2">
            <Swords className="h-4 w-4" /> Attacks
          </TabsTrigger>
          <TabsTrigger value="modifiers" className="gap-2">
            <Zap className="h-4 w-4" /> Modifiers
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <Shield className="h-4 w-4" /> Stats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attacks" className="mt-6 space-y-4">
          {character.attacks.map((attack, index) => (
            <Card key={`${attack.name}-${index}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex flex-1 items-center gap-4">
                    <div className="flex-1">
                      <Input
                        value={attack.name}
                        onChange={(e) => updateAttack(index, 'name', e.target.value)}
                        className="hover:border-input focus:border-input -ml-2 h-auto border-transparent bg-transparent px-2 py-1 text-lg font-bold"
                      />
                      <CardDescription>
                        {attack.originType} • {attack.parentName}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {attack.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  className="text-muted-foreground bg-muted/30 hover:border-input focus:border-input min-h-[80px] w-full rounded-md border border-transparent p-2 text-sm leading-relaxed focus:outline-none"
                  value={attack.description}
                  onChange={(e) => updateAttack(index, 'description', e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-muted-foreground text-xs font-bold uppercase">
                      Scaling Stat
                    </label>
                    <Input
                      value={attack.scalingStat}
                      onChange={(e) =>
                        updateAttack(index, 'scalingStat', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-muted-foreground text-xs font-bold uppercase">
                      Motion Values (comma separated)
                    </label>
                    <Input
                      value={attack.motionValues?.join(', ')}
                      onChange={(e) => {
                        const vals = e.target.value
                          .split(',')
                          .map((v) => parseFloat(v.trim()))
                          .filter((v) => !isNaN(v));
                        updateAttack(index, 'motionValues', vals);
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="modifiers" className="mt-6 space-y-4">
          {character.modifiers.length > 0 ? (
            character.modifiers.map((mod, index) => (
              <Card key={`${mod.name}-${index}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{mod.name}</CardTitle>
                      <CardDescription>
                        {mod.originType} • {mod.parentName}
                      </CardDescription>
                    </div>
                    {mod.unlockedAt && (
                      <Badge variant="outline" className="bg-primary/5">
                        Unlocked at {mod.unlockedAt.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {mod.description}
                  </p>
                  <div className="bg-muted/30 space-y-2 rounded-lg p-4">
                    <label className="text-muted-foreground text-xs font-bold uppercase">
                      Modified Stats (JSON)
                    </label>
                    <textarea
                      className="min-h-[100px] w-full border-none bg-transparent font-mono text-xs focus:outline-none"
                      value={JSON.stringify(mod.modifiedStats, null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          const newModifiers = [...character.modifiers];
                          newModifiers[index] = {
                            ...newModifiers[index],
                            modifiedStats: parsed,
                          };
                          onChange({ ...character, modifiers: newModifiers });
                        } catch (err) {
                          // Invalid JSON
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-muted-foreground rounded-lg border-2 border-dashed py-12 text-center">
              No modifiers found for this character.
            </div>
          )}
        </TabsContent>

        <TabsContent value="stats" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Object.entries(character.stats).map(([statName, values]) => (
              <Card key={statName}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold tracking-tight uppercase">
                    {statName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {values &&
                    values.map((val, i) => (
                      <div
                        key={i}
                        className="bg-muted/20 flex flex-col gap-2 rounded border p-3"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex flex-col">
                            <span className="font-medium">{val.name}</span>
                            <span className="text-muted-foreground text-[10px] uppercase">
                              {val.originType}
                            </span>
                          </div>
                          <Input
                            type="number"
                            step="0.001"
                            className="h-8 w-24 text-right font-mono"
                            value={val as number}
                            onChange={(e) => {
                              const newVal = parseFloat(e.target.value);
                              if (isNaN(newVal)) return;
                              const newStats = { ...character.stats };
                              const statArray = [...newStats[statName as any]];
                              statArray[i] = {
                                ...statArray[i],
                                value: newVal,
                              };
                              newStats[statName] = statArray;
                              onChange({ ...character, stats: newStats });
                            }}
                          />
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Weapon Editor
function WeaponEditor({
  weapon,
  onChange,
}: {
  weapon: Weapon;
  onChange: (updated: Weapon) => void;
}) {
  const [activeRefine, setRefine] = useState<RefineLevel>('1');

  const updateWeaponStat = (statName: string, value: number) => {
    const newBaseStats = { ...weapon.baseStats, [statName]: value };
    onChange({ ...weapon, baseStats: newBaseStats });
  };

  const updateRefineProperty = (field: string, value: any) => {
    const newAttributes = { ...weapon.attributes };
    newAttributes[activeRefine] = {
      ...newAttributes[activeRefine],
      [field]: value,
    };
    onChange({ ...weapon, attributes: newAttributes });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
              Weapon Name
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={weapon.name}
              onChange={(e) => onChange({ ...weapon, name: e.target.value })}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
              Base Stats (Level 90)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {Object.entries(weapon.baseStats).map(([stat, val]) => (
              <div key={stat} className="space-y-1">
                <label className="text-[10px] font-bold uppercase opacity-50">
                  {stat}
                </label>
                <Input
                  type="number"
                  step="0.001"
                  value={val}
                  onChange={(e) => updateWeaponStat(stat, parseFloat(e.target.value))}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="font-bold">Refinement Level:</label>
          <div className="flex gap-2">
            {Object.values(RefineLevel).map((r) => (
              <Button
                key={r}
                variant={activeRefine === r ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRefine(r)}
              >
                R{r}
              </Button>
            ))}
          </div>
        </div>

        <Tabs defaultValue="modifiers" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="modifiers" className="gap-2">
              <Zap className="h-4 w-4" /> Modifiers
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <Shield className="h-4 w-4" /> Passive Stats
            </TabsTrigger>
            <TabsTrigger value="attack" className="gap-2">
              <Swords className="h-4 w-4" /> Weapon Attack
            </TabsTrigger>
          </TabsList>

          <TabsContent value="modifiers" className="mt-6 space-y-4">
            <textarea
              className="min-h-[300px] w-full rounded-md border p-4 font-mono text-xs"
              value={JSON.stringify(weapon.attributes[activeRefine].modifiers, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  updateRefineProperty('modifiers', parsed);
                } catch (err) {}
              }}
            />
          </TabsContent>

          <TabsContent value="stats" className="mt-6 space-y-4">
            <textarea
              className="min-h-[300px] w-full rounded-md border p-4 font-mono text-xs"
              value={JSON.stringify(weapon.attributes[activeRefine].stats, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  updateRefineProperty('stats', parsed);
                } catch (err) {}
              }}
            />
          </TabsContent>

          <TabsContent value="attack" className="mt-6 space-y-4">
            <textarea
              className="min-h-[300px] w-full rounded-md border p-4 font-mono text-xs"
              value={JSON.stringify(weapon.attributes[activeRefine].attack, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  updateRefineProperty('attack', parsed);
                } catch (err) {}
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Echo Editor
function EchoEditor({
  echo,
  onChange,
}: {
  echo: Echo;
  onChange: (updated: Echo) => void;
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
            Echo Name
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={echo.name}
            onChange={(e) => onChange({ ...echo, name: e.target.value })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
            Echo Sets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={echo.echoSetIds.join(', ')}
            onChange={(e) =>
              onChange({
                ...echo,
                echoSetIds: e.target.value.split(',').map((s) => s.trim()),
              })
            }
          />
        </CardContent>
      </Card>

      <Tabs defaultValue="attack" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="attack" className="gap-2">
            <Swords className="h-4 w-4" /> Echo Skill
          </TabsTrigger>
          <TabsTrigger value="modifiers" className="gap-2">
            <Zap className="h-4 w-4" /> Modifiers
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <Shield className="h-4 w-4" /> Stats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attack" className="mt-6">
          <textarea
            className="min-h-[300px] w-full rounded-md border p-4 font-mono text-xs"
            value={JSON.stringify(echo.attack, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                onChange({ ...echo, attack: parsed });
              } catch (err) {}
            }}
          />
        </TabsContent>

        <TabsContent value="modifiers" className="mt-6">
          <textarea
            className="min-h-[300px] w-full rounded-md border p-4 font-mono text-xs"
            value={JSON.stringify(echo.modifiers, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                onChange({ ...echo, modifiers: parsed });
              } catch (err) {}
            }}
          />
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <textarea
            className="min-h-[300px] w-full rounded-md border p-4 font-mono text-xs"
            value={JSON.stringify(echo.stats, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                onChange({ ...echo, stats: parsed });
              } catch (err) {}
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Echo Set Editor
function EchoSetEditor({
  echoSet,
  onChange,
}: {
  echoSet: EchoSet;
  onChange: (updated: EchoSet) => void;
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
            Set Name
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={echoSet.name}
            onChange={(e) => onChange({ ...echoSet, name: e.target.value })}
          />
        </CardContent>
      </Card>

      <Tabs defaultValue="TWO_PIECE" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="TWO_PIECE">2-Piece Effect</TabsTrigger>
          <TabsTrigger value="FIVE_PIECE">5-Piece Effect</TabsTrigger>
        </TabsList>

        {['TWO_PIECE', 'FIVE_PIECE'].map((tier) => (
          <TabsContent key={tier} value={tier} className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {tier === 'TWO_PIECE' ? '2-Piece' : '5-Piece'} Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  className="min-h-[400px] w-full rounded-md border p-4 font-mono text-xs"
                  value={JSON.stringify((echoSet.setEffects as any)[tier], null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      const newEffects = { ...echoSet.setEffects, [tier]: parsed };
                      onChange({ ...echoSet, setEffects: newEffects });
                    } catch (err) {}
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export const Route = createFileRoute('/admin')({
  component: AdminConsole,
});
