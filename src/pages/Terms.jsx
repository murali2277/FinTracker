import React from 'react';
import { motion } from 'framer-motion';

const Terms = () => {
  return (
    <div className="container mx-auto px-4 py-32 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
        <div className="prose dark:prose-invert max-w-none text-muted-foreground">
          <p className="text-sm text-foreground/60 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using FinTracker, you accept and agree to be bound by the terms and provision of this agreement.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">2. Use License</h2>
          <p>
            Permission is granted to temporarily use FinTracker for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">3. Disclaimer</h2>
          <p>
            The materials on FinTracker's website are provided "as is". FinTracker makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties.
          </p>
          <p className="mt-4">
             FinTracker is an educational and organizational tool. We are not financial advisors, and the information provided by the app should not be considered professional financial advice.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">4. Limitations</h2>
          <p>
            In no event shall FinTracker or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on FinTracker.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Terms;
