import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PatientProfile } from '../types';
import { api } from '../services/api';
import { Info, Check } from 'lucide-react';

interface Props {
  onComplete: (profile: PatientProfile) => void;
}

const PatientProfileSetup: React.FC<Props> = ({ onComplete }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<PatientProfile>({
    name: '',
    age: 0,
    gender: 'Other',
    height: 0,
    weight: 0,
    isCaretaker: false,
    conditions: []
  });

  const conditionsList = [
    'Diabetes',
    'Blood Pressure',
    'Heart Condition',
    'Asthma',
    'Kidney Issues',
    'Other'
  ];

  const toggleCondition = (cond: string) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.includes(cond)
        ? prev.conditions.filter(c => c !== cond)
        : [...prev.conditions, cond]
    }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Update basic profile
      await api.user.updateProfile({
        name: formData.name,
        age: formData.age,
        gender: formData.gender,
        height: formData.height,
        weight: formData.weight
      });

      // Update health problems
      const conditions = formData.conditions;
      await api.health.addProblems({
        diabetes: conditions.includes('Diabetes'),
        blood_pressure: conditions.includes('Blood Pressure'),
        heart_problem: conditions.includes('Heart Condition')
      });

      onComplete(formData);
      // Navigate handled by parent callback if provided, but if used standalone:
      navigate('/patient/dashboard');
    } catch (err) {
      console.error("Failed to setup profile", err);
      alert("Failed to save profile. Please try again.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Patient Profile Setup</h2>
        <p className="text-slate-500">Help doctors understand your health baseline.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Full Name</label>
              <input
                required
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="John Doe"
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Age</label>
              <input
                required
                type="number"
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="0"
                onChange={e => setFormData({ ...formData, age: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Gender</label>
              <select
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                onChange={e => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Role</label>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm text-slate-600">Filling as caretaker?</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isCaretaker: !formData.isCaretaker })}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${formData.isCaretaker ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.isCaretaker ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Height (cm)</label>
              <input
                type="number"
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                onChange={e => setFormData({ ...formData, height: parseInt(e.target.value) })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Weight (kg)</label>
              <input
                type="number"
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                onChange={e => setFormData({ ...formData, weight: parseInt(e.target.value) })}
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <label className="text-sm font-semibold text-slate-700 block mb-4 uppercase tracking-wider">Health Conditions</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {conditionsList.map(cond => (
              <button
                key={cond}
                type="button"
                onClick={() => toggleCondition(cond)}
                className={`flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all ${formData.conditions.includes(cond)
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
              >
                {cond}
                {formData.conditions.includes(cond) && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-xl flex gap-3 items-start border border-blue-100">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 leading-relaxed">
            This information helps doctors understand your health baseline and provides context for AI monitoring.
          </p>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all transform active:scale-[0.98]"
        >
          Create Profile
        </button>
      </form>
    </div>
  );
};

export default PatientProfileSetup;
