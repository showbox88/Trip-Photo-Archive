import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, Settings, ListFilter, Play, LayoutGrid, AlignJustify, SlidersHorizontal, ArrowUpDown, Search } from 'lucide-react';
import { useFileSystemAccess } from './hooks/useFileSystemAccess';
import { useContextMenu } from './hooks/useContextMenu';
import { PhotoCard } from './components/PhotoCard';
import { VirtualGrid } from './components/VirtualGrid';
import { ContextMenu } from './components/ContextMenu';
import { CreateEventModal } from './components/CreateEventModal';
import { CreateTripModal } from './components/CreateTripModal';
import { Sidebar } from './components/Sidebar';
import { Lightbox } from './components/Lightbox';
import { Plane, Plus, Trash2, ChevronRight, CheckCircle2, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

function App() {
  const { initWorkspace, isScanning, photoFiles, error, dbHandle, dbContent, saveToDatabase } = useFileSystemAccess();
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
      const record = dbPhotoMap.get(file.path) || {};
      return { ...file, ...record };
    });
  }, [photoFiles, dbPhotoMap]);

  // Mode: 'home' | 'gallery'
  const [appMode, setAppMode] = useState('home');
  const [viewMode, setViewMode] = useState('gallery'); // 'gallery' | 'table'
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [activePhotos, setActivePhotos] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [activeFilter, setActiveFilter] = useState({ type: 'all' });
  
  // Lightbox State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0);
  const [lightboxPhotos, setLightboxPhotos] = useState([]);

  // Toast State
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleInitialize = async () => {
    await initWorkspace();
    if (!error) {
       setAppMode('gallery');
    }
  };
  // Handler for direct Trip metadata updates (inline editing)
  const handleUpdateTrip = async (tripId, updates) => {
    // Intercept placeholder click
    if (tripId === 'NEW_POP_MODAL') {
      setIsTripModalOpen(true);
      return;
    }

    const newDbContent = {
      ...dbContent,
      trips: dbContent.trips.map(t => 
        String(t.trip_id) === String(tripId) ? { ...t, ...updates } : t
      )
    };
    
    // Persist to database (saveToDatabase already calls setDbContent internally)
    await saveToDatabase(newDbContent);
    
    setToast({
      message: `Updated trip info`,
      type: 'purple',
      visible: true
    });
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onMenuAction = (actionId, targetItem, extraData) => {
    if (actionId === 'create-event') {
      const targetId = targetItem.type === 'photo' ? targetItem.path : `event:${targetItem.id}`;
      const classifyTargets = selectedIds.has(targetId)
        ? enrichedPhotos.filter(p => selectedIds.has(p.path))
        : [targetItem];

      setActivePhotos(classifyTargets);
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
    }
  };

  const handleCreateEvent = async (eventData) => {
    const newEventId = crypto.randomUUID();
    const newEvent = {
        event_id: newEventId,
        trip_id: null,
        title: eventData.title,
        city: eventData.city,
        category: eventData.category,
        rate: eventData.rate,
        notes: eventData.notes,
        date: eventData.date,
        total_spending: 0,
        currency: "CNY"
    };

    const updatedPhotos = dbContent.photos.map(p => {
        if (eventData.photoIds.includes(p.file_name)) {
            return { ...p, event_id: newEventId };
        }
        return p;
    });

    await saveToDatabase({
        ...dbContent,
        events: [...dbContent.events, newEvent],
        photos: updatedPhotos
    });
    setSelectedIds(new Set());
    showToast(`事件 "${eventData.title}" 归类成功`, 'event');
  };

  const handleCreateTrip = async (tripData) => {
    const newTripId = crypto.randomUUID();
    const newTrip = {
      trip_id: newTripId,
      title: tripData.title,
      country: tripData.country,
      start_date: tripData.startDate,
      end_date: tripData.endDate,
      stage: tripData.stage,
      cover_photo_id: null
    };

    // If no events selected in modal, use the global selection if they are events
    let eventIdsToLink = tripData.eventIds;
    if (eventIdsToLink.length === 0) {
       eventIdsToLink = Array.from(selectedIds)
         .filter(id => id.startsWith('event:'))
         .map(id => id.replace('event:', ''));
    }

    const updatedEvents = dbContent.events.map(e => {
       if (eventIdsToLink.includes(e.event_id)) {
           return { ...e, trip_id: newTripId };
       }
       return e;
    });

    await saveToDatabase({
      ...dbContent,
      trips: [...dbContent.trips, newTrip],
      events: updatedEvents
    });
    setSelectedIds(new Set());
    showToast(`开启新的篇章：${tripData.title}`, 'trip');
  };

  const handleAssignToTrip = async (tripId, eventIds) => {
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
    showToast(`成功将事件归类到行程`, 'trip');
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
         .filter(e => e.trip_id === activeFilter.id)
         .map(e => ({
            type: 'event',
            id: e.event_id,
            title: e.title,
            photos: enrichedPhotos.filter(p => p.event_id === e.event_id)
         }));
    }

    // 2. If we are focused on a specific Event
    if (activeFilter.type === 'event') {
       return enrichedPhotos.filter(p => p.event_id === activeFilter.id)
         .map(p => ({ ...p, type: 'photo' }));
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
                  Select Root Folder
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
            {/* ── Notion-style top bar ── */}
            <header className="h-12 shrink-0 border-b border-white/5 bg-[#111215] flex flex-row items-center justify-between px-4 z-50">
              {/* Left: view toggle */}
              <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('table')}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                    viewMode === 'table' ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-neutral-300'
                  )}
                >
                  <AlignJustify size={13} /> Table
                </button>
                <button
                  onClick={() => setViewMode('gallery')}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                    viewMode === 'gallery' ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-neutral-300'
                  )}
                >
                  <LayoutGrid size={13} /> Gallery
                </button>
              </div>

              {/* Right: filter actions + New button */}
              <div className="flex items-center gap-1">
                <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-neutral-500 hover:text-neutral-200 hover:bg-white/5 transition-all">
                  <SlidersHorizontal size={13} /> Filter
                </button>
                <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-neutral-500 hover:text-neutral-200 hover:bg-white/5 transition-all">
                  <ArrowUpDown size={13} /> Sort
                </button>
                <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-neutral-500 hover:text-neutral-200 hover:bg-white/5 transition-all">
                  <Search size={13} />
                </button>
                <div className="w-px h-4 bg-white/10 mx-1" />
                <button
                  onClick={handleResetDatabase}
                  className="px-2.5 py-1.5 rounded-md text-xs text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-1"
                  title="Clear DB (dev)"
                >
                  <Trash2 size={12} />
                </button>
                <button
                  onClick={() => setIsTripModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-md text-xs font-semibold text-white transition-all shadow-lg shadow-blue-900/30"
                >
                  New <ChevronDown size={11} />
                </button>
              </div>
            </header>

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
                  onUpdateTrip={handleUpdateTrip}
                />
              </div>
            </div>

            <ContextMenu 
              menu={contextMenu} 
              onClose={closeMenu} 
              onAction={onMenuAction} 
              selectionCount={selectedIds.size}
              trips={dbContent.trips}
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
                .filter(id => id.startsWith('event:'))
                .map(id => id.replace('event:', ''))}
              onCreate={handleCreateTrip}
              onAssign={handleAssignToTrip}
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
                    toast.type === 'trip' 
                      ? "bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.2)]" 
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                  )}
                >
                  <CheckCircle2 size={18} />
                  <span className="text-sm font-bold tracking-tight">{toast.message}</span>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
