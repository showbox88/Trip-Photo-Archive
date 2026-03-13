import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, Settings, ListFilter, Play } from 'lucide-react';
import { useFileSystemAccess } from './hooks/useFileSystemAccess';
import { useContextMenu } from './hooks/useContextMenu';
import { PhotoCard } from './components/PhotoCard';
import { VirtualGrid } from './components/VirtualGrid';
import { ContextMenu } from './components/ContextMenu';
import { CreateEventModal } from './components/CreateEventModal';
import { CreateTripModal } from './components/CreateTripModal';
import { Sidebar } from './components/Sidebar';
import { Lightbox } from './components/Lightbox';
import { Plane, Plus, Trash2, ChevronRight } from 'lucide-react';
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
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [activePhotos, setActivePhotos] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [activeFilter, setActiveFilter] = useState({ type: 'all' });
  
  // Lightbox State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0);
  const [lightboxPhotos, setLightboxPhotos] = useState([]);

  const handleInitialize = async () => {
    await initWorkspace();
    if (!error) {
       setAppMode('gallery');
    }
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
        photos: enrichedPhotos.filter(p => {
           const event = dbContent.events.find(e => e.event_id === p.event_id);
           return event && event.trip_id === trip.trip_id;
        })
      });
    });

    // Add Independent Events
    (dbContent.events || []).filter(e => !e.trip_id).forEach(event => {
      items.push({
        type: 'event',
        id: event.event_id,
        title: event.title,
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
            {/* Gallery Navbar (Glassmorphism) */}
            <header className="h-20 shrink-0 border-b border-white/5 bg-black/20 flex flex-row items-center justify-between px-8 z-50 shadow-sm backdrop-blur-3xl">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-blue-500/20 rounded-xl shadow-inner border border-blue-500/20">
                  <FolderOpen size={20} className="text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold tracking-tight text-white/90">Memory Database</h2>
                <div className="px-3 py-1.5 rounded-full bg-white/5 text-xs font-medium ml-4 border border-white/10 text-neutral-300">
                   Active: {photoFiles.length} Photos
                </div>
                <div className="px-3 py-1.5 rounded-full bg-purple-500/10 text-xs font-medium border border-purple-500/20 text-purple-300 flex items-center gap-2">
                   <Plane size={12} /> {dbContent.trips.length} Trips
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsTripModalOpen(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-bold transition-all text-white flex items-center gap-2 shadow-lg shadow-purple-900/20"
                >
                  <Plus size={16} /> New Trip
                </button>
                <div className="w-px h-6 bg-white/10 mx-2" />
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium transition-colors text-neutral-400 hover:text-white flex items-center gap-2 border border-white/5">
                  <ListFilter size={16} /> Filters
                </button>
                <button 
                  onClick={handleResetDatabase}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-sm font-medium transition-colors text-red-400 flex items-center gap-2"
                  title="Clear all categorizations (Testing)"
                >
                  <Trash2 size={16} /> Clear DB
                </button>
                <button className="p-2.5 hover:bg-white/10 rounded-xl transition-colors text-neutral-400 hover:text-white">
                  <Settings size={20} />
                </button>
              </div>
            </header>

            {/* Main Layout Area */}
            <div className="flex-1 flex overflow-hidden">
              <Sidebar 
                dbContent={dbContent} 
                activeFilter={activeFilter} 
                onFilterChange={setActiveFilter} 
              />
              
              <div className="flex-1 flex flex-col relative">
                {/* Virtualized Infinite Grid */}
                <VirtualGrid 
                  items={displayedItems} 
                  onContextMenu={handleContextMenu} 
                  selectedIds={selectedIds}
                  onToggleSelection={toggleSelection}
                  onNavigate={handleNavigate}
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

            {/* Floating Action Bar / Status (Glassmorphism again) */}
            <motion.div 
               initial={{ y: 100, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.5, type: "spring", damping: 25 }}
               className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 rounded-2xl bg-[#111216]/80 backdrop-blur-2xl border border-white/10 shadow-[0_0_40px_-10px_rgba(0,0,0,0.8)] p-4 flex gap-8 items-center"
            >
                <div className="flex flex-col items-center px-4 border-r border-white/5">
                   <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Storage</span>
                   <span className="text-sm font-semibold text-green-400 flex items-center gap-2 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]">
                     <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Local JSON
                   </span>
                </div>
                <div className="flex flex-col items-center px-4 border-r border-white/5">
                   <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Status</span>
                   <span className="text-sm font-semibold text-neutral-300">Up to Date</span>
                </div>
                <div className="flex flex-col items-center px-4">
                   <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Total</span>
                   <span className="text-sm font-semibold text-white">{photoFiles.length} Images</span>
                </div>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
