import React, { useState, useEffect } from 'react';
import api from '../ApiInception';
import LeftSidebar from './LeftSidebar';
import { Trash2, Edit2, AlertCircle, Clock, Plus, Calendar, Zap, X, Check } from 'lucide-react';

const MyTodo = () => {
    const [todos, setTodos] = useState([]);
    const [overdueTodos, setOverdueTodos] = useState([]);
    const [analysis, setAnalysis] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingTodo, setEditingTodo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [warning, setWarning] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDateTime: '',
        endDateTime: '',
        estimatedHours: '',
        priority: 'medium'
    });

    // ── Local-time helpers (avoids UTC offset shifting the date e.g. Dhaka UTC+6) ──
    const toLocalDateStr = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };
    const toLocalDTStr = (d) => {
        const h = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${toLocalDateStr(d)}T${h}:${min}`;
    };
    const getTodayDate = () => toLocalDateStr(new Date());
    const getTodayMin = () => { const t = new Date(); t.setHours(0, 0); return toLocalDTStr(t); };
    const getTodayMax = () => { const t = new Date(); t.setHours(23, 59); return toLocalDTStr(t); };
    const localDate = (s) => s ? s.split('T')[0] : '';

    // ── Timezone offset (minutes ahead of UTC, e.g. Dhaka = 360) ──
    const getTzOffset = () => -new Date().getTimezoneOffset();

    const fetchTodayTodos = async () => {
        try {
            setLoading(true);
            const r = await api.get('/api/v1/todo/today');
            if (r.data.success) {
                setTodos(r.data.todos);
                setAnalysis(r.data.analysis);
            }
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to fetch todos');
        } finally {
            setLoading(false);
        }
    };

    const fetchOverdueTodos = async () => {
        try {
            // Send local timezone offset so backend computes "now" in the user's local time
            const tzOffset = getTzOffset();
            const r = await api.get(`/api/v1/todo/overdue?tzOffset=${tzOffset}`);
            if (r.data.success) setOverdueTodos(r.data.todos);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchTodayTodos();
        fetchOverdueTodos();
        // Re-check overdue every 60s so tasks expiring while page is open appear
        const timer = setInterval(fetchOverdueTodos, 60000);
        return () => clearInterval(timer);
    }, []);

    const calcHours = (start, end) => {
        if (!start || !end) return '';
        const diff = (new Date(end) - new Date(start)) / 3600000;
        return diff > 0 ? Math.round(diff * 4) / 4 : '';
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const today = getTodayDate();
        if ((name === 'startDateTime' || name === 'endDateTime') && value) {
            if (localDate(value) !== today) {
                setError('Date is fixed to today — only the time can be changed');
                return;
            }
        }
        setError(null);
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            if (name === 'startDateTime' || name === 'endDateTime') {
                const hrs = calcHours(
                    name === 'startDateTime' ? value : prev.startDateTime,
                    name === 'endDateTime' ? value : prev.endDateTime
                );
                updated.estimatedHours = hrs !== '' ? String(hrs) : '';
            }
            return updated;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setWarning(null);
        try {
            if (!formData.title || !formData.startDateTime || !formData.endDateTime || !formData.estimatedHours) {
                setError('Please fill in all required fields');
                return;
            }
            const s = new Date(formData.startDateTime);
            const en = new Date(formData.endDateTime);
            const today = getTodayDate();
            if (localDate(formData.startDateTime) !== today || localDate(formData.endDateTime) !== today) {
                setError('Tasks can only be created for today');
                return;
            }
            if (s >= en) { setError('Start time must be before end time'); return; }
            if (parseFloat(formData.estimatedHours) <= 0 || parseFloat(formData.estimatedHours) > 24) {
                setError('Estimated hours must be between 0.25 and 24');
                return;
            }
            const payload = { ...formData, estimatedHours: parseFloat(formData.estimatedHours) };
            const url = editingTodo ? `/api/v1/todo/update/${editingTodo._id}` : '/api/v1/todo/create';
            const method = editingTodo ? 'patch' : 'post';
            const r = await api[method](url, payload);
            if (r.data.success) {
                if (r.data.warning) setWarning(r.data.warning);
                fetchTodayTodos();
                fetchOverdueTodos();
                setEditingTodo(null);
                setShowForm(false);
                resetForm();
            }
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to save todo');
        }
    };

    const handleEdit = (todo) => {
        setEditingTodo(todo);
        setFormData({
            title: todo.title,
            description: todo.description,
            startDateTime: toLocalDTStr(new Date(todo.startDateTime)),
            endDateTime: toLocalDTStr(new Date(todo.endDateTime)),
            estimatedHours: todo.estimatedHours.toString(),
            priority: todo.priority
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this task?')) return;
        try {
            const r = await api.delete(`/api/v1/todo/delete/${id}`);
            if (r.data.success) { fetchTodayTodos(); fetchOverdueTodos(); }
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to delete');
        }
    };

    const handleStatusChange = async (id, status) => {
        try {
            const r = await api.patch(`/api/v1/todo/update/${id}`, { status });
            if (r.data.success) { fetchTodayTodos(); fetchOverdueTodos(); }
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to update');
        }
    };

    const resetForm = () => {
        setFormData({ title: '', description: '', startDateTime: '', endDateTime: '', estimatedHours: '', priority: 'medium' });
        setEditingTodo(null);
    };

    const handleCancel = () => { setShowForm(false); resetForm(); setError(null); setWarning(null); };

    const statusStyle = (s) => ({
        'pending':     'bg-slate-700 text-slate-200',
        'in-progress': 'bg-blue-900/60 text-blue-200',
        'completed':   'bg-emerald-900/60 text-emerald-200',
        'cancelled':   'bg-gray-800 text-gray-300'
    }[s] || 'bg-gray-800 text-gray-300');

    const priorityDot = (p) => ({ high: '#f87171', medium: '#fbbf24', low: '#34d399' }[p] || '#9ca3af');

    const fmtTime = (d) => new Date(d).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' });
    const fmtDate = (d) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric' });

    const timeLeft = (end) => {
        const ms = new Date(end) - new Date();
        if (ms < 0) return { text: 'Overdue', over: true };
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        return { text: h > 0 ? `${h}h ${m}m` : `${m}m`, over: false };
    };

    const capPct = analysis ? Math.min(100, (analysis.totalHours / analysis.availableHours) * 100) : 0;

    if (loading) return (
        <div className="flex h-screen bg-slate-950">
            <LeftSidebar />
            <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                    <p className="text-slate-400 text-base">Loading tasks…</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-slate-950 font-sans">
            <div className="w-56 shrink-0 border-r border-slate-800">
                <LeftSidebar />
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
                <div className="max-w-5xl mx-auto px-5 py-6">

                    {/* ── Header ── */}
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h1 className="text-2xl font-semibold text-white tracking-tight">My Tasks</h1>
                            <p className="text-sm text-slate-400 mt-0.5">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                showForm
                                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-sm'
                            }`}
                        >
                            {showForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> New Task</>}
                        </button>
                    </div>

                    {/* ── Capacity Bar ── */}
                    {analysis && (
                        <div className="mb-5 p-4 bg-slate-900 rounded-xl border border-slate-800">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Zap size={14} className="text-yellow-400" />
                                    <span className="text-sm font-medium text-slate-300">Daily Capacity</span>
                                    {analysis.isOverloaded && (
                                        <span className="text-xs px-2 py-0.5 bg-red-900/50 text-red-300 rounded-md border border-red-800/50">Overloaded</span>
                                    )}
                                </div>
                                <span className="text-sm text-slate-400">
                                    {analysis.totalHours.toFixed(1)}h / {analysis.availableHours}h
                                </span>
                            </div>

                            {/* Progress bar */}
                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${analysis.isOverloaded ? 'bg-red-500' : 'bg-purple-500'}`}
                                    style={{ width: `${capPct}%` }}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { label: 'Available', value: `${analysis.availableHours}h`, color: 'text-slate-200' },
                                    { label: 'Allocated', value: `${analysis.totalHours.toFixed(1)}h`, color: analysis.isOverloaded ? 'text-red-300' : 'text-slate-200' },
                                    { label: 'Remaining', value: `${Math.max(0, analysis.remainingHours).toFixed(1)}h`, color: analysis.remainingHours < 0 ? 'text-red-300' : 'text-emerald-400' },
                                ].map(({ label, value, color }) => (
                                    <div key={label} className="bg-slate-800/50 rounded-lg px-3 py-2.5">
                                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
                                        <p className={`text-base font-semibold ${color}`}>{value}</p>
                                    </div>
                                ))}
                            </div>

                            {analysis.isOverloaded && (
                                <p className="mt-3 text-sm text-red-400 flex items-center gap-1.5">
                                    <AlertCircle size={13} />
                                    {analysis.excessHours.toFixed(1)}h over capacity — consider moving tasks
                                </p>
                            )}
                        </div>
                    )}

                    {/* ── Alerts ── */}
                    {error && (
                        <div className="mb-4 flex items-center justify-between px-3 py-2.5 bg-red-950/50 border border-red-900/60 rounded-lg">
                            <div className="flex items-center gap-2">
                                <AlertCircle size={14} className="text-red-400 shrink-0" />
                                <p className="text-sm text-red-300">{error}</p>
                            </div>
                            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-300 ml-3"><X size={14} /></button>
                        </div>
                    )}
                    {warning && (
                        <div className="mb-4 flex items-center justify-between px-3 py-2.5 bg-amber-950/50 border border-amber-900/60 rounded-lg">
                            <div className="flex items-center gap-2">
                                <AlertCircle size={14} className="text-amber-400 shrink-0" />
                                <p className="text-sm text-amber-300">
                                    Too many tasks — {warning.totalHours?.toFixed(1)}h total, {warning.excessHours?.toFixed(1)}h over
                                </p>
                            </div>
                            <button onClick={() => setWarning(null)} className="text-amber-500 hover:text-amber-300 ml-3"><X size={14} /></button>
                        </div>
                    )}

                    {/* ── Task Form ── */}
                    {showForm && (
                        <div className="mb-5 bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
                                <span className="text-sm font-medium text-white">{editingTodo ? 'Edit Task' : 'New Task'}</span>
                            </div>
                            <form onSubmit={handleSubmit} className="p-4 space-y-3">
                                <input
                                    type="text" name="title" value={formData.title}
                                    onChange={handleInputChange} placeholder="Task title *"
                                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                                    required
                                />
                                <textarea
                                    name="description" value={formData.description}
                                    onChange={handleInputChange} placeholder="Description (optional)"
                                    rows="2"
                                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition resize-none"
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wide">Start *</label>
                                        <input type="datetime-local" name="startDateTime" value={formData.startDateTime}
                                            onChange={handleInputChange} min={getTodayMin()} max={getTodayMax()}
                                            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 transition" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wide">End *</label>
                                        <input type="datetime-local" name="endDateTime" value={formData.endDateTime}
                                            onChange={handleInputChange} min={getTodayMin()} max={getTodayMax()}
                                            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 transition" required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wide">Hours *</label>
                                        <input type="number" name="estimatedHours" value={formData.estimatedHours}
                                            onChange={handleInputChange} placeholder="2.5" step="0.25" min="0.25" max="24"
                                            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wide">Priority</label>
                                        <select name="priority" value={formData.priority} onChange={handleInputChange}
                                            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 transition">
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-1">
                                    <button type="submit"
                                        className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition">
                                        {editingTodo ? 'Update Task' : 'Create Task'}
                                    </button>
                                    <button type="button" onClick={handleCancel}
                                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* ── Overdue Section ── */}
                    {/* {overdueTodos.length > 0 && (
                        <div className="mb-5">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertCircle size={14} className="text-red-400" />
                                <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wide">Overdue · {overdueTodos.length}</h2>
                            </div>
                            <div className="space-y-2">
                                {overdueTodos.map(todo => (
                                    <div key={todo._id} className="bg-red-950/20 border border-red-900/40 rounded-xl p-3.5">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="min-w-0">
                                                <h4 className="text-base font-medium text-white truncate">{todo.title}</h4>
                                                {todo.description && (
                                                    <p className="text-sm text-slate-400 mt-0.5 line-clamp-1">{todo.description}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <span className="text-xs px-2 py-0.5 rounded font-medium bg-red-900/40 text-red-300 border border-red-800/40">Overdue</span>
                                                <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                                                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: priorityDot(todo.priority), display: 'inline-block' }} />
                                                    {todo.priority}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 mb-2.5">
                                            <span>Due {fmtDate(todo.endDateTime)} {fmtTime(todo.endDateTime)}</span>
                                            <span>·</span>
                                            <span>{todo.estimatedHours}h</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <select value={todo.status} onChange={(e) => handleStatusChange(todo._id, e.target.value)}
                                                className="flex-1 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500">
                                                <option value="pending">Pending</option>
                                                <option value="in-progress">In Progress</option>
                                                <option value="completed">Completed</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                            <button onClick={() => handleEdit(todo)} className="p-1.5 hover:bg-blue-900/30 text-blue-400 rounded-lg transition"><Edit2 size={14} /></button>
                                            <button onClick={() => handleDelete(todo._id)} className="p-1.5 hover:bg-red-900/30 text-red-400 rounded-lg transition"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )} */}

                    {/* ── Today's Tasks ── */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar size={14} className="text-purple-400" />
                            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Today · {todos.length}</h2>
                        </div>

                        {todos.length === 0 ? (
                            <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
                                <p className="text-slate-400 text-base mb-3">No tasks for today</p>
                                <button onClick={() => setShowForm(true)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition">
                                    <Plus size={14} /> Add a task
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {todos.map(todo => {
                                    const tl = timeLeft(todo.endDateTime);
                                    const done = todo.status === 'completed';
                                    return (
                                        <div key={todo._id}
                                            className={`rounded-xl border transition-all ${
                                                done
                                                    ? 'bg-slate-900/30 border-slate-800/60 opacity-60'
                                                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                                            }`}>
                                            {/* Top row */}
                                            <div className="flex items-start gap-3 px-3.5 pt-3.5 pb-2">
                                                <button
                                                    onClick={() => handleStatusChange(todo._id, done ? 'pending' : 'completed')}
                                                    className={`mt-0.5 w-5 h-5 rounded shrink-0 border flex items-center justify-center transition-all ${
                                                        done
                                                            ? 'bg-purple-600 border-purple-600'
                                                            : 'border-slate-600 hover:border-purple-500'
                                                    }`}
                                                >
                                                    {done && <Check size={11} className="text-white" />}
                                                </button>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className={`text-base font-medium truncate ${done ? 'line-through text-slate-500' : 'text-white'}`}>
                                                            {todo.title}
                                                        </h4>
                                                        <span className="inline-flex items-center gap-1 text-xs text-slate-400 shrink-0">
                                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: priorityDot(todo.priority), display: 'inline-block' }} />
                                                            {todo.priority}
                                                        </span>
                                                    </div>
                                                    {todo.description && (
                                                        <p className="text-sm text-slate-400 mt-0.5 line-clamp-1">{todo.description}</p>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <span className={`text-xs px-2 py-0.5 rounded ${statusStyle(todo.status)}`}>
                                                        {todo.status}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Meta row */}
                                            <div className="flex items-center gap-4 px-3.5 pb-2 ml-8 text-xs text-slate-500">
                                                <span className="font-mono">{fmtTime(todo.startDateTime)} → {fmtTime(todo.endDateTime)}</span>
                                                <span>{todo.estimatedHours}h</span>
                                                <span className={`flex items-center gap-1 ${tl.over ? 'text-red-400' : 'text-emerald-400'}`}>
                                                    <Clock size={11} />
                                                    {tl.text}
                                                </span>
                                            </div>

                                            {/* Action row */}
                                            <div className="flex items-center gap-2 px-3.5 pb-3.5 ml-8">
                                                <select value={todo.status} onChange={(e) => handleStatusChange(todo._id, e.target.value)}
                                                    className="flex px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500">
                                                    <option value="pending">Pending</option>
                                                    <option value="in-progress">In Progress</option>
                                                    <option value="completed">Completed</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                                <button onClick={() => handleEdit(todo)} className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-blue-400 rounded-lg transition"><Edit2 size={14} /></button>
                                                <button onClick={() => handleDelete(todo._id)} className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-lg transition"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default MyTodo;