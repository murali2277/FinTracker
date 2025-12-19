import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/Button';
import { FiMoon, FiSun, FiMenu, FiLogOut, FiBell, FiUserPlus, FiCheck, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '../../assets/FinTracker_logo.png';
import axios from 'axios';
import { useState, useEffect, useRef } from 'react';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isLanding = location.pathname === '/' || location.pathname === '/landing';

  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [requests, setRequests] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
      const handleClickOutside = (event) => {
          if (notifRef.current && !notifRef.current.contains(event.target)) {
              setShowNotifs(false);
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifRef]);

  const fetchNotifications = async () => {
      if(!user) return;
      try {
          const config = { headers: { Authorization: `Bearer ${user.token}` } };
          const [notifRes, reqRes] = await Promise.all([
              axios.get('/api/notifications', config),
              axios.get('/api/friends/requests', config)
          ]);
          
          setNotifications(notifRes.data);
          setRequests(reqRes.data);
          
          const unreadNotifs = notifRes.data.filter(n => !n.isRead).length;
          setUnreadCount(unreadNotifs + reqRes.data.length);
      } catch (error) {
          console.error("Failed to fetch notifications");
      }
  };

  const handleAcceptFriend = async (requestId) => {
      try {
          const config = { headers: { Authorization: `Bearer ${user.token}` } };
          await axios.put(`/api/friends/accept/${requestId}`, {}, config);
          toast.success("Friend accepted!");
          setRequests(prev => prev.filter(r => r._id !== requestId));
          setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) { toast.error("Failed to accept friend"); }
  };

  const handleRejectFriend = async (requestId) => {
      try {
          const config = { headers: { Authorization: `Bearer ${user.token}` } };
          await axios.put(`/api/friends/reject/${requestId}`, {}, config);
          toast.info("Friend request rejected");
          setRequests(prev => prev.filter(r => r._id !== requestId));
          setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) { toast.error("Failed to reject friend"); }
  };

  const markRead = async (id) => {
      try {
          const config = { headers: { Authorization: `Bearer ${user.token}` } };
          await axios.put(`/api/notifications/${id}/read`, {}, config);
          setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
          setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) { console.error(error); }
  };

  const markAllRead = async () => {
      try {
          const config = { headers: { Authorization: `Bearer ${user.token}` } };
          await axios.put(`/api/notifications/read-all`, {}, config);
          setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
          setUnreadCount(0);
      } catch (error) { console.error(error); }
  };
  
  // Poll for notifications every 60s
  useEffect(() => {
      if(user) {
          fetchNotifications();
          const interval = setInterval(fetchNotifications, 60000); 
          return () => clearInterval(interval);
      }
  }, [user]);

  const handleLogout = () => {
    navigate('/landing', { replace: true });
    setTimeout(() => {
        logout();
    }, 50);
  };

  // 1. Floating Glassmorphic Navbar (Landing Page Only)
  if (isLanding) {
    return (
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl transition-all duration-300">
        <div className="flex items-center justify-between rounded-full border border-border/40 bg-background/60 px-6 py-3 shadow-2xl backdrop-blur-xl supports-[backdrop-filter]:bg-background/30">
          <div className="flex items-center gap-4">
             {/* Note: Sidebar toggle usually hidden on landing, but keeping logic consistent just in case */}
            {toggleSidebar && (
              <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                <FiMenu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            )}
            <Link to="/" className="flex items-center gap-3">
                <img 
                    src={logo} 
                    alt="FinTracker" 
                    className="h-12 w-auto object-contain mix-blend-multiply dark:mix-blend-screen dark:invert" 
                />
                <div className="flex flex-col items-start justify-center">
                    <span className="text-xl font-serif font-bold tracking-wide text-[#0F2C59] dark:text-blue-400 leading-none">
                        FINTRACKER
                    </span>
                    <span className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-[#0F2C59] dark:text-blue-300 w-full text-center">
                        TRACK | SAVE | GROW
                    </span>
                </div>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
              {theme === 'dark' ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
              <span className="sr-only">Toggle Theme</span>
            </Button>
            
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium hidden sm:inline-block">Hi, {user.name}</span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <FiLogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                 <Link to="/login">
                    <Button variant="ghost" size="sm">Login</Button>
                 </Link>
                 <Link to="/register">
                    <Button size="sm">Get Started</Button>
                 </Link>
              </div>
            )}
          </div>
        </div>
      </header>
    );
  }

  // 2. Standard Sticky Navbar (Dashboard & Other Pages)
  return (
    <header className="relative z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-20 items-center px-4 md:pl-2.5 md:pr-6">
        {toggleSidebar && (
          <Button variant="ghost" size="icon" className="mr-2" onClick={toggleSidebar}>
            <FiMenu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        )}
        <Link to="/" className="flex items-center gap-2 md:gap-3">
            <img 
                src={logo} 
                alt="FinTracker" 
                className="h-8 md:h-16 w-auto object-contain mix-blend-multiply dark:mix-blend-screen dark:invert" 
            />
            <div className="flex flex-col items-start justify-center">
                <span className="text-lg md:text-2xl font-serif font-bold tracking-wide text-[#0F2C59] dark:text-blue-400 leading-none">
                    FINTRACKER
                </span>
                <span className="hidden md:block text-[0.65rem] md:text-xs font-semibold uppercase tracking-[0.3em] text-[#0F2C59] dark:text-blue-300 mt-1 w-full text-center">
                    TRACK | SAVE | GROW
                </span>
            </div>
        </Link>
        <div className="ml-auto flex items-center gap-1 md:gap-4">
          
          {user && (
              <div className="relative" ref={notifRef}>
                  <Button variant="ghost" size="icon" className="relative rounded-full" onClick={() => setShowNotifs(!showNotifs)}>
                      <FiBell className="h-5 w-5" />
                      {unreadCount > 0 && (
                          <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse border border-background"></span>
                      )}
                  </Button>
                  
                  {showNotifs && (
                      <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-lg border bg-popover text-popover-foreground shadow-lg animate-in fade-in zoom-in-95 z-50 overflow-hidden">
                          <div className="flex items-center justify-between p-4 border-b">
                              <h4 className="font-semibold text-sm">Notifications</h4>
                              {unreadCount > 0 && (
                                  <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                                      Mark all read
                                  </button>
                              )}
                          </div>
                          <div className="max-h-[400px] overflow-y-auto">
                              {/* Friend Requests Section */}
                              {requests.length > 0 && (
                                  <div className="border-b border-border bg-indigo-50/30 dark:bg-indigo-900/10">
                                      <div className="px-4 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-100/50 dark:bg-indigo-900/40 flex items-center gap-1">
                                          <FiUserPlus /> Friend Requests
                                      </div>
                                      {requests.map(req => (
                                          <div key={req._id} className="p-3 border-b border-border last:border-0 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                                              <div className="flex items-center justify-between gap-3">
                                                  <div className="flex items-center gap-3">
                                                      <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-200 flex items-center justify-center font-bold text-xs ring-2 ring-background">
                                                         {req.sender.name.charAt(0).toUpperCase()}
                                                      </div>
                                                      <div>
                                                          <p className="text-sm font-medium text-foreground">{req.sender.name}</p>
                                                          <p className="text-xs text-muted-foreground">{req.sender.phone}</p>
                                                      </div>
                                                  </div>
                                                  <div className="flex gap-1">
                                                      <Button 
                                                          size="xs" 
                                                          variant="ghost"
                                                          className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" 
                                                          onClick={(e) => {
                                                              e.stopPropagation();
                                                              handleRejectFriend(req._id);
                                                          }}
                                                      >
                                                          <FiX />
                                                      </Button>
                                                      <Button 
                                                          size="xs" 
                                                          className="h-7 bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-sm" 
                                                          onClick={(e) => {
                                                              e.stopPropagation();
                                                              handleAcceptFriend(req._id);
                                                          }}
                                                      >
                                                          Accept
                                                      </Button>
                                                  </div>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              )}

                              {notifications.length === 0 && requests.length === 0 ? (
                                  <div className="p-8 text-center text-sm text-muted-foreground">
                                      No notifications
                                  </div>
                              ) : (
                                  notifications.map(notif => (
                                      <div 
                                          key={notif._id} 
                                          className={`p-4 border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer ${!notif.isRead ? 'bg-muted/30 dark:bg-muted/10' : ''}`}
                                          onClick={() => !notif.isRead && markRead(notif._id)}
                                      >
                                          <div className="flex gap-3">
                                              <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                                                  notif.type === 'success' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 
                                                  notif.type === 'warning' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                                              }`} />
                                              <div className="flex-1 space-y-1">
                                                  <p className={`text-sm leading-snug ${!notif.isRead ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                                                      {notif.message}
                                                  </p>
                                                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                                      {new Date(notif.createdAt).toLocaleDateString()}
                                                  </p>
                                              </div>
                                          </div>
                                      </div>
                                  ))
                              )}
                          </div>
                      </div>
                  )}
              </div>
          )}

          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
            {theme === 'dark' ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
            <span className="sr-only">Toggle Theme</span>
          </Button>
          
          {user ? (
            <div className="flex items-center gap-1 md:gap-4">
              <span className="text-sm font-medium hidden sm:inline-block">Hi, {user.name}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <FiLogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
               <Link to="/login">
                  <Button variant="ghost" size="sm">Login</Button>
               </Link>
               <Link to="/register">
                  <Button size="sm">Get Started</Button>
               </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
