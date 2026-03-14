import { motion } from 'framer-motion';
import { useObjectUrl } from '../hooks/useObjectUrl';
import { Image, MoreVertical, Calendar, Heart } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

export function PhotoCard({ fileInfo, index, onContextMenu, isSelected, onToggleSelection, onNavigate, onUpdate }) {
  const imgUrl = useObjectUrl(fileInfo.handle);
  const date = fileInfo.timestamp ? new Date(fileInfo.timestamp) : null;
  const rating = fileInfo.rating ?? 0;
  
  // 提取简单的文件名作为标题（移除扩展名）
  const displayTitle = fileInfo.name.replace(/\.[^/.]+$/, "");

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
        onToggleSelection(fileInfo.path);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onNavigate({ type: 'photo', data: fileInfo });
      }}
      whileTap={{ scale: 0.98 }}
      data-item-key={fileInfo.path}
      className={clsx(
        "relative flex flex-col cursor-pointer group rounded-xl overflow-visible",
        "bg-[#191a21] border border-white/5 shadow-lg transition-all duration-300",
        isSelected 
          ? "ring-4 ring-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.4)]" 
          : "hover:border-blue-500/30 hover:shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:bg-[#1e1f28]"
      )}
    >
      {/* ── Cover photo ── */}
      <div className="relative w-full aspect-[3/2] overflow-hidden rounded-t-xl shrink-0">
        {imgUrl ? (
          <img 
            src={imgUrl} 
            alt={fileInfo.name} 
            className={clsx(
                "w-full h-full object-cover transition-transform duration-500 group-hover:scale-110",
                isSelected && "brightness-90"
            )}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
            <Image className="text-neutral-700" size={28} />
          </div>
        )}

        {/* Selection Checkbox */}
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

      {/* ── Metadata body ── */}
      <div className="p-2.5 flex flex-col gap-1 relative">
        {/* Top Row: Memory Tag & Rating */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold whitespace-nowrap bg-blue-500/20 text-blue-400">
              Memory
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            {[...Array(10)].map((_, i) => {
              const active = i < rating;
              return (
                <button
                  key={i}
                  title={`${i + 1}/10`}
                  onClick={(e) => {
                    e.stopPropagation();
                    const newRating = i + 1;
                    onUpdate?.(fileInfo.path, { rating: newRating }, 'photo');
                  }}
                  className={clsx(
                    "transition-all hover:scale-125 active:scale-95",
                    active ? "text-red-500" : "text-white/20 hover:text-white/40"
                  )}
                >
                  {active ? (
                    <Heart size={10} fill="currentColor" strokeWidth={0} />
                  ) : (
                    <Heart size={10} strokeWidth={2} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-white text-[11px] font-bold truncate mt-1">{displayTitle}</h3>

        {/* Date */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[9px] text-neutral-500">
            {date ? format(date, 'MMM d, yyyy') : 'Unknown Date'}
          </span>
        </div>

        {/* Badge area */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Image size={10} strokeWidth={2.5} />
            <span className="text-[8px] font-black uppercase tracking-wider">Photo</span>
          </div>
          <span className="text-[8px] text-white/10 font-mono italic">#{index + 1}</span>
        </div>
      </div>
    </motion.div>
  );
}
