
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, Link, Navigate } from 'react-router-dom';
import { UserRole, PatientProfile, DailyUpdate, VitalEntry } from './types';
import Login from './views/Login';
import PatientProfileSetup from './views/PatientProfileSetup';
import DailyUpdateForm from './views/DailyUpdateForm';
import PatientDashboard from './views/PatientDashboard';
import DoctorDashboard from './views/DoctorDashboard';

import PatientClinicalProfile from './views/PatientClinicalProfile';
import UserProfile from './views/UserProfile';
import { Activity, ShieldCheck, User, Stethoscope, LogOut } from 'lucide-react';
import { api } from './services/api';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.NONE);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [updates, setUpdates] = useState<DailyUpdate[]>([]);
  const [vitalsHistory, setVitalsHistory] = useState<VitalEntry[]>([]);

  useEffect(() => {
    const initSession = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const data = await api.user.getProfile();
        if (data && data.uid) {
          const restoredRole = data.uid.startsWith('DOC-') ? UserRole.DOCTOR : UserRole.PATIENT;
          setRole(restoredRole);
          if (restoredRole === UserRole.PATIENT && data.profile) {
            setProfile(data.profile);
          }
        }
      } catch (e) {
        console.error("Session restore failed", e);
        localStorage.removeItem('token');
      }
    };
    initSession();
  }, []);


  const fetchData = async () => {
    if (role === UserRole.PATIENT) {
      try {
        const data = await api.user.getFullData();
        if (data.profile && data.profile.profile) {
          setProfile(data.profile.profile);
        }

        if (data.health) {
          const bp = data.health.bp || [];
          const diabetes = data.health.diabetes || [];

          const vitalsMap = new Map<string, any>();

          bp.forEach((r: any) => {
            // Safe date parsing
            const rDate = r.date || new Date().toISOString();
            const date = String(rDate).split('T')[0];

            if (!vitalsMap.has(date)) vitalsMap.set(date, { date });
            const entry = vitalsMap.get(date);
            entry.systolic = r.systolic;
            entry.diastolic = r.diastolic;
          });

          diabetes.forEach((r: any) => {
            const rDate = r.date || new Date().toISOString();
            const date = String(rDate).split('T')[0];
            if (!vitalsMap.has(date)) vitalsMap.set(date, { date });
            const entry = vitalsMap.get(date);
            entry.sugar = r.glucose;
          });

          const sortedVitals = Array.from(vitalsMap.values()).sort((a: any, b: any) => a.date.localeCompare(b.date));
          setVitalsHistory(sortedVitals);
        }
      } catch (err) {
        console.error("Failed to fetch patient data", err);
      }
    }
  };

  useEffect(() => {
    if (role !== UserRole.NONE) fetchData();
  }, [role]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setRole(UserRole.NONE);
    setProfile(null);
    window.location.href = '/#/';
  };

  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Navigation Bar */}
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 py-3 flex items-center justify-between">

          <Link to="/" className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-800 text-lg tracking-tight">CareSync</span>
          </Link>
          <div className="flex items-center gap-4">
            {role !== UserRole.NONE && (
              <>
                <Link to="/profile" className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors">
                  {role === UserRole.PATIENT ? <User className="w-3 h-3" /> : <Stethoscope className="w-3 h-3" />}
                  {role}
                </Link>
                <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors" title="Logout">
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            )}
            {role === UserRole.NONE && (
              <div className="flex items-center gap-2 text-slate-400">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-xs font-medium hidden sm:inline">Secure Access</span>
              </div>
            )}
          </div>
        </nav>

        <main className="flex-grow container mx-auto max-w-5xl px-4 py-6">
          <Routes>
            <Route path="/" element={<Login onLogin={setRole} />} />


            {/* Patient Routes - semi-protected (App state logic usually handles true protection) */}
            <Route path="/patient/setup" element={<PatientProfileSetup onComplete={setProfile} />} />
            <Route path="/patient/update" element={<DailyUpdateForm onUpdate={(u) => { setUpdates([...updates, u]); fetchData(); }} />} />
            <Route path="/patient/dashboard" element={<PatientDashboard profile={profile} vitals={vitalsHistory} />} />

            {/* Doctor Routes */}
            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            <Route path="/doctor/patient/:id" element={<PatientClinicalProfile profile={profile} vitals={vitalsHistory} />} />


            {/* Common Routes */}
            <Route path="/profile" element={<UserProfile />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>


        <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Microsoft Imagine Cup Prototype</p>
          <p className="text-xs text-slate-400">
            CareSync assists doctors. Final decisions are made by healthcare professionals.
            This app does not provide medical diagnosis.
          </p>
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;
