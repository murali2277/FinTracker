import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import { toast } from 'react-toastify';
import registerSvg from '../assets/register.svg';
import axios from 'axios';
import { FiArrowLeft, FiMail, FiSmartphone } from 'react-icons/fi';

const Register = () => {
  const [step, setStep] = useState(1); // 1: Details, 2: OTP
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // OTP States
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [otpLoading, setOtpLoading] = useState(false);

  const { register, loading } = useAuth();
  const navigate = useNavigate();

  // Password Requirements: 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  // Phone starts with 6-9 and total 10 digits
  const phoneRegex = /^[6-9]\d{9}$/;

  const validatePassword = (pwd) => {
      if (!passwordRegex.test(pwd)) {
          return "Password must be 8+ chars, include uppercase, lowercase, number, and special char.";
      }
      return "";
  };

  // Resend Timer State
  const [timer, setTimer] = useState(0);

  React.useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleSendOtp = async (e) => {
      if (e) e.preventDefault();
      setPasswordError('');

      // validate details
      if(password !== confirmPassword) {
          setPasswordError("Passwords do not match.");
          return;
      }
      const strengthError = validatePassword(password);
      if (strengthError) {
        setPasswordError(strengthError);
        return;
      }
      
      if (!phoneRegex.test(phone)) {
           toast.error("Please enter a valid Indian mobile number (starts with 6-9).");
           return;
      }

      setOtpLoading(true);
      try {
          // Call backend to generate and send OTP
          await axios.post('/api/users/send-otp', { email, phone });
          toast.success("OTP sent to Email and Phone!");
          setStep(2);
          setTimer(60); // Start 60s timer
      } catch (error) {
          toast.error(error.response?.data?.message || "Failed to send OTPs");
      } finally {
          setOtpLoading(false);
      }
  };
  
  const handleResendOtp = () => {
      handleSendOtp(null);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
        toast.error("Please enter the full 6-digit OTP.");
        return;
    }
    try {
      await register(name, email, phone, password, otpCode);
      navigate('/dashboard');
      toast.success('Account verified and created successfully!');
    } catch (e) {
      console.error(e);
      toast.error(typeof e === 'string' ? e : 'Registration failed.');
    }
  };

  const handleChangeOtp = (element, index) => {
    if (isNaN(element.value)) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next input
    if (element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  const handleBackspaceOtp = (e, index) => {
      if (e.key === "Backspace") {
          if(e.target.value === "") {
             if(e.target.previousSibling) {
                 e.target.previousSibling.focus();
             }
          }
      }
  };

  // Helper to get color ref based on simple length check
  const getBorderColor = () => {
     if (!password) return "";
     if (password !== confirmPassword && confirmPassword) return "border-red-500 focus-visible:ring-red-500";
     if (password === confirmPassword) return "border-green-500 focus-visible:ring-green-500";
     return "";
  };

  return (
    <div className="w-full h-[calc(100vh-4rem)] grid grid-cols-1 md:grid-cols-2 gap-8 items-center justify-center p-4">
      {/* Left Side: Illustration */}
      <div className="hidden md:flex flex-col items-center justify-center h-full bg-muted/20 rounded-2xl p-8 gap-10 animate-in fade-in slide-in-from-left-10 duration-700">
          <div className="mt-8 text-center space-y-2">
              <h2 className="text-2xl font-bold text-primary">Join FinTracker</h2>
              <p className="text-muted-foreground">Start your journey to financial freedom today.</p>
          </div>
          <img 
            src={registerSvg} 
            alt="Sign Up" 
            className="w-full max-w-md h-auto drop-shadow-xl"
          />
      </div>

      {/* Right Side: Form */}
      <div className="flex items-center justify-center w-full animate-in fade-in slide-in-from-right-10 duration-700">
        <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-primary">
          <CardHeader className="space-y-1 text-center relative">
            {step === 2 && (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute left-0 top-0"
                    onClick={() => setStep(1)}
                >
                    <FiArrowLeft />
                </Button>
            )}
            <CardTitle className="text-3xl font-bold tracking-tight">
                {step === 1 ? 'Create Account' : 'Verify Contact'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {step === 1 ? 'Enter your details below to get started' : 'Enter the OTP sent to your email and phone'}
            </p>
          </CardHeader>
          <CardContent>
            {step === 1 ? (
                 <form onSubmit={handleSendOtp} className="space-y-4">
                 <div className="space-y-2">
                   <label className="text-sm font-medium leading-none" htmlFor="name">Full Name</label>
                   <Input 
                     id="name" 
                     type="text" 
                     placeholder="John Doe" 
                     value={name}
                     onChange={(e) => setName(e.target.value)}
                     required
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-sm font-medium leading-none" htmlFor="email">Email</label>
                   <Input 
                     id="email" 
                     type="email" 
                     placeholder="m@example.com" 
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     required
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-sm font-medium leading-none" htmlFor="phone">Phone Number</label>
                   <Input 
                     id="phone" 
                     type="tel" 
                     placeholder="9876543210" 
                     value={phone}
                     onChange={(e) => setPhone(e.target.value)}
                     pattern="[6-9][0-9]{9}"
                     title="10 digit Indian mobile number starting with 6-9"
                     required
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-sm font-medium leading-none" htmlFor="password">Password</label>
                   <Input 
                     id="password" 
                     type="password" 
                     value={password}
                     onChange={(e) => {
                         setPassword(e.target.value);
                         setPasswordError('');
                     }}
                     required
                   />
                   <p className="text-[10px] text-muted-foreground">
                       Must contain 8+ chars, uppercase, lowercase, number, and special char.
                   </p>
                 </div>
                 <div className="space-y-2">
                   <label className="text-sm font-medium leading-none" htmlFor="confirmPassword">Confirm Password</label>
                   <Input 
                     id="confirmPassword" 
                     type="password" 
                     value={confirmPassword}
                     onChange={(e) => setConfirmPassword(e.target.value)}
                     required
                     className={getBorderColor()}
                   />
                 </div>
                 
                 {passwordError && (
                     <div className="text-sm text-red-500 font-medium bg-red-50 p-2 rounded border border-red-200">
                         {passwordError}
                     </div>
                 )}
                 <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-[1.02]" isLoading={otpLoading}>
                   Next: Verify Info
                 </Button>
               </form>
            ) : (
                <form onSubmit={handleRegister} className="space-y-6">
                    <div className="space-y-6 flex flex-col items-center">
                        <div className="space-y-4 w-full">
                            <label className="text-sm font-medium flex items-center justify-center gap-2 text-primary">
                                <FiMail /> <span className="text-xs text-muted-foreground">&</span> <FiSmartphone /> OTP Code
                            </label>
                            
                            <div className="flex justify-center gap-2">
                                {otp.map((data, index) => (
                                    <input
                                        className="w-12 h-12 text-center text-xl font-bold border border-input rounded-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-background"
                                        type="text"
                                        name="otp"
                                        maxLength="1"
                                        key={index}
                                        value={data}
                                        onChange={e => handleChangeOtp(e.target, index)}
                                        onKeyDown={e => handleBackspaceOtp(e, index)}
                                        onFocus={e => e.target.select()}
                                    />
                                ))}
                            </div>
                            
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground mb-2">
                                    Use the same code sent to both <br/>
                                    <span className="font-medium text-foreground">{email}</span> and <span className="font-medium text-foreground">{phone}</span>
                                </p>
                                <Button
                                    type="button"
                                    variant="link"
                                    className="text-xs p-0 h-auto font-normal text-primary"
                                    onClick={handleResendOtp}
                                    disabled={timer > 0 || otpLoading}
                                >
                                    {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
                                </Button>
                            </div>
                            
                        </div>
                    </div>
                    
                    <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-blue-200/50" isLoading={loading}>
                        Verify & Sign Up
                    </Button>
                </form>
            )}
           
          </CardContent>
          <CardFooter className="justify-center border-t bg-muted/50 py-4">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Login
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Register;
