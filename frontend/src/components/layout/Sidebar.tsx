
import { LayoutDashboard, Database, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboards', href: '/', icon: LayoutDashboard },
    { name: 'Datasets', href: '/datasets', icon: Database },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-72 bg-white dark:bg-slate-950 flex-shrink-0 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)] z-20 hidden md:flex border-r border-slate-100 dark:border-slate-800">
      <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800">
        <div className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center">
          <LayoutDashboard className="w-6 h-6 mr-2 text-blue-600" />
          AI BI Platform
        </div>
      </div>
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`group flex items-center px-3 py-2.5 text-sm font-semibold rounded-r-full transition-all duration-200 ease-in-out ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 border-l-4 border-blue-600' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-50 border-l-4 border-transparent'
              }`}
            >
              <Icon className={`mr-3 flex-shrink-0 h-5 w-5 transition-transform duration-200 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:scale-110 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} aria-hidden="true" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
