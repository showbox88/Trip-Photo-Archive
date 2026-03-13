import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Info, Trash2, Tag, Move, Layers, ChevronRight, Briefcase } from 'lucide-react';
import { useState } from 'react';

export function ContextMenu({ menu, onClose, onAction, selectionCount, trips = [] }) {
  const [activeSubmenu, setActiveSubmenu] = useState(null);

  if (!menu) return null;

  const isBulk = selectionCount > 1;
  const targetType = menu.data?.type || 'photo';

  const handleAction = (id, extraData) => {
    onAction(id, menu.data, extraData);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.1 }}
      className="fixed z-[100] min-w-[220px] bg-[#1a1b1e]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-2 flex flex-col gap-1 ring-1 ring-black/50"
      style={{ top: menu.mouseY, left: menu.mouseX }}
      onMouseLeave={() => setActiveSubmenu(null)}
    >
      <div className="px-3 py-2 border-b border-white/5 mb-1">
        <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">{isBulk ? '批量管理' : '管理档案'}</p>
        <p className="text-xs text-neutral-300 truncate font-medium">
          {isBulk ? `${selectionCount} 个已选项目` : menu.data?.name || menu.data?.title}
        </p>
      </div>
      
      {/* Photo Actions */}
      {targetType === 'photo' && (
        <button
          onClick={() => handleAction('create-event')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-all group text-blue-400"
        >
          <PlusCircle size={18} className="group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium text-neutral-200 group-hover:text-white">聚集到新事件</span>
        </button>
      )}

      {/* Event Actions: Archiving */}
      {targetType === 'event' && (
        <>
          <button
            onClick={() => handleAction('create-trip')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-all group text-purple-400"
          >
            <PlusCircle size={18} className="group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-neutral-200 group-hover:text-white">归档到新行程</span>
          </button>

          <div className="relative">
            <button
              onMouseEnter={() => setActiveSubmenu('trips')}
              className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-all group text-purple-400"
            >
              <div className="flex items-center gap-3">
                <Layers size={18} className="group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-neutral-200 group-hover:text-white">归档到已有行程</span>
              </div>
              <ChevronRight size={14} className="text-neutral-600 group-hover:text-white transition-colors" />
            </button>

            <AnimatePresence>
              {activeSubmenu === 'trips' && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute left-full top-0 ml-2 min-w-[200px] bg-[#1a1b1e]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-2 flex flex-col gap-1 ring-1 ring-black/50"
                >
                  <p className="px-3 py-1.5 text-[9px] uppercase tracking-widest text-neutral-600 font-black">选择目标行程</p>
                  {trips.length === 0 ? (
                    <p className="px-3 py-4 text-xs text-neutral-500 italic">暂无已有行程</p>
                  ) : (
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                      {trips.map(trip => (
                        <button
                          key={trip.trip_id}
                          onClick={() => handleAction('assign-to-trip', { tripId: trip.trip_id, title: trip.title })}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-purple-500/20 transition-all group text-left"
                        >
                          <Briefcase size={14} className="text-purple-400/50 group-hover:text-purple-400" />
                          <span className="text-xs font-medium text-neutral-300 group-hover:text-white truncate">{trip.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      <div className="h-px bg-white/5 my-1" />
      
      <button
        onClick={() => handleAction('info')}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-all group text-neutral-400"
      >
        <Info size={18} className="group-hover:scale-110 transition-transform" />
        <span className="text-sm font-medium text-neutral-200 group-hover:text-white">查看详情</span>
      </button>
      
      <button
        onClick={() => handleAction('delete')}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 transition-all group text-red-400"
      >
        <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
        <span className="text-sm font-medium text-red-400/80 group-hover:text-red-400">移除</span>
      </button>
    </motion.div>
  );
}
