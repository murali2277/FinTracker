import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { toast } from 'react-toastify';
import { FiEdit2, FiTrash2, FiSave, FiX, FiCheck } from 'react-icons/fi';

// Constants
const INCOME_CATEGORIES = ['Salary', 'Business', 'Freelance', 'Investment Returns', 'Gift', 'Other'];
const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Education', 'Shopping', 'Rent', 'Other'];
const SAVINGS_CATEGORIES = ['Emergency', 'Retirement', 'Travel', 'House', 'Education', 'Gadgets', 'Other'];
const PAYMENT_MODES = ['UPI', 'Bank Transfer', 'Cash', 'Credit Card', 'Debit Card', 'Cheque'];
const SAVINGS_METHODS = ['Bank Deposit', 'FD', 'RD', 'SIP', 'Mutual Fund', 'Stocks', 'Cash'];

const TodayTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});

  const fetchTransactions = async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };
      const { data } = await axios.get('/api/transactions', config);
      
      // Filter by Creation Date (Entries made today)
      const today = new Date().toDateString();
      const todayTxns = data.filter(t => {
          const createdDate = new Date(t.createdAt).toDateString();
          return createdDate === today;
      });
      
      setTransactions(todayTxns.reverse());
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  const handleEdit = (txn) => {
    setEditingId(txn._id);
    setFormData({
      title: txn.title,
      amount: txn.amount,
      category: txn.category,
      paymentMode: txn.paymentMode,
      type: txn.type 
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({});
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (id) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };
      await axios.put(`/api/transactions/${id}`, formData, config);
      toast.success('Transaction updated');
      setEditingId(null);
      fetchTransactions();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };
      await axios.delete(`/api/transactions/${id}`, config);
      toast.success('Transaction deleted');
      fetchTransactions();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Today's Entries</h2>
      <p className="text-muted-foreground">Transactions created today.</p>
      
      {loading ? (
        <p>Loading...</p>
      ) : transactions.length === 0 ? (
        <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
                No entries recorded today.
            </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
            {transactions.map((txn) => (
                <Card key={txn._id} className="transition-all hover:shadow-md">
                    <CardContent className="p-4 flex items-center justify-between">
                        {editingId === txn._id ? (
                            // Edit Mode
                            <div className="flex-1 grid gap-4 md:grid-cols-4 items-end">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Description</label>
                                    <Input name="title" value={formData.title} onChange={handleChange} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Amount</label>
                                    <Input name="amount" type="number" value={formData.amount} onChange={handleChange} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Category</label>
                                    <select 
                                        name="category" 
                                        value={formData.category} 
                                        onChange={handleChange}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        {(txn.type === 'income' ? INCOME_CATEGORIES : txn.type === 'expense' ? EXPENSE_CATEGORIES : SAVINGS_CATEGORIES).map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={() => handleUpdate(txn._id)} className="bg-green-600 hover:bg-green-700">
                                        <FiCheck className="mr-1" /> Save
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={handleCancel}>
                                        <FiX />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            // View Mode
                            <>
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-full ${
                                        txn.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 
                                        txn.type === 'expense' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                                    }`}>
                                        {txn.type === 'income' ? '+' : txn.type === 'expense' ? '-' : '='}
                                    </div>
                                    <div>
                                        <p className="font-medium">{txn.title}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(txn.date).toLocaleDateString()} • {txn.category} • {txn.paymentMode}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <span className={`font-bold ${
                                        txn.type === 'income' ? 'text-emerald-600' : 
                                        txn.type === 'expense' ? 'text-rose-600' : 'text-blue-600'
                                    }`}>
                                        {txn.type === 'income' ? '+' : '-'} ₹{Number(txn.amount).toLocaleString()}
                                    </span>
                                    <div className="flex gap-2">
                                        {(txn.paymentMode === 'Wallet' || txn.category === 'Wallet TopUp') ? (
                                            <span className="text-xs text-muted-foreground italic select-none px-2 self-center">Protected</span>
                                        ) : (
                                            <>
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(txn)}>
                                                    <FiEdit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(txn._id)}>
                                                    <FiTrash2 className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
      )}
    </div>
  );
};

export default TodayTransactions;
