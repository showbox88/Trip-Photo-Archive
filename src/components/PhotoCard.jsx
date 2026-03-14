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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.02, 
        duration: 0.5,
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
      whileHover={{ 
        scale: 1.02, 
        zIndex: 10,
      }}
      whileTap={{ scale: 0.98 }}
      className={clsx(
        "relative aspect-[3/2] rounded-[1.5rem] overflow-hidden bg-[#1a1b1e] transition-all cursor-pointer group",
        isSelected ? "p-1.5 bg-blue-600" : "hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
      )}
    >
      <div className={clsx(
        "relative w-full h-full overflow-hidden",
        isSelected ? "rounded-[1.2rem]" : "rounded-[1.5rem]"
      )}>
        {/* Selection Checkbox (Top Right - Matching Screenshot) */}
        <div className={clsx(
          "absolute top-3 right-3 z-30 w-6 h-6 rounded-full flex items-center justify-center transition-all shadow-lg",
          isSelected 
            ? "bg-blue-500 scale-100" 
            : "bg-black/20 backdrop-blur-md border border-white/20 opacity-0 group-hover:opacity-100 scale-90"
        )}>
          {isSelected && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>
          )}
        </div>

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
          <div className="w-full h-full animate-pulse bg-white/5" />
        )}
        
        {/* Subtle Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </motion.div>
  );
}
