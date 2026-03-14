import { useRef, useState, useEffect, useMemo } from 'react';
import { PhotoCard } from './PhotoCard';
import { CollectionCard } from './CollectionCard';
import { motion, LayoutGroup, AnimatePresence } from 'framer-motion';
import { Plus as PlusIcon } from 'lucide-react';

export function VirtualGrid({ items, onContextMenu, selectedIds, onToggleSelection, onNavigate, onUpdateItem, onUpdateTrip }) {
  const parentRef = useRef(null);
  const gridRef = useRef(null);
  
  // 统一回调：优先使用 onUpdateItem，如果未定义则回退到 onUpdateTrip
  const updateHandler = onUpdateItem || onUpdateTrip;
  
  // Selection box state
  const [dragStart, setDragStart] = useState(null);
  const [dragCurrent, setDragCurrent] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragWasActive = useRef(false);

  // Handle mass selection from rect
  const handleMassSelection = (rect, isAppend) => {
    if (!gridRef.current) return;
    
    const cardElements = gridRef.current.querySelectorAll('[data-item-key]');
    const newlySelected = new Set(isAppend ? selectedIds : []);
    
    cardElements.forEach(el => {
      const elRect = el.getBoundingClientRect();
      const itemKey = el.getAttribute('data-item-key');
      
      // Check collision
      const isIntersecting = !(
        rect.left > elRect.right ||
        rect.right < elRect.left ||
        rect.top > elRect.bottom ||
        rect.bottom < elRect.top
      );
      
      if (isIntersecting) {
        newlySelected.add(itemKey);
      }
    });

    // Update state via bulk toggle if needed (here we assume onToggleSelection can take an array or Set, 
    // but since the prop is typically a single toggle, we'll need to adjust App.jsx or use a bulk function)
    // For now, let's assume we need to call it once for each if we don't have a bulk setter.
    // IMPROVEMENT: We will add a bulk selection handler to App.jsx next.
    if (onToggleSelection) {
      // If we don't have a bulk function, this might be slow, but let's try calling it.
      // Better: we'll call onToggleSelection with a special 'bulk' signature if supported, 
      // or just ensure we update the set and pass it back.
      onToggleSelection(newlySelected, true); 
    }
  };

  const onMouseDown = (e) => {
    // Only left click and not on a button/interactive element
    if (e.button !== 0 || e.target.closest('button') || e.target.closest('input')) return;
    
    const rect = parentRef.current.getBoundingClientRect();
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragCurrent({ x: e.clientX, y: e.clientY });
    setIsDragging(false);
    dragWasActive.current = false;
  };

  const onMouseMove = (e) => {
    if (!dragStart) return;
    
    const dist = Math.sqrt(Math.pow(e.clientX - dragStart.x, 2) + Math.pow(e.clientY - dragStart.y, 2));
    if (dist > 5) { // Threshold to prevent accidental drags
      setIsDragging(true);
      setDragCurrent({ x: e.clientX, y: e.clientY });
      dragWasActive.current = true;
    }
  };

  const onMouseUp = (e) => {
    if (isDragging && dragStart && dragCurrent) {
      const rect = {
        left: Math.min(dragStart.x, dragCurrent.x),
        top: Math.min(dragStart.y, dragCurrent.y),
        right: Math.max(dragStart.x, dragCurrent.x),
        bottom: Math.max(dragStart.y, dragCurrent.y)
      };
      handleMassSelection(rect, e.shiftKey || e.ctrlKey || e.metaKey);
    }
    setDragStart(null);
    setDragCurrent(null);
    setIsDragging(false);
  };

  useEffect(() => {
    if (dragStart) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragStart, dragCurrent, isDragging]);

  const selectionBoxStyle = useMemo(() => {
    if (!dragStart || !dragCurrent || !isDragging) return null;
    return {
      left: Math.min(dragStart.x, dragCurrent.x),
      top: Math.min(dragStart.y, dragCurrent.y),
      width: Math.abs(dragStart.x - dragCurrent.x),
      height: Math.abs(dragStart.y - dragCurrent.y),
    };
  }, [dragStart, dragCurrent, isDragging]);

  // Paging Logic
  const PAGE_SIZE = 21; // 3 rows of 7
  const [displayLimit, setDisplayLimit] = useState(PAGE_SIZE);
  const sentinelRef = useRef(null);

  useEffect(() => {
    // Reset limit when items change (e.g. changing filter or navigating)
    setDisplayLimit(PAGE_SIZE);
  }, [items]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting && displayLimit < items.length) {
        setDisplayLimit(prev => prev + PAGE_SIZE);
      }
    }, { threshold: 0.1 });

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [items.length, displayLimit]);

  const visibleItems = items.slice(0, displayLimit);

  return (
    <div
      ref={parentRef}
      onMouseDown={onMouseDown}
      onClick={() => {
        if (!dragWasActive.current) {
          onToggleSelection(new Set(), true);
        }
      }}
      className="flex-1 overflow-y-auto w-full px-10 py-10 scroll-smooth custom-scrollbar select-none"
    >
      <div 
        ref={gridRef}
        className="w-full grid gap-12 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-7"
      >
        <LayoutGroup id="grid-layout">
          {visibleItems.map((item, i) => {
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
                  onUpdate={onUpdateItem || onUpdateTrip}
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
                isSelected={isSelected}
                onToggleSelection={onToggleSelection}
                onUpdateTrip={onUpdateItem || onUpdateTrip}
                onNavigate={onNavigate}
                onContextMenu={onContextMenu}
              />
            );
          })}

          <motion.div
            layout
            onClick={() => onUpdateTrip?.('NEW_POP_MODAL')}
            className="border border-dashed border-white/8 rounded-xl flex flex-col items-center justify-center gap-1.5 text-white/20 hover:text-white/40 hover:border-white/15 transition-all cursor-pointer min-h-[180px]"
          >
            <PlusIcon size={20} />
            <span className="text-[11px] font-medium">New page</span>
          </motion.div>
        </LayoutGroup>
      </div>

      {/* Sentinel for infinite scroll */}
      {displayLimit < items.length && (
        <div ref={sentinelRef} className="h-20 w-full flex items-center justify-center">
           <div className="w-6 h-6 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
        </div>
      )}

      {/* Selection Overlay */}
      <AnimatePresence>
        {selectionBoxStyle && (
          <div
            className="fixed z-[1000] border border-blue-500 bg-blue-500/20 pointer-events-none"
            style={selectionBoxStyle}
          />
        )}
      </AnimatePresence>
    </div>
  );
}


