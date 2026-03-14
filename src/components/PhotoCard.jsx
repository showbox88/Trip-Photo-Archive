import { motion } from 'framer-motion';
import { useObjectUrl } from '../hooks/useObjectUrl';
import { MoreVertical, Image } from 'lucide-react';
import clsx from 'clsx';

/**
 * Renders a single photo with Framer Motion animations
 * and lazy-loading of Blob URLs using the file handle.
 */
export function PhotoCard({ fileInfo, index, onContextMenu, isSelected, onToggleSelection, onNavigate }) {
  // `useObjectUrl` only generates the Blob URL if this component is rendered.
  // This saves immense memory across 6000 photos.
  const imgUrl = useObjectUrl(fileInfo.handle);

  return (
    <motion.div
      // A gentle stagger effect during the initial 'Gathering' layout animation
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 0.85, y: 0 }}
      transition={{ 
        delay: index * 0.05, 
        duration: 0.8, 
        type: "spring",
        stiffness: 150,
        damping: 25
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
      whileHover={{ 
        scale: 0.88, 
        zIndex: 10,
        boxShadow: "0 0 25px rgba(59, 130, 246, 0.4), 0 0 50px rgba(59, 130, 246, 0.1)"
      }}
      whileTap={{ scale: 0.82 }}
      className={clsx(
        "relative aspect-square rounded-2xl overflow-hidden bg-white/5 shadow-2xl ring-1 transition-all cursor-pointer group",
        isSelected ? "ring-blue-500 ring-4" : "ring-white/10 group-hover:ring-blue-400/50"
      )}
      style={{
        // Give it the 'Visual Stacking' feel requested
        boxShadow: isSelected 
          ? "0 0 30px rgba(59, 130, 246, 0.4)" 
          : "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
      }}
    >
      {/* Selection Checkbox (Top Left) */}
      <div className={clsx(
        "absolute top-3 left-3 z-30 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
        isSelected 
          ? "bg-blue-500 border-blue-500 scale-110 shadow-lg" 
          : "bg-black/20 border-white/40 opacity-0 group-hover:opacity-100"
      )}>
        {isSelected && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
        )}
      </div>

      {/* Context Menu Trigger Overlay */}
      <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="p-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-white/70 hover:text-white">
          <MoreVertical size={16} />
        </div>
      </div>

      {imgUrl ? (
        <img 
          src={imgUrl} 
          alt={fileInfo.name} 
          className="w-full h-full object-cover" 
          loading="lazy"
        />
      ) : (
        // Skeleton while loading Blob
        <div className="w-full h-full animate-pulse bg-white/10" />
      )}
      
      {/* Glassmorphism Name Tag */}
      <div className="absolute bottom-0 inset-x-0 p-4 bg-black/40 backdrop-blur-xl border-t border-white/5">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1 rounded-md bg-blue-500/20 text-blue-400">
            <Image size={10} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest opacity-60 text-white">
            Photo Item
          </span>
        </div>
        <p className="text-white text-xs truncate max-w-full font-bold">
          {fileInfo.name}
        </p>
      </div>
    </motion.div>
  );
}
