import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Map, Heart, Calendar as CalendarIcon, Check, ChevronDown } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useObjectUrl } from '../hooks/useObjectUrl';
import clsx from 'clsx';

const STAGES = [
  { id: 'Bucket List', color: 'text-amber-400', bg: 'bg-amber-400/15', border: 'border-amber-400/25' },
  { id: 'Planning',    color: 'text-blue-400',   bg: 'bg-blue-400/15',   border: 'border-blue-400/25' },
  { id: 'Completed',   color: 'text-emerald-400', bg: 'bg-emerald-400/15', border: 'border-emerald-400/25' },
  { id: 'On the way',  color: 'text-rose-400',   bg: 'bg-rose-400/15',   border: 'border-rose-400/25' },
];

// ─── Collection Card (竖向 Notion 画廊样式) ──────────────────────────────────────────
export function CollectionCard({ type, item, photos, index, isSelected, onToggleSelection, onNavigate, onContextMenu, onUpdateTrip, onDropToEvent }) {
  const isTrip = type === 'trip';
  const itemId = isTrip ? item.trip_id : item.event_id;
  const [isDragOver, setIsDragOver] = useState(false);
  const selectionId = `${type}:${itemId}`;
  
  // 颜色配置
  const theme = isTrip 
    ? { primary: 'blue-500', text: 'purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/25', icon: Plane }
    : { primary: 'orange-500', text: 'orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/25', icon: Map };

  const startDate = (isTrip ? item.startDate : item.date) ? new Date(isTrip ? item.startDate : item.date) : null;
  const endDate   = isTrip ? (item.endDate ? new Date(item.endDate) : null) : null;
  const duration  = isTrip ? (item.duration || (startDate && endDate ? differenceInDays(endDate, startDate) + 1 : 0)) : 0;
  
  const rating    = item.rating ?? 0;

  const [activeMenu, setActiveMenu] = useState(null);
  const menuRef = useRef(null);
  const currentStage = isTrip 
    ? (STAGES.find(s => s.id === (item.stage || 'Completed')) || STAGES[2])
    : { id: 'Event', color: theme.text, bg: theme.bg, border: theme.border };

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setActiveMenu(null);
    };
    if (activeMenu) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [activeMenu]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 160, damping: 26 }}
      onClick={(e) => { e.stopPropagation(); onToggleSelection(selectionId, index, e); }}
      onDoubleClick={(e) => { e.stopPropagation(); onNavigate({ type, id: itemId }); }}
      onContextMenu={(e) => onContextMenu(e, { ...item, type })}
      onDragOver={!isTrip ? (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setIsDragOver(true); } : undefined}
      onDragLeave={!isTrip ? () => setIsDragOver(false) : undefined}
      onDrop={!isTrip ? (e) => {
        e.preventDefault();
        setIsDragOver(false);
        try {
          const paths = JSON.parse(e.dataTransfer.getData('photo-paths'));
          if (paths?.length) onDropToEvent?.(itemId, paths);
        } catch {}
      } : undefined}
      data-item-key={selectionId}
      className={clsx(
        'relative flex flex-col cursor-pointer group rounded-xl overflow-visible',
        'bg-[#191a21] border shadow-lg transition-all duration-300',
        isDragOver
          ? 'border-orange-400 shadow-[0_0_40px_rgba(251,146,60,0.5)] scale-[1.02]'
          : (isSelected
            ? (isTrip ? 'ring-4 ring-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.4)] border-white/5' : 'ring-4 ring-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.4)] border-white/5')
            : (isTrip ? 'border-white/5 hover:border-purple-500/30 hover:shadow-[0_0_40px_rgba(168,85,247,0.3)]' : 'border-white/5 hover:border-orange-500/30 hover:shadow-[0_0_40px_rgba(249,115,22,0.3)]')),
        activeMenu ? 'z-[200]' : 'z-10'
      )}
    >
      {/* ── Drop overlay ── */}
      {isDragOver && !isTrip && (
        <div className="absolute inset-0 z-50 rounded-xl flex items-center justify-center bg-orange-500/10 border-2 border-orange-400 pointer-events-none">
          <span className="text-orange-300 text-[11px] font-black uppercase tracking-wider bg-black/60 px-3 py-1.5 rounded-lg backdrop-blur-sm">
            放入此事件
          </span>
        </div>
      )}

      {/* ── Cover photo ── */}
      <div className="relative w-full aspect-[3/2] overflow-hidden rounded-t-xl shrink-0">
        {photos.length > 0 ? (
          <CoverImage 
            photo={item.cover_photo_id ? (photos.find(p => p.path === item.cover_photo_id) || photos[0]) : photos[0]} 
            isSelected={isSelected} 
            layoutId={selectionId} 
          />
        ) : (
          <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
            <theme.icon className="text-neutral-700" size={28} />
          </div>
        )}
      </div>

      {/* ── Metadata body ── */}
      <div ref={menuRef} className="p-3 flex flex-col gap-1.5 relative">

        {/* Tags moved to bottom */}

        {/* Title and Rating Row */}
        <div className="flex items-center justify-between gap-3 mt-1 min-w-0">
          <h3 className="text-white text-[11px] font-bold truncate leading-tight flex-1">
            {item.title}
          </h3>
          <div className="flex items-center gap-0.5 shrink-0">
            {[...Array(10)].map((_, i) => {
              const active = i < rating;
              return (
                <button
                  key={i}
                  title={`${i + 1}/10`}
                  onClick={(e) => {
                    e.stopPropagation();
                    const newRating = i + 1;
                    if (onUpdateTrip) {
                      onUpdateTrip(itemId, { rating: newRating }, type);
                    }
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

        {/* Date range / Date */}
        <button
          onClick={(e) => { if (isTrip) { e.stopPropagation(); setActiveMenu('date'); } }}
          className={clsx(
            "text-left text-[9px] text-neutral-400 transition-colors leading-snug",
            isTrip && "hover:text-neutral-200"
          )}
        >
          {startDate ? format(startDate, 'MMMM d, yyyy') : '...'} 
          {isTrip && (endDate ? ` → ${format(endDate, 'MMMM d, yyyy')}` : ' → ...')}
        </button>

        {/* Duration (Only for Trip) */}
        {isTrip && <p className="text-[9px] text-neutral-600">Duration: {duration} Days</p>}

        {/* Status badge area: Fixed at bottom left */}
        <div className="mt-auto pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* 统一类型标识 (左下角) */}
            <div className={clsx(
              'flex items-center gap-1.5 px-1.5 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-wider',
              theme.bg, theme.border, theme.color
            )}>
              <theme.icon size={10} strokeWidth={2.5} />
              {isTrip ? 'Trip' : 'Event'}
            </div>

            {/* 内容标签已移除 */}

            {/* Trip 专属状态标识 */}
            {isTrip && (
              <button
                onClick={(e) => { e.stopPropagation(); setActiveMenu('status'); }}
                className={clsx(
                  'flex items-center gap-1.5 px-1.5 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-wider transition-all hover:brightness-125',
                  currentStage.bg, currentStage.border, currentStage.color
                )}
              >
                {currentStage.id}
                <ChevronDown size={7} />
              </button>
            )}
          </div>
        </div>

        {/* ── Dropdowns (Only for Trip) ── */}
        {isTrip && (
          <AnimatePresence>
            {activeMenu === 'status' && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                className="absolute bottom-full mb-2 left-2 z-[300] w-36 bg-[#25262e] border border-white/10 rounded-lg shadow-2xl p-1.5 backdrop-blur-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-[7px] text-white/40 font-bold px-2 py-1 uppercase tracking-widest">Select Status</p>
                {STAGES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { onUpdateTrip(item.trip_id, { stage: s.id }); setActiveMenu(null); }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors"
                  >
                    <div className={clsx('w-1.5 h-1.5 rounded-full', s.bg)} />
                    <span className={clsx('text-[10px] font-medium', s.color)}>{s.id}</span>
                    {item.stage === s.id && <Check size={9} className="ml-auto text-white/40" />}
                  </button>
                ))}
              </motion.div>
            )}

            {activeMenu === 'date' && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                className="absolute bottom-full mb-2 left-2 z-[300] w-60 bg-[#25262e] border border-white/10 rounded-lg shadow-2xl p-4 backdrop-blur-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                  <CalendarIcon size={11} className="text-purple-400" /> Edit Date Period
                </p>
                <div className="space-y-3">
                  {[['Start Date', 'startDate', item.startDate], ['End Date', 'endDate', item.endDate]].map(([label, field, val]) => (
                    <div key={field}>
                      <label className="text-[8px] text-white/30 uppercase block mb-1 ml-0.5 font-bold">{label}</label>
                      <input
                        type="date"
                        defaultValue={val}
                        onBlur={(e) => onUpdateTrip(item.trip_id, { [field]: e.target.value })}
                        className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-[11px] text-white focus:border-purple-500/50 outline-none transition-all [color-scheme:dark]"
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Selection dot */}
      <div className={clsx(
        'absolute top-2 right-2 z-40 w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-300',
        isSelected
          ? (isTrip ? 'bg-purple-500 border-purple-400 scale-110 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-orange-500 border-orange-400 scale-110 shadow-[0_0_10px_rgba(249,115,22,0.5)]')
          : 'bg-black/40 border-white/20 opacity-0 group-hover:opacity-100 backdrop-blur-md'
      )}>
        {isSelected && (
          <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </motion.div>
  );
}

function CoverImage({ photo, isSelected, layoutId }) {
  const imgUrl = useObjectUrl(photo.handle);
  return imgUrl
    ? <motion.img 
        layoutId={layoutId}
        src={imgUrl} 
        className={clsx(
          "w-full h-full object-cover transition-transform duration-500 group-hover:scale-110",
          isSelected && "brightness-90"
        )} 
        alt="" 
      />
    : <div className="w-full h-full bg-neutral-800 animate-pulse" />;
}
