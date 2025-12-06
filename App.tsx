import React, { useContext, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppProvider, AppContext } from './contexts/AppContext';
import { ToastProvider } from './contexts/ToastContext';
import { SocketProvider } from './contexts/SocketContext';
import { AppContextType } from './types';
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';
import ToastNotifications from './components/ToastNotifications';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const PropertiesPage = lazy(() => import('./pages/PropertiesPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const CreateListingPage = lazy(() => import('./pages/CreateListingPage'));

const ProtectedRoute: React.FC = () => {
  const { currentUser } = useContext(AppContext) as AppContextType;
  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }
  return <Outlet />;
};

const AppLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-neutral-light">
      <Header />
      <main className="flex-grow">
        <Outlet /> {/* Child routes will render here */}
      </main>
      <footer className="bg-neutral-dark text-center text-neutral-light p-4 text-sm">
        © {new Date().getFullYear()} LocalRent. Connecting Neighbors. All rights reserved (simulated).
      </footer>
      <ToastNotifications /> {/* Add ToastNotifications here */}
    </div>
  );
};


const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppProvider>
        <SocketProvider>
          <HashRouter>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route element={<AppLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/properties" element={<PropertiesPage />} />
                  <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/listing/create" element={<CreateListingPage />} />
                    <Route path="/listing/edit/:propertyId" element={<CreateListingPage />} />
                  </Route>
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </Suspense>
          </HashRouter>
        </SocketProvider>
      </AppProvider>
    </ToastProvider>
  );
};

export default App;