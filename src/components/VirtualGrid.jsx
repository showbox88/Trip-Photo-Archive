import { useRef } from 'react';
import { PhotoCard } from './PhotoCard';
import { CollectionCard } from './CollectionCard';
import { motion, LayoutGroup } from 'framer-motion';
import { Plus as PlusIcon } from 'lucide-react';

export function VirtualGrid({ items, onContextMenu, selectedIds, onToggleSelection, onNavigate, onUpdateTrip }) {
  const parentRef = useRef(null);

  return (
    <div
      ref={parentRef}
      className="flex-1 overflow-y-auto w-full px-6 py-5 scroll-smooth custom-scrollbar"
    >
      <div className="w-full grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 3xl:grid-cols-10">
        <LayoutGroup id="grid-layout">
          {items.map((item, i) => {
            const itemKey = item.type === 'photo' ? item.path : `${item.type}:${item.id}`;
            const isSelected = selectedIds.has(itemKey);

            if (item.type === 'photo') {
              return (
                <PhotoCard
                  key={itemKey}
                  index={i}
                  onContextMenu={onContextMenu}
                  isSelected={isSelected}
                  onToggleSelection={onToggleSelection}
                  onNavigate={onNavigate}
                  fileInfo={item}
                />
              );
            }

            return (
              <CollectionCard
                key={itemKey}
                type={item.type}
                item={item.item || item}
                photos={item.photos}
                associatedEvents={item.associatedEvents}
                index={i}
                isSelected={selectedIds.has(item.type === 'trip' ? `trip:${item.id}` : `event:${item.id}`)}
                onToggleSelection={onToggleSelection}
                onUpdateTrip={onUpdateTrip}
                onNavigate={onNavigate}
                onContextMenu={onContextMenu}
              />
            );
          })}

          {/* + New page placeholder */}
          <motion.div
            layout
            onClick={() => onUpdateTrip?.('NEW_POP_MODAL')}
            className="border border-dashed border-white/8 rounded-xl flex flex-col items-center justify-center gap-1.5 text-white/20 hover:text-white/40 hover:border-white/15 transition-all cursor-pointer aspect-[3/2]"
          >
            <PlusIcon size={20} />
            <span className="text-[11px] font-medium">New page</span>
          </motion.div>
        </LayoutGroup>
      </div>
    </div>
  );
}
