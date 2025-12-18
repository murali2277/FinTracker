import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { 
  FiHome, 
  FiPlusCircle, 
  FiList, 
  FiPieChart, 
  FiCalendar,
  FiSettings,
  FiTarget,
  FiX,
  FiCreditCard 
} from 'react-icons/fi';
import { Button } from '../ui/Button';

const Sidebar = ({ isOpen, onClose }) => {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: FiHome },
    { name: 'Wallet', path: '/wallet', icon: FiCreditCard },
    { name: 'Today Transaction', path: '/add-transaction', icon: FiPlusCircle },
    { name: 'History', path: '/history', icon: FiList },
    { name: 'Analytics', path: '/analytics', icon: FiPieChart },
    { name: 'Calendar', path: '/calendar', icon: FiCalendar },
    { name: 'Goals', path: '/goals', icon: FiTarget },
    { name: 'Settings', path: '/settings', icon: FiSettings },
  ];

  const handleLinkClick = () => {
    // Only close sidebar automatically on mobile devices (< 768px)
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 h-full border-r bg-card transition-all duration-300 ease-in-out md:static whitespace-nowrap overflow-hidden group",
        isOpen 
            ? "w-64 translate-x-0" 
            : "w-64 -translate-x-full md:w-16 md:translate-x-0 md:hover:w-64"
      )}>
        <div className="flex h-16 items-center justify-center border-b px-6 md:hidden">
           {/* Mobile Header */}
           <span className="text-lg font-bold">Menu</span>

           <Button variant="ghost" size="icon" className="ml-auto" onClick={onClose}>
             <FiX className="h-5 w-5" />
           </Button>
        </div>
        <div className="flex flex-col py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleLinkClick} 
              className={({ isActive }) => cn(
                "flex items-center gap-4 px-5 py-3 text-sm font-medium transition-colors min-h-[48px]",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className={cn(
                  "transition-opacity duration-300",
                  !isOpen && "md:opacity-0 md:group-hover:opacity-100 hidden md:block" // Hide text when collapsed on desktop
              )}>
                  {item.name}
              </span>
            </NavLink>
          ))}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
