import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import { PhotoCard } from './PhotoCard';
import { CollectionCard } from './CollectionCard';
import { motion, LayoutGroup } from 'framer-motion';

export function VirtualGrid({ items, onContextMenu, selectedIds, onToggleSelection, onNavigate }) {
  const parentRef = useRef(null);
  
  // We'll calculate columns based on common gallery widths
  const columns = 5; 
  const rowCount = Math.ceil(items.length / columns);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 280, // Approximate height of a row including gaps
    overscan: 5,
  });

  return (
    <div
      ref={parentRef}
      className="flex-1 overflow-y-auto w-full p-8 scroll-smooth will-change-scroll custom-scrollbar"
    >
      <div
        className="max-w-7xl mx-auto relative"
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * columns;
          const rowItems = items.slice(startIndex, startIndex + columns);

          return (
            <div
              key={virtualRow.key}
              className="absolute top-0 left-0 w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <LayoutGroup id="grid-layout">
                {rowItems.map((item, i) => {
                  const itemKey = item.type === 'photo' ? item.path : `${item.type}:${item.id}`;
                  const isSelected = selectedIds.has(itemKey);

                  if (item.type === 'photo') {
                    return (
                      <PhotoCard 
                        key={itemKey}
                        index={startIndex + i}
                        onContextMenu={onContextMenu}
                        isSelected={isSelected}
                        onToggleSelection={onToggleSelection}
                        onNavigate={onNavigate}
                        fileInfo={item} 
                      />
                    );
                  } else {
                    return (
                      <CollectionCard 
                        key={itemKey}
                        index={startIndex + i}
                        onContextMenu={onContextMenu}
                        isSelected={isSelected}
                        onToggleSelection={onToggleSelection}
                        onNavigate={onNavigate}
                        type={item.type} 
                        item={item} 
                        photos={item.photos} 
                      />
                    );
                  }
                })}
              </LayoutGroup>
            </div>
          );
        })}
      </div>
    </div>
  );
}
