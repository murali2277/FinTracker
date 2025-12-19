import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { toast } from 'react-toastify';
import { FiAlertTriangle } from 'react-icons/fi';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { user, updateProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  
  /* Delete Account with Verification */
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const [verifyPassword, setVerifyPassword] = useState('');
  const [captchaValue, setCaptchaValue] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');

  // Generate Captcha when modal opens
  const generateCaptcha = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars (I/1, O/0)
      let result = '';
      for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setCaptchaValue(result);
      setCaptchaInput('');
      setVerifyPassword('');
  };

  const handleDeleteAccount = async (e) => {
      e.preventDefault();
      
      if (captchaInput.toUpperCase() !== captchaValue) {
          toast.error("Incorrect CAPTCHA code");
          return;
      }
      
      if (!verifyPassword) {
          toast.error("Please enter your password");
          return;
      }

      setDeleteLoading(true);
      try {
          const config = { 
              headers: { Authorization: `Bearer ${user.token}` },
              data: { password: verifyPassword } // DELETE sends body via 'data' property
          };
          await axios.delete('/api/users/profile', config);
          toast.success('Account deleted successfully');
          navigate('/landing');
          setTimeout(() => {
              logout();
          }, 50);
      } catch (error) {
          toast.error(error.response?.data?.message || 'Failed to delete account');
          setDeleteLoading(false);
          generateCaptcha(); // Refresh captcha on failure
      }
  };
  
  // Trigger captcha when modal opens
  React.useEffect(() => {
      if(showDeleteModal) generateCaptcha();
  }, [showDeleteModal]);

  const handleUpdate = async (e) => {
     e.preventDefault();
     try {
         await updateProfile({ name, email, phone: user?.phone ? undefined : phone });
         toast.success('Profile updated successfully!');
     } catch (error) {
         toast.error(error || "Update failed");
     }
  };

  return (
    <div className="space-y-6 max-w-4xl">
       <h2 className="text-3xl font-bold tracking-tight">Settings</h2>

       <Card>
          <CardHeader>
             <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
             <div className="space-y-1">
                <p className="font-medium">Theme</p>
                <p className="text-sm text-muted-foreground">Customize how FinTracker looks on your device</p>
             </div>
             <Button onClick={toggleTheme} variant="outline">
                {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
             </Button>
          </CardContent>
       </Card>

       <Card>
          <CardHeader>
             <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
             <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid gap-2">
                   <label htmlFor="name">Display Name</label>
                   <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                   <label htmlFor="email">Email</label>
                   <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="grid gap-2">
                   <label htmlFor="phone">Phone Number</label>
                   {user?.phone ? (
                       <>
                           <Input 
                                id="phone" 
                                value={user.phone} 
                                disabled 
                                className="bg-muted text-muted-foreground"
                           />
                           <p className="text-[10px] text-muted-foreground">Phone number cannot be changed once set.</p>
                       </>
                   ) : (
                       <Input 
                            id="phone" 
                            type="tel"
                            placeholder="Add your 10-digit phone number"
                            value={phone} 
                            onChange={(e) => setPhone(e.target.value)}
                            pattern="[0-9]{10}"
                            title="10 digit mobile number"
                        />
                   )}
                </div>
                <Button type="submit">Update Profile</Button>
             </form>
          </CardContent>
       </Card>
       <Card className="border-red-100 bg-red-50/10 dark:border-red-900/50 dark:bg-red-900/10">
          <CardHeader>
             <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                 <FiAlertTriangle /> Danger Zone
             </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="flex items-center justify-between">
                 <div className="space-y-1">
                    <p className="font-medium text-red-600 dark:text-red-400">Delete Account</p>
                    <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data.</p>
                 </div>
                 <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
                    Delete Account
                 </Button>
             </div>
          </CardContent>
       </Card>

       {/* Delete Confirmation Modal */}
       {showDeleteModal && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
               <Card className="w-full max-w-md border-red-200 animate-in zoom-in-95">
                   <CardHeader className="space-y-1">
                       <CardTitle className="text-red-600 flex items-center gap-2">
                           <FiAlertTriangle /> Delete Account?
                       </CardTitle>
                       <p className="text-sm text-muted-foreground">
                           This action cannot be undone. All your data (transactions, friends, history) will be permanently lost.
                       </p>
                   </CardHeader>
                   <CardContent>
                       <form onSubmit={handleDeleteAccount} className="space-y-4 pt-4">
                           <div className="space-y-2">
                               <label className="text-sm font-medium">Verify Password</label>
                               <Input 
                                   type="password" 
                                   placeholder="Enter your password"
                                   value={verifyPassword}
                                   onChange={(e) => setVerifyPassword(e.target.value)}
                                   required
                               />
                           </div>
                           
                           <div className="space-y-2">
                               <label className="text-sm font-medium">Security Check</label>
                               <div className="flex gap-3">
                                   <div className="flex items-center justify-center bg-muted/50 border border-input rounded-md px-4 font-mono text-lg tracking-widest font-bold select-none text-indigo-600 dark:text-indigo-400 w-32">
                                       {captchaValue}
                                   </div>
                                    <Input 
                                       placeholder="Enter code"
                                       value={captchaInput}
                                       onChange={(e) => setCaptchaInput(e.target.value)}
                                       className="uppercase"
                                       maxLength={5}
                                       required
                                   />
                               </div>
                               <p className="text-xs text-muted-foreground">Type the characters shown above to verify you are human.</p>
                           </div>

                           <div className="flex gap-3 justify-end pt-2">
                               <Button type="button" variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                               <Button type="submit" variant="destructive" isLoading={deleteLoading}>
                                   Yes, Delete Forever
                               </Button>
                           </div>
                       </form>
                   </CardContent>
               </Card>
           </div>
       )}
    </div>
  );
};

export default Settings;
