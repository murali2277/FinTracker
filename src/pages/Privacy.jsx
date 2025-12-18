import React from 'react';
import { motion } from 'framer-motion';

const Privacy = () => {
  return (
    <div className="container mx-auto px-4 py-32 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <div className="prose dark:prose-invert max-w-none text-muted-foreground">
          <p className="text-sm text-foreground/60 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">1. Information We Collect</h2>
          <p>
            When you use FinTracker, we collect information that you strictly provide to us, such as your name, email address (for account creation), and the financial transaction data you enter into the application.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">2. How We Use Your Information</h2>
          <p>
            We use your information solely to provide and improve the FinTracker service. Specifically:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>To create and maintain your account.</li>
            <li>To display your financial dashboard and analytics.</li>
            <li>To respond to your support requests.</li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">3. Data Security</h2>
          <p>
            We take the security of your data seriously. We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">4. Sharing of Information</h2>
          <p>
            We do not sell, trade, or rent your personal identification information to others. We do not share your financial data with third-party advertisers.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Privacy;
