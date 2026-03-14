import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderPlus, Download, Trash2, Layers } from 'lucide-react';

export function ActionBar({ selectionCount, onClear, onMerge, onDownload, onDelete }) {
  if (selectionCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, x: '-50%', opacity: 0 }}
        animate={{ y: 0, x: '-50%', opacity: 1 }}
        exit={{ y: 100, x: '-50%', opacity: 0 }}
        className="fixed bottom-10 left-1/2 z-[200] w-max max-w-[90vw]"
      >
        <div className="bg-[#111215]/80 backdrop-blur-2xl border border-white/10 rounded-full px-6 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-6">
          <div className="flex items-center gap-4 pr-6 border-r border-white/10">
            <button 
              onClick={onClear}
              className="p-1 hover:bg-white/10 rounded-full text-neutral-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
            <div className="flex flex-col">
              <span className="text-white text-sm font-bold tracking-tight">{selectionCount} Photos Selected</span>
              <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Lasso Active</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ActionButton icon={<FolderPlus size={18} />} onClick={() => {}} />
            <ActionButton icon={<Download size={18} />} onClick={onDownload} />
            <ActionButton icon={<Trash2 size={18} className="text-red-400" />} onClick={onDelete} />
          </div>

          <button
            onClick={onMerge}
            className="ml-4 flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-full text-sm font-bold text-white transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <Layers size={16} />
            Merge to Event
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function ActionButton({ icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="p-3 hover:bg-white/5 rounded-full text-neutral-400 hover:text-white transition-all active:scale-90"
    >
      {icon}
    </button>
  );
}
