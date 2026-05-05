import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

const Login       = lazy(() => import('./pages/Login'));
const Dashboard   = lazy(() => import('./pages/Dashboard'));
const Employees   = lazy(() => import('./pages/Employees'));
const Services    = lazy(() => import('./pages/Services'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Payroll     = lazy(() => import('./pages/Payroll'));
const Reports     = lazy(() => import('./pages/Reports'));
const Schedule    = lazy(() => import('./pages/Schedule'));
const Gallery     = lazy(() => import('./pages/Gallery'));
const Blog        = lazy(() => import('./pages/Blog'));

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-300 border-t-pink-600" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/services" element={<Services />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/payroll" element={<Payroll />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
