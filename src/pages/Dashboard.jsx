import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { FiCornerUpLeft, FiCornerUpRight, FiArrowUp, FiArrowDown, FiDollarSign, FiActivity, FiCreditCard } from 'react-icons/fi';


import { cn } from '../utils/cn';
import { 
    INCOME_TYPES, EXPENSE_TYPES, SAVINGS_TYPES,
    INCOME_CATEGORIES, EXPENSE_CATEGORIES, SAVINGS_CATEGORIES,
    PAYMENT_MODES, INCOME_PAYMENT_MODES, SAVINGS_METHODS
} from '../utils/constants';

const SummaryCard = ({ title, value, icon: Icon, trend, trendValue, color }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={cn("h-4 w-4 text-muted-foreground", color)} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">₹{value.toLocaleString()}</div>
      <p className="text-xs text-muted-foreground mt-1">
        {trendValue && (
            trend === 'up' ? 
            <span className="text-emerald-500 flex items-center gap-1"><FiArrowUp /> {trendValue}</span> : 
            <span className="text-rose-500 flex items-center gap-1"><FiArrowDown /> {trendValue}</span>
        )}
        <span className="ml-1">{trendValue ? "from last month" : "No data available"}</span>
      </p>
    </CardContent>
  </Card>
);



import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { useEffect } from 'react';

const Dashboard = () => {
    const { user } = useAuth();
    
    // Initial empty state
    const [summary, setSummary] = useState({
        balance: 0,
        walletBalance: 0,
        income: 0,
        expense: 0,
        savings: 0,
        monthlyData: []
    });
    
    // Add Transaction Form State
    const [formData, setFormData] = useState({
        type: 'expense', // income, expense, savings
        subType: 'Mandatory', 
        title: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: 'Uncategorized',
        paymentMode: 'UPI', 
    });
    
    const [lastFormData, setLastFormData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch Data on Component Mount
    const fetchData = async () => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
            };

            // Parallel Fetch: Transactions & Wallet
            const [txRes, walletRes] = await Promise.all([
                axios.get('/api/transactions', config),
                axios.get('/api/wallet', config).catch(() => ({ data: { balance: 0 } })) // Fallback if wallet fails
            ]);
            
            const data = txRes.data;
            const walletBalance = walletRes.data.balance || 0;
            
            // Calculate Summary
            let income = 0;
            let expense = 0;
            let savings = 0;

            const monthlyMap = new Map();
            // Initialize last 6 months
            for(let i=0; i<7; i++) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const monthName = d.toLocaleString('default', { month: 'short' });
                monthlyMap.set(monthName, { name: monthName, income: 0, expense: 0 });
            }

            data.forEach(t => {
                const amt = Number(t.amount);
                if (t.type === 'income') income += amt;
                if (t.type === 'expense') expense += amt;
                if (t.type === 'savings') savings += amt;

                // Monthly Chart Data
                const d = new Date(t.date);
                const monthName = d.toLocaleString('default', { month: 'short' });
                if (monthlyMap.has(monthName)) {
                    const monthData = monthlyMap.get(monthName);
                    if (t.type === 'income') monthData.income += amt;
                    if (t.type === 'expense') monthData.expense += amt;
                }
            });

            setSummary({
                balance: income - expense - savings, 
                walletBalance,
                income,
                expense,
                savings,
                monthlyData: Array.from(monthlyMap.values()).reverse()
            });

        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    // Helper to reset defaults when main type changes
    const handleTypeChange = (newType) => {
        let defaultsubType = '';
        let defaultCategory = '';
        let defaultMode = '';

        if (newType === 'income') {
            defaultsubType = INCOME_TYPES[0];
            defaultCategory = INCOME_CATEGORIES[0];
            defaultMode = INCOME_PAYMENT_MODES[0];
        } else if (newType === 'expense') {
            defaultsubType = EXPENSE_TYPES[0];
            defaultCategory = 'Uncategorized';
            defaultMode = PAYMENT_MODES[0];
        } else { // savings
            defaultsubType = SAVINGS_TYPES[0];
            defaultCategory = SAVINGS_CATEGORIES[0];
            defaultMode = SAVINGS_METHODS[0];
        }

        setFormData({
            ...formData,
            type: newType,
            subType: defaultsubType,
            category: defaultCategory,
            paymentMode: defaultMode
        });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleReset = () => {
        setLastFormData(formData); // Save state before reset
        setFormData({
            ...formData,
            title: '',
            amount: '',
            date: new Date().toISOString().split('T')[0]
        });
        toast.info("Form reset");
    };

    const handleRedo = () => {
        if (lastFormData) {
            setFormData(lastFormData);
            // setLastFormData(null); // Optional: keep history or clear
            toast.success("Form restored");
        }
    };

    const handleUndo = async (id) => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            await axios.delete(`/api/transactions/${id}`, config);
            toast.info('Transaction reverted');
            fetchData();
        } catch (error) {
            toast.error('Failed to undo');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            
            const { data } = await axios.post('/api/transactions', formData, config);
            
            // Custom Toast with Undo
            const UndoMsg = ({ closeToast }) => (
                <div className="flex items-center justify-between w-full gap-2">
                    <span>Transaction added</span>
                    <button 
                        onClick={() => { handleUndo(data._id); closeToast(); }} 
                        className="bg-white/20 hover:bg-white/30 text-white text-xs px-2 py-1 rounded transition-colors"
                    >
                        Undo
                    </button>
                </div>
            );

            toast.success(<UndoMsg />);
            setLoading(false);
            
            // Refetch data to update summary
            fetchData();
            
            // Reset form
            setFormData({
                ...formData,
                title: '',
                amount: '',
                // Keep date and type same
            });
            
        } catch (error) {
            setLoading(false);
            const message = error.response?.data?.message || error.message;
            toast.error(message);
        }
    };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
            {/* Date Range Picker or similar could go here */}
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <SummaryCard 
           title="Wallet Balance" 
           value={summary.walletBalance} 
           icon={FiCreditCard} 
           trend="up" 
           trendValue={null} 
           color="text-indigo-600"
        />
        <SummaryCard 
           title="Net Cash Flow" 
           value={summary.balance} 
           icon={FiDollarSign} 
           trend={summary.balance >= 0 ? "up" : "down"}
           trendValue={null} 
           color={summary.balance >= 0 ? "text-primary" : "text-rose-500"}
        />
        <SummaryCard 
           title="Income" 
           value={summary.income} 
           icon={FiArrowUp} 
           trend="up" 
           trendValue={null}
           color="text-emerald-500"
        />
        <SummaryCard 
           title="Expenses" 
           value={summary.expense} 
           icon={FiArrowDown} 
           trend="down" 
           trendValue={null}
           color="text-rose-500"
        />
        <SummaryCard 
           title="Savings" 
           value={summary.savings} 
           icon={FiActivity} 
           trend="up" 
           trendValue={null}
           color="text-blue-500"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.monthlyData}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip 
                     cursor={{fill: 'transparent'}}
                     contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="income" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>New Entry</CardTitle>
            <div className="flex items-center gap-1">
                <Button 
                    type="button"
                    variant="ghost" 
                    size="icon" 
                    onClick={handleReset} 
                    title="Revert / Reset (Previous)"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                    <FiCornerUpLeft className="h-4 w-4" />
                </Button>
                <Button 
                    type="button"
                    variant="ghost" 
                    size="icon" 
                    onClick={handleRedo} 
                    disabled={!lastFormData}
                    title="Redo / Restore (Next)"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                    <FiCornerUpRight className="h-4 w-4" />
                </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                 <Button 
                    type="button" 
                    variant={formData.type === 'income' ? 'primary' : 'outline'}
                    onClick={() => handleTypeChange('income')}
                    className="w-full"
                 >
                   Income
                 </Button>
                 <Button 
                    type="button" 
                    variant={formData.type === 'expense' ? 'destructive' : 'outline'}
                    className={formData.type === 'expense' ? 'w-full' : 'w-full hover:border-destructive hover:text-destructive'}
                    onClick={() => handleTypeChange('expense')}
                 >
                   Expense
                 </Button>
                 <Button 
                    type="button" 
                    variant={formData.type === 'savings' ? 'secondary' : 'outline'}
                    className={formData.type === 'savings' ? 'w-full bg-blue-500 hover:bg-blue-600 text-white' : 'w-full hover:border-blue-500 hover:text-blue-500'}
                    onClick={() => handleTypeChange('savings')}
                 >
                   Savings
                 </Button>
              </div>

              {/* Dynamic Type Selector (Income Type / Expense Type / Savings Type) */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                    {formData.type === 'income' ? 'Income Type' : formData.type === 'expense' ? 'Expense Type' : 'Savings Type'}
                </label>
                <select 
                  name="subType"
                  value={formData.subType}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    {(formData.type === 'income' ? INCOME_TYPES : formData.type === 'expense' ? EXPENSE_TYPES : SAVINGS_TYPES).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
              </div>

               {/* Description - Common */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Description (Source/Purpose)</label>
                <Input 
                  name="title" 
                  value={formData.title} 
                  onChange={handleChange} 
                  placeholder={formData.type === 'income' ? "e.g. Monthly Salary" : formData.type === 'expense' ? "e.g. Grocery Shopping" : "e.g. Emergency Fund"} 
                  required 
                />
              </div>

               {/* Amount - Common */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Amount</label>
                <Input 
                  name="amount" 
                  type="number" 
                  value={formData.amount} 
                  onChange={handleChange} 
                  placeholder="0.00" 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 {/* Date - Common */}
                 <div className="space-y-2">
                   <label className="text-sm font-medium leading-none">Date</label>
                   <Input 
                     name="date" 
                     type="date" 
                     value={formData.date} 
                     onChange={handleChange} 
                     required 
                   />
                 </div>

                 {/* Category - Dynamic Options */}
                 <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Category</label>
                    <select 
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {(formData.type === 'income' ? INCOME_CATEGORIES : formData.type === 'expense' ? EXPENSE_CATEGORIES : SAVINGS_CATEGORIES)
                          .filter(cat => cat !== 'Wallet TopUp')
                          .map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                 </div>
              </div>

              {/* Payment Mode / Savings Method - Dynamic */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                    {formData.type === 'savings' ? 'Savings Method' : 'Payment Mode'}
                </label>
                <select 
                  name="paymentMode"
                  value={formData.paymentMode}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    {(formData.type === 'savings' ? SAVINGS_METHODS : PAYMENT_MODES)
                        .filter(mode => mode !== 'Wallet')
                        .map(mode => (
                        <option key={mode} value={mode}>{mode}</option>
                    ))}
                </select>
              </div>

              <Button type="submit" isLoading={loading} disabled={loading} className={cn("w-full mt-4", 
                  formData.type === 'expense' ? "bg-destructive hover:bg-destructive/90" : 
                  formData.type === 'savings' ? "bg-blue-500 hover:bg-blue-600" : ""
              )}>
                  Save {formData.type.charAt(0).toUpperCase() + formData.type.slice(1)}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
