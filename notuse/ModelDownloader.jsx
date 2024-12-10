import React, { useState } from 'react';
import { Download } from 'lucide-react';

const DirectFileDownloader = () => {
  const [url, setUrl] = useState('');
  
  const downloadFile = () => {
    if (!url) return;
    
    // Create an invisible anchor element
    const link = document.createElement('a');
    link.href = url;
    
    // Extract filename from URL
    const filename = url.split('/').pop();
    if (filename) {
      link.setAttribute('download', filename);
    }
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-md p-4">
      <div className="space-y-4">
        <input
          type="url"
          placeholder="Enter file URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full p-2 border rounded"
        />
        
        <button 
          onClick={downloadFile}
          disabled={!url}
          className="w-full bg-blue-500 text-white p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Download className="h-4 w-4" />
          <span>Download File</span>
        </button>
      </div>
    </div>
  );
};

export default DirectFileDownloader;