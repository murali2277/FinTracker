import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiCreditCard, FiSend, FiPlusCircle, FiActivity, FiArrowUpRight, FiArrowDownLeft, FiLock, FiEye, FiEyeOff, FiUserPlus, FiUsers, FiCheck, FiX } from 'react-icons/fi';
import { Input } from '../components/ui/Input';

const Wallet = () => {
    const { user } = useAuth();
    const [balance, setBalance] = useState(0);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showBalance, setShowBalance] = useState(true);

    const [showTopUp, setShowTopUp] = useState(false);
    const [showTransfer, setShowTransfer] = useState(false);
    const [showAddFriend, setShowAddFriend] = useState(false); // New Modal state
    
    // Friends State
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [newFriendPhone, setNewFriendPhone] = useState('');

    const [amount, setAmount] = useState('');
    const [phone, setPhone] = useState('');
    const [description, setDescription] = useState('');
    const [modalLoading, setModalLoading] = useState(false);

    const [hasPin, setHasPin] = useState(true); // Assume true initially to avoid flicker
    const [showSetPin, setShowSetPin] = useState(false);
    
    // Form States
    const [pin, setPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [isEditingFriends, setIsEditingFriends] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [pinError, setPinError] = useState('');

    useEffect(() => {
        fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const [wRes, hRes, fRes, rRes] = await Promise.all([
                axios.get('/api/wallet', config),
                axios.get('/api/wallet/history', config),
                axios.get('/api/friends', config),
                axios.get('/api/friends/requests', config)
            ]);
            setBalance(wRes.data.balance);
            setHasPin(wRes.data.hasPin);
            if (!wRes.data.hasPin) {
                setShowSetPin(true);
            }
            setHistory(hRes.data);
            setFriends(fRes.data);
            setRequests(rRes.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleSetPin = async (e) => {
        e.preventDefault();
        setPinError('');
        
        if (newPin !== confirmPin) {
            setPinError("PINs do not match");
            return;
        }
        if (!/^\d{4,6}$/.test(newPin)) {
            setPinError("PIN must be 4-6 numeric digits");
            return;
        }
        
        setModalLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post('/api/wallet/pin', { pin: newPin }, config);
            toast.success("Wallet PIN set successfully!");
            setHasPin(true);
            setShowSetPin(false);
        } catch (error) {
            // For backend validation errors handled by inline, fallback to toast only if generic
            const msg = error.response?.data?.message;
            if (msg === 'PIN must be 4-6 digits' || msg === 'PINs do not match') {
                 setPinError(msg);
            } else {
                 toast.error(msg || "Failed to set PIN");
            }
        } finally {
            setModalLoading(false);
        }
    };

    const handleAddFriend = async (e) => {
        e.preventDefault();
        setModalLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post('/api/friends/request', { phone: newFriendPhone }, config);
            toast.success("Friend request sent!");
            setNewFriendPhone('');
            setShowAddFriend(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send request");
        } finally {
            setModalLoading(false);
        }
    };

    const handleAcceptFriend = async (requestId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`/api/friends/accept/${requestId}`, {}, config);
            toast.success("Friend accepted!");
            fetchData();
        } catch (error) {
            toast.error("Failed to accept friend");
        }
    };

    const handleRemoveFriend = async (friendId) => {
        if (!window.confirm("Are you sure you want to remove this friend?")) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.delete(`/api/friends/${friendId}`, config);
            toast.success("Friend removed");
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to remove friend");
        }
    };

    const initiateTransfer = (friendPhone) => {
        setPhone(friendPhone);
        setAmount('');
        setDescription('');
        setPin(''); // Reset PIN for new transaction
        setShowTransfer(true);
    };

    const handleTopUp = async (e) => {
        e.preventDefault();
        setModalLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post('/api/wallet/topup', { amount: Number(amount), pin }, config);
            toast.success("Wallet topped up!");
            setAmount('');
            setPin('');
            setShowTopUp(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Top up failed");
        } finally {
            setModalLoading(false);
        }
    };

    const handleTransfer = async (e) => {
        e.preventDefault();
        setModalLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post('/api/wallet/transfer', { phone, amount: Number(amount), description, pin }, config);
            toast.success("Transfer successful!");
            setAmount('');
            setPhone('');
            setDescription('');
            setPin('');
            setShowTransfer(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Transfer failed");
        } finally {
            setModalLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <h1 className="text-2xl font-bold">Digital Wallet</h1>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                
                {/* Left Column: Wallet Logic + History */}
                <div className="flex flex-col gap-6 h-full">
                    {/* Wallet Card */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white shadow-xl h-64 flex flex-col justify-between">
                        <div className="absolute top-0 right-0 p-32 opacity-10 rounded-full bg-white blur-3xl transform translate-x-10 -translate-y-10"></div>
                        
                        <div className="flex justify-between items-start z-10">
                            <div>
                               <div className="flex items-center gap-2 mb-1">
                                   <p className="text-indigo-200 text-sm font-medium tracking-wider">CURRENT BALANCE</p>
                                   <button onClick={() => setShowBalance(!showBalance)} className="text-indigo-200 hover:text-white transition-colors">
                                       {showBalance ? <FiEyeOff /> : <FiEye />}
                                   </button>
                               </div>
                               <h2 className="text-4xl font-bold">
                                   {loading ? '...' : showBalance ? `₹${balance.toLocaleString()}` : '****'}
                               </h2>
                            </div>
                            <FiCreditCard className="text-3xl opacity-80" />
                        </div>

                        <div className="z-10 mt-8">
                           <p className="font-mono text-lg tracking-widest opacity-80">
                             **** **** **** {user._id.slice(-4).toUpperCase()}
                           </p>
                           <div className="flex justify-between items-end mt-4">
                               <div>
                                   <p className="text-[10px] text-indigo-300 uppercase">Card Holder</p>
                                   <p className="font-medium text-sm">{user.name.toUpperCase()}</p>
                               </div>
                               <div className="flex gap-3">
                                    <Button 
                                        className="bg-white/20 hover:bg-white/30 text-white backdrop-blur border-none" 
                                        size="sm"
                                        onClick={() => {
                                            setPin('');
                                            setShowTopUp(true);
                                        }}
                                    >
                                        <FiPlusCircle className="mr-2" /> Top Up
                                    </Button>
                                    <Button 
                                        className="bg-white text-indigo-900 hover:bg-indigo-50 border-none" 
                                        size="sm"
                                        onClick={() => {
                                            setPin('');
                                            setShowTransfer(true);
                                        }}
                                    >
                                        <FiSend className="mr-2" /> Send
                                    </Button>
                               </div>
                           </div>
                        </div>
                    </div>

                    {/* Transaction History (Moved Here) */}
                    <Card className="flex-1 flex flex-col min-h-0">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FiActivity /> Wallet History
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto">
                            <div className="space-y-4">
                                {history.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">No wallet transactions yet.</p>
                                ) : (
                                    history.map(tx => (
                                        <div key={tx._id} className="flex items-center justify-between p-3 border-b last:border-0 hover:bg-muted/50 rounded-lg transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-full ${
                                                    tx.type === 'TOPUP' ? 'bg-green-100 text-green-600' : 
                                                    tx.type === 'RECEIVED' ? 'bg-blue-100 text-blue-600' :
                                                    'bg-orange-100 text-orange-600' // SENT
                                                }`}>
                                                    {tx.type === 'TOPUP' ? <FiPlusCircle /> : 
                                                     tx.type === 'RECEIVED' ? <FiArrowDownLeft /> : <FiArrowUpRight />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {tx.type === 'TOPUP' ? 'Wallet Top Up' : 
                                                         tx.type === 'TRANSFER' ? `Sent to ${tx.relatedUser?.name || 'Unknown'}` :
                                                         `Received from ${tx.relatedUser?.name || 'Unknown'}`
                                                        }
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className={`font-bold ${
                                                tx.type === 'TOPUP' || tx.type === 'RECEIVED' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {/* Ensure currency symbol is Correct */}
                                                {tx.type === 'TOPUP' || tx.type === 'RECEIVED' ? '+' : '-'}₹{Math.abs(tx.amount).toFixed(2)}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Friends List (Full Height) */}
                <div className="h-full">
                     <Card className="h-full flex flex-col">
                         <CardHeader className="flex flex-row items-center justify-between shrink-0">
                             <CardTitle className="flex items-center gap-2">
                                 <FiUsers /> Friends
                             </CardTitle>
                             <div className="flex gap-2">
                                {friends.length > 0 && (
                                    <Button size="sm" variant={isEditingFriends ? "secondary" : "ghost"} onClick={() => setIsEditingFriends(!isEditingFriends)}>
                                        {isEditingFriends ? "Done" : "Edit"}
                                    </Button>
                                )}
                                <Button size="sm" variant="outline" onClick={() => setShowAddFriend(true)}>
                                    <FiUserPlus className="mr-2" /> Add Friend
                                </Button>
                             </div>
                         </CardHeader>
                         <CardContent className="flex-1 overflow-y-auto min-h-[400px]">
                             {friends.length > 0 && (
                                 <div className="mb-4">
                                     <Input
                                         placeholder="Search friends by name or phone..."
                                         value={searchQuery}
                                         onChange={(e) => setSearchQuery(e.target.value)}
                                     />
                                 </div>
                             )}
                             {friends.length === 0 ? (
                                 <div className="text-center py-6 text-muted-foreground">
                                     No friends yet. Add some to send money easily!
                                 </div>
                             ) : (
                                 <div className="grid grid-cols-1 gap-4">
                                     {friends.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.phone.includes(searchQuery)).map(friend => (
                                         <div key={friend._id} className="flex items-center justify-between p-3 border hover:border-indigo-200 hover:shadow-sm rounded-lg transition-all bg-card/50 gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg shrink-0">
                                                    {friend.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium truncate">{friend.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{friend.phone}</p>
                                                </div>
                                            </div>
                                            {isEditingFriends ? (
                                                <Button size="sm" variant="destructive" className="shrink-0" onClick={() => handleRemoveFriend(friend._id)}>
                                                    Remove
                                                </Button>
                                            ) : (
                                                <Button size="sm" variant="secondary" className="hover:bg-indigo-100 hover:text-indigo-700 shrink-0" onClick={() => initiateTransfer(friend.phone)}>
                                                    Pay
                                                </Button>
                                            )}
                                        </div>
                                     ))}
                                 </div>
                             )}
                         </CardContent>
                     </Card>
                </div>
            </div>

            {/* Modals */}
            {/* Set PIN Modal (Forced if !hasPin) */}
            {showSetPin && (
                 <div className="fixed top-0 left-0 right-0 bottom-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 h-screen w-screen">
                     <Card className="w-full max-w-sm border-indigo-200 shadow-2xl animate-in zoom-in-95">
                         <CardHeader>
                             <CardTitle className="text-center text-indigo-700 flex flex-col items-center gap-2">
                                 <FiLock className="text-3xl" />
                                 Set Wallet PIN
                             </CardTitle>
                             <p className="text-center text-sm text-muted-foreground">
                                 Create a secure 4-6 digit PIN for transactions.
                             </p>
                         </CardHeader>
                         <CardContent>
                             <form onSubmit={handleSetPin} className="space-y-4">
                                 <Input 
                                     type="password"
                                     placeholder="Enter PIN (4-6 digits)" 
                                     value={newPin} 
                                     onChange={(e) => {
                                         const val = e.target.value;
                                         if (/^\d*$/.test(val)) {
                                             setNewPin(val);
                                             setPinError('');
                                         }
                                     }} 
                                     maxLength={6}
                                     className="text-center text-2xl tracking-widest"
                                     autoFocus
                                     inputMode="numeric"
                                     pattern="[0-9]*"
                                 />
                                 <Input 
                                     type="password"
                                     placeholder="Confirm PIN" 
                                     value={confirmPin} 
                                     onChange={(e) => {
                                          const val = e.target.value;
                                          if (/^\d*$/.test(val)) {
                                             setConfirmPin(val);
                                             setPinError('');
                                          }
                                     }} 
                                     maxLength={6}
                                     className="text-center text-2xl tracking-widest"
                                     inputMode="numeric"
                                     pattern="[0-9]*"
                                 />
                                 {pinError && (
                                     <p className="text-sm text-red-500 font-medium text-center animate-shake">
                                         {pinError}
                                     </p>
                                 )}
                                 <Button className="w-full" size="lg" isLoading={modalLoading} disabled={newPin.length < 4}>
                                     Set Secure PIN
                                 </Button>
                             </form>
                         </CardContent>
                     </Card>
                 </div>
            )}

            {/* Top Up Modal */}
            {showTopUp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-sm animate-in zoom-in-95">
                        <CardHeader>
                            <CardTitle>Top Up Wallet</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleTopUp} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Amount (₹)</label>
                                    <Input 
                                        type="number" 
                                        min="1" 
                                        value={amount} 
                                        onChange={e => setAmount(e.target.value)} 
                                        required 
                                        placeholder="100.00"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Wallet PIN</label>
                                    <Input 
                                        type="password" 
                                        value={pin} 
                                        onChange={e => setPin(e.target.value)} 
                                        required 
                                        placeholder="Enter PIN"
                                        maxLength={6}
                                        className="tracking-widest"
                                    />
                                </div>
                                <div className="flex gap-2 justify-end pt-2">
                                    <Button type="button" variant="ghost" onClick={() => setShowTopUp(false)}>Cancel</Button>
                                    <Button type="submit" isLoading={modalLoading}>Add Funds</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Transfer Modal */}
            {showTransfer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-sm animate-in zoom-in-95">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FiLock className="text-amber-500"/> Secure Transfer
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleTransfer} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Recipient Phone Number</label>
                                    <Input 
                                        type="tel" 
                                        value={phone} 
                                        onChange={e => setPhone(e.target.value)} 
                                        required 
                                        placeholder="9876543210"
                                        pattern="[0-9]{10}"
                                        title="10 digit mobile number"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Amount (₹)</label>
                                    <Input 
                                        type="number" 
                                        min="1" 
                                        value={amount} 
                                        onChange={e => setAmount(e.target.value)} 
                                        required 
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Description (Optional)</label>
                                    <Input 
                                        type="text" 
                                        value={description} 
                                        onChange={e => setDescription(e.target.value)} 
                                        placeholder="e.g. Dinner, Rent"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Wallet PIN</label>
                                    <Input 
                                        type="password" 
                                        value={pin} 
                                        onChange={e => setPin(e.target.value)} 
                                        required 
                                        placeholder="Enter PIN"
                                        maxLength={6}
                                        className="tracking-widest"
                                    />
                                </div>
                                <div className="p-2 bg-amber-50 border border-amber-100 rounded text-xs text-amber-800">
                                    Funds will be instantly transferred and deducted from your balance.
                                </div>
                                <div className="flex gap-2 justify-end pt-2">
                                    <Button type="button" variant="ghost" onClick={() => setShowTransfer(false)}>Cancel</Button>
                                    <Button type="submit" isLoading={modalLoading}>Send Money</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
            {/* Add Friend Modal */}
            {showAddFriend && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-sm animate-in zoom-in-95">
                        <CardHeader>
                            <CardTitle>Add Friend</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddFriend} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Friend's Phone Number</label>
                                    <Input 
                                        type="tel" 
                                        value={newFriendPhone} 
                                        onChange={e => setNewFriendPhone(e.target.value)} 
                                        required 
                                        placeholder="9876543210"
                                        pattern="[0-9]{10}"
                                        title="10 digit mobile number"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        They will receive a request to accept.
                                    </p>
                                </div>
                                <div className="flex gap-2 justify-end pt-2">
                                    <Button type="button" variant="ghost" onClick={() => setShowAddFriend(false)}>Cancel</Button>
                                    <Button type="submit" isLoading={modalLoading}>Send Request</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Wallet;
