import React from 'react';
import { motion } from 'framer-motion';

import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const About = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow container mx-auto px-4 py-32 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <h1 className="text-4xl font-bold tracking-tight">About FinTracker</h1>
        <div className="prose dark:prose-invert max-w-none text-lg text-muted-foreground">
          <p>
            FinTracker was built with a simple mission: to make personal finance management accessible, intuitive, and secure for everyone. 
          </p>
          <p>
            We believe that understanding your financial health shouldn't require a degree in accounting. Our tools are designed to give you clarity and control over your money, one transaction at a time.
          </p>
          <p>
            Whether you are saving for a big goal, trying to get out of debt, or just want to know where your money goes each month, FinTracker provides the insights you need without the clutter you don't.
          </p>
          <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">Our Values</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Simplicity:</strong> Finance is complex; your tools shouldn't be.</li>
            <li><strong>Privacy:</strong> Your data is yours. We prioritize security and privacy above all.</li>
            <li><strong>Empowerment:</strong> We provide the data; you make the decisions.</li>
          </ul>
        </div>
      </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default About;
