import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from '../utils/auth';

interface LayoutProps {
  children: React.ReactNode;
  user: { name: string; email: string; picture?: string };
  onSignOut?: () => void;
}

export const Layout = ({ children, user, onSignOut }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    // Call parent callback if provided to update auth state
    if (onSignOut) {
      onSignOut();
    }
    // Navigate to login
    navigate('/login', { replace: true });
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/datasets', label: 'Datasets', icon: '📋' },
    { path: '/templates', label: 'Templates', icon: '✉️' },
    { path: '/campaigns', label: 'Campaigns', icon: '📬' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Email Sender</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{user.name}</span>
                <span className="text-gray-400 mx-2">•</span>
                <span>{user.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

