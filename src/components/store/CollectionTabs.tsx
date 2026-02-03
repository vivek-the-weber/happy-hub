import { cn } from '@/lib/utils';
import { Collection } from '@/hooks/useCollections';

interface CollectionTabsProps {
  collections: Collection[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function CollectionTabs({ collections, selectedId, onSelect }: CollectionTabsProps) {
  const visibleCollections = collections.filter(c => c.is_visible);

  if (visibleCollections.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-6 overflow-x-auto scrollbar-hide px-4 py-3">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "relative pb-2 text-sm whitespace-nowrap transition-colors",
          selectedId === null
            ? "text-white"
            : "text-white/60 hover:text-white/80"
        )}
      >
        All
        {selectedId === null && (
          <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />
        )}
      </button>
      {visibleCollections.map((collection) => (
        <button
          key={collection.id}
          onClick={() => onSelect(collection.id)}
          className={cn(
            "relative pb-2 text-sm whitespace-nowrap transition-colors",
            selectedId === collection.id
              ? "text-white"
              : "text-white/60 hover:text-white/80"
          )}
        >
          {collection.name}
          {selectedId === collection.id && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}
