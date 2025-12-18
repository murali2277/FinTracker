import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid,
  Legend
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658', '#82ca9d'];

const Analytics = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [expenseData, setExpenseData] = useState([]);
    const [incomeData, setIncomeData] = useState([]);
    
    // Trend Data States
    const [viewMode, setViewMode] = useState('monthly'); // daily, monthly, yearly
    const [trends, setTrends] = useState({ daily: [], monthly: [], yearly: [] });
    
    // Series Visibility State
    const [activeSeries, setActiveSeries] = useState({
        income: true,
        expense: true,
        savings: true
    });

    const [rawTransactions, setRawTransactions] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const { data } = await axios.get('/api/transactions', config);
                setRawTransactions(data);
                processData(data);
                setLoading(false);
            } catch (error) {
                console.error(error);
                setLoading(false);
            }
        };

        if (user) fetchData();
    }, [user]);

    const exportCSV = () => {
        if (!rawTransactions.length) return;
        
        const headers = ["Date", "Type", "SubType", "Title", "Amount", "Category", "PaymentMode"];
        const rows = rawTransactions.map(t => [
            new Date(t.date).toLocaleDateString(),
            t.type,
            t.subType,
            t.title,
            t.amount,
            t.category,
            t.paymentMode
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `FinTracker_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toggleSeries = (series) => {
        setActiveSeries(prev => ({ ...prev, [series]: !prev[series] }));
    };

    const processData = (transactions) => {
        // 1. Category Data
        const expenseMap = new Map();
        const incomeMap = new Map();

        // 2. Trend Maps
        const dailyMap = new Map();
        const monthlyMap = new Map();
        const yearlyMap = new Map();

        // Initialize Buckets
        // Daily (Last 30 days)
        for(let i=29; i>=0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toLocaleDateString('default', { day: 'numeric', month: 'short' }); 
            const isoKey = d.toISOString().split('T')[0]; 
            dailyMap.set(isoKey, { name: key, income: 0, expense: 0, savings: 0 });
        }

        // Monthly (Last 12 months)
        for (let i = 11; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = d.toLocaleString('default', { month: 'short', year: '2-digit' }); 
            const sortKey = `${d.getFullYear()}-${d.getMonth()}`; 
            monthlyMap.set(sortKey, { name: key, income: 0, expense: 0, savings: 0 });
        }

        // Yearly (Last 5 years)
        for (let i = 4; i >= 0; i--) {
            const d = new Date();
            d.setFullYear(d.getFullYear() - i);
            const key = d.getFullYear().toString();
            yearlyMap.set(key, { name: key, income: 0, expense: 0, savings: 0 });
        }

        transactions.forEach(t => {
            const amt = Number(t.amount);
            
            // Pie Charts Logic
            if (t.type === 'expense') expenseMap.set(t.category, (expenseMap.get(t.category) || 0) + amt);
            else if (t.type === 'income') incomeMap.set(t.category, (incomeMap.get(t.category) || 0) + amt);

            // Trend Logic
            const d = new Date(t.date);
            
            // Daily Match
            const dayKey = d.toISOString().split('T')[0];
            if (dailyMap.has(dayKey)) {
                const entry = dailyMap.get(dayKey);
                if(t.type === 'income') entry.income += amt;
                if(t.type === 'expense') entry.expense += amt;
                if(t.type === 'savings') entry.savings += amt;
            }

            // Monthly Match
            const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
            if (monthlyMap.has(monthKey)) {
                const entry = monthlyMap.get(monthKey);
                if(t.type === 'income') entry.income += amt;
                if(t.type === 'expense') entry.expense += amt;
                if(t.type === 'savings') entry.savings += amt;
            }

            // Yearly Match
            const yearKey = d.getFullYear().toString();
            if (yearlyMap.has(yearKey)) {
                const entry = yearlyMap.get(yearKey);
                if(t.type === 'income') entry.income += amt;
                if(t.type === 'expense') entry.expense += amt;
                if(t.type === 'savings') entry.savings += amt;
            }
        });

        setExpenseData(Array.from(expenseMap, ([name, value]) => ({ name, value })));
        setIncomeData(Array.from(incomeMap, ([name, value]) => ({ name, value })));
        
        setTrends({
            daily: Array.from(dailyMap.values()),
            monthly: Array.from(monthlyMap.values()),
            yearly: Array.from(yearlyMap.values())
        });
    };

    const hasData = expenseData.length > 0 || incomeData.length > 0;

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading Analytics...</div>;

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
           <div className="flex gap-2">
               <Button variant="outline" size="sm" onClick={() => window.print()}>
                   Print Report
               </Button>
               <Button size="sm" onClick={exportCSV}>
                   Export CSV
               </Button>
           </div>
       </div>

       {!hasData ? (
           <Card>
               <CardContent className="py-20 text-center text-muted-foreground">
                   No data available to generate analytics. Start adding transactions!
               </CardContent>
           </Card>
       ) : (
        <>
            <div className="grid gap-4 md:grid-cols-2">
                {/* Expense Pie Chart */}
                <Card>
                    <CardHeader>
                    <CardTitle>Spending by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={expenseData}
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {expenseData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `$${value}`} />
                            <Legend />
                        </PieChart>
                        </ResponsiveContainer>
                    </div>
                    </CardContent>
                </Card>

                {/* Income Pie Chart */}
                <Card>
                    <CardHeader>
                    <CardTitle>Income Sources</CardTitle>
                    </CardHeader>
                    <CardContent>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={incomeData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                fill="#82ca9d"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {incomeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `$${value}`} />
                            <Legend />
                        </PieChart>
                        </ResponsiveContainer>
                    </div>
                    </CardContent>
                </Card>
            </div>

            {/* Financial Overview Wave Chart */}
            <Card>
                <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2">
                    <CardTitle>Financial Trends</CardTitle>
                    
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        {/* Series Toggles */}
                        <div className="flex gap-2">
                             <button onClick={() => toggleSeries('income')} className={`px-3 py-1 text-xs rounded-full border transition-colors ${activeSeries.income ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'text-muted-foreground border-transparent hover:bg-muted'}`}>
                                 Income
                             </button>
                             <button onClick={() => toggleSeries('expense')} className={`px-3 py-1 text-xs rounded-full border transition-colors ${activeSeries.expense ? 'bg-rose-100 text-rose-700 border-rose-200' : 'text-muted-foreground border-transparent hover:bg-muted'}`}>
                                 Expense
                             </button>
                             <button onClick={() => toggleSeries('savings')} className={`px-3 py-1 text-xs rounded-full border transition-colors ${activeSeries.savings ? 'bg-blue-100 text-blue-700 border-blue-200' : 'text-muted-foreground border-transparent hover:bg-muted'}`}>
                                 Savings
                             </button>
                        </div>
                        
                        {/* Time View Toggles */}
                        <div className="flex bg-muted rounded-md p-1">
                            {['daily', 'monthly', 'yearly'].map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={`px-3 py-1 rounded-sm text-xs font-medium capitalize transition-all ${
                                        viewMode === mode 
                                        ? 'bg-background shadow-sm text-foreground' 
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={trends[viewMode]}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="name" fontSize={12} tickMargin={10} />
                                <YAxis fontSize={12} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    formatter={(value) => `$${value}`}
                                />
                                <Legend />
                                {activeSeries.income && (
                                    <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                                )}
                                {activeSeries.expense && (
                                    <Area type="monotone" dataKey="expense" name="Expense" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
                                )}
                                {activeSeries.savings && (
                                    <Area type="monotone" dataKey="savings" name="Savings" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSavings)" strokeWidth={2} />
                                )}
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </>
       )}
    </div>
  );
};

export default Analytics;
