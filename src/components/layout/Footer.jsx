import React from 'react';
import { Link } from 'react-router-dom';
import { FiGithub, FiTwitter, FiInstagram, FiLinkedin } from 'react-icons/fi';
import logo from '../../assets/FinTracker_logo.png';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-background text-muted-foreground">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img 
                 src={logo} 
                 alt="FinTracker" 
                 className="h-8 w-auto object-contain mix-blend-multiply dark:mix-blend-screen dark:invert" 
              />
              <span className="text-xl font-bold text-foreground">FinTracker</span>
            </Link>
            <p className="text-sm">
              Empowering you to take control of your financial future with smart tracking and powerful insights.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a href="#" className="hover:text-primary transition-colors">
                <FiGithub className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                <FiTwitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                <FiInstagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                <FiLinkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
             <h4 className="text-foreground font-semibold">Company</h4>
             <ul className="space-y-2 text-sm">
               <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
             </ul>
          </div>

          {/* Legal */}
           <div className="space-y-4">
             <h4 className="text-foreground font-semibold">Legal</h4>
             <ul className="space-y-2 text-sm">
               <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
               <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
             </ul>
          </div>
        </div>

        <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p>© {currentYear} FinTracker. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
