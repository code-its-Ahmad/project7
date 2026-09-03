import { lazy, Suspense } from 'react';
import { Toaster as HotToaster } from 'react-hot-toast';
import { MotionConfig } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { PortfolioProvider } from './context/PortfolioContext';
import { SoundProvider } from './context/SoundContext';
import { DeviceCapabilitiesProvider } from './context/DeviceCapabilitiesContext';
import RouteFallback from './components/common/RouteFallback';
import AppErrorBoundary from './components/common/AppErrorBoundary';
import CustomCursor from './components/common/CustomCursor';

/**
 * The admin CMS is a completely separate concern from the public portfolio.
 * Splitting it out keeps its ~4,200 lines of manager components out of the
 * critical path for the 99% of visitors who never open /admin.
 */
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

const App = () => (
  <AppErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <DeviceCapabilitiesProvider>
        {/*
         * `reducedMotion="user"` is the single highest-leverage accessibility
         * change in the project. framer-motion writes animations as inline
         * styles via rAF, so the `@media (prefers-reduced-motion: reduce)` block
         * in index.css could never reach them — every spring, parallax layer and
         * entrance transform ran at full strength for users who had explicitly
         * asked for less motion. With this flag framer skips transform and
         * layout animations and keeps only opacity, across all ~30 animated
         * components, without touching a single call site.
         */}
        <MotionConfig reducedMotion="user">
          <ThemeProvider>
            <AuthProvider>
              <PortfolioProvider>
                <SoundProvider>
                  <HotToaster
                    position="top-right"
                    gutter={10}
                    toastOptions={{
                      duration: 4000,
                      style: {
                        background: '#1e293b',
                        color: '#fff',
                        borderRadius: '14px',
                        fontSize: '13px',
                        fontWeight: 500,
                        // Keeps toasts inside a 360px viewport (Infinix Hot 10)
                        maxWidth: 'calc(100vw - 24px)',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  />
                  <CustomCursor />
                  <BrowserRouter>
                    <Suspense fallback={<RouteFallback />}>
                      <Routes>
                        {/* Public portfolio — eagerly bundled, it is the landing route */}
                        <Route path="/" element={<Index />} />

                        {/* Admin control suite — lazy loaded */}
                        <Route path="/admin/login" element={<AdminLogin />} />
                        <Route path="/admin" element={<AdminPage />} />
                        <Route path="/admin/*" element={<AdminPage />} />

                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </BrowserRouter>
                </SoundProvider>
              </PortfolioProvider>
            </AuthProvider>
          </ThemeProvider>
        </MotionConfig>
      </DeviceCapabilitiesProvider>
    </QueryClientProvider>
  </AppErrorBoundary>
);

export default App;
