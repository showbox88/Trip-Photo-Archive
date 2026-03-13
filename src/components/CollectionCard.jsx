import { motion } from 'framer-motion';
import { Layers, Map, Plane, MoreVertical } from 'lucide-react';
import { useObjectUrl } from '../hooks/useObjectUrl';
import clsx from 'clsx';

/**
 * A stacked card representation of a collection (Event or Trip)
 */
export function CollectionCard({ type, item, photos, index, onContextMenu, isSelected, onToggleSelection, onNavigate }) {
  // Use the first few photos as the stack preview
  const previewPhotos = photos.slice(0, 3);
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20
      }}
      onClick={(e) => {
        e.stopPropagation();
        onToggleSelection(`${type}:${item.id}`);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onNavigate({ type, id: item.id });
      }}
      onContextMenu={(e) => onContextMenu(e, { ...item, type })}
      className={clsx(
        "relative aspect-square cursor-pointer group",
        isSelected ? "scale-[0.96]" : "hover:scale-105"
      )}
    >
      {/* Visual Stacking Effect */}
      <div className="absolute inset-0 flex items-center justify-center">
        {previewPhotos.length > 0 ? (
          previewPhotos.map((photo, idx) => (
            <PhotoStackItem 
              key={photo.path} 
              photo={photo} 
              index={idx} 
              total={previewPhotos.length}
              isSelected={isSelected}
            />
          ))
        ) : (
          <div className="w-[85%] h-[85%] rounded-2xl bg-neutral-800 border-2 border-dashed border-white/10 flex items-center justify-center">
            {type === 'trip' ? <Plane className="text-neutral-600" size={32}/> : <Map className="text-neutral-600" size={32}/>}
          </div>
        )}
      </div>

      {/* Selection Indicator */}
      <div className={clsx(
        "absolute top-3 left-3 z-40 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
        isSelected ? "bg-blue-500 border-blue-500 scale-110 shadow-lg" : "bg-black/20 border-white/40 opacity-0 group-hover:opacity-100"
      )}>
        {isSelected && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>

      {/* Type Badge & Info */}
      <div className="absolute bottom-0 inset-x-0 p-4 z-30">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl">
           <div className="flex items-center gap-2 mb-1">
              <div className={clsx(
                "p-1 rounded-md",
                type === 'trip' ? "bg-purple-500/20 text-purple-400" : "bg-emerald-500/20 text-emerald-400"
              )}>
                {type === 'trip' ? <Plane size={12}/> : <Map size={12}/>}
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest opacity-60">
                {type === 'trip' ? 'Trip' : 'Event'}
              </span>
           </div>
           <p className="text-white text-sm font-bold truncate">{item.title}</p>
           <p className="text-[10px] text-white/50 font-medium">{photos.length} Items</p>
        </div>
      </div>
    </motion.div>
  );
}

function PhotoStackItem({ photo, index, total, isSelected }) {
  // We manually handle the URL generation here for the stack preview
  const imgUrl = useObjectUrl(photo.handle);
  
  // Dynamic offset for the stack effect
  const offset = index * 8;
  const rotate = (index - (total - 1) / 2) * 5;

  return (
    <motion.div
      className={clsx(
        "absolute w-[85%] h-[85%] rounded-2xl overflow-hidden shadow-2xl border transition-colors",
        isSelected ? "border-blue-500" : "border-white/10"
      )}
      style={{
        transform: `translate(${offset}px, ${-offset}px) rotate(${rotate}deg)`,
        zIndex: 10 - index,
        boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
      }}
    >
      {imgUrl ? (
        <img src={imgUrl} className="w-full h-full object-cover" alt="" />
      ) : (
        <div className="w-full h-full bg-neutral-800 animate-pulse" />
      )}
      <div className="absolute inset-0 bg-black/10" />
    </motion.div>
  );
}
