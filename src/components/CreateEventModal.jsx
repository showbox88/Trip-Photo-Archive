import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Tags, CheckCircle2, Layers, MapPin, Star, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { useObjectUrl } from '../hooks/useObjectUrl';
import clsx from 'clsx';

const CATEGORIES = ['Sightseeing', 'Food', 'Transport', 'Hotel', 'Shopping', 'Other'];

export function CreateEventModal({ isOpen, onClose, photos, onCreate }) {
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('Sightseeing');
  const [rating, setRating] = useState(8);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [spending, setSpending] = useState(0);
  const [currency, setCurrency] = useState('CNY');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen || !photos || photos.length === 0) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title) return;
    
    onCreate({
      title,
      city,
      category,
      rating,
      date,
      spending: parseFloat(spending) || 0,
      currency,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      notes,
      photoIds: photos.map(p => p.path),
    });
    
    onClose();
    // Reset
    setTitle('');
    setCity('');
    setCategory('Sightseeing');
    setRating(8);
    setDate(new Date().toISOString().split('T')[0]);
    setSpending(0);
    setCurrency('CNY');
    setLatitude('');
    setLongitude('');
    setTags('');
    setNotes('');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-4xl bg-[#16171d] border border-white/10 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden"
        >
          <div className="p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-orange-500/20 rounded-xl">
                    <Calendar size={20} className="text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-white">创建新事件</h3>
                    <p className="text-xs text-neutral-500 font-medium">
                      正在将 {photos.length} 张照片归档至此事件
                    </p>
                  </div>
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
                      <PhotoThumbnail handle={p.handle} />
                    </div>
                  ))}
                </div>
                <div>
                   <p className="text-xs text-orange-400 font-bold uppercase tracking-wider mb-1">
                     正在归类回忆
                   </p>
                   <p className="text-sm font-medium text-neutral-300 truncate max-w-[200px]">
                     {photos.length === 1 ? photos[0].name : `${photos.length} 项所选内容`}
                   </p>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Left Column: Core */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2 ml-1">事件名称</label>
                      <input
                        autoFocus
                        type="text"
                        className="w-full bg-white/5 border border-white/10 focus:border-orange-500/50 rounded-2xl px-5 py-4 font-medium outline-none transition-all placeholder:text-neutral-600 focus:ring-1 focus:ring-orange-500/10 text-white text-sm"
                        placeholder="例如：圣家堂一日游..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2 ml-1">城市 / 地点</label>
                        <input
                          type="text"
                          className="w-full bg-white/5 border border-white/10 focus:border-orange-500/50 rounded-2xl px-4 py-4 font-medium outline-none transition-all placeholder:text-neutral-600 text-white text-sm"
                          placeholder="Tokyo, Japan"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2 ml-1">日期</label>
                        <input
                          type="date"
                          className="w-full bg-white/5 border border-white/10 focus:border-orange-500/50 rounded-2xl px-4 py-4 text-sm font-medium outline-none transition-all text-white [color-scheme:dark]"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2 ml-1">分类</label>
                      <select
                        className="w-full bg-[#1e1f28] border border-white/10 focus:border-orange-500/50 rounded-2xl px-4 py-4 font-medium outline-none transition-all text-white text-sm cursor-pointer"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Middle Column: Detail */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2 ml-1">好感度 (1-10)</label>
                      <div className="flex items-center gap-4 bg-white/5 px-5 py-4 rounded-2xl border border-white/10">
                        <input
                          type="range"
                          min="1"
                          max="10"
                          step="1"
                          className="flex-1 accent-orange-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                          value={rating}
                          onChange={(e) => setRating(parseInt(e.target.value))}
                        />
                        <span className="text-orange-400 font-bold text-lg min-w-[2ch]">{rating}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2 ml-1">消费金额</label>
                        <input
                          type="number"
                          className="w-full bg-white/5 border border-white/10 focus:border-orange-500/50 rounded-2xl px-4 py-4 font-medium outline-none transition-all placeholder:text-neutral-600 text-white text-sm"
                          placeholder="0.00"
                          value={spending}
                          onChange={(e) => setSpending(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2 ml-1">货币</label>
                        <select
                          className="w-full bg-[#1e1f28] border border-white/10 focus:border-orange-500/50 rounded-2xl px-4 py-4 font-medium outline-none transition-all text-white text-sm cursor-pointer"
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                        >
                          <option value="CNY">人民币 (¥)</option>
                          <option value="USD">美元 ($)</option>
                          <option value="JPY">日元 (¥)</option>
                          <option value="EUR">欧元 (€)</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2 ml-1">GPS 纬度</label>
                        <input
                          type="text"
                          className="w-full bg-white/5 border border-white/10 focus:border-orange-500/50 rounded-2xl px-4 py-4 font-medium outline-none transition-all placeholder:text-neutral-600 text-white text-sm"
                          value={latitude}
                          onChange={(e) => setLatitude(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2 ml-1">GPS 经度</label>
                        <input
                          type="text"
                          className="w-full bg-white/5 border border-white/10 focus:border-orange-500/50 rounded-2xl px-4 py-4 font-medium outline-none transition-all placeholder:text-neutral-600 text-white text-sm"
                          value={longitude}
                          onChange={(e) => setLongitude(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Content */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2 ml-1">标签 (用逗号隔开)</label>
                      <input
                        type="text"
                        className="w-full bg-white/5 border border-white/10 focus:border-orange-500/50 rounded-2xl px-5 py-4 font-medium outline-none transition-all placeholder:text-neutral-600 focus:ring-1 focus:ring-orange-500/10 text-white text-sm"
                        placeholder="美食, 拍照, 艺术..."
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2 ml-1">笔记 / 日记</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="记录一下此刻的回忆..."
                        className="w-full h-[155px] bg-white/5 border border-white/10 focus:border-orange-500/50 rounded-2xl px-5 py-4 font-medium outline-none transition-all placeholder:text-neutral-600 focus:ring-1 focus:ring-orange-500/10 text-white resize-none text-sm custom-scrollbar"
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
                    className="flex-[2] px-6 py-4 rounded-2xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-all shadow-xl shadow-orange-900/20 text-white"
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

function PhotoThumbnail({ handle }) {
  const url = useObjectUrl(handle);
  return (
    <div className="w-full h-full bg-neutral-800 flex items-center justify-center overflow-hidden">
      {url ? (
        <img src={url} alt="" className="w-full h-full object-cover opacity-50" />
      ) : (
        <div className="w-4 h-4 border-2 border-white/10 border-t-white/30 rounded-full animate-spin" />
      )}
    </div>
  );
}
