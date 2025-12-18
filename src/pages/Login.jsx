import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import { toast } from 'react-toastify';
import loginSvg from '../assets/login.svg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      // Toast handles success? usually no, logic handles redirect
      navigate('/dashboard');
    } catch (error) {
      toast.error(error);
    }
  };

  return (
    <div className="w-full h-[calc(100vh-4rem)] grid grid-cols-1 md:grid-cols-2 gap-8 items-center justify-center p-4">
      {/* Left Side: Illustration */}
      <div className="hidden md:flex flex-col items-center justify-center h-full bg-muted/20 rounded-2xl p-8 gap-10 animate-in fade-in slide-in-from-left-10 duration-700">
          <div className="mt-8 text-center space-y-2">
              <h2 className="text-2xl font-bold text-primary">Welcome Back!</h2>
              <p className="text-muted-foreground">Securely access your financial insights.</p>
          </div>
          <img 
            src={loginSvg} 
            alt="Secure Login" 
            className="w-full max-w-md h-auto drop-shadow-xl"
          />
      </div>

      {/* Right Side: Form */}
      <div className="flex items-center justify-center w-full animate-in fade-in slide-in-from-right-10 duration-700">
        <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-primary">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold tracking-tight">Login</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access your dashboard
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="email">Email</label>
                <div className="relative">
                   <Input 
                      id="email" 
                      type="email" 
                      placeholder="m@example.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-3"
                    />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium leading-none" htmlFor="password">Password</label>
                  <Link to="#" className="text-xs font-medium text-primary hover:underline" onClick={(e) => e.preventDefault()}>
                    Forgot password?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-[1.02]" isLoading={loading}>
                Sign In
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center border-t bg-muted/50 py-4">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
