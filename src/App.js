// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
// import ModelflowWithNavigation from './components/ModelflowWithNavigation';
import ModelEditorWithState from './components/ModelEditorWithSate';
// import ModelDebugTest from './components/ModelDebugTest';
// import DirectFileDownloader from './components/ModelDownloader';
import ModelGenerator from './components/search/ModelGenerator';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingPage from './components/LoadingPage';
const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ModelGenerator />} />
        <Route path="/editor" element={
          <ProtectedRoute>
            <ModelEditorWithState />
          </ProtectedRoute>
        } />
        {/* <Route path="/debug" element={
          <ProtectedRoute>
            <ModelDebugTest />
          </ProtectedRoute>
        } /> */}
        {/* <Route path="/download" element={<DirectFileDownloader />} /> */}
        <Route path="/login" element={<Login />} />
        <Route path="/loading" element={<LoadingPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;