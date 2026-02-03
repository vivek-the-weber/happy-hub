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
    <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors",
          selectedId === null
            ? "bg-white text-black"
            : "text-white/70 hover:text-white"
        )}
      >
        All
      </button>
      {visibleCollections.map((collection) => (
        <button
          key={collection.id}
          onClick={() => onSelect(collection.id)}
          className={cn(
            "px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors",
            selectedId === collection.id
              ? "bg-white text-black"
              : "text-white/70 hover:text-white"
          )}
        >
          {collection.name}
        </button>
      ))}
    </div>
  );
}
