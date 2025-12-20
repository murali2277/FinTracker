import React from 'react';
import { motion } from 'framer-motion';

import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const Privacy = () => {
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
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <p className="text-sm">Last Updated: {new Date().toLocaleDateString()}</p>
          
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">1. Introduction</h2>
            <p>
              Welcome to FinTracker ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">2. Information We Collect</h2>
            <p>
              We collect personal information that you voluntarily provide to us when registering at the Services expressing an interest in obtaining information about us or our products and services, when participating in activities on the Services or otherwise contacting us.
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Personal Data:</strong> Name, email address, phone numbers, and other similar contact data.</li>
              <li><strong>Financial Data:</strong> Transaction history, wallet balances, and budget goals entered into the application. We do NOT store credit card numbers or bank account passwords directly; we only store the records you manually create or sync securely.</li>
              <li><strong>Credentials:</strong> Passwords, password hints, and similar security information used for authentication and account access.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">3. How We Use Your Information</h2>
            <p>
              We use personal information collected via our Services for a variety of business purposes described below:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>To facilitate account creation and logon process.</li>
              <li>To send you administrative information, such as product, service and new feature information and/or information about changes to our terms, conditions, and policies.</li>
              <li>To protect our Services (e.g., fraud monitoring and prevention).</li>
              <li>To provide you with the financial analytics and insights that are the core function of the application.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">4. Sharing Your Information</h2>
            <p>
              We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. We do not sell your personal data to advertisers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">5. Data Retention</h2>
            <p>
              We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy policy, unless a longer retention period is required or permitted by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">6. Contact Us</h2>
            <p>
              If you have questions or comments about this policy, you may email us at privacy@fintracker.app.
            </p>
          </section>
        </div>
      </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default Privacy;
