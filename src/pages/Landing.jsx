import React from 'react';
import { FiActivity, FiPieChart, FiShield } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import Footer from '../components/layout/Footer';
import { motion } from 'framer-motion';
import dashboardPreview from '../assets/dashboard-preview.png';

import Navbar from '../components/layout/Navbar';

const Landing = () => {
  return (
    <div className="flex flex-col w-full">
      <Navbar />
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center p-4 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl space-y-6"
        >
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-primary">
            Master Your Finances <br/>
            <span className="text-foreground">One Transaction at a Time.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Track expenses, visualize your spending, and stay on top of your budget with FinTracker. The modern way to manage your money.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link to="/register">
              <Button size="lg" className="rounded-full px-8">Get Started</Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="rounded-full px-8">Login</Button>
            </Link>
          </div>
        </motion.div>

        {/* Hero Image / Illustration Placeholder */}
        <motion.div 
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.2, duration: 0.5 }}
           className="mt-12 w-full max-w-4xl p-4 md:p-8"
        >
          <div className="rounded-xl border bg-card shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] overflow-hidden aspect-video relative group transition-all duration-500 hover:scale-[1.01] hover:shadow-[0_30px_60px_-10px_rgba(0,0,0,0.4)]">
             <img 
                src={dashboardPreview} 
                alt="FinTracker Dashboard Preview" 
                className="w-full h-full object-cover"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
          </div>
        </motion.div>
      </div>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Everything you need to manage your money</h2>
            <p className="text-muted-foreground">Powerful features to help you keep track of your financial life without the complexity.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<FiActivity className="w-10 h-10 text-primary" />}
              title="Digital Wallet"
              description="Top up your protected wallet and manage your personal funds securely with a PIN."
            />
            <FeatureCard 
              icon={<FiPieChart className="w-10 h-10 text-primary" />}
              title="Friends & Payments"
              description="Add friends and send money instantly using just their phone number. Settling up made easy."
            />
            <FeatureCard 
              icon={<FiShield className="w-10 h-10 text-primary" />}
              title="Smart Goals (₹)"
              description="Set financial goals in Rupee and get AI-powered strategies to reach them faster."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
           <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center px-4">
             <div className="space-y-4">
               <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-xl font-bold text-primary">1</div>
               <h3 className="text-xl font-semibold">Create an Account</h3>
               <p className="text-muted-foreground">Sign up in seconds and set up your personal dashboard.</p>
             </div>
             <div className="space-y-4">
               <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-xl font-bold text-primary">2</div>
               <h3 className="text-xl font-semibold">Top Up & Track</h3>
               <p className="text-muted-foreground">Add money to your wallet or log your daily income and expenses.</p>
             </div>
             <div className="space-y-4">
               <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-xl font-bold text-primary">3</div>
               <h3 className="text-xl font-semibold">View Insights</h3>
               <p className="text-muted-foreground">Get detailed reports and visualize your spending habits.</p>
             </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <Footer />
    </div>
  );
};

// Helper Component for Features
const FeatureCard = ({ icon, title, description }) => {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
    >
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </motion.div>
  );
};

export default Landing;
