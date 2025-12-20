import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { FiChevronLeft, FiChevronRight, FiPlus, FiClock, FiCheckCircle, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { 
    INCOME_TYPES, EXPENSE_TYPES, SAVINGS_TYPES,
    INCOME_CATEGORIES, EXPENSE_CATEGORIES, SAVINGS_CATEGORIES,
    PAYMENT_MODES, INCOME_PAYMENT_MODES, SAVINGS_METHODS
} from '../utils/constants';

const Calendar = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reminders, setReminders] = useState([]);
  // Extended state for new reminder input
  const [formData, setFormData] = useState({
      title: '',
      amount: '',
      type: 'expense',
      category: 'Food',
      paymentMode: 'UPI',
      autoAdd: false
  });
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Fetch Reminders
  const fetchReminders = async () => {
    try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get('/api/reminders', config);
        setReminders(data);
    } catch (error) {
        console.error("Failed to fetch reminders", error);
        // toast.error("Could not load reminders"); 
    }
  };

  useEffect(() => {
    if (user) {
        fetchReminders();
    }
  }, [user]);

  const daysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const onDateClick = (day) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
    setIsAdding(false); // Reset adding state when changing dates
  };

  const handleAddReminder = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        
        // Prepare payload - clear optional fields if not auto-add
        const payload = {
            ...formData,
            date: selectedDate,
            amount: formData.autoAdd ? formData.amount : null,
            category: formData.autoAdd ? formData.category : null,
            paymentMode: formData.autoAdd ? formData.paymentMode : null
        };
        
        if (editingId) {
            // Update existing
            const { data } = await axios.put(`/api/reminders/${editingId}`, payload, config);
            
            setReminders(reminders.map(r => r._id === editingId ? data : r)); // MongoDB uses _id
            setEditingId(null);
            toast.success(formData.autoAdd ? 'Auto-pay enabled' : 'Reminder updated');
        } else {
            // Create new
            const { data } = await axios.post('/api/reminders', payload, config);
            
            setReminders([...reminders, data]);
            toast.success(formData.autoAdd ? 'Scheduled for auto-add' : 'Reminder added');
        }
        
        // Reset form
        setFormData({
            title: '',
            amount: '',
            type: 'expense',
            category: 'Food',
            paymentMode: 'UPI',
            autoAdd: false
        });
        
        setIsAdding(false);
    } catch (error) {
        toast.error('Failed to save reminder');
    }
  };

  const handleEdit = (reminder) => {
      setFormData({
          title: reminder.title,
          amount: reminder.amount || '',
          type: reminder.type || 'expense',
          category: reminder.category || 'Food',
          paymentMode: reminder.paymentMode || 'UPI',
          autoAdd: reminder.autoAdd || false
      });
      setEditingId(reminder._id);
      setIsAdding(true);
  };

  const handleEnableAutoPay = (reminder) => {
      handleEdit(reminder);
      setFormData(prev => ({ ...prev, autoAdd: true }));
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const toggleReminder = async (id, currentStatus) => {
    try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.put(`/api/reminders/${id}`, { completed: !currentStatus }, config);
        setReminders(reminders.map(r => r._id === id ? data : r));
    } catch (error) {
        toast.error("Failed to update status");
    }
  };

  const handleDeleteReminder = async (id) => {
      if(!window.confirm("Delete this reminder?")) return;
      try {
          const config = { headers: { Authorization: `Bearer ${user.token}` } };
          await axios.delete(`/api/reminders/${id}`, config);
          setReminders(reminders.filter(r => r._id !== id));
          toast.info('Reminder removed');
      } catch (error) {
          toast.error("Failed to delete");
      }
  };

  const renderCalendarDays = () => {
    const days = [];
    const totalDays = daysInMonth(currentDate);
    const startDay = firstDayOfMonth(currentDate);

    // Padding for prev month
    for (let i = 0; i < startDay; i++) {
        days.push(<div key={`empty-${i}`} className="h-14 md:h-24 bg-muted/20 border border-border/50"></div>);
    }

    // Days
    for (let d = 1; d <= totalDays; d++) {
        const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
        // Compare dates using locale date string for basic match, or ISO date part
        const dateStr = dateObj.toDateString(); 
        const isSelected = selectedDate.toDateString() === dateStr;
        const isToday = new Date().toDateString() === dateStr;
        
        // MongoDB stores full ISO date. We need to match day part.
        // Or simpler: Convert reminder date to Date object and compare.
        const dayReminders = reminders.filter(r => new Date(r.date).toDateString() === dateStr);

        days.push(
            <div 
                key={d} 
                onClick={() => onDateClick(d)}
                className={`h-14 md:h-24 border border-border/50 p-1 md:p-2 cursor-pointer transition-colors relative hover:bg-muted/50 ${isSelected ? 'bg-primary/10 ring-1 ring-inset ring-primary' : ''} ${isToday ? 'bg-accent/30 font-semibold' : ''}`}
            >
                <div className="flex justify-between items-start">
                    <span className={`text-sm rounded-full w-6 h-6 flex items-center justify-center ${isToday ? 'bg-primary text-primary-foreground' : ''}`}>{d}</span>
                    {dayReminders.length > 0 && (
                        <div className="flex gap-0.5">
                             {dayReminders.map((r, i) => (
                                 <span key={i} className={`w-1.5 h-1.5 rounded-full ${r.completed ? 'bg-green-500' : 'bg-amber-500'}`} />
                             ))}
                        </div>
                    )}
                </div>
                {/* Mobile: dots only. Desktop: list */}
                <div className="hidden md:block mt-1 space-y-0.5">
                    {dayReminders.slice(0, 3).map(r => (
                        <div key={r._id} className={`text-[0.6rem] truncate px-1 rounded ${r.completed ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                            {r.title}
                        </div>
                    ))}
                     {dayReminders.length > 3 && <div className="text-[0.6rem] text-muted-foreground">+ {dayReminders.length - 3} more</div>}
                </div>
            </div>
        );
    }

    return days;
  };

  const selectedDayReminders = reminders.filter(r => new Date(r.date).toDateString() === selectedDate.toDateString());

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Financial Calendar</h2>
        <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}><FiChevronLeft /></Button>
            <h3 className="text-xl font-semibold w-40 text-center">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <Button variant="outline" size="icon" onClick={nextMonth}><FiChevronRight /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-2">
             <Card>
                 <CardContent className="p-0">
                     <div className="grid grid-cols-7 text-center py-2 bg-muted/30 border-b text-sm font-medium">
                         {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                             <div key={d}>{d}</div>
                         ))}
                     </div>
                     <div className="grid grid-cols-7">
                         {renderCalendarDays()}
                     </div>
                 </CardContent>
             </Card>
          </div>

          {/* Details Sidebar (on Page) */}
          <div className="space-y-6">
              <Card>
                  <CardHeader>
                      <CardTitle className="flex justify-between items-center text-lg">
                          <span>{selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}</span>
                          <span className="text-xs text-muted-foreground font-normal">
                             {selectedDayReminders.length} Entries
                          </span>
                      </CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="space-y-4">
                          {selectedDayReminders.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-8">No entries for this date.</p>
                          ) : (
                              <ul className="space-y-2">
                                  {selectedDayReminders.map(r => (
                                      <li key={r._id} className="flex flex-col p-3 rounded-md border hover:bg-muted/50 transition-colors gap-2">
                                          <div className="flex items-center justify-between w-full">
                                              <div className="flex items-center gap-3">
                                                  <button onClick={() => toggleReminder(r._id, r.completed)} className={`text-lg ${r.completed ? 'text-green-500' : 'text-gray-300 hover:text-green-500'}`}>
                                                      <FiCheckCircle />
                                                  </button>
                                                  <span className={`font-medium ${r.completed ? 'line-through text-muted-foreground' : ''}`}>{r.title}</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                  <div className={`text-xs px-2 py-0.5 rounded-full uppercase ${r.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                      {r.type}
                                                  </div>
                                                  <button 
                                                      onClick={() => handleDeleteReminder(r._id)}
                                                      className="text-muted-foreground hover:text-destructive transition-colors"
                                                      title="Remove Reminder"
                                                  >
                                                      <FiTrash2 className="w-4 h-4" />
                                                  </button>
                                              </div>
                                          </div>
                                          
                                          {/* Details Row */}
                                          <div className="flex items-center justify-between text-xs text-muted-foreground pl-7 min-h-[1.5em]">
                                              <span>
                                                  {r.category && r.paymentMode ? `${r.category} • ${r.paymentMode}` : ''}
                                              </span>
                                              <div className="flex items-center gap-2">
                                                  {!r.autoAdd && (
                                                      <button 
                                                          onClick={() => handleEnableAutoPay(r)} 
                                                          className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded hover:bg-blue-100 transition-colors"
                                                          title="Enable Auto-Entry"
                                                      >
                                                          <FiRefreshCw className="w-3 h-3" /> Auto-Entry
                                                      </button>
                                                  )}
                                                  <span className="font-semibold text-foreground">
                                                      {r.amount ? `₹${Number(r.amount).toLocaleString()}` : '-'}
                                                  </span>
                                              </div>
                                          </div>
                                          
                                          {/* Auto Add Badge */}
                                          {r.autoAdd && (
                                              <div className="pl-7 flex items-center gap-1 text-[10px] text-blue-500">
                                                  <FiRefreshCw /> Auto-Add Enabled
                                              </div>
                                          )}
                                      </li>
                                  ))}
                              </ul>
                          )}

                          {!isAdding ? (
                              <Button variant="outline" className="w-full border-dashed" onClick={() => setIsAdding(true)}>
                                  <FiPlus className="mr-2" /> Add Reminder / Entry
                              </Button>
                          ) : (
                              <form onSubmit={handleAddReminder} className="space-y-3 animate-in fade-in zoom-in-95 duration-200 border p-3 rounded-md bg-muted/20">
                                  {/* Title */}
                                  <div className="space-y-1">
                                      <label className="text-xs font-medium">Description</label>
                                      <Input 
                                        name="title"
                                        placeholder="e.g. Monthly Rent" 
                                        value={formData.title} 
                                        onChange={handleChange}
                                        autoFocus
                                        required
                                      />
                                  </div>

                                  <div className="flex items-center gap-2">
                                      <input 
                                        type="checkbox" 
                                        id="autoAdd" 
                                        name="autoAdd" 
                                        checked={formData.autoAdd} 
                                        onChange={handleChange}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                      />
                                      <label htmlFor="autoAdd" className="text-sm font-medium cursor-pointer select-none">Auto-add to Transactions?</label>
                                  </div>

                                  {formData.autoAdd && (
                                      <div className="space-y-3 pt-2 border-t">
                                          <div className="grid grid-cols-2 gap-2">
                                              <div className="space-y-1">
                                                  <label className="text-xs font-medium">Type</label>
                                                  <select 
                                                      name="type"
                                                      value={formData.type}
                                                      onChange={handleChange}
                                                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                                                  >
                                                      <option value="income">Income</option>
                                                      <option value="expense">Expense</option>
                                                      <option value="savings">Savings</option>
                                                  </select>
                                              </div>
                                              <div className="space-y-1">
                                                  <label className="text-xs font-medium">Amount</label>
                                                  <Input 
                                                    type="number" 
                                                    name="amount" 
                                                    placeholder="0.00" 
                                                    value={formData.amount} 
                                                    onChange={handleChange}
                                                    required={formData.autoAdd}
                                                  />
                                              </div>
                                          </div>

                                          <div className="grid grid-cols-2 gap-2">
                                              <div className="space-y-1">
                                                  <label className="text-xs font-medium">Category</label>
                                                  <select 
                                                      name="category"
                                                      value={formData.category}
                                                      onChange={handleChange}
                                                       className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                                                  >
                                                      {(formData.type === 'income' ? INCOME_CATEGORIES : formData.type === 'expense' ? EXPENSE_CATEGORIES : SAVINGS_CATEGORIES).map(c => (
                                                          <option key={c} value={c}>{c}</option>
                                                      ))}
                                                  </select>
                                              </div>
                                              <div className="space-y-1">
                                                  <label className="text-xs font-medium">Mode</label>
                                                  <select 
                                                      name="paymentMode"
                                                      value={formData.paymentMode}
                                                      onChange={handleChange}
                                                       className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                                                  >
                                                       {(formData.type === 'savings' ? SAVINGS_METHODS : PAYMENT_MODES).map(m => (
                                                          <option key={m} value={m}>{m}</option>
                                                      ))}
                                                  </select>
                                              </div>
                                          </div>
                                      </div>
                                  )}

                                  <div className="flex gap-2 pt-2">
                                      <Button type="submit" size="sm" className="w-full">
                                          {editingId ? 'Update Entry' : 'Save'}
                                      </Button>
                                      <Button 
                                        type="button" 
                                        size="sm" 
                                        variant="ghost" 
                                        className="w-full" 
                                        onClick={() => { setIsAdding(false); setEditingId(null); }}
                                      >
                                          Cancel
                                      </Button>
                                  </div>
                              </form>
                          )}
                      </div>
                  </CardContent>
              </Card>

              {/* Tips / Auto Options Placeholder */}
              <Card className="bg-primary/5 text-primary-foreground/90">
                  <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2 text-primary">
                          <FiClock /> Scheduled Transactions
                      </CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p className="text-xs text-muted-foreground">
                          Stay on top of your finances. Schedule reminders and set auto-entries to track every penny effortlessly.
                      </p>
                  </CardContent>
              </Card>
          </div>
      </div>
    </div>
  );
};

export default Calendar;
