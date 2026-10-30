import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import Compare from './pages/Compare';
import Agent from './pages/Agent';
import ShoppingLists from './pages/ShoppingLists';
import Preferences from './pages/Preferences';
import Login from './pages/Login';
import { useAuthStore } from './store/store';

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="search" element={<Search />} />
        <Route path="compare" element={<Compare />} />
        <Route path="agent" element={<Agent />} />
        <Route
          path="lists"
          element={
            <PrivateRoute>
              <ShoppingLists />
            </PrivateRoute>
          }
        />
        <Route
          path="preferences"
          element={
            <PrivateRoute>
              <Preferences />
            </PrivateRoute>
          }
        />
      </Route>
    </Routes>
  );
}
