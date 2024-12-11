import React from 'react';
import { Loader } from 'lucide-react';
import { Card } from './common_ui/Card';

// Custom hook to fetch model through proxy
const useProxyModel = (modelUrl) => {
  const [status, setStatus] = React.useState({ loading: true, error: null, url: null });

  React.useEffect(() => {
    if (!modelUrl) {
      setStatus({ loading: false, error: 'No model URL provided', url: null });
      return;
    }

    // Fetch through our proxy endpoint
    fetch(`${process.env.REACT_APP_API_BASE_URL}/api/model-proxy?url=${encodeURIComponent(modelUrl)}`, {
      headers: {
        'Accept': 'application/json, application/octet-stream'
      },
    })
    .then(async response => {
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to load model');
      }
      return response.blob();
    })
    .then(blob => {
      const url = URL.createObjectURL(blob);
      setStatus({ loading: false, error: null, url });
      return () => URL.revokeObjectURL(url);
    })
    .catch(error => {
      console.error('Model loading error:', error);
      setStatus({ loading: false, error: error.message, url: null });
    });
  }, [modelUrl]);

  return status;
};

const ModelPreview = ({ modelUrl }) => {
  const proxyUrl = useProxyModel(modelUrl);
  
  if (!proxyUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <iframe 
      src={`/model-viewer.html?url=${encodeURIComponent(proxyUrl)}`}
      className="w-full h-full border-0"
      title="3D Model Preview"
    />
  );
};

const LoadingPage = ({ progress = 0, modelType = 'text-to-3d' }) => {
  const mockModels = ['https://1drv.ms/u/c/6e25bbb47050f1b8/ET8KKn5VxSZNszvtf2FUoSEBKBIN80SrAbDEDpa-EDEzsg?e=FSUTTN']
  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      {/* Top Bar with Loading Progress */}
      <div className="w-full mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="animate-bounce">
            <Loader className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        </div>
        <p className="text-slate-400 text-sm">
          {modelType === 'text-to-3d' ? 'Generating your 3D model...' : 'Converting your image to 3D...'}
        </p>
      </div>
      
      <div className="w-full flex flex-col lg:flex-row gap-6">
        {/* Main Preview Area */}
        <div className="w-full lg:w-2/3">
          <h2 className="text-xl font-semibold mb-4">Model Preview</h2>
          <Card className="aspect-[4/3] bg-slate-800 rounded-lg overflow-hidden">
            <ModelPreview modelUrl={mockModels[0]} />
          </Card>
        </div>
        
        {/* Right Side Grid */}
        <div className="w-full lg:w-1/3">
          <h3 className="text-sm font-medium text-slate-400 mb-4">More Examples</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-slate-800"></div>
            <div className="aspect-square rounded-lg overflow-hidden bg-slate-800"></div>
            <div className="aspect-square rounded-lg overflow-hidden bg-slate-800"></div>
            <div className="aspect-square rounded-lg overflow-hidden bg-slate-800"></div>
          </div>
        </div>
      </div>
      
      {/* Bottom Grid */}
      <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="aspect-video rounded-lg bg-slate-800"></div>
        <div className="aspect-video rounded-lg bg-slate-800"></div>
        <div className="aspect-video rounded-lg bg-slate-800"></div>
        <div className="aspect-video rounded-lg bg-slate-800"></div>
      </div>
    </div>
  );
};

export default LoadingPage;