import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { toast } from 'react-toastify';

const Settings = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  const handleUpdate = (e) => {
     e.preventDefault();
     toast.success('Profile updated successfully!');
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
                <Button type="submit">Update Profile</Button>
             </form>
          </CardContent>
       </Card>
    </div>
  );
};

export default Settings;
