

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, AlertTriangle, CheckCircle, Activity, Search, Bell } from 'lucide-react';
import { api } from '../services/api';

const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);


  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);


  const [stats, setStats] = useState({ total_patients: 0, high_risk: 0, alerts_today: 0, reviewed: 0 });

  useEffect(() => {
    // Load patients and invites
    const loadData = async () => {
      try {

        const pat = await api.doctor.getPatients();
        const inv = await api.doctor.getInvites();
        const statData = await api.doctor.getStats();
        setStats(statData);



        const formatted = pat.map((p: any) => {
          // p.health maps directly to the conditions object from backend summary
          // Use loose check for condition presence (truthy)
          const primaryList = Object.keys(p.health || {}).filter(k => !!p.health[k]);
          const primary = primaryList.length > 0 ? primaryList.join(', ') : 'None';

          return {
            id: p.uid,
            name: p.profile?.name || 'Unknown Patient',
            age: p.profile?.age || 'N/A',
            condition: primary.replace(/_/g, ' '),
            risk: p.risk === 'HIGH' ? 'High' : (p.risk === 'MEDIUM' ? 'Monitor' : 'Stable'),
            lastUpdate: p.last_alert ? new Date(p.last_alert).toLocaleDateString() : 'N/A'
          };
        });
        setPatients(formatted);
        setPendingInvites(inv);

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery) return;
    try {
      // Need to add search to api.ts
      const res = await api.user.search('patient', searchQuery);
      setSearchResults(res);
    } catch (e) {
      console.error("Search failed", e);
    }
  };

  const acceptInvite = async (patientUid: string) => {
    try {
      await api.doctor.acceptInvite(patientUid);
      window.location.reload();
    } catch (e) {
      alert("Failed to accept");
    }
  };

  const [filter, setFilter] = useState<'all' | 'invited' | 'linked'>('linked');

  const rejectInvite = async (patientUid: string) => {
    try {
      await api.doctor.rejectInvite(patientUid);
      setPendingInvites(prev => prev.filter(i => i.patient !== patientUid));
    } catch (e) {
      alert("Failed to reject");
    }
  };

  const disconnectPatient = async (patientUid: string) => {
    if (!confirm("Are you sure you want to disconnect?")) return;
    try {
      await api.doctor.disconnectPatient(patientUid);
      setPatients(prev => prev.filter(p => p.id !== patientUid));
    } catch (e) { alert("Failed to disconnect"); }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900">Doctor's Workspace</h2>
          <p className="text-slate-500 font-medium">Monitoring {patients.length} active patients today.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Pending Invites Alert */}
          {pendingInvites.length > 0 && (
            <div className="bg-amber-100 px-4 py-2 rounded-xl flex items-center gap-3 text-amber-800 border border-amber-200">
              <span className="text-xs font-bold">New Invites!</span>
              {pendingInvites.map(i => (
                <div key={i.patient} className="flex gap-2 items-center">
                  <span className="text-sm font-medium">{i.patient_name ? `From: ${i.patient_name}` : i.patient}</span>
                  <button onClick={() => acceptInvite(i.patient)} className="text-xs bg-white px-2 py-1 rounded shadow-sm hover:bg-amber-50">Accept</button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => setFilter('linked')} className={`px-4 py-2 rounded-xl text-sm font-bold ${filter === 'linked' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>Active</button>
            <button onClick={() => setFilter('invited')} className={`px-4 py-2 rounded-xl text-sm font-bold ${filter === 'invited' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>Invites ({pendingInvites.length})</button>
            <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-xl text-sm font-bold ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>All</button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
              placeholder="Search ID/Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button className="p-2 bg-white border border-slate-200 rounded-xl relative hover:bg-slate-50">
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
          </button>
        </div>
      </header>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-top-2">
          <h3 className="font-bold text-sm text-slate-500 uppercase mb-2">Search Results</h3>
          <div className="grid gap-2">
            {searchResults.map(res => (
              <div key={res.uid} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">{res.username[0]}</div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{res.username}</p>
                    <p className="text-xs text-slate-500">ID: {res.uid}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Patients</p>
            <p className="text-2xl font-bold text-slate-800">{stats.total_patients}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-rose-50 p-3 rounded-2xl text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">High Risk</p>
            <p className="text-2xl font-bold text-slate-800">{stats.high_risk}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-amber-50 p-3 rounded-2xl text-amber-600">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alerts Today</p>
            <p className="text-2xl font-bold text-slate-800">{stats.alerts_today}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reviewed</p>
            <p className="text-2xl font-bold text-slate-800">{stats.reviewed}</p>
          </div>
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Patient Monitoring List</h3>
          <button className="text-xs font-bold text-indigo-600 hover:underline">Export Report</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Patient Name</th>
                <th className="px-6 py-4">Primary Condition</th>
                <th className="px-6 py-4">AI Risk Status</th>
                <th className="px-6 py-4">Last Update</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filter === 'invited' ? (
                pendingInvites.map(i => (
                  <tr key={i.patient} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 font-bold">?</div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">Request: {i.patient_name || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">ID: {i.patient}</p>
                        </div>
                      </div>
                    </td>
                    <td colSpan={3} className="px-6 py-4 text-sm text-slate-500">Patient has requested to link with you.</td>
                    <td className="px-6 py-4 text-right flex gap-2 justify-end">
                      <button onClick={() => acceptInvite(i.patient)} className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600">Accept</button>
                      <button onClick={() => rejectInvite(i.patient)} className="px-4 py-2 bg-rose-500 text-white text-xs font-bold rounded-xl hover:bg-rose-600">Reject</button>
                    </td>
                  </tr>
                ))
              ) : (
                patients.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold">
                          {p.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{p.name}</p>
                          <p className="text-xs text-slate-500">Age: {p.age}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                      {p.condition}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${p.risk === 'High' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                        p.risk === 'Monitor' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                          'bg-emerald-50 border-emerald-100 text-emerald-600'
                        }`}>
                        {p.risk}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 italic">
                      {p.lastUpdate}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/doctor/patient/${p.id}`)}
                        className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => disconnectPatient(p.id)}
                        className="px-2 py-2 ml-2 bg-slate-100 text-slate-500 text-xs font-bold rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      >
                        Unlink
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
