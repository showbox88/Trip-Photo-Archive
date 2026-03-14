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

// 根据标签名 hash 稳定分配颜色，与截图效果一致
const TAG_PALETTES = [
  'bg-red-500/20 text-red-400',
  'bg-blue-500/20 text-blue-400',
  'bg-emerald-500/20 text-emerald-400',
  'bg-amber-500/20 text-amber-400',
  'bg-purple-500/20 text-purple-400',
  'bg-pink-500/20 text-pink-400',
  'bg-cyan-500/20 text-cyan-400',
  'bg-orange-500/20 text-orange-400',
  'bg-teal-500/20 text-teal-400',
  'bg-lime-600/20 text-lime-400',
  'bg-indigo-500/20 text-indigo-400',
  'bg-rose-500/20 text-rose-400',
];

function tagColor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return TAG_PALETTES[Math.abs(h) % TAG_PALETTES.length];
}

function Tag({ label, small }) {
  return (
    <span className={clsx(
      'rounded px-1.5 font-semibold whitespace-nowrap',
      small ? 'py-px text-[8px]' : 'py-0.5 text-[9px]',
      tagColor(label)
    )}>
      {label}
    </span>
  );
}

// ─── Trip Card (竖向 Notion 画廊样式) ──────────────────────────────────────────
function TripCard({ item, photos, associatedEvents = [], isSelected, onToggleSelection, onNavigate, onContextMenu, onUpdateTrip }) {
  const startDate = item.start_date ? new Date(item.start_date) : null;
  const endDate   = item.end_date   ? new Date(item.end_date)   : null;
  const duration  = startDate && endDate ? differenceInDays(endDate, startDate) + 1 : 0;
  const cities    = Array.from(new Set(associatedEvents.map(e => e.city).filter(Boolean)));
  const rating    = item.rate ?? Math.max(1, Math.min(8, Math.floor(photos.length / 8) + 2));

  const countries = (item.country || '')
    .split(/[,、\s\/]+/)
    .map(s => s.trim())
    .filter(Boolean);

  const [activeMenu, setActiveMenu] = useState(null);
  const menuRef = useRef(null);
  const currentStage = STAGES.find(s => s.id === (item.stage || 'Completed')) || STAGES[2];

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
      onClick={(e) => { e.stopPropagation(); onToggleSelection(`trip:${item.trip_id}`); }}
      onDoubleClick={(e) => { e.stopPropagation(); onNavigate({ type: 'trip', id: item.trip_id }); }}
      onContextMenu={(e) => onContextMenu(e, { ...item, type: 'trip' })}
      className={clsx(
        'relative flex flex-col cursor-pointer group rounded-xl overflow-visible',
        'bg-[#191a21] border border-white/5 shadow-lg transition-all duration-200',
        isSelected ? 'ring-2 ring-blue-500/50' : 'hover:border-white/10 hover:bg-[#1e1f28]',
        activeMenu ? 'z-[200]' : 'z-10'
      )}
    >
      {/* ── Cover photo ── */}
      <div className="relative w-full aspect-[3/2] overflow-hidden rounded-t-xl shrink-0">
        {photos.length > 0 ? (
          <CoverImage photo={photos[0]} />
        ) : (
          <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
            <Plane className="text-neutral-700" size={28} />
          </div>
        )}
      </div>

      {/* ── Metadata body ── */}
      <div ref={menuRef} className="p-2.5 flex flex-col gap-1.5 relative">

        {/* Country tags */}
        {countries.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {countries.map(c => <Tag key={c} label={c} />)}
          </div>
        )}

        {/* City tags */}
        {cities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {cities.map(c => <Tag key={c} label={c} small />)}
          </div>
        )}

        {/* Date range */}
        <button
          onClick={(e) => { e.stopPropagation(); setActiveMenu('date'); }}
          className="text-left text-[9px] text-neutral-400 hover:text-neutral-200 transition-colors leading-snug"
        >
          {startDate ? format(startDate, 'MMMM d, yyyy') : '...'} → {endDate ? format(endDate, 'MMMM d, yyyy') : '...'}
        </button>

        {/* Duration */}
        <p className="text-[9px] text-neutral-600">Duration: {duration} Days</p>

        {/* Hearts rating */}
        <button
          onClick={(e) => { e.stopPropagation(); setActiveMenu('rating'); }}
          className="flex gap-0.5 hover:opacity-80 transition-opacity"
        >
          {[...Array(Math.min(rating, 10))].map((_, i) => (
            <Heart key={i} size={9} className="fill-white/70 text-white/70" />
          ))}
        </button>

        {/* Status badge */}
        <div className="flex items-center justify-between">
          <button
            onClick={(e) => { e.stopPropagation(); setActiveMenu('status'); }}
            className={clsx(
              'px-2 py-0.5 text-[8px] font-bold rounded border flex items-center gap-1 hover:brightness-125 transition-all',
              currentStage.bg, currentStage.border, currentStage.color
            )}
          >
            {currentStage.id} <ChevronDown size={7} />
          </button>
          <span className="text-[8px] text-white/20 font-mono">{photos.length}P</span>
        </div>

        {/* ── Dropdowns ── */}
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

          {activeMenu === 'rating' && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              className="absolute bottom-full mb-2 left-2 z-[300] w-32 bg-[#25262e] border border-white/10 rounded-lg shadow-2xl p-2 backdrop-blur-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[7px] text-white/40 font-bold px-1 pb-1 uppercase tracking-widest">Set Rating</p>
              <div className="flex gap-1 flex-wrap">
                {[1,2,3,4,5,6,7,8].map(v => (
                  <button
                    key={v}
                    onClick={() => { onUpdateTrip(item.trip_id, { rate: v }); setActiveMenu(null); }}
                    className={clsx('w-5 h-5 flex items-center justify-center rounded transition-colors', v <= (item.rate || 0) ? 'text-white' : 'text-white/20 hover:text-white/50')}
                  >
                    <Heart size={9} fill={v <= (item.rate || 0) ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
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
                {[['Start Date', 'start_date', item.start_date], ['End Date', 'end_date', item.end_date]].map(([label, field, val]) => (
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
      </div>

      {/* Selection dot */}
      <div className={clsx(
        'absolute top-2 right-2 z-40 w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-300',
        isSelected
          ? 'bg-blue-500 border-blue-400 scale-110 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
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

// ─── Event Card (方形堆叠样式，保持原有) ─────────────────────────────────────────
function EventCard({ item, photos, isSelected, onToggleSelection, onNavigate, onContextMenu }) {
  const itemId = item.event_id || item.id;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 150, damping: 25 }}
      onClick={(e) => { e.stopPropagation(); onToggleSelection(`event:${itemId}`); }}
      onDoubleClick={(e) => { e.stopPropagation(); onNavigate({ type: 'event', id: itemId }); }}
      onContextMenu={(e) => onContextMenu(e, { ...item, type: 'event' })}
      className={clsx('relative aspect-[3/2] cursor-pointer group', isSelected && 'scale-[0.96]')}
      whileHover={{ scale: 1.03, y: -4, transition: { type: 'spring', stiffness: 400, damping: 30 } }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute inset-[2%] rounded-2xl bg-white/[0.02] border border-white/5 translate-y-[-4px] group-hover:translate-y-[-8px] transition-transform duration-500" />
        <div className="absolute inset-[1%] rounded-2xl bg-white/[0.04] border border-white/10 translate-y-[-2px] group-hover:translate-y-[-4px] transition-transform duration-500" />
        <div className="relative w-full h-full p-1">
          <div className={clsx(
            'w-full h-full rounded-2xl overflow-hidden border transition-all duration-500',
            isSelected ? 'border-emerald-500 ring-4 ring-emerald-500/20' : 'border-white/20 group-hover:border-emerald-400/40 shadow-2xl'
          )}>
            {photos.length > 0 ? <CoverImage photo={photos[0]} /> : (
              <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
                <Map className="text-neutral-700" size={28} />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 inset-x-4 z-30">
        <div className="flex items-center gap-2 mb-1">
          <div className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-[0.15em] backdrop-blur-md border bg-emerald-500/10 border-emerald-500/30 text-emerald-400">LOCAL EVENT</div>
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[9px] text-white/40 font-mono">{photos.length}P</span>
        </div>
        <h3 className="text-white text-sm font-bold truncate drop-shadow-md">{item.title}</h3>
      </div>

      <div className={clsx(
        'absolute top-4 left-4 z-40 w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300',
        isSelected ? 'bg-blue-500 border-blue-400 scale-110' : 'bg-black/40 border-white/20 opacity-0 group-hover:opacity-100'
      )}>
        {isSelected && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </motion.div>
  );
}

// ─── Public export ─────────────────────────────────────────────────────────────
export function CollectionCard({ type, item, photos, associatedEvents = [], isSelected, onToggleSelection, onNavigate, onContextMenu, onUpdateTrip }) {
  if (type === 'trip') {
    return (
      <TripCard
        item={item}
        photos={photos}
        associatedEvents={associatedEvents}
        isSelected={isSelected}
        onToggleSelection={onToggleSelection}
        onNavigate={onNavigate}
        onContextMenu={onContextMenu}
        onUpdateTrip={onUpdateTrip}
      />
    );
  }
  return (
    <EventCard
      item={item}
      photos={photos}
      isSelected={isSelected}
      onToggleSelection={onToggleSelection}
      onNavigate={onNavigate}
      onContextMenu={onContextMenu}
    />
  );
}

function CoverImage({ photo }) {
  const imgUrl = useObjectUrl(photo.handle);
  return imgUrl
    ? <img src={imgUrl} className="w-full h-full object-cover" alt="" />
    : <div className="w-full h-full bg-neutral-800 animate-pulse" />;
}
