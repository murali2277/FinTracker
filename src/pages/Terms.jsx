import React from 'react';
import { motion } from 'framer-motion';

import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const Terms = () => {
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
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Terms of Service</h1>
        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <p className="text-sm">Last Updated: {new Date().toLocaleDateString()}</p>
          
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">1. Agreement to Terms</h2>
            <p>
              These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and FinTracker ("we," "us," or "our"), concerning your access to and use of the FinTracker application and website. By accessing the application, you agree that you have read, understood, and agree to be bound by all of these Terms of Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">2. Intellectual Property Rights</h2>
            <p>
              Unless otherwise indicated, the Application is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Application (collectively, the "Content") and the trademarks, service marks, and logos contained therein (the "Marks") are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">3. User Representations</h2>
            <p>
               By using the Application, you represent and warrant that:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>All registration information you submit will be true, accurate, current, and complete.</li>
              <li>You will maintain the accuracy of such information and promptly update such registration information as necessary.</li>
              <li>You have the legal capacity and you agree to comply with these Terms of Service.</li>
              <li>You will not access the Application through automated or non-human means, whether through a bot, script or otherwise.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">4. Prohibited Activities</h2>
            <p>
              You may not access or use the Application for any purpose other than that for which we make the Application available. The Application may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">5. Disclaimer</h2>
            <p>
              The Application is provided on an as-is and as-available basis. You agree that your use of the Application and our services will be at your sole risk. We are not financial advisors, and any data or insights provided by FinTracker are for informational purposes only.
            </p>
          </section>

           <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">6. Term and Termination</h2>
            <p>
              These Terms of Service shall remain in full force and effect while you use the Application. WITHOUT LIMITING ANY OTHER PROVISION OF THESE TERMS OF SERVICE, WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND USE OF THE APPLICATION (INCLUDING BLOCKING CERTAIN IP ADDRESSES), TO ANY PERSON FOR ANY REASON.
            </p>
          </section>
        </div>
      </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default Terms;
