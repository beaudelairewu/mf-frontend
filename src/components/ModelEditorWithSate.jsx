// src/components/ModelEditorWithState.jsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ModelEditorPage from './ModelEditor';

const ModelEditorWithState = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  React.useEffect(() => {
    if (!location.state?.modelUrl) {
      navigate('/', { replace: true });
    }
  }, [location.state, navigate]);

  if (!location.state?.modelUrl) {
    return null;
  }

  return (
    <ModelEditorPage
      modelUrl={location.state.modelUrl}
      modelDetails={location.state.modelDetails}
      taskId={location.state.taskId}
    />
  );
};

export default ModelEditorWithState;