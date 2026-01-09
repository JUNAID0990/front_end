
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PatientProfile, VitalEntry } from '../types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
// Added Activity to the imports below

import { AlertCircle, ArrowUpRight, CheckCircle2, Calendar, TrendingUp, Plus, Activity, UserPlus, Info } from 'lucide-react';
import { api } from '../services/api';

interface Props {
  profile: PatientProfile | null;
  vitals: VitalEntry[];
}

const PatientDashboard: React.FC<Props> = ({ profile, vitals }) => {
  const navigate = useNavigate();


  const [alerts, setAlerts] = React.useState<any[]>([]);
  const [connectDoctorId, setConnectDoctorId] = React.useState('');

  const [sentInvites, setSentInvites] = React.useState<any[]>([]);

  React.useEffect(() => {
    const getInvites = async () => {
      try {

        const data = await api.patient.getInvites();
        const formatted = data.map((inv: any) => ({
          ...inv,
          patient_name: inv.patient_name || inv.patient || "Unknown" // Ensure name fallback
        }));
        setSentInvites(formatted);
      } catch (e) { console.error(e); }
    };
    getInvites();

    const getAlerts = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:8000/alerts', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        // Return ALL alerts, not just Rule based, as User requested "all type of alert"
        // And sort them
        const allAlerts = Array.isArray(data) ? data : [];
        setAlerts(allAlerts);
      } catch (e) { console.error(e); }
    };
    getAlerts();
  }, []);

  const handleConnect = async () => {
    if (!connectDoctorId) return;
    try {
      const res = await api.patient.invite(connectDoctorId);
      if (res.msg) alert(res.msg);
      else alert("Invite sent!");
      setConnectDoctorId('');
      // Refresh list
      const invites = await api.patient.getInvites();
      setSentInvites(invites);
    } catch (e) {
      alert("Failed to invite. Check ID.");
    }
  };

  // Simple logic for status display
  const latestVital = vitals[vitals.length - 1];
  const isHigh = latestVital?.systolic > 135 || latestVital?.sugar > 120;

  return (
    <div className="space-y-6 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Hello, {profile?.name || 'Patient'}!</h2>
          <p className="text-slate-500 text-sm">Welcome back to your health monitor.</p>
        </div>
        <button
          onClick={() => navigate('/patient/update')}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-2xl font-semibold shadow-md hover:bg-blue-700 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Update Daily Vitals
        </button>
      </header>

      {/* Today's Status Card */}
      <div className={`p-6 rounded-3xl border-2 flex flex-col md:flex-row gap-6 items-center ${isHigh ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
        <div className={`p-4 rounded-2xl ${isHigh ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
          {isHigh ? <AlertCircle className="w-10 h-10" /> : <CheckCircle2 className="w-10 h-10" />}
        </div>
        <div className="flex-grow text-center md:text-left">
          <h3 className={`text-xl font-bold ${isHigh ? 'text-amber-900' : 'text-emerald-900'}`}>
            Today's Status: {isHigh ? 'Monitor' : 'Stable'}
          </h3>
          <p className={`text-sm ${isHigh ? 'text-amber-700' : 'text-emerald-700'} mt-1`}>
            {isHigh
              ? 'Your readings are slightly higher than usual. Please continue regular monitoring and stay hydrated.'
              : 'Everything looks good today. Keep up the healthy routine!'
            }
          </p>
        </div>
        <div className="hidden lg:block bg-white p-3 rounded-2xl border border-slate-100 shadow-sm text-center min-w-[120px]">
          <span className="text-xs font-bold text-slate-400 block uppercase mb-1">Last Update</span>
          <span className="text-sm font-semibold text-slate-700">Today, 09:15 AM</span>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Trend Section */}
        <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="font-bold text-slate-800">Health Trends</h4>
              <p className="text-xs text-slate-500">Recent vital history</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={vitals}>
                <defs>
                  <linearGradient id="colorSys" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="systolic" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSys)" name="Systolic BP" strokeWidth={3} />
                <Area type="monotone" dataKey="sugar" stroke="#f43f5e" fillOpacity={0} name="Glucose" strokeWidth={3} dot={true} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>



        {/* Alerts Section (Rule based) -> Modified to col-span-1 to fit under trends */}
        <div className="lg:col-span-1 space-y-6">
          {alerts.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-500" /> Recent Alerts
              </h4>
              <div className="space-y-3">
                {alerts.slice(0, 3).map((a, i) => (
                  <div key={i} className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3">
                    <TrendingUp className="w-4 h-4 text-rose-600 mt-1" />
                    <div>
                      <p className="text-sm font-bold text-rose-800">{a.type === 'ML' ? 'AI Alert' : 'Reading Warning'}</p>
                      <p className="text-xs text-rose-600">
                        {a.type === 'ML'
                          ? `Risk: ${a.alert} (Prob: ${(a.probability * 100).toFixed(1)}%)`
                          : `${a.alerts?.join(', ')} recorded.`}
                      </p>
                      <p className="text-[10px] text-rose-400 mt-1">{new Date(a.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* Sent Invites Status */}
          {sentInvites.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-500" /> Connection Requests
              </h4>
              <div className="space-y-3">
                {sentInvites.map((inv, i) => (
                  <div key={i} className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between ">
                    <div>
                      <p className="text-sm font-bold text-blue-800">Doctor ID: {inv.doctor}</p>
                      <p className="text-xs text-blue-600">Status: <span className="uppercase font-bold">{inv.status}</span></p>
                    </div>
                    {inv.status === 'pending' ?
                      <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-lg font-bold">Pending</span>
                      : <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-1 rounded-lg font-bold">Accepted</span>
                    }
                  </div>
                ))}
              </div>
            </div>
          )}


          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-indigo-500" /> Connect with Doctor
            </h4>
            <div className="flex flex-col gap-3">
              <input
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="Enter Doctor ID..."
                value={connectDoctorId}
                onChange={e => setConnectDoctorId(e.target.value)}
              />
              <button
                onClick={handleConnect}
                className="w-full bg-indigo-600 text-white px-4 py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 hover:shadow-md transition-all active:scale-95"
              >
                Link Doctor
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-3 text-center">
              Ask your doctor for their unique ID to share your health records securely.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mt-6">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" /> Sleep Pattern
            </h4>
            <div className="h-40 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[{ name: 'Deep', value: 40 }, { name: 'Light', value: 30 }, { name: 'REM', value: 20 }, { name: 'Awake', value: 10 }]}
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#4f46e5" />
                    <Cell fill="#818cf8" />
                    <Cell fill="#c7d2fe" />
                    <Cell fill="#f1f5f9" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-800">7.5h</p>
                <p className="text-xs text-slate-400">Avg Sleep</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" /> Reminders
            </h4>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Activity className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-grow">
                  <p className="text-xs font-bold text-slate-800">Evening BP Check</p>
                  <p className="text-[10px] text-slate-500">Scheduled for 7:00 PM</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-grow">
                  <p className="text-xs font-bold text-slate-800">Afternoon Medication</p>
                  <p className="text-[10px] text-emerald-600 font-medium">Completed at 12:30 PM</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="font-bold mb-1">Did you know?</h4>
              <p className="text-xs text-blue-100 leading-relaxed mb-4">
                Consistent daily tracking improves AI monitoring accuracy by up to 40%.
              </p>
              <button className="text-xs font-bold bg-white text-blue-700 px-4 py-2 rounded-xl">Learn More</button>
            </div>
            <ArrowUpRight className="absolute top-4 right-4 w-12 h-12 text-blue-400 opacity-20" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
