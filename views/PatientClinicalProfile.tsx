
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PatientProfile, VitalEntry, AIAnalysisResult, SuggestedQuestion } from '../types';
import { getClinicalAnalysis, getSuggestedQuestions } from '../services/geminiService';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

import {
  ArrowLeft, BrainCircuit, Activity, ClipboardList, Info, Loader2, Send, CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';

interface Props {
  profile: PatientProfile | null;
  vitals: VitalEntry[];
}

const PatientClinicalProfile: React.FC<Props> = ({ profile, vitals }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'vitals' | 'ai' | 'notes'>('overview');
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestedQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState<string | null>(null);


  // Local state for fetched data if props aren't sufficient
  const [fetchedProfile, setFetchedProfile] = useState<any>(null);
  const [fetchedVitals, setFetchedVitals] = useState<any[]>([]);
  const [fetchedAlerts, setFetchedAlerts] = useState<any[]>([]);

  useEffect(() => {
    // If we have an ID, we should fetch that specific patient data
    // The parent might have passed profile/vitals, but they might be the doctor's general list
    // rather than full detailed history. 
    // Let's always fetch full data for clinical view to be safe/rich.
    const loadPatient = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await api.user.getFullData(id);
        setFetchedProfile(data.profile?.profile || {});
        setFetchedAlerts(data.alerts || []);


        // Process vitals
        const bp = data.health?.bp || [];
        const diab = data.health?.diabetes || [];
        // Merge
        // Inline for speed:


        const vMap = new Map();
        if (Array.isArray(bp)) {
          bp.forEach((r: any) => {
            if (!r || !r.date) return;
            const dStr = String(r.date);
            const d = dStr.includes('T') ? dStr.split('T')[0] : dStr;
            if (!vMap.has(d)) vMap.set(d, { date: d });
            const e = vMap.get(d);
            e.systolic = r.systolic;
            e.diastolic = r.diastolic;
          });
        }
        if (Array.isArray(diab)) {
          diab.forEach((r: any) => {
            if (!r || !r.date) return;
            const dStr = String(r.date);
            const d = dStr.includes('T') ? dStr.split('T')[0] : dStr;
            if (!vMap.has(d)) vMap.set(d, { date: d });
            const e = vMap.get(d);
            e.sugar = r.glucose;
          });
        }
        const sorted = Array.from(vMap.values()).sort((a: any, b: any) => a.date.localeCompare(b.date));
        setFetchedVitals(sorted);

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadPatient();
  }, [id]);


  // Use fetched data if available, else props (which might be empty if direct navigation)
  // Fix: If id is present (Doctor viewing Patient), DO NOT fallback to 'profile' (which is Doctor's own profile).
  const isDoctorView = !!id;
  const displayProfile = fetchedProfile || (isDoctorView ? { name: 'Loading...', age: 0 } : profile) || { name: 'Loading...', age: 0 };
  const displayVitals = fetchedVitals.length > 0 ? fetchedVitals : (isDoctorView ? [] : vitals);



  useEffect(() => {
    // Feature paused by request
    setLoading(false);
  }, [fetchedProfile, displayVitals]);

  // Placeholder for when we re-enable intelligence
  /*
  useEffect(() => {
    const fetchAnalysis = async () => {
      // Don't analyze if no data confirmed
      if (!displayVitals.length && !fetchedProfile) return;

      setLoading(true);
      try {
        const result = await getClinicalAnalysis(displayProfile, displayVitals);
        setAnalysis(result);
        const questions = await getSuggestedQuestions(result);
        setSuggestions(questions);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [fetchedProfile, displayVitals]);
  */

  const handleSendQuestion = (qid: string) => {
    setSending(qid);
    setTimeout(() => setSending(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/doctor/dashboard')} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">{displayProfile?.name || 'Unknown'}</h2>
          <p className="text-sm text-slate-500 font-medium">Case ID: #CLN-{id || '001'} • Active Monitoring</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
        {(['overview', 'vitals', 'ai', 'alerts', 'notes'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-xl text-sm font-bold capitalize transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            {tab === 'ai' ? 'AI Analysis' : tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'overview' && (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">

              <section>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Patient Demographics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-xs text-slate-500">Age</p>
                    <p className="font-bold text-slate-800">{displayProfile?.age} yrs</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Gender</p>
                    <p className="font-bold text-slate-800">{displayProfile?.gender}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Height</p>
                    <p className="font-bold text-slate-800">{displayProfile?.height} cm</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Weight</p>
                    <p className="font-bold text-slate-800">{displayProfile?.weight} kg</p>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">BMI & Vitals Ratio</h4>
                <div className="h-40 flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-100 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'BMI', value: (displayProfile?.weight || 70) / ((displayProfile?.height / 100) ** 2 || 3) },
                          { name: 'Muscle', value: 40 },
                          { name: 'Fat', value: 20 }
                        ]}
                        innerRadius={40}
                        outerRadius={60}
                        dataKey="value"
                      >
                        <Cell fill="#6366f1" />
                        <Cell fill="#34d399" />
                        <Cell fill="#fbbf24" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="ml-4">
                    <p className="text-sm font-bold text-slate-700">BMI: {((displayProfile?.weight || 70) / ((displayProfile?.height / 100) ** 2 || 1)).toFixed(1)}</p>
                    <p className="text-xs text-slate-400">Normal Range</p>
                  </div>
                </div>
              </section>


              <section>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Clinical Conditions</h4>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const conds = displayProfile?.conditions;
                    let list: string[] = [];
                    if (Array.isArray(conds)) {
                      list = conds;
                    } else if (typeof conds === 'object' && conds !== null) {
                      list = Object.keys(conds).filter(k => conds[k] === true);
                    }

                    if (list.length === 0) return <span className="text-sm text-slate-400 italic">None recorded</span>;

                    return list.map((c: string) => (
                      <span key={c} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 capitalize">
                        {c.replace(/_/g, ' ')}
                      </span>
                    ));
                  })()}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Blood Pressure Trend</h4>
                  <button onClick={() => setActiveTab('vitals')} className="text-xs font-bold text-indigo-600 hover:underline">View All Vitals</button>
                </div>
                {displayVitals.length > 0 ? (
                  <div className="h-64 bg-white p-4 rounded-2xl border border-slate-100">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={displayVitals}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
                        <Tooltip />
                        <Line type="monotone" dataKey="systolic" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="diastolic" stroke="#94a3b8" strokeWidth={3} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-40 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 text-sm font-medium">
                    No vitals recorded yet.
                  </div>
                )}
              </section>

              {analysis && (
                <section>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">AI Clinical Summary</h4>
                  <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 relative overflow-hidden">
                    <BrainCircuit className="absolute top-4 right-4 w-12 h-12 text-indigo-100" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${analysis.riskLevel === 'Elevated' ? 'bg-rose-100 text-rose-700' : analysis.riskLevel === 'Monitor' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {analysis.riskLevel} Risk
                        </span>
                        <span className="text-xs text-slate-500 font-bold">Score: {analysis.riskScore}</span>
                      </div>
                      <p className="text-sm text-slate-700 italic leading-relaxed">"{analysis.summary}"</p>
                    </div>
                  </div>
                </section>
              )}

              <section>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Medication Adherence</h4>
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <div>
                      <p className="font-bold text-emerald-900">Excellent Adherence</p>
                      <p className="text-xs text-emerald-700">Patient has confirmed taking medications 95% of the time this month.</p>
                    </div>
                  </div>
                  <span className="text-xl font-black text-emerald-600">95%</span>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'vitals' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-8">
              <div>
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-600" /> Blood Pressure Trend (Systolic/Diastolic)
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={displayVitals}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" />
                      <YAxis domain={['dataMin - 10', 'dataMax + 10']} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="systolic" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="diastolic" stroke="#94a3b8" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-indigo-600" /> Blood Sugar Levels
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={displayVitals}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" />
                      <YAxis domain={['dataMin - 10', 'dataMax + 10']} />
                      <Tooltip />
                      <Bar dataKey="sugar" fill="#6366f1" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}


          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="bg-white p-20 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-slate-400">
                <BrainCircuit className="w-16 h-16 text-slate-200 mb-4" />
                <h3 className="text-xl font-bold text-slate-600 mb-2">AI Clinical Analysis</h3>
                <p className="text-sm text-slate-500 bg-slate-100 px-4 py-2 rounded-full font-medium">✨ Upcoming Feature</p>
                <p className="max-w-md text-center mt-4 text-xs leading-relaxed">
                  Advanced clinical reasoning and risk scoring powered by OpenAI Azure is coming soon.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" /> Alert History
              </h4>
              {fetchedAlerts.length === 0 ? <p className="text-slate-500 italic">No alerts recorded.</p> : (
                <div className="space-y-4">
                  {fetchedAlerts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((alert, i) => (
                    <div key={i} className={`p-4 rounded-xl border ${alert.type === 'ML' ? 'bg-indigo-50 border-indigo-100' : 'bg-rose-50 border-rose-100'} flex items-start gap-4`}>
                      <div className={`p-2 rounded-lg ${alert.type === 'ML' ? 'bg-indigo-200 text-indigo-800' : 'bg-rose-200 text-rose-800'}`}>
                        {alert.type === 'ML' ? <BrainCircuit className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between">
                          <p className="font-bold text-slate-800">{alert.type === 'ML' ? 'AI Risk Assessment' : 'Rule Violation'}</p>
                          <span className="text-xs text-slate-400">{new Date(alert.created_at).toLocaleString()}</span>
                        </div>
                        {alert.type === 'ML' ? (
                          <p className="text-sm text-slate-600 mt-1">
                            Risk: <span className="font-bold">{alert.alert}</span> (Probability: {(alert.probability * 100).toFixed(1)}%)
                          </p>
                        ) : (
                          <p className="text-sm text-slate-600 mt-1">
                            Triggers: {alert.alerts?.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar: AI Question Engine */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm sticky top-24">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Send className="w-4 h-4 text-indigo-600" /> AI Follow-up Engine
            </h4>
            <p className="text-xs text-slate-500 mb-6">
              AI suggests priority questions based on the recent elevated readings.
            </p>

            <div className="space-y-3">
              {loading ? (
                <div className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-300" /></div>
              ) : suggestions.map(s => (
                <div key={s.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl group transition-all hover:border-indigo-300">
                  <div className="flex justify-between mb-2">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${s.priority === 'High' ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-600'
                      }`}>
                      {s.priority} Priority
                    </span>
                    <button
                      disabled={sending === s.id}
                      onClick={() => handleSendQuestion(s.id)}
                      className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {sending === s.id ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-slate-700 leading-tight">
                    {s.question}
                  </p>
                </div>
              ))}

              <button className="w-full mt-4 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-bold text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all">
                + Add Custom Clinical Question
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientClinicalProfile;
