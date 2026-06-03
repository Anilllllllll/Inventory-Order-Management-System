import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  History, 
  LogOut, 
  Menu, 
  X, 
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const adminLinks = [
    { name: 'Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
  ];

  const sellerLinks = [
    { name: 'Products & Shop', path: '/dashboard', icon: Package },
    { name: 'Order History', path: '/dashboard/orders', icon: History },
  ];

  const links = isAdmin ? adminLinks : sellerLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-100 font-sans">
      {/* Background ambient glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl animate-pulse-slow -z-10"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl animate-pulse-slow -z-10"></div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 glass-panel border-r border-slate-800/80 p-5 shrink-0">
        <div className="flex items-center gap-3 px-2 py-4 mb-6">
          <div className="bg-gradient-to-tr from-violet-600 to-fuchsia-600 p-2 rounded-xl shadow-lg shadow-violet-500/20">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg bg-gradient-to-r from-white via-violet-200 to-fuchsia-300 bg-clip-text text-transparent">
              InvenFlow
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
              Management Suite
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const active = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  active
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                }`}
              >
                <Icon className="h-5 w-5" />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="mt-auto border-t border-slate-800/60 pt-4 flex flex-col gap-3">
          <div className="flex items-center gap-3 p-2 bg-slate-900/40 rounded-xl">
            <div className="h-9 w-9 rounded-lg bg-slate-800 flex items-center justify-center text-violet-400">
              <UserIcon className="h-5 w-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold truncate">{user?.name}</p>
              <div className="flex items-center gap-1">
                {isAdmin ? (
                  <span className="flex items-center text-[9px] bg-red-500/10 text-red-400 font-bold px-1.5 py-0.5 rounded border border-red-500/20">
                    <ShieldCheck className="h-2.5 w-2.5 mr-0.5" />
                    Admin
                  </span>
                ) : (
                  <span className="text-[9px] bg-violet-500/10 text-violet-400 font-bold px-1.5 py-0.5 rounded border border-violet-500/20">
                    Seller
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-950/80 backdrop-blur-sm">
          <aside className="w-64 h-full glass-panel border-r border-slate-800/80 p-5 flex flex-col animate-slide-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-tr from-violet-600 to-fuchsia-600 p-2 rounded-xl">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <span className="font-extrabold text-md bg-gradient-to-r from-white via-violet-200 to-fuchsia-300 bg-clip-text text-transparent">
                  InvenFlow
                </span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="flex-1 space-y-1">
              {links.map((link) => {
                const Icon = link.icon;
                const active = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                      active
                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto border-t border-slate-800/60 pt-4 flex flex-col gap-3">
              <div className="flex items-center gap-3 p-2 bg-slate-900/40 rounded-xl">
                <div className="h-9 w-9 rounded-lg bg-slate-800 flex items-center justify-center text-violet-400">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold truncate">{user?.name}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                    isAdmin 
                      ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                      : 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                  }`}>
                    {user?.role}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 glass-panel border-b border-slate-800/80 px-4 md:px-8 flex items-center justify-between shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden md:block">
            <h2 className="text-sm font-semibold text-slate-300">
              Welcome back, <span className="text-violet-400">{user?.name}</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Dashboard Overview
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 p-1 px-3 bg-slate-900/60 border border-slate-800 rounded-full text-xs font-medium">
              <span className={`h-2 w-2 rounded-full ${isAdmin ? 'bg-red-500 shadow-sm shadow-red-500/50' : 'bg-emerald-500 shadow-sm shadow-emerald-500/50'}`} />
              <span className="capitalize">{user?.role?.toLowerCase()} Mode</span>
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
