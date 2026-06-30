import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutGrid } from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const { user, tenant, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-base">
      <nav className="bg-surface/80 backdrop-blur-md border-b border-border-base px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-violet-500 flex items-center justify-center">
            <LayoutGrid className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-text-primary tracking-tight">{tenant?.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 text-xs flex items-center justify-center font-medium">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-text-secondary">{user?.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-coral-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}