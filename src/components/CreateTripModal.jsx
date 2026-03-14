import { motion, AnimatePresence } from 'framer-motion';
import { X, Plane, Briefcase, CheckCircle2, Layers, Flag, Calendar, Activity, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import clsx from 'clsx';

const STAGES = ['Planning', 'Completed', 'Ongoing', 'Canceled'];

export function CreateTripModal({ isOpen, onClose, events, onCreate, initialSelectedIds = [] }) {
  const [title, setTitle] = useState('');
  const [country, setCountry] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stage, setStage] = useState('Completed');
  const [selectedEventIds, setSelectedEventIds] = useState(new Set(initialSelectedIds));

  useEffect(() => {
    if (isOpen) {
      setSelectedEventIds(new Set(initialSelectedIds));
    }
  }, [isOpen, initialSelectedIds]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title) return;
    
    onCreate({
      title,
      country,
      startDate,
      endDate,
      stage,
      eventIds: Array.from(selectedEventIds),
    });
    
    onClose();
    // Reset
    setTitle('');
    setCountry('');
    setStartDate('');
    setEndDate('');
    setStage('Completed');
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
                  <div className="p-2.5 bg-purple-500/20 rounded-xl">
                    <Plus size={20} className="text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-white">开启新行程档案</h3>
                    <p className="text-xs text-neutral-500 font-medium">
                      正在将 {selectedEventIds.size} 个选定事件归档到新行程
                    </p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-neutral-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2 ml-1">行程标题</label>
                      <input
                        autoFocus
                        type="text"
                        className="w-full bg-white/5 border border-white/10 focus:border-purple-500/50 rounded-2xl px-5 py-4 font-medium outline-none transition-all placeholder:text-neutral-600 focus:ring-1 focus:ring-purple-500/10 text-white"
                        placeholder="例如：巴塞罗那 2024 夏日庆典"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2 ml-1">国家 / 地区</label>
                      <div className="relative">
                        <Flag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" />
                        <input
                          type="text"
                          className="w-full bg-white/5 border border-white/10 focus:border-purple-500/50 rounded-2xl pl-12 pr-5 py-4 font-medium outline-none transition-all placeholder:text-neutral-600 focus:ring-1 focus:ring-purple-500/10 text-white"
                          placeholder="Japan / Spain..."
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2 ml-1">当前阶段</label>
                      <div className="flex flex-wrap gap-2">
                        {STAGES.map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setStage(s)}
                            className={clsx(
                              "px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border",
                              stage === s 
                                ? "bg-purple-500/20 border-purple-500/50 text-purple-400" 
                                : "bg-white/5 border-white/5 text-neutral-500 hover:border-white/20"
                            )}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2 ml-1">开始日期</label>
                        <input
                          type="date"
                          className="w-full bg-white/5 border border-white/10 focus:border-purple-500/50 rounded-2xl px-4 py-4 text-sm font-medium outline-none transition-all text-white [color-scheme:dark]"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2 ml-1">结束日期</label>
                        <input
                          type="date"
                          className="w-full bg-white/5 border border-white/10 focus:border-purple-500/50 rounded-2xl px-4 py-4 text-sm font-medium outline-none transition-all text-white [color-scheme:dark]"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="p-6 bg-purple-500/5 border border-dashed border-purple-500/20 rounded-2xl flex flex-col items-center justify-center text-center">
                      <Layers size={24} className="text-purple-500/40 mb-2" />
                      <p className="text-[11px] text-neutral-500 font-medium italic">创建后，已选的事件将自动关联到此行程档案中。</p>
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
                    className="flex-[2] px-6 py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed font-bold transition-all shadow-xl shadow-purple-900/20 text-white"
                  >
                    创建行程并完成归档
                  </button>
                </div>
              </form>
            </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
