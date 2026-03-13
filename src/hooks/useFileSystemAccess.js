import { useState } from 'react';

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

  return { initWorkspace, isScanning, photoFiles, error, dbHandle, dbContent, saveToDatabase };
}
