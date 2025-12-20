import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input'; // Assuming Input exists
import { Button } from '../components/ui/Button'; // Assuming Button exists
import { toast } from 'react-toastify';
import { FiSearch, FiFilter, FiTrash2, FiEdit2, FiArrowUp, FiArrowDown, FiDownload } from 'react-icons/fi';

const History = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, income, expense, savings
  const [sortOrder, setSortOrder] = useState('desc'); // desc (newest first), asc

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };
      const { data } = await axios.get('/api/transactions', config);
      setTransactions(data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load history');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  const handleExportCSV = () => {
    if (transactions.length === 0) {
        toast.info("No data to export");
        return;
    }

    const headers = ["Date", "Description", "Type", "Category", "Amount", "Payment Mode"];
    
    const csvContent = [
        headers.join(','),
        ...transactions.map(t => [
            new Date(t.date).toLocaleDateString(),
            `"${t.title.replace(/"/g, '""')}"`,
            t.type,
            t.category,
            t.amount,
            t.paymentMode
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transactions_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
        const config = {
            headers: { Authorization: `Bearer ${user.token}` },
        };
        await axios.delete(`/api/transactions/${id}`, config);
        toast.success('Record deleted');
        setTransactions(transactions.filter(t => t._id !== id));
    } catch (error) {
        toast.error('Delete failed');
    }
  };

  // Derived state for filtering
  const filteredTransactions = transactions
    .filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              t.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || t.type === filterType;
        return matchesSearch && matchesType;
    })
    .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

  const getTypeColor = (type) => {
      switch(type) {
          case 'income': return 'text-emerald-600 bg-emerald-50';
          case 'expense': return 'text-rose-600 bg-rose-50';
          case 'savings': return 'text-blue-600 bg-blue-50';
          default: return 'text-gray-600';
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Transaction History</h2>
        <Button variant="outline" className="gap-2 hidden md:flex" onClick={handleExportCSV}>
             <FiDownload /> Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
             <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative w-full sm:w-72">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input 
                        placeholder="Search transactions..." 
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                    {['all', 'income', 'expense', 'savings'].map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors whitespace-nowrap ${
                                filterType === type 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
             </div>
        </CardHeader>
        <CardContent className="p-0">
            {loading ? (
                <div className="p-8 text-center text-muted-foreground">Loading history...</div>
            ) : filteredTransactions.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                    <div className="bg-secondary p-4 rounded-full mb-4">
                        <FiFilter className="h-8 w-8 opacity-50" />
                    </div>
                    <p className="text-lg font-medium">No transactions found</p>
                    <p className="text-sm">Try adjusting your filters or search query.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Description</th>
                                <th className="px-6 py-3">Type</th>
                                <th className="px-6 py-3">Category</th>
                                <th className="px-6 py-3 text-right">Amount</th>
                                <th className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredTransactions.map((t) => (
                                <tr key={t._id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {new Date(t.date).toLocaleDateString(undefined, {
                                            year: 'numeric', month: 'short', day: 'numeric'
                                        })}
                                    </td>
                                    <td className="px-6 py-4 font-medium">{t.title}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getTypeColor(t.type)}`}>
                                            {t.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{t.category}</td>
                                    <td className={`px-6 py-4 text-right font-bold ${
                                        t.type === 'income' ? 'text-emerald-600' : 
                                        t.type === 'expense' ? 'text-rose-600' : 'text-blue-600'
                                    }`}>
                                        {t.type === 'income' ? '+' : '-'} ₹{Number(t.amount).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {(t.paymentMode === 'Wallet' || t.category === 'Wallet TopUp') ? (
                                            <span className="text-xs text-muted-foreground italic select-none">Protected</span>
                                        ) : (
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                                                onClick={() => handleDelete(t._id)}
                                                title="Delete"
                                            >
                                                <FiTrash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </CardContent>
      </Card>
      
      <div className="text-xs text-center text-muted-foreground">
        Showing {filteredTransactions.length} of {transactions.length} records
      </div>
    </div>
  );
};

export default History;
