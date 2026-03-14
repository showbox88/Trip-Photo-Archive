import { useState, useCallback } from 'react';
import * as idb from '../utils/idb';

/**
 * Handle recursive directory reading using the File System Access API
 */
async function getFilesFromDirectory(directoryHandle, path = '') {
  let files = [];
  try {
    // Attempt to iterate over the directory entries
    for await (const entry of directoryHandle.values()) {
      if (entry.kind === 'file' && entry.name.match(/\.(jpe?g|png|heic|webp)$/i)) {
        files.push({
          handle: entry,
          path: `${path}${entry.name}`,
          name: entry.name,
        });
      } else if (entry.kind === 'directory') {
        const nestedFiles = await getFilesFromDirectory(entry, `${path}${entry.name}/`);
        files.push(...nestedFiles);
      }
    }
  } catch (err) {
    console.error(`Error reading ${path}:`, err);
  }
  return files;
}

export function useFileSystemAccess() {
  const [photoFiles, setPhotoFiles] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [dbHandle, setDbHandle] = useState(null);
  const [dbContent, setDbContent] = useState({ trips: [], events: [], photos: [] });
  const [error, setError] = useState(null);
  const [hasPersistedHandle, setHasPersistedHandle] = useState(false);

  // Check if we have a saved handle on mount
  const checkPersistedWorkspace = useCallback(async () => {
    try {
      const handle = await idb.get('last_handle');
      setHasPersistedHandle(!!handle);
      return !!handle;
    } catch (err) {
      console.error('Failed to check persisted workspace:', err);
      return false;
    }
  }, []);

  const saveToDatabase = async (newContent) => {
    if (!dbHandle) {
      console.error('No database handle available for saving.');
      return;
    }
    try {
      const writable = await dbHandle.createWritable();
      await writable.write(JSON.stringify(newContent, null, 2));
      await writable.close();
      console.log('Successfully saved to trip_database.json');
      setDbContent(newContent);
    } catch (err) {
      console.error('Failed to save to local JSON:', err);
      setError('Failed to save changes to the local database file.');
    }
  };

  const initWorkspace = async () => {
    try {
      setIsScanning(true);
      setError(null);

      // 1. Ask user to select the root folder
      const directoryHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
      });

      // 1.1 Persist for later
      await idb.set('last_handle', directoryHandle);
      setHasPersistedHandle(true);

      // 2. Scan for photos
      const files = await getFilesFromDirectory(directoryHandle);
      setPhotoFiles(files);

      // 3. Load or create trip_database.json
      let dbFileHandle;
      let currentDb = { trips: [], events: [], photos: [] };

      try {
        dbFileHandle = await directoryHandle.getFileHandle('trip_database.json', { create: false });
        const file = await dbFileHandle.getFile();
        const text = await file.text();
        currentDb = JSON.parse(text);
      } catch (e) {
        dbFileHandle = await directoryHandle.getFileHandle('trip_database.json', { create: true });
        
        // Initial sync: mark all scanned files as known photos
        currentDb.photos = files.map(f => ({
          photo_id: crypto.randomUUID(),
          file_name: f.path,
          timestamp: new Date().toISOString(),
          event_id: null
        }));

        const writable = await dbFileHandle.createWritable();
        await writable.write(JSON.stringify(currentDb, null, 2));
        await writable.close();
      }
      
      setDbHandle(dbFileHandle);
      setDbContent(currentDb);

    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('User cancelled the folder selection.');
      } else {
        console.error('File System Support Error:', err);
        setError('Your browser might not support folder access or permission was denied.');
      }
    } finally {
      setIsScanning(false);
    }
  };

  const restoreWorkspace = async () => {
    try {
      setIsScanning(true);
      setError(null);
      
      const directoryHandle = await idb.get('last_handle');
      if (!directoryHandle) {
        throw new Error('抱歉，找不到之前保存的工作区。');
      }

      // Check permission
      const options = { mode: 'readwrite' };
      if ((await directoryHandle.queryPermission(options)) !== 'granted') {
        if ((await directoryHandle.requestPermission(options)) !== 'granted') {
          throw new Error('未获得权限，无法访问文件夹。');
        }
      }

      // 2. Scan for photos
      const files = await getFilesFromDirectory(directoryHandle);
      setPhotoFiles(files);

      // 3. Load trip_database.json
      let dbFileHandle;
      let currentDb = { trips: [], events: [], photos: [] };

      try {
        dbFileHandle = await directoryHandle.getFileHandle('trip_database.json', { create: false });
        const file = await dbFileHandle.getFile();
        const text = await file.text();
        currentDb = JSON.parse(text);
      } catch (e) {
        // If it was deleted somehow but handle exists, recreate
        dbFileHandle = await directoryHandle.getFileHandle('trip_database.json', { create: true });
        currentDb.photos = files.map(f => ({
          photo_id: crypto.randomUUID(),
          file_name: f.path,
          timestamp: new Date().toISOString(),
          event_id: null
        }));
        const writable = await dbFileHandle.createWritable();
        await writable.write(JSON.stringify(currentDb, null, 2));
        await writable.close();
      }
      
      setDbHandle(dbFileHandle);
      setDbContent(currentDb);
    } catch (err) {
      console.error('Failed to restore workspace:', err);
      setError(err.message || '恢复工作区失败。');
      // If handle is invalid, clear it
      if (err.name === 'NotFoundError') {
        await idb.clear();
        setHasPersistedHandle(false);
      }
    } finally {
      setIsScanning(false);
    }
  };

  return { initWorkspace, restoreWorkspace, checkPersistedWorkspace, hasPersistedHandle, isScanning, photoFiles, error, dbHandle, dbContent, saveToDatabase };
}
