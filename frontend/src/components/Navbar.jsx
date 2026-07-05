import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Calculator, FileSpreadsheet, GitBranch, LogOut, User } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'Admin';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const navItems = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'Submissions', path: '/submissions', icon: FileSpreadsheet },
    { name: 'Calculations', path: '/calculations', icon: Calculator },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Flow Pipeline', path: '/timeline', icon: GitBranch },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 font-bold text-white shadow-lg shadow-blue-500/20">
                ₹
              </div>
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
                PayFlow Auto
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center space-x-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600/10 text-blue-400'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User Controls */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 rounded-lg bg-slate-900 px-3 py-1.5 border border-slate-850">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
                <User className="h-3.5 w-3.5" />
              </div>
              <span className="hidden text-sm font-semibold text-slate-300 sm:inline-block">
                {username}
              </span>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all duration-200"
              title="Logout"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Nav Links Container */}
      <div className="flex border-t border-slate-900 bg-slate-950 md:hidden overflow-x-auto">
        <div className="flex space-x-1 p-2 w-full justify-between">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-md text-[10px] font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-400'
                    : 'text-slate-400'
                }`}
              >
                <Icon className="h-4 w-4 mb-0.5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
