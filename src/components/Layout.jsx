import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const nav = [
  { to: '/', label: 'Dashboard' },
  { to: '/schedule', label: 'Schedule' },
  { to: '/employees', label: 'Employees' },
  { to: '/services', label: 'Services' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/payroll', label: 'Payroll' },
  { to: '/reports', label: 'Reports' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-rose-100 bg-white shadow-sm">
        <div className="border-b border-rose-100 px-5 py-6">
          <h1 className="text-lg font-bold tracking-tight text-primary">Nail Salon</h1>
          <p className="text-xs text-slate-500">Management</p>
        </div>
        <nav className="flex flex-col gap-0.5 p-3">
          {nav.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-rose-100 text-primary'
                    : 'text-slate-600 hover:bg-rose-50 hover:text-primary'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-rose-100 bg-white/90 px-6 backdrop-blur">
          <span className="text-sm text-slate-500">
            Signed in as <span className="font-semibold text-slate-800">{user?.username}</span>
            {user?.role && (
              <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-xs text-primary">
                {user.role}
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-rose-50"
          >
            Log out
          </button>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
