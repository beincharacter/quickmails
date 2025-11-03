import { useState } from 'react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Toggle menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
              <h1 className="text-xl font-bold text-gray-900">Email Sender</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:flex items-center text-sm text-gray-600">
                <span className="font-medium">{user.name}</span>
                <span className="text-gray-400 mx-2">•</span>
                <span className="hidden md:inline">{user.email}</span>
                <span className="md:hidden">{user.email.split('@')[0]}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <span className="hidden sm:inline">Sign Out</span>
                <span className="sm:hidden">Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] transform transition-transform duration-200 ease-in-out ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full lg:w-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

