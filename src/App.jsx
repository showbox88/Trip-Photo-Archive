import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { 
  FolderOpen, Settings, ListFilter, Play, LayoutGrid, AlignJustify, 
  SlidersHorizontal, ArrowUpDown, Search, Plane, Plus, Trash2, 
  ChevronRight, CheckCircle2, ChevronDown, Archive, Calendar 
} from 'lucide-react';
import { useFileSystemAccess } from './hooks/useFileSystemAccess';
import { useContextMenu } from './hooks/useContextMenu';
import { PhotoCard } from './components/PhotoCard';
import { VirtualGrid } from './components/VirtualGrid';
import { ContextMenu } from './components/ContextMenu';
import { CreateEventModal } from './components/CreateEventModal';
import { CreateTripModal } from './components/CreateTripModal';
import { DetailModal } from './components/DetailModal';
import { Sidebar } from './components/Sidebar';
import { Lightbox } from './components/Lightbox';
import { ActionBar } from './components/ActionBar';
import clsx from 'clsx';

function NavLink({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "text-sm font-bold transition-colors cursor-pointer",
        active ? "text-white" : "text-neutral-500 hover:text-neutral-300"
      )}
    >
      {label}
    </button>
  );
}

function App() {
  const { 
    initWorkspace, 
    restoreWorkspace,
    checkPersistedWorkspace,
    hasPersistedHandle,
    isScanning, 
    photoFiles, 
    error, 
    dbHandle, 
    dbContent, 
    saveToDatabase 
  } = useFileSystemAccess();
  
  const { contextMenu, handleContextMenu, closeMenu } = useContextMenu();

  // Create a fast lookup map for DB records by path/filename
  const dbPhotoMap = useMemo(() => {
    const map = new Map();
    (dbContent.photos || []).forEach(p => {
      map.set(p.file_name, p);
    });
    return map;
  }, [dbContent.photos]);

  // Merge scan results (handles) with DB metadata
  const enrichedPhotos = useMemo(() => {
    return photoFiles.map(file => {
      // 统一路径规范化 (处理 Windows \ 与 / 的差异)
      const normalizedPath = file.path.replace(/\\/g, '/');
      const record = (dbContent.photos || []).find(p => {
        const dbPath = p.file_name.replace(/\\/g, '/');
        return dbPath === normalizedPath;
      }) || {};
      return { ...file, ...record, path: normalizedPath };
    });
  }, [photoFiles, dbContent.photos]);

  const [appMode, setAppMode] = useState('home');
  const [activeFilter, setActiveFilter] = useState({ type: 'all' });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [toast, setToast] = useState(null);
  const [activePhotos, setActivePhotos] = useState([]);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxPhotos, setLightboxPhotos] = useState([]);
  const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0);
  const [viewMode, setViewMode] = useState('gallery'); // 'gallery' | 'table'
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
  const [animatingTargetId, setAnimatingTargetId] = useState(null);

  useEffect(() => {
    checkPersistedWorkspace();
  }, [checkPersistedWorkspace]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleInitialize = async () => {
    if (hasPersistedHandle) {
      await restoreWorkspace();
    } else {
      await initWorkspace();
    }
    if (!error) {
       setAppMode('gallery');
    }
  };
  // Handler for all metadata updates (inline/detail modal)
  const handleUpdateItem = async (id, updates, typeOverride) => {
    // Determine type from id or override
    let itemType = typeOverride;
    if (!itemType) {
      if (typeof id === 'string' && id.includes('\\')) itemType = 'photo';
      else if (dbContent.trips.find(t => String(t.trip_id) === String(id))) itemType = 'trip';
      else itemType = 'event';
    }

    const newDbContent = { ...dbContent };

    if (itemType === 'trip') {
      newDbContent.trips = dbContent.trips.map(t => 
        String(t.trip_id) === String(id) ? { ...t, ...updates } : t
      );
    } else if (itemType === 'event') {
      newDbContent.events = dbContent.events.map(e => 
        String(e.event_id) === String(id) ? { ...e, ...updates } : e
      );
    } else if (itemType === 'photo') {
      newDbContent.photos = dbContent.photos.map(p => 
        p.file_name === id ? { ...p, ...updates } : p
      );
    }

    await saveToDatabase(newDbContent);
    showToast(`信息已更新`, itemType === 'trip' ? 'purple' : (itemType === 'event' ? 'orange' : 'blue'));
  };

  // Deprecated: keeping for compatibility with existing components for a moment
  const handleUpdateTrip = (id, updates) => handleUpdateItem(id, updates, 'trip');

  const toggleSelection = (id, indexOrBulk, event) => {
    setSelectedIds(prev => {
      // Handle bulk update (like clearing or rectangle selection)
      if (indexOrBulk === true) {
        return new Set(id);
      }

      const next = new Set(prev);
      const index = typeof indexOrBulk === 'number' ? indexOrBulk : undefined;
      
      // Handle Shift-Click for range selection
      if (event?.shiftKey && lastSelectedIndex !== null && index !== undefined) {
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        
        // Items between start and end inclusive
        const rangeItems = displayedItems.slice(start, end + 1);
        rangeItems.forEach(item => {
          const itemId = item.type === 'photo' ? item.path : `${item.type}:${item.id}`;
          next.add(itemId);
        });
      } else {
        // Normal click
        if (next.has(id)) next.delete(id);
        else next.add(id);
        
        if (index !== undefined) {
          setLastSelectedIndex(index);
        }
      }
      
      return next;
    });
  };

  const onMenuAction = (actionId, targetItem, extraData) => {
    if (actionId === 'create-event') {
      const targets = enrichedPhotos.filter(p => selectedIds.has(p.path));
      setActivePhotos(targets.length > 0 ? targets : [targetItem]);
      setIsEventModalOpen(true);
    } else if (actionId === 'create-trip') {
      setIsTripModalOpen(true);
    } else if (actionId === 'assign-to-trip') {
      const selectedEventIds = Array.from(selectedIds)
        .filter(id => id.startsWith('event:'))
        .map(id => id.replace('event:', ''));
      
      // If none selected, use the target item
      const finalIds = selectedEventIds.length > 0 ? selectedEventIds : [targetItem.id];
      handleAssignToTrip(extraData.tripId, finalIds);
    } else if (actionId === 'assign-to-event') {
      const selectedPhotoPaths = Array.from(selectedIds)
        .filter(id => !id.startsWith('event:'));
      
      const finalPaths = selectedPhotoPaths.length > 0 ? selectedPhotoPaths : [targetItem.path];
      handleAssignToEvent(extraData.eventId, finalPaths);
    } else if (actionId === 'info') {
      const type = targetItem.type || (targetItem.path ? 'photo' : (targetItem.trip_id ? 'trip' : 'event'));
      const data = targetItem.item || targetItem;
      setDetailItem({ type, data });
      setIsDetailModalOpen(true);
    }
  };

  const handleCreateEvent = async (eventData) => {
    const newEventId = crypto.randomUUID();
    const newEvent = {
        event_id: newEventId,
        trip_id: eventData.tripId || null,
        title: eventData.title || "未命名事件",
        rating: eventData.rating || 0, // 1-10
        category: eventData.category || "未分类",
        city: eventData.city || "",
        date: eventData.date || new Date().toISOString().split('T')[0],
        spending: eventData.spending || 0,
        currency: eventData.currency || "CNY",
        latitude: eventData.latitude || null,
        longitude: eventData.longitude || null,
        tags: eventData.tags || [],
        notes: eventData.notes || ""
    };

    const updatedPhotos = dbContent.photos.map(p => {
        const pNormalized = p.file_name.replace(/\\/g, '/');
        if (eventData.photoIds.some(id => id.replace(/\\/g, '/') === pNormalized)) {
            return { 
              ...p, 
              event_id: newEventId, 
              trip_id: eventData.tripId || p.trip_id
            };
        }
        return p;
    });

    await saveToDatabase({
        ...dbContent,
        events: [...dbContent.events, newEvent],
        photos: updatedPhotos
    });
    setSelectedIds(new Set());
    showToast(`事件 "${eventData.title}" 已创建`, 'orange');
  };

  const handleCreateTrip = async (tripData) => {
    const newTripId = crypto.randomUUID();
    
    // Calculate duration
    let duration = 0;
    if (tripData.startDate && tripData.endDate) {
      const start = new Date(tripData.startDate);
      const end = new Date(tripData.endDate);
      const diffTime = Math.abs(end - start);
      duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive
    }

    const newTrip = {
      trip_id: newTripId,
      title: tripData.title || "未命名行程",
      rating: tripData.rating || 0,
      category: tripData.category || "旅行",
      city: tripData.city || "",
      date: tripData.startDate || new Date().toISOString().split('T')[0],
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      duration: duration,
      spending: tripData.spending || 0,
      currency: tripData.currency || "CNY",
      latitude: tripData.latitude || null,
      longitude: tripData.longitude || null,
      tags: tripData.tags || [],
      notes: tripData.notes || "",
      cover_photo_id: null
    };

    // Link events to trip
    let eventIdsToLink = tripData.eventIds || [];
    if (eventIdsToLink.length === 0) {
       eventIdsToLink = Array.from(selectedIds)
         .filter(id => id.startsWith('event:'))
         .map(id => id.replace('event:', ''));
    }

    // Also link photos directly to trip if selected
    let photoPathsToLink = Array.from(selectedIds)
      .filter(id => !id.includes(':')) // Pure paths are photos
      .concat(tripData.photoIds || []);

    const updatedEvents = dbContent.events.map(e => {
       if (eventIdsToLink.includes(e.event_id)) {
           return { ...e, trip_id: newTripId };
       }
       return e;
    });

    const updatedPhotos = dbContent.photos.map(p => {
      const pNormalized = p.file_name.replace(/\\/g, '/');
      if (photoPathsToLink.some(path => path.replace(/\\/g, '/') === pNormalized)) {
          return { ...p, trip_id: newTripId };
      }
      return p;
    });

    await saveToDatabase({
      ...dbContent,
      trips: [...dbContent.trips, newTrip],
      events: updatedEvents,
      photos: updatedPhotos
    });
    
    setSelectedIds(new Set());
    showToast(`行程 "${tripData.title}" 已开启`, 'purple');
  };

  const handleAssignToTrip = async (tripId, eventIds) => {
    setAnimatingTargetId(`trip:${tripId}`);
    const updatedEvents = dbContent.events.map(e => {
        if (eventIds.includes(e.event_id)) {
            return { ...e, trip_id: tripId };
        }
        return e;
    });

    await saveToDatabase({
        ...dbContent,
        events: updatedEvents
    });
    setSelectedIds(new Set());
    setTimeout(() => setAnimatingTargetId(null), 1000);
    showToast(`成功将事件归类到行程`, 'trip');
  };

  const handleAssignToEvent = async (eventId, photoPaths) => {
    setAnimatingTargetId(`event:${eventId}`);
    const updatedPhotos = dbContent.photos.map(p => {
        const pNormalized = p.file_name.replace(/\\/g, '/');
        if (photoPaths.some(path => path.replace(/\\/g, '/') === pNormalized)) {
            return { ...p, event_id: eventId };
        }
        return p;
    });

    await saveToDatabase({
        ...dbContent,
        photos: updatedPhotos
    });
    setSelectedIds(new Set());
    setTimeout(() => setAnimatingTargetId(null), 1000);
    const event = dbContent.events.find(e => e.event_id === eventId);
    showToast(`成功将照片添加到事件 "${event?.title || '未知事件'}"`, 'orange');
  };

  const handleResetDatabase = async () => {
    console.log('--- RESET DATABASE START ---');
    if (!window.confirm('确定要清空所有已分类的行程和事件吗？')) return;
    
    try {
      const basePhotos = (photoFiles || []).map(f => {
         // Try to find if we already have a UUID for this path in current state
         const existing = (dbContent.photos || []).find(p => p.file_name === f.path);
         return {
            photo_id: existing?.photo_id || (window.crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)),
            file_name: f.path,
            timestamp: existing?.timestamp || new Date().toISOString(),
            event_id: null
         };
      });

      console.log('Constructed basePhotos, length:', basePhotos.length);

      const resetContent = {
        trips: [],
        events: [],
        photos: basePhotos
      };
      
      console.log('Sending reset payload to drive...');
      await saveToDatabase(resetContent);
      console.log('Save to database call returned.');
      
      setActiveFilter({ type: 'all' });
      setSelectedIds(new Set());
      console.log('--- RESET DATABASE COMPLETE ---');
    } catch (err) {
      console.error('CRITICAL: Reset Database Failed:', err);
    }
  };

  const handleNavigate = (target) => {
    if (target.type === 'photo') {
      // Find index in the current filtered/displayed list for seamless browsing
      const index = displayedItems.findIndex(item => item.type === 'photo' && item.path === target.data.path);
      const photosOnly = displayedItems.filter(item => item.type === 'photo');
      const photoIndex = photosOnly.findIndex(p => p.path === target.data.path);
      
      setLightboxPhotos(photosOnly);
      setLightboxInitialIndex(photoIndex >= 0 ? photoIndex : 0);
      setIsLightboxOpen(true);
    } else {
      // Drill down into Trip or Event
      setActiveFilter({ 
        type: target.type, 
        id: target.id 
      });
    }
  };

  // Hierarchy Logic: What to show in the grid
  const displayedItems = useMemo(() => {
    // 1. If we are focused on a specific Trip
    if (activeFilter.type === 'trip') {
       return dbContent.events
         .filter(e => String(e.trip_id) === String(activeFilter.id))
         .map(e => ({
            type: 'event',
            id: e.event_id,
            event_id: e.event_id, // 冗余一份 ID 确保 CollectionCard 识别
            title: e.title,
            item: e, // 传递原对象以获取分类、城市等信息
            photos: enrichedPhotos.filter(p => String(p.event_id) === String(e.event_id))
         }));
    }

    // 2. If we are focused on a specific Event
    if (activeFilter.type === 'event') {
       return enrichedPhotos.filter(p => String(p.event_id) === String(activeFilter.id))
         .map(p => ({ ...p, type: 'photo' }));
    }

    // 2.5 Show ALL Events (Categorized View)
    if (activeFilter.type === 'all-events') {
      return (dbContent.events || []).map(event => ({
        type: 'event',
        id: event.event_id,
        title: event.title,
        item: event,
        photos: enrichedPhotos.filter(p => p.event_id === event.event_id)
      }));
    }

    // 2.6 Show ALL Albums/Trips (Categorized View)
    if (activeFilter.type === 'all-albums') {
      return (dbContent.trips || []).map(trip => ({
        type: 'trip',
        id: trip.trip_id,
        title: trip.title,
        item: trip,
        photos: enrichedPhotos.filter(p => {
           const photoEvent = dbContent.events.find(e => String(e.event_id) === String(p.event_id));
           return photoEvent && String(photoEvent.trip_id) === String(trip.trip_id);
        }),
        associatedEvents: dbContent.events.filter(e => String(e.trip_id) === String(trip.trip_id))
      }));
    }

    // 3. Default "All Memories" / Archive View
    // Show all Trips + All Independent Events + All Uncategorized Photos
    const items = [];

    // Add Trips
    (dbContent.trips || []).forEach(trip => {
      items.push({
        type: 'trip',
        id: trip.trip_id,
        title: trip.title,
        item: trip, // Full trip object
        photos: enrichedPhotos.filter(p => {
           const photoEvent = dbContent.events.find(e => String(e.event_id) === String(p.event_id));
           return photoEvent && String(photoEvent.trip_id) === String(trip.trip_id);
        }),
        associatedEvents: dbContent.events.filter(e => String(e.trip_id) === String(trip.trip_id))
      });
    });

    // Add Independent Events
    (dbContent.events || []).filter(e => !e.trip_id).forEach(event => {
      items.push({
        type: 'event',
        id: event.event_id,
        title: event.title,
        item: event, // Full event object
        photos: enrichedPhotos.filter(p => p.event_id === event.event_id)
      });
    });

    // Add Uncategorized Photos
    enrichedPhotos.filter(p => !p.event_id).forEach(photo => {
      items.push({ ...photo, type: 'photo' });
    });

    return items;
  }, [enrichedPhotos, activeFilter, dbContent]);

  return (
    <div className="min-h-screen bg-[#0b0c10] text-[#f8f9fa] flex flex-col items-center justify-center relative overflow-hidden font-sans">
      
      {/* Dynamic Background Blur effects based on mode */}
      <motion.div 
        animate={{
          scale: appMode === 'gallery' ? 1.5 : 1,
          opacity: appMode === 'gallery' ? 0.3 : 0.6,
          y: appMode === 'gallery' ? -300 : 0
        }}
        transition={{ duration: 1.5, ease: "anticipate" }}
        className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[140px] pointer-events-none z-0" 
      />
      <motion.div 
        animate={{
          scale: appMode === 'gallery' ? 0 : 1,
          opacity: appMode === 'gallery' ? 0 : 0.6,
        }}
        transition={{ duration: 1.0, ease: "anticipate" }}
        className="fixed bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none z-0" 
      />
      
      {/* ----------------- HOME VIEW ----------------- */}
      <AnimatePresence mode="wait">
        {appMode === 'home' && (
          <motion.div 
            key="home"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            transition={{ duration: 0.6, ease: "circInOut" }}
            className="text-center z-10 w-full max-w-4xl px-6"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center justify-center p-6 bg-white/5 rounded-[2rem] mb-12 ring-2 ring-white/10 shadow-2xl backdrop-blur-3xl"
            >
              <FolderOpen size={64} className="text-blue-400 drop-shadow-lg" />
            </motion.div>

            <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-gradient-to-br from-white via-white to-neutral-500 bg-clip-text text-transparent drop-shadow-sm">
              Trip Archive
            </h1>
            <p className="text-xl md:text-2xl text-neutral-400 max-w-2xl mx-auto mb-16 font-light leading-relaxed">
              A physical-feeling local memory database. <br className="hidden md:block"/>
              Zero uploads. Infinite capacity.
            </p>
            
            <motion.button
              onClick={handleInitialize}
              disabled={isScanning}
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
              whileTap={{ scale: 0.95 }}
              className={clsx(
                  "relative group px-10 py-5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl text-xl font-medium transition-all shadow-2xl flex items-center justify-center gap-4 mx-auto",
                  isScanning && "opacity-50 cursor-not-allowed"
              )}
            >
              {isScanning ? (
                <>
                  <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                  Granting Access...
                </>
              ) : (
                <>
                  <Play size={24} className="text-blue-400 fill-blue-400/20 group-hover:fill-blue-400 transition-colors" />
                  {hasPersistedHandle ? 'Restore Archive' : 'Select Root Folder'}
                </>
              )}
            </motion.button>
            
            <AnimatePresence>
              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: 10, scale: 0.9 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-8 text-red-400 font-medium max-w-md mx-auto p-4 bg-red-500/10 rounded-2xl border border-red-500/20 shadow-xl backdrop-blur-md"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ----------------- GALLERY LAYOUT (THE GATHERING) ----------------- */}
      <AnimatePresence>
        {appMode === 'gallery' && (
          <motion.div 
            key="gallery"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-20 flex flex-col bg-black/40 backdrop-blur-3xl"
          >
            <LayoutGroup id="main-archive-layout">
            {/* ── Design-Specific Top Header ── */}
            <header className="w-full h-20 shrink-0 bg-[#0b1014] border-b border-white/5 flex items-center justify-between px-10 z-[100]">
              <div className="flex items-center gap-12">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                    <Archive size={20} className="text-white" />
                  </div>
                  <span className="text-xl font-black tracking-tight text-white">Trip Archive</span>
                </div>
                
                <nav className="hidden md:flex items-center gap-8">
                  <NavLink 
                    label="All Photos" 
                    active={activeFilter.type === 'all'}
                    onClick={() => {
                      setActiveFilter({ type: 'all' });
                    }} 
                  />
                  <NavLink 
                    label="Albums" 
                    active={activeFilter.type === 'all-albums'}
                    onClick={() => setActiveFilter({ type: 'all-albums' })}
                  />
                  <NavLink 
                    label="Events" 
                    active={activeFilter.type === 'all-events'}
                    onClick={() => setActiveFilter({ type: 'all-events' })}
                  />
                  <NavLink label="Map" />
                </nav>
              </div>

              <div className="flex items-center gap-6">
                <div className="relative group">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-blue-400 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search your memories..." 
                    className="w-80 h-12 pl-12 pr-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/10 transition-all font-medium"
                  />
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-400 to-neutral-600 border-2 border-white/10 p-0.5 overflow-hidden active:scale-95 transition-transform cursor-pointer shadow-lg">
                  <img src="https://ui-avatars.com/api/?name=User&background=333&color=fff" alt="Avatar" className="w-full h-full rounded-full object-cover" />
                </div>
              </div>
            </header>

            {/* ── Design-Specific Sub Header ── */}
            <div className="px-10 pt-12 pb-8 flex items-center justify-between">
              <div className="space-y-2">
                <h2 className="text-4xl font-black tracking-tight text-white">Switzerland Trip 2024</h2>
                <div className="flex items-center gap-3 text-neutral-500 font-bold text-sm">
                  <Calendar size={14} />
                  <span>August 12 - August 24</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-700 mx-1" />
                  <span>142 items</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={handleResetDatabase}
                  className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all active:scale-95"
                  title="Clear Database"
                >
                  <Trash2 size={16} />
                  Reset DB
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white hover:bg-white/10 transition-all active:scale-95">
                  <ListFilter size={18} />
                  Filter
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 rounded-2xl text-sm font-bold text-white hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95">
                  <Plus size={18} />
                  Upload
                </button>
              </div>
            </div>

            {/* Main Layout Area */}
            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar: only show in table view */}
              {viewMode === 'table' && (
                <Sidebar
                  dbContent={dbContent}
                  activeFilter={activeFilter}
                  onFilterChange={setActiveFilter}
                />
              )}

              <div className="flex-1 flex flex-col relative">
                {/* Virtualized Infinite Grid */}
                <VirtualGrid 
                  items={displayedItems} 
                  onContextMenu={handleContextMenu} 
                  selectedIds={selectedIds}
                  onToggleSelection={toggleSelection}
                  onNavigate={handleNavigate}
                  onUpdateItem={handleUpdateItem}
                  animatingTargetId={animatingTargetId}
                />

                <ActionBar 
                  selectedIds={selectedIds}
                  onClear={() => setSelectedIds(new Set())}
                  onMerge={() => onMenuAction('create-event', { type: 'photo', path: Array.from(selectedIds)[0] })}
                  onDownload={() => showToast('Starting download...', 'trip')}
                  onDelete={() => showToast('Items removed', 'trip')}
                />
              </div>
            </div>

            <ContextMenu 
              menu={contextMenu} 
              onClose={closeMenu} 
              onAction={onMenuAction} 
              selectionCount={selectedIds.size}
              trips={dbContent.trips}
              events={dbContent.events}
            />

            <CreateEventModal 
              isOpen={isEventModalOpen}
              onClose={() => setIsEventModalOpen(false)}
              photos={activePhotos}
              onCreate={handleCreateEvent}
            />

            <CreateTripModal
              isOpen={isTripModalOpen}
              onClose={() => setIsTripModalOpen(false)}
              trips={dbContent.trips}
              events={dbContent.events.filter(e => !e.trip_id)}
              initialSelectedIds={Array.from(selectedIds)
                .filter(id => typeof id === 'string' && id.startsWith('event:'))
                .map(id => id.replace('event:', ''))}
              onCreate={handleCreateTrip}
              onAssign={handleAssignToTrip}
              allPhotos={enrichedPhotos}
            />

            <DetailModal
              isOpen={isDetailModalOpen}
              onClose={() => {
                setIsDetailModalOpen(false);
                setDetailItem(null);
              }}
              type={detailItem?.type}
              item={detailItem?.data}
              allPhotos={enrichedPhotos}
              onUpdate={handleUpdateItem}
            />

            <Lightbox 
              isOpen={isLightboxOpen}
              onClose={() => setIsLightboxOpen(false)}
              photos={lightboxPhotos}
              initialIndex={lightboxInitialIndex}
              events={dbContent.events}
            />


            {/* Global Toast (Glow Style) - Fixed Insertion */}
            <AnimatePresence>
              {toast && (
                <motion.div
                  initial={{ y: 50, opacity: 0, scale: 0.9 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 20, opacity: 0, scale: 0.9 }}
                  className={clsx(
                    "fixed top-24 left-1/2 -translate-x-1/2 z-[300] px-6 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center gap-3",
                    toast.type === 'trip' || toast.type === 'purple'
                      ? "bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.2)]" 
                      : toast.type === 'orange' || toast.type === 'event'
                      ? "bg-orange-500/10 border-orange-500/30 text-orange-400 shadow-[0_0_30px_rgba(249,115,22,0.2)]"
                      : "bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.2)]"
                  )}
                >
                  <CheckCircle2 size={18} />
                  <span className="text-sm font-bold tracking-tight">{toast.message}</span>
                </motion.div>
              )}
            </AnimatePresence>

            </LayoutGroup>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
