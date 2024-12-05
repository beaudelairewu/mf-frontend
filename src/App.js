// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ModelflowWithNavigation from './components/ModelflowWithNavigation';
import ModelEditorWithState from './components/ModelEditorWithSate';
import ModelDebugTest from './components/ModelDebugTest';
import DirectFileDownloader from './components/ModelDownloader';
import ModelGenerator from './components/ModelGenerator';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ModelGenerator />} />
        <Route path="/editor" element={
          // <ProtectedRoute>
            <ModelEditorWithState />
          // </ProtectedRoute>
        } />
        <Route path="/debug" element={
          // <ProtectedRoute>
            <ModelDebugTest />
          // </ProtectedRoute>
        } />
        <Route path="/download" element={<DirectFileDownloader />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;