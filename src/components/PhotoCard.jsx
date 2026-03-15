import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import * as idb from '../utils/idb';
import { useObjectUrl } from '../hooks/useObjectUrl';
import { Image, MoreVertical, Calendar, Heart } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

export function PhotoCard({ fileInfo, index, onContextMenu, isSelected, onToggleSelection, onNavigate, onUpdate, animatingTargetId }) {
  const [thumbUrl, setThumbUrl] = useState(null);
  const rawUrl = useObjectUrl(fileInfo.handle);
  
  const date = fileInfo.timestamp ? new Date(fileInfo.timestamp) : null;
  const rating = fileInfo.rating ?? 0;
  
  // 异步加载缩略图
  useEffect(() => {
    let isMounted = true;
    async function loadThumb() {
      try {
        const cached = await idb.get(fileInfo.path, 'ThumbnailStore');
        if (isMounted && cached) {
          setThumbUrl(cached);
        }
      } catch (e) {}
    }
    loadThumb();
    return () => { isMounted = false; };
  }, [fileInfo.path]);

  // 渲染时优先使用缩略图
  const displayUrl = thumbUrl || rawUrl;
  
  const displayTitle = fileInfo.name.replace(/\.[^/.]+$/, "");
  const finalLayoutId = (isSelected && animatingTargetId) ? animatingTargetId : fileInfo.path;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.01, 
        duration: 0.4,
        ease: "easeOut"
      }}
      onContextMenu={(e) => onContextMenu(e, fileInfo)}
      onClick={(e) => {
        e.stopPropagation();
        onToggleSelection(fileInfo.path, index, e);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onNavigate({ type: 'photo', data: fileInfo });
      }}
      whileTap={{ scale: 0.98 }}
      className={clsx(
        "relative flex flex-col cursor-pointer group rounded-xl overflow-visible",
        "bg-[#191a21] border border-white/5 shadow-lg transition-all duration-300",
        isSelected 
          ? "ring-4 ring-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.4)]" 
          : "hover:border-blue-500/30 hover:shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:bg-[#1e1f28]"
      )}
    >
      <div className="relative w-full aspect-[3/2] overflow-hidden rounded-t-xl shrink-0 bg-neutral-900">
        {displayUrl ? (
          <motion.img 
            layoutId={finalLayoutId}
            src={displayUrl} 
            alt={fileInfo.name} 
            className={clsx(
                "w-full h-full object-cover transition-transform duration-500 group-hover:scale-110",
                isSelected && "brightness-90 opacity-80"
            )}
            transition={{ 
              type: "spring", stiffness: 220, damping: 22, mass: 1.1, duration: 1.0
            }}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-20">
            <Image className="text-white" size={28} />
          </div>
        )}

        <div className={clsx(
          "absolute top-2 right-2 z-40 w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-300",
          isSelected
            ? "bg-blue-500 border-blue-400 scale-110 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
            : "bg-black/40 border-white/20 opacity-0 group-hover:opacity-100 backdrop-blur-md"
        )}>
          {isSelected && (
            <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>

      <div className="p-2 flex flex-col gap-1 relative">
        <div className="flex items-center justify-between gap-2 mt-0.5 min-w-0">
          <h3 className="text-white text-[10px] font-bold truncate leading-tight flex-1">
            {displayTitle}
          </h3>
          <div className="flex items-center shrink-0">
            {[...Array(10)].map((_, i) => {
              const active = i < rating;
              return (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    const newRating = i + 1;
                    onUpdate?.(fileInfo.path, { rating: newRating }, 'photo');
                  }}
                  className={clsx(
                    "transition-all hover:scale-125 active:scale-95",
                    active ? "text-red-500" : "text-white/10 hover:text-white/30"
                  )}
                >
                  <Heart size={8} fill={active ? "currentColor" : "none"} strokeWidth={active ? 0 : 2} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="text-[8px] text-neutral-600 truncate">
            {date ? format(date, 'MMM d, yyyy') : 'Unknown'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
