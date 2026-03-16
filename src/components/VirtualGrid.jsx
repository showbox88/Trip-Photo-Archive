import { useRef, useState, useEffect, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { PhotoCard } from './PhotoCard';
import { CollectionCard } from './CollectionCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus as PlusIcon, CheckCircle2, Circle } from 'lucide-react';
import clsx from 'clsx';

const COLUMNS = 10;

/**
 * Group flat items array into virtual rows:
 * - date-header items → their own row (full width)
 * - photo/collection items → batched into rows of COLUMNS
 * - last row → "new page" button
 */
function groupItemsIntoRows(items) {
  const rows = [];
  let i = 0;
  while (i < items.length) {
    const item = items[i];
    if (item.type === 'date-header') {
      rows.push({ type: 'header', item });
      i++;
    } else {
      const rowItems = [];
      while (i < items.length && items[i].type !== 'date-header' && rowItems.length < COLUMNS) {
        rowItems.push(items[i]);
        i++;
      }
      rows.push({ type: 'grid', items: rowItems });
    }
  }
  rows.push({ type: 'new-page' });
  return rows;
}

export function VirtualGrid({ items, onContextMenu, selectedIds, onToggleSelection, onToggleDateSelection, onNavigate, onUpdateItem, onUpdateTrip, animatingTargetId, metadata, onDropToEvent }) {
  const parentRef = useRef(null);
  const updateHandler = onUpdateItem || onUpdateTrip;

  const handlePhotoDragStart = (e, fileInfo) => {
    // Drag all selected photos if this card is selected, otherwise just this one
    const paths = (selectedIds.has(fileInfo.path) && selectedIds.size > 1)
      ? Array.from(selectedIds).filter(id => !id.includes(':'))
      : [fileInfo.path];
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('photo-paths', JSON.stringify(paths));
  };

  // Selection box state
  const [dragStart, setDragStart] = useState(null);
  const [dragCurrent, setDragCurrent] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragWasActive = useRef(false);

  const virtualRows = useMemo(() => groupItemsIntoRows(items), [items]);

  const virtualizer = useVirtualizer({
    count: virtualRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => {
      const row = virtualRows[i];
      if (row.type === 'header') return 80;
      if (row.type === 'new-page') return 220;
      return 240; // grid row height estimate (card + gap)
    },
    overscan: 4,
  });

  const handleMassSelection = (rect, isAppend) => {
    if (!parentRef.current) return;
    const cardElements = parentRef.current.querySelectorAll('[data-item-key]');
    const newlySelected = new Set(isAppend ? selectedIds : []);
    cardElements.forEach(el => {
      const elRect = el.getBoundingClientRect();
      const itemKey = el.getAttribute('data-item-key');
      const isIntersecting = !(
        rect.left > elRect.right || rect.right < elRect.left ||
        rect.top > elRect.bottom || rect.bottom < elRect.top
      );
      if (isIntersecting) newlySelected.add(itemKey);
    });
    if (onToggleSelection) onToggleSelection(newlySelected, true);
  };

  const onMouseDown = (e) => {
    if (e.button !== 0 || e.target.closest('button') || e.target.closest('input')) return;
    // If clicking on a draggable photo card, let HTML5 drag handle it — don't start rect selection
    if (e.target.closest('[draggable="true"]')) return;
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragCurrent({ x: e.clientX, y: e.clientY });
    setIsDragging(false);
    dragWasActive.current = false;
  };

  const onMouseMove = (e) => {
    if (!dragStart) return;
    const dist = Math.sqrt(Math.pow(e.clientX - dragStart.x, 2) + Math.pow(e.clientY - dragStart.y, 2));
    if (dist > 5) {
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
        bottom: Math.max(dragStart.y, dragCurrent.y),
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

  // Safety cleanup: if an HTML5 drag ends while rect selection is active, reset state
  useEffect(() => {
    const cleanup = () => {
      setDragStart(null);
      setDragCurrent(null);
      setIsDragging(false);
      dragWasActive.current = false;
    };
    window.addEventListener('dragend', cleanup);
    return () => window.removeEventListener('dragend', cleanup);
  }, []);

  // Auto-scroll the grid when dragging near top/bottom edge
  useEffect(() => {
    let animFrame = null;
    const ZONE = 120;   // px from edge to start scrolling
    const MAX_SPEED = 18;

    const onDragOver = (e) => {
      const container = parentRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const relY = e.clientY - rect.top;
      const h = rect.height;

      let speed = 0;
      if (relY < ZONE) speed = -MAX_SPEED * (1 - relY / ZONE);
      else if (relY > h - ZONE) speed = MAX_SPEED * (1 - (h - relY) / ZONE);

      if (animFrame) cancelAnimationFrame(animFrame);
      if (speed !== 0) {
        const tick = () => { container.scrollBy(0, speed); animFrame = requestAnimationFrame(tick); };
        animFrame = requestAnimationFrame(tick);
      }
    };

    const stop = () => { if (animFrame) cancelAnimationFrame(animFrame); animFrame = null; };

    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragend', stop);
    window.addEventListener('drop', stop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragend', stop);
      window.removeEventListener('drop', stop);
      stop();
    };
  }, []);

  const selectionBoxStyle = useMemo(() => {
    if (!dragStart || !dragCurrent || !isDragging) return null;
    return {
      left: Math.min(dragStart.x, dragCurrent.x),
      top: Math.min(dragStart.y, dragCurrent.y),
      width: Math.abs(dragStart.x - dragCurrent.x),
      height: Math.abs(dragStart.y - dragCurrent.y),
    };
  }, [dragStart, dragCurrent, isDragging]);

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
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const row = virtualRows[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {row.type === 'header' && (() => {
                const photosOnDate = items.filter(p => p.type === 'photo' && p.date === row.item.date);
                const selectedOnDate = photosOnDate.filter(p => selectedIds.has(p.path));
                const isAllSelected = photosOnDate.length > 0 && selectedOnDate.length === photosOnDate.length;
                const isPartialSelected = selectedOnDate.length > 0 && selectedOnDate.length < photosOnDate.length;
                return (
                  <div className="py-6 bg-black/5 backdrop-blur-md -mx-10 px-10 mb-4 flex items-center gap-4 border-b border-white/5 group/header">
                    <div className="flex items-center gap-4">
                      <h2 className="text-3xl font-light tracking-tight text-white/90">{row.item.title}</h2>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleDateSelection?.(row.item.date, !isAllSelected);
                        }}
                        className={clsx(
                          "flex items-center gap-2 px-3 py-1 rounded-full border transition-all",
                          isAllSelected
                            ? "bg-blue-600/20 border-blue-500/50 text-blue-400"
                            : (isPartialSelected
                              ? "bg-white/5 border-white/20 text-blue-400/70"
                              : "bg-white/5 border-white/10 text-neutral-500 hover:border-white/20 hover:text-neutral-300 opacity-0 group-hover/header:opacity-100")
                        )}
                      >
                        {isAllSelected ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {isAllSelected ? '已全选' : (isPartialSelected ? '部分选中' : '全选')}
                        </span>
                      </button>
                      <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                        {photosOnDate.length} 张照片
                      </span>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
                  </div>
                );
              })()}

              {row.type === 'grid' && (
                <div
                  className="w-full grid gap-4 pb-4"
                  style={{ gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))` }}
                >
                  {row.items.map((item, i) => {
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
                          onUpdate={updateHandler}
                          fileInfo={item}
                          animatingTargetId={animatingTargetId}
                          metadata={metadata}
                          onDragStart={(e) => handlePhotoDragStart(e, item)}
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
                        onUpdateTrip={updateHandler}
                        onNavigate={onNavigate}
                        onContextMenu={onContextMenu}
                        onDropToEvent={onDropToEvent}
                      />
                    );
                  })}
                </div>
              )}

              {row.type === 'new-page' && (
                <div
                  className="w-full grid gap-4"
                  style={{ gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))` }}
                >
                  <motion.div
                    layout
                    onClick={() => updateHandler?.('NEW_POP_MODAL')}
                    className="border border-dashed border-white/8 rounded-xl flex flex-col items-center justify-center gap-1.5 text-white/20 hover:text-white/40 hover:border-white/15 transition-all cursor-pointer min-h-[180px]"
                  >
                    <PlusIcon size={20} />
                    <span className="text-[11px] font-medium">New page</span>
                  </motion.div>
                </div>
              )}
            </div>
          );
        })}
      </div>

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
