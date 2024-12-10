import React from 'react';
import { Loader } from 'lucide-react';
import { Card } from './common_ui/Card';
import ModelPreview from '../utils/modelLoaderUrl';

const mockModels = [
  'https://github.com/KhronosGroup/glTF-Sample-Models/blob/main/2.0/Duck/glTF-Binary/Duck.glb',
];

const LoadingPage = ({ progress = 0, modelType = 'text-to-3d' }) => (
  <div className="min-h-screen bg-[#1a1d21] text-white p-6">
    <div className="max-w-7xl mx-auto mb-8">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1">
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
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
      <p className="text-gray-400 text-sm">
        {modelType === 'text-to-3d' ? 'Generating your 3D model...' : 'Converting your image to 3D...'}
      </p>
    </div>

    <div className="max-w-7xl mx-auto">
      <h2 className="text-xl font-semibold mb-6">Model Preview</h2>
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-4">
        <Card className="lg:col-span-3 aspect-[4/3] bg-gray-800 rounded-lg overflow-hidden">
          <ModelPreview modelUrl={mockModels[0]} />
        </Card>

        <Card className="p-4 bg-gray-800 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400 mb-4">More Examples</h3>
          <div className="grid grid-cols-2 gap-4">
            {mockModels.slice(1).map((url, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden bg-gray-700">
                <ModelPreview modelUrl={url} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  </div>
);

export default LoadingPage;