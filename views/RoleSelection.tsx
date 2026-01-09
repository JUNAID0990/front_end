
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { User, Stethoscope, ChevronRight } from 'lucide-react';

interface Props {
  onSelect: (role: UserRole) => void;
}

const RoleSelection: React.FC<Props> = ({ onSelect }) => {
  const navigate = useNavigate();

  const handleSelect = (role: UserRole) => {
    onSelect(role);
    if (role === UserRole.PATIENT) {
      navigate('/patient/setup');
    } else {
      navigate('/doctor/dashboard');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 max-w-lg mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">AI Health Assistant</h1>
        <p className="text-slate-600 text-lg leading-relaxed">Track health. Support doctors. Stay safe.</p>
      </div>

      <div className="grid gap-4 w-full">
        <button
          onClick={() => handleSelect(UserRole.PATIENT)}
          className="group relative flex items-center gap-6 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300 text-left"
        >
          <div className="flex-shrink-0 p-4 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <User className="w-8 h-8" />
          </div>
          <div className="flex-grow">
            <h3 className="font-bold text-xl text-slate-800">Continue as Patient</h3>
            <p className="text-sm text-slate-500">Track your daily vitals and symptoms securely.</p>
          </div>
          <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" />
        </button>

        <button
          onClick={() => handleSelect(UserRole.DOCTOR)}
          className="group relative flex items-center gap-6 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-300 text-left"
        >
          <div className="flex-shrink-0 p-4 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Stethoscope className="w-8 h-8" />
          </div>
          <div className="flex-grow">
            <h3 className="font-bold text-xl text-slate-800">Continue as Doctor</h3>
            <p className="text-sm text-slate-500">Access clinical insights and patient analytics.</p>
          </div>
          <ChevronRight className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
        </button>
      </div>

      <p className="mt-8 text-xs text-slate-400 text-center px-8">
        By continuing, you agree to our medical terms. AI analysis is intended for support, not direct diagnosis.
      </p>
    </div>
  );
};

export default RoleSelection;
