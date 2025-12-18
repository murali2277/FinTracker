import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { FiPlus, FiTarget, FiTrendingUp, FiAlertCircle, FiCheckCircle, FiZap, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';

const Goals = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Strategy Internal State
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [strategyLoading, setStrategyLoading] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
      title: '',
      targetAmount: '',
      currentAmount: '',
      targetDate: '',
      color: '#2563EB',
      priority: 'Medium'
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const [goalsRes, analysisRes] = await Promise.all([
            axios.get('/api/goals', config),
            axios.get('/api/goals/analysis', config)
        ]);
        setGoals(goalsRes.data);
        setAnalysis(analysisRes.data);
        setLoading(false);
    } catch (error) {
        toast.error("Failed to load goals");
        setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await axios.post('/api/goals', formData, config);
        toast.success("Goal created!");
        setShowModal(false);
        fetchData();
        setFormData({ title: '', targetAmount: '', currentAmount: '', targetDate: '', color: '#2563EB', priority: 'Medium' });
    } catch (error) {
        toast.error("Failed to create goal");
    }
  };

  const handleUpdateAmount = async (id, currentAmount, addAmount) => {
      const newAmount = Number(currentAmount) + Number(addAmount);
      try {
          const config = { headers: { Authorization: `Bearer ${user.token}` } };
          await axios.put(`/api/goals/${id}`, { currentAmount: newAmount }, config);
          toast.success("Funds added!");
          fetchData(); // Refresh to update analysis
      } catch (error) {
          toast.error("Update failed");
      }
  };

  const handleDelete = async (id) => {
      if(!window.confirm("Delete this goal?")) return;
      try {
          const config = { headers: { Authorization: `Bearer ${user.token}` } };
          await axios.delete(`/api/goals/${id}`, config);
          toast.info("Goal deleted");
          fetchData();
      } catch (error) {
          toast.error("Delete failed");
      }
  };

  const handleGetStrategy = async (goal) => {
      setSelectedStrategy({ title: goal.title, loading: true, items: [] });
      setStrategyLoading(true);
      
      try {
          const config = { headers: { Authorization: `Bearer ${user.token}` } };
          const { data } = await axios.get(`/api/goals/${goal._id}/strategy`, config);
          setSelectedStrategy({ title: goal.title, loading: false, items: data.strategies });
      } catch (error) {
          toast.error("Could not fetch AI advice");
          setSelectedStrategy(null);
      } finally {
          setStrategyLoading(false);
      }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Financial Goals</h1>
           <p className="text-muted-foreground text-sm">Visualize and accelerate your savings journey.</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700">
           <FiPlus className="mr-2" /> New Goal
        </Button>
      </div>

      {/* Analysis Section */}
      {/* Analysis Section */}
      {analysis && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg. Monthly Savings</CardTitle>
                      <FiTrendingUp className="h-4 w-4 text-emerald-500" />
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold">${analysis.avgMonthlySavings}</div>
                      <p className="text-xs text-muted-foreground mt-1">Based on last 3 months</p>
                  </CardContent>
              </Card>

              <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                       <CardTitle className="text-sm font-medium">Top Expense Cutback</CardTitle>
                       <FiAlertCircle className="h-4 w-4 text-rose-500" />
                  </CardHeader>
                  <CardContent>
                      {analysis.topExpenses[0] ? (
                          <>
                            <div className="text-2xl font-bold">{analysis.topExpenses[0].category}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Avg ${Math.round(analysis.topExpenses[0].monthlyAvg)}/mo
                            </p>
                          </>
                      ) : (
                          <div className="text-sm text-muted-foreground">No data available</div>
                      )}
                  </CardContent>
              </Card>

              <Card className="md:col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Smart Strategy</CardTitle>
                      <FiTarget className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                      <div className="text-sm text-muted-foreground">
                          {Number(analysis.avgMonthlySavings) > 0 ? (
                               <span>
                                   Allocating your average savings of <span className="font-bold text-foreground">${analysis.avgMonthlySavings}</span> fully to your goals could accelerate completion by months.
                               </span>
                          ) : (
                              <span>Start saving to see acceleration strategies here.</span>
                          )}
                      </div>
                  </CardContent>
              </Card>
          </div>
      )}

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
            const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
            const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
            
            // Calculate Days Left
            let daysLeft = null;
            if (goal.targetDate) {
                const today = new Date();
                const target = new Date(goal.targetDate);
                const diffTime = target - today;
                daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            }

            // Find analysis projection for this goal
            const projection = analysis?.goalProjections?.find(p => p.id === goal._id);
            
            return (
                <Card key={goal._id} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                             <CardTitle className="flex items-center gap-2 text-lg">
                                 {goal.title}
                                 {percentage >= 100 && <FiCheckCircle className="text-blue-500" />}
                                 <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                     goal.priority === 'High' ? 'border-rose-200 text-rose-600 bg-rose-50' : 
                                     goal.priority === 'Low' ? 'border-blue-200 text-blue-600 bg-blue-50' : 
                                     'border-amber-200 text-amber-600 bg-amber-50'
                                 }`}>
                                     {goal.priority || 'Medium'}
                                 </span>
                             </CardTitle>
                             <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(goal._id)}>
                                 <span className="text-xs">✕</span>
                             </Button>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground mt-1">
                            <span>${goal.currentAmount.toLocaleString()} saved</span>
                            <span className="font-semibold text-foreground">{percentage.toFixed(0)}%</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Progress Bar */}
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden mb-2">
                            <div 
                                className="h-full rounded-full transition-all duration-1000 ease-out bg-blue-600"
                                style={{ width: `${percentage}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-4">
                             <span>Target: ${goal.targetAmount.toLocaleString()}</span>
                             <span>Remaining: ${remaining.toLocaleString()}</span>
                        </div>

                        {/* Insights */}
                        <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-2 mb-4">
                             {goal.targetDate && (
                                 <div className="flex justify-between">
                                     <span>Deadline:</span>
                                     <span className={daysLeft < 0 ? "text-rose-500 font-bold" : ""}>
                                         {new Date(goal.targetDate).toLocaleDateString()} 
                                         {daysLeft !== null && (
                                             <span className="ml-1 opacity-80">
                                                 ({daysLeft > 0 ? `${daysLeft} days left` : `${Math.abs(daysLeft)} days overdue`})
                                             </span>
                                         )}
                                     </span>
                                 </div>
                             )}
                             <div className="flex justify-between text-muted-foreground">
                                 <span>Projection:</span>
                                 <span className={projection?.comparisonText?.includes('late') ? "font-bold text-rose-500" : projection?.comparisonText?.includes('earlier') ? "font-bold text-emerald-500" : "font-medium text-foreground"}>
                                     {projection?.comparisonText || 'N/A'}
                                 </span>
                             </div>
                             {projection?.requiredMonthly > 0 && daysLeft > 0 && (
                                 <div className="flex justify-between text-orange-600 dark:text-orange-400">
                                     <span>Required/Mo:</span>
                                     <span className="font-bold">${projection.requiredMonthly}</span>
                                 </div>
                             )}
                        </div>

                        {/* Actions Row */}
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 text-xs border-dashed"
                                onClick={() => handleUpdateAmount(goal._id, goal.currentAmount, 100)}
                            >
                                + $100
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 text-xs border-dashed bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                                onClick={() => handleGetStrategy(goal)}
                            >
                                <FiZap className="mr-1" /> AI Tips
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            );
        })}
      </div>

      {/* New Goal Modal */}
      {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <Card className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                  <CardHeader>
                      <CardTitle>Create New Goal</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <form onSubmit={handleCreate} className="space-y-4">
                          <div className="space-y-2">
                              <label className="text-sm font-medium">Goal Name</label>
                              <Input 
                                value={formData.title} 
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                placeholder="e.g. Dream Car, House Downpayment"
                                required
                              />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                  <label className="text-sm font-medium">Target Amount</label>
                                  <Input 
                                    type="number"
                                    value={formData.targetAmount} 
                                    onChange={(e) => setFormData({...formData, targetAmount: e.target.value})}
                                    placeholder="0.00"
                                    required
                                  />
                              </div>
                              <div className="space-y-2">
                                  <label className="text-sm font-medium">Current Savings</label>
                                  <Input 
                                    type="number"
                                    value={formData.currentAmount} 
                                    onChange={(e) => setFormData({...formData, currentAmount: e.target.value})}
                                    placeholder="0.00"
                                  />
                              </div>
                          </div>
                          <div className="space-y-2">
                              <label className="text-sm font-medium">Target Date</label>
                              <Input 
                                type="date"
                                value={formData.targetDate} 
                                onChange={(e) => setFormData({...formData, targetDate: e.target.value})}
                              />
                          </div>
                          <div className="space-y-2">
                              <label className="text-sm font-medium">Priority</label>
                              <select 
                                value={formData.priority}
                                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              >
                                  <option value="High">High</option>
                                  <option value="Medium">Medium</option>
                                  <option value="Low">Low</option>
                              </select>
                          </div>
                          <div className="flex justify-end gap-3 pt-4">
                              <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                              <Button type="submit">Create Goal</Button>
                          </div>
                      </form>
                  </CardContent>
              </Card>
          </div>
      )}

      {/* Strategy Modal */}
      {selectedStrategy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
             <Card className="w-full max-w-md bg-background shadow-xl border-indigo-200">
                 <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
                     <CardTitle className="text-lg flex items-center gap-2">
                         <FiZap className="fill-yellow-300 text-yellow-300" /> 
                         AI Strategy: {selectedStrategy.title}
                     </CardTitle>
                     <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setSelectedStrategy(null)}>
                         <FiX />
                     </Button>
                 </CardHeader>
                 <CardContent className="pt-6">
                     {selectedStrategy.loading ? (
                         <div className="flex flex-col items-center justify-center py-8 space-y-4">
                             <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                             <p className="text-sm text-muted-foreground animate-pulse">Consulting AI Advisor...</p>
                         </div>
                     ) : (
                         <div className="space-y-4">
                             {selectedStrategy.items.map((strategy, index) => (
                                 <div key={index} className="flex gap-3 bg-muted/30 p-3 rounded-lg border border-border/50">
                                     <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold mt-0.5">
                                         {index + 1}
                                     </span>
                                     <p className="text-sm text-foreground/90 leading-relaxed">{strategy}</p>
                                 </div>
                             ))}
                             <div className="pt-2">
                                <p className="text-[10px] text-muted-foreground text-center">
                                    Generated by Gemini AI based on your spending habits.
                                </p>
                             </div>
                         </div>
                     )}
                     <Button className="w-full mt-6" onClick={() => setSelectedStrategy(null)}>
                         Got it!
                     </Button>
                 </CardContent>
             </Card>
        </div>
      )}
    </div>
  );
};

export default Goals;
