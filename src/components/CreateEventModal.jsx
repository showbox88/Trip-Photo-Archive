import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Tags, CheckCircle2, Layers, MapPin, Star, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

const CATEGORIES = ['Sightseeing', 'Food', 'Transport', 'Hotel', 'Shopping', 'Other'];

export function CreateEventModal({ isOpen, onClose, photos, onCreate }) {
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('Sightseeing');
  const [rate, setRate] = useState(0);
  const [notes, setNotes] = useState('');

  if (!isOpen || !photos || photos.length === 0) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title) return;
    
    onCreate({
      title,
      city,
      category,
      rate,
      notes,
      photoIds: photos.map(p => p.path),
    });
    
    // Instead of full screen block, we just close and reset
    onClose();
    setTitle('');
    setCity('');
    setCategory('Sightseeing');
    setRate(0);
    setNotes('');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl bg-[#16171d] border border-white/10 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden"
        >
          <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/20 rounded-xl">
                    <Calendar size={20} className="text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-white">创建新事件</h3>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-neutral-500 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-8 flex items-center gap-6 p-5 bg-white/5 rounded-2xl border border-white/5 ring-1 ring-white/5 overflow-hidden">
                <div className="relative w-20 h-20 shrink-0">
                  {/* Visual Stacking Effect for Multiple Photos */}
                  {photos.slice(0, 3).map((p, idx) => (
                    <div 
                      key={p.path}
                      className="absolute top-0 left-0 w-16 h-16 rounded-xl overflow-hidden shadow-2xl border border-white/10"
                      style={{ 
                        transform: `translate(${idx * 6}px, ${idx * 4}px)`,
                        zIndex: 10 - idx,
                        opacity: 1 - (idx * 0.2)
                      }}
                    >
                      <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                         <Layers size={20} className="text-neutral-500" />
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                   <p className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-1">
                     {photos.length === 1 ? '正在归类照片' : `正在归类 ${photos.length} 张照片`}
                   </p>
                   <p className="text-sm font-medium text-neutral-300 truncate max-w-[200px]">
                     {photos.length === 1 ? photos[0].name : "批量操作"}
                   </p>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2 ml-1">事件名称</label>
                      <input
                        autoFocus
                        type="text"
                        className="w-full bg-white/5 border border-white/10 focus:border-blue-500/50 rounded-2xl px-5 py-4 font-medium outline-none transition-all placeholder:text-neutral-600 focus:ring-1 focus:ring-blue-500/10 text-white"
                        placeholder="例如：圣家堂一日游..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2 ml-1">城市 / 地点</label>
                      <div className="relative">
                        <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" />
                        <input
                          type="text"
                          className="w-full bg-white/5 border border-white/10 focus:border-blue-500/50 rounded-2xl pl-12 pr-5 py-4 font-medium outline-none transition-all placeholder:text-neutral-600 focus:ring-1 focus:ring-blue-500/10 text-white"
                          placeholder="Tokyo, Japan"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2 ml-1">分类</label>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setCategory(cat)}
                            className={clsx(
                              "px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border",
                              category === cat 
                                ? "bg-blue-500/20 border-blue-500/50 text-blue-400" 
                                : "bg-white/5 border-white/5 text-neutral-500 hover:border-white/20"
                            )}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2 ml-1">评价</label>
                      <div className="flex gap-2 p-3 bg-white/5 rounded-2xl border border-white/10 w-fit">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRate(star)}
                            className="focus:outline-none transition-transform active:scale-90"
                          >
                            <Star 
                              size={20} 
                              className={star <= rate ? "fill-yellow-400 text-yellow-400" : "text-neutral-700"} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2 ml-1">笔记 / 日记</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="记录一下此刻的回忆..."
                        rows={5}
                        className="w-full bg-white/5 border border-white/10 focus:border-blue-500/50 rounded-2xl px-5 py-4 font-medium outline-none transition-all placeholder:text-neutral-600 focus:ring-1 focus:ring-blue-500/10 text-white resize-none text-sm custom-scrollbar"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-6 py-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 font-bold transition-all text-neutral-400 hover:text-white"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={!title}
                    className="flex-[2] px-6 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-all shadow-xl shadow-blue-900/20 text-white"
                  >
                    确认创建
                  </button>
                </div>
              </form>
            </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
