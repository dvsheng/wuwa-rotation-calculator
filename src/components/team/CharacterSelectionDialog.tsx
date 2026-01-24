import { Filter, Search, X } from 'lucide-react';
import { useState } from 'react';

import { GameImage } from '@/components/common/GameImage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCharacterList } from '@/hooks/useCharacterList';
import { cn } from '@/lib/utils';
import { resolveImagePath } from '@/services/image-service';
import { Attribute } from '@/types';

import { ATTRIBUTE_COLORS } from './constants';

interface CharacterSelectionDialogProps {
  onSelect: (id: string, name: string) => void;
  selectedCharacterName?: string;
  excludeNames?: Array<string>;
}

const ATTRIBUTES = Object.values(Attribute);
const RARITIES = [5, 4];

export const CharacterSelectionDialog = ({
  onSelect,
  selectedCharacterName,
  excludeNames = [],
}: CharacterSelectionDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null);
  const [selectedRarity, setSelectedRarity] = useState<number | null>(null);

  const { data: characterList = [] } = useCharacterList();

  const filteredCharacters = characterList
    .filter((char) => {
      const matchesSearch = char.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAttribute =
        !selectedAttribute || char.attribute === selectedAttribute;
      const matchesRarity = !selectedRarity || char.rarity === selectedRarity;
      const isNotExcluded = !excludeNames.includes(char.name);
      return matchesSearch && matchesAttribute && matchesRarity && isNotExcluded;
    })
    .sort((a, b) => {
      // Sort by attribute first (alphabetical)
      if (a.attribute !== b.attribute) {
        return a.attribute.localeCompare(b.attribute);
      }
      // Then by rarity descending (5* before 4*)
      if (a.rarity !== b.rarity) {
        return b.rarity - a.rarity;
      }
      // Finally by name
      return a.name.localeCompare(b.name);
    });

  const handleSelect = (id: string, name: string) => {
    onSelect(id, name);
    setIsOpen(false);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedAttribute(null);
    setSelectedRarity(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start truncate font-normal">
          <span className="truncate">
            {selectedCharacterName || 'Select character'}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-[80vh] max-w-2xl flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Select Character</DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 flex-col space-y-4 overflow-hidden p-6">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <Input
              placeholder="Search characters..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Filter className="text-muted-foreground h-4 w-4" />
              <span className="font-medium">Filters:</span>
            </div>

            <div className="flex gap-1">
              {ATTRIBUTES.map((attr) => (
                <Badge
                  key={attr}
                  variant={selectedAttribute === attr ? undefined : 'outline'}
                  className="cursor-pointer gap-1.5 transition-all"
                  style={{
                    backgroundColor:
                      selectedAttribute === attr ? ATTRIBUTE_COLORS[attr] : undefined,
                    borderColor: ATTRIBUTE_COLORS[attr],
                    color:
                      selectedAttribute === attr ? 'white' : ATTRIBUTE_COLORS[attr],
                    opacity:
                      selectedAttribute === null || selectedAttribute === attr
                        ? 1
                        : 0.3,
                    transform: selectedAttribute === attr ? 'scale(1.05)' : 'scale(1)',
                  }}
                  onClick={() =>
                    setSelectedAttribute(selectedAttribute === attr ? null : attr)
                  }
                >
                  <img
                    src={resolveImagePath('attribute', 'icon', attr)}
                    alt={attr}
                    className={cn(
                      'h-3.5 w-3.5',
                      selectedAttribute !== attr && 'brightness-100 contrast-125',
                    )}
                  />
                  <span className="capitalize">{attr}</span>
                </Badge>
              ))}
            </div>

            <div className="flex gap-1">
              {RARITIES.map((rarity) => (
                <Badge
                  key={rarity}
                  variant={selectedRarity === rarity ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() =>
                    setSelectedRarity(selectedRarity === rarity ? null : rarity)
                  }
                >
                  {rarity}★
                </Badge>
              ))}
            </div>

            {(selectedAttribute || selectedRarity || searchTerm) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={resetFilters}
              >
                <X className="h-3 w-3" /> Clear
              </Button>
            )}
          </div>

          <ScrollArea className="flex-1 rounded-md border">
            <div className="grid grid-cols-2 gap-2 p-4 md:grid-cols-3">
              {filteredCharacters.length > 0 ? (
                filteredCharacters.map((char) => (
                  <button
                    key={char.id}
                    onClick={() => handleSelect(char.id.toString(), char.name)}
                    className={cn(
                      'group hover:bg-accent hover:border-primary/50 flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-all',
                      selectedCharacterName === char.name &&
                        'border-primary ring-primary bg-accent ring-1',
                    )}
                    style={{
                      borderLeft: `4px solid ${ATTRIBUTE_COLORS[char.attribute]}`,
                    }}
                  >
                    <div className="group-hover:bg-background bg-muted relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full transition-colors">
                      <GameImage
                        entity="character"
                        type="icon"
                        id={char.id}
                        alt={char.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="max-w-[120px] truncate text-sm font-bold">
                        {char.name}
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <span
                          className={cn(
                            'rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase',
                            char.rarity === 5
                              ? 'bg-yellow-500/10 text-yellow-600'
                              : 'bg-purple-500/10 text-purple-600',
                          )}
                        >
                          {char.rarity}★
                        </span>
                        <span className="text-muted-foreground text-[10px] capitalize">
                          {char.attribute}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-muted-foreground col-span-full py-12 text-center">
                  No characters found matching your filters.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
