
import { Search, Bell, User } from 'lucide-react';

export const Navbar = () => {
  return (
    <header className="h-16 flex items-center justify-between px-8 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl sticky top-0 z-30 transition-all">
      <div className="flex flex-1 items-center">
        <div className="max-w-md w-full relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-2 border border-slate-200 dark:border-slate-700/50 rounded-full leading-5 bg-slate-100/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm transition-all shadow-sm"
            placeholder="Search datasets, dashboards, and insights..."
          />
        </div>
      </div>
      <div className="flex items-center space-x-6">
        <button className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
          <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-950"></span>
          <span className="sr-only">View notifications</span>
          <Bell className="h-5 w-5" aria-hidden="true" />
        </button>
        <button className="flex items-center p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full hover:shadow-md transition-all group">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-inner group-hover:scale-105 transition-transform">
            <User className="h-4 w-4" aria-hidden="true" />
          </div>
        </button>
      </div>
    </header>
  );
};
