import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiCreditCard, FiSend, FiPlusCircle, FiActivity, FiArrowUpRight, FiArrowDownLeft, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { Input } from '../components/ui/Input';

const Wallet = () => {
    const { user } = useAuth();
    const [balance, setBalance] = useState(0);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showBalance, setShowBalance] = useState(true);

    const [showTopUp, setShowTopUp] = useState(false);
    const [showTransfer, setShowTransfer] = useState(false);
    const [amount, setAmount] = useState('');
    const [email, setEmail] = useState('');
    const [description, setDescription] = useState('');
    const [modalLoading, setModalLoading] = useState(false);

    useEffect(() => {
        fetchWallet();
    }, [user]);

    const fetchWallet = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const [wRes, hRes] = await Promise.all([
                axios.get('/api/wallet', config),
                axios.get('/api/wallet/history', config)
            ]);
            setBalance(wRes.data.balance);
            setHistory(hRes.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleTopUp = async (e) => {
        e.preventDefault();
        setModalLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post('/api/wallet/topup', { amount: Number(amount) }, config);
            toast.success("Wallet topped up!");
            setAmount('');
            setShowTopUp(false);
            fetchWallet();
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
            await axios.post('/api/wallet/transfer', { email, amount: Number(amount), description }, config);
            toast.success("Transfer successful!");
            setAmount('');
            setEmail('');
            setDescription('');
            setShowTransfer(false);
            fetchWallet();
        } catch (error) {
            toast.error(error.response?.data?.message || "Transfer failed");
        } finally {
            setModalLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <h1 className="text-2xl font-bold">Digital Wallet</h1>

            {/* Wallet Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                               {loading ? '...' : showBalance ? `$${balance.toLocaleString()}` : '****'}
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
                                    onClick={() => setShowTopUp(true)}
                                >
                                    <FiPlusCircle className="mr-2" /> Top Up
                                </Button>
                                <Button 
                                    className="bg-white text-indigo-900 hover:bg-indigo-50 border-none" 
                                    size="sm"
                                    onClick={() => setShowTransfer(true)}
                                >
                                    <FiSend className="mr-2" /> Send
                                </Button>
                           </div>
                       </div>
                    </div>
                </div>

                {/* Quick Info / Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <Card className="flex flex-col justify-center items-center p-6 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100">
                         <div className="p-3 bg-emerald-100 dark:bg-emerald-900 rounded-full mb-3 text-emerald-600">
                             <FiArrowDownLeft className="text-2xl" />
                         </div>
                         <h3 className="font-semibold text-lg text-emerald-700">Income</h3>
                         <p className="text-sm text-center text-muted-foreground mt-1">Receive funds instantly from friends</p>
                     </Card>
                     <Card className="flex flex-col justify-center items-center p-6 bg-rose-50 dark:bg-rose-950/30 border-rose-100">
                         <div className="p-3 bg-rose-100 dark:bg-rose-900 rounded-full mb-3 text-rose-600">
                             <FiArrowUpRight className="text-2xl" />
                         </div>
                         <h3 className="font-semibold text-lg text-rose-700">Transfer</h3>
                         <p className="text-sm text-center text-muted-foreground mt-1">Secure payments to any user</p>
                     </Card>
                </div>
            </div>

            {/* Transaction History */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FiActivity /> Wallet History
                    </CardTitle>
                </CardHeader>
                <CardContent>
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
                                        {tx.type === 'TOPUP' || tx.type === 'RECEIVED' ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Modals */}
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
                                    <label className="text-sm font-medium">Amount ($)</label>
                                    <Input 
                                        type="number" 
                                        min="1" 
                                        value={amount} 
                                        onChange={e => setAmount(e.target.value)} 
                                        required 
                                        placeholder="100.00"
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
                                    <label className="text-sm font-medium">Recipient Email</label>
                                    <Input 
                                        type="email" 
                                        value={email} 
                                        onChange={e => setEmail(e.target.value)} 
                                        required 
                                        placeholder="friend@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Amount ($)</label>
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
        </div>
    );
};

export default Wallet;
