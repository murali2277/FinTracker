export const mockTransactions = [
  { id: 1, title: 'Grocery Shopping', amount: -120.50, date: '2023-10-25', category: 'Food', status: 'completed' },
  { id: 2, title: 'Salary Deposit', amount: 3500.00, date: '2023-10-01', category: 'Income', status: 'completed' },
  { id: 3, title: 'Netflix Subscription', amount: -15.99, date: '2023-10-20', category: 'Entertainment', status: 'pending' },
  { id: 4, title: 'Electric Bill', amount: -85.00, date: '2023-10-15', category: 'Utilities', status: 'completed' },
  { id: 5, title: 'Freelance Design', amount: 450.00, date: '2023-10-12', category: 'Income', status: 'completed' },
  { id: 6, title: 'Coffee Shop', amount: -8.50, date: '2023-10-26', category: 'Food', status: 'completed' },
  { id: 7, title: 'Gym Membership', amount: -45.00, date: '2023-10-05', category: 'Health', status: 'completed' },
];

export const mockSummary = {
  balance: 14250.75,
  income: 4500.00,
  expense: 1245.50,
  savings: 3254.50,
  monthlyData: [
    { name: 'Jan', income: 4000, expense: 2400 },
    { name: 'Feb', income: 3000, expense: 1398 },
    { name: 'Mar', income: 2000, expense: 9800 },
    { name: 'Apr', income: 2780, expense: 3908 },
    { name: 'May', income: 1890, expense: 4800 },
    { name: 'Jun', income: 2390, expense: 3800 },
    { name: 'Jul', income: 3490, expense: 4300 },
  ]
};

export const spendingByCategory = [
  { name: 'Food', value: 400 },
  { name: 'Rent', value: 1200 },
  { name: 'Utilities', value: 300 },
  { name: 'Entertainment', value: 200 },
  { name: 'Transport', value: 150 },
];
