import { useState, useEffect } from 'react';

/**
 * Custom hook to safely load an Object URL from a FileSystemFileHandle 
 * only when needed, to prevent massive memory leaks.
 */
export function useObjectUrl(fileHandle) {
  const [url, setUrl] = useState(null);
  
  useEffect(() => {
    let objectUrl = null;

    async function generateUrl() {
      if (!fileHandle) return;
      try {
        const file = await fileHandle.getFile(); // Read actual Blob
        objectUrl = URL.createObjectURL(file);
        setUrl(objectUrl);
      } catch (err) {
        console.error('Failed to generate Object URL:', err);
      }
    }

    generateUrl();

    // Cleanup object URL when the component unmounts
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [fileHandle]);

  return url;
}
