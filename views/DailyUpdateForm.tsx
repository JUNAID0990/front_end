
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DailyUpdate } from '../types';
import { api } from '../services/api';
import {
  Heart, Droplet, Weight, Moon, GlassWater, Pill, Thermometer,
  ChevronLeft, ChevronRight, Calendar, Info, Activity, CheckCircle2
} from 'lucide-react';

interface Props {
  onUpdate: (update: DailyUpdate) => void;
}

const DailyUpdateForm: React.FC<Props> = ({ onUpdate }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);

  const [formData, setFormData] = useState<DailyUpdate>({
    vitals: { systolic: '', diastolic: '', pulse: '', sugar: '', sugarType: 'Random', weight: '', insulin: '' },
    routine: { sleep: '', water: '', medicineTaken: false },
    symptoms: []
  });

  const symptomsList = ['Headache', 'Dizziness', 'Chest discomfort', 'Fatigue', 'Breathlessness'];

  const toggleSymptom = (sym: string) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(sym)
        ? prev.symptoms.filter(s => s !== sym)
        : [...prev.symptoms, sym]
    }));
  };

  const toggleCondition = (cond: string) => {
    setSelectedConditions(prev =>
      prev.includes(cond) ? prev.filter(c => c !== cond) : [...prev, cond]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dateStr = new Date().toISOString().split('T')[0];
    const { vitals } = formData;

    try {
      const promises = [];

      // Save BP if selected
      if (selectedConditions.includes('bp') && vitals.systolic && vitals.diastolic) {
        promises.push(api.health.addBP({
          systolic: parseInt(vitals.systolic),
          diastolic: parseInt(vitals.diastolic),
          pulse: parseInt(vitals.pulse || '0'),
          date: dateStr
        }));
      }



      // Save Diabetes if selected
      if (selectedConditions.includes('diabetes') && vitals.sugar) {
        promises.push(api.health.addDiabetes({
          glucose: parseInt(vitals.sugar),
          type: vitals.sugarType || 'Random',
          date: dateStr,
          insulin: vitals.insulin ? parseFloat(vitals.insulin) : 0
        }));
      }

      // ---------------------------------------------------------
      // FIX: Store the current selected conditions in MongoDB
      // ---------------------------------------------------------
      // We map the selectedConditions array (['bp', 'diabetes']) 
      // to the boolean dictionary expected by the backend.
      const conditionUpdate = {
        diabetes: selectedConditions.includes('diabetes'),
        blood_pressure: selectedConditions.includes('bp'),
        heart_problem: selectedConditions.includes('heart')
      };

      // Update Health Records (for DoctorDashboard)
      promises.push(api.health.addProblems(conditionUpdate));

      // Update Profile (for PatientClinicalProfile view)
      promises.push(api.user.updateProfile({
        conditions: conditionUpdate
      }));
      // ---------------------------------------------------------

      // Save Weight to Profile if provided
      if (vitals.weight) {
        promises.push(api.user.updateProfile({
          weight: parseFloat(vitals.weight)
        }));
      }

      // We always save the daily update object locally
      // But for backend, we pushed individual records. 
      // Weight is separate? Usually weight goes with profile or separate endpoint, 
      // but here we just pass it to onUpdate for dashboard.

      if (promises.length > 0) {
        const responses = await Promise.all(promises);
        const failed = responses.find((r: any) => r.ok === false);
        if (failed) {
          alert((failed as any).msg);
          if ((failed as any).msg.includes('already updated')) {
            navigate('/patient/dashboard');
          }
          return;
        }
      }

      onUpdate(formData);
      navigate('/patient/dashboard');

    } catch (err) {
      console.error("Failed to save update", err);
      alert("Failed to save data. Please try again.");
    }
  };

  // --- Step Renders ---

  const renderRoutine = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" /> Daily Routine
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1 uppercase">
              <Moon className="w-3 h-3" /> Sleep Duration
            </label>
            <input
              type="number"
              className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-none outline-blue-500"
              placeholder="Hours"
              value={formData.routine.sleep}
              onChange={e => setFormData({ ...formData, routine: { ...formData.routine, sleep: e.target.value } })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1 uppercase">
              <GlassWater className="w-3 h-3" /> Water Intake
            </label>
            <input
              type="number"
              className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-none outline-blue-500"
              placeholder="Glasses"
              value={formData.routine.water}
              onChange={e => setFormData({ ...formData, routine: { ...formData.routine, water: e.target.value } })}
            />
          </div>
        </div>
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl">
          <div className="flex items-center gap-3">
            <Pill className="text-blue-600" />
            <span className="text-sm font-semibold text-blue-900">Taken all medicines today?</span>
          </div>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, routine: { ...prev.routine, medicineTaken: !prev.routine.medicineTaken } }))}
            className={`w-14 h-8 rounded-full p-1 transition-colors ${formData.routine.medicineTaken ? 'bg-emerald-500' : 'bg-slate-300'}`}
          >
            <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${formData.routine.medicineTaken ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderSymptoms = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
          <Thermometer className="w-5 h-5 text-amber-500" /> Are you feeling any symptoms?
        </h3>
        <div className="flex flex-wrap gap-2">
          {symptomsList.map(sym => (
            <button
              key={sym}
              type="button"
              onClick={() => toggleSymptom(sym)}
              className={`px-4 py-3 rounded-xl border text-sm transition-all flex items-center gap-2 ${formData.symptoms.includes(sym)
                ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold'
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
            >
              {formData.symptoms.includes(sym) && <CheckCircle2 className="w-3 h-3" />}
              {sym}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderWeight = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center space-y-6">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
          <Weight className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Current Weight</h3>
        <div className="relative max-w-xs mx-auto">
          <input
            type="number"
            step="0.1"
            className="w-full px-4 py-4 text-center text-3xl font-black bg-slate-50 rounded-2xl border-none outline-blue-500 text-slate-800"
            placeholder="0.0"
            value={formData.vitals.weight}
            onChange={e => setFormData({ ...formData, vitals: { ...formData.vitals, weight: e.target.value } })}
          />
          <span className="absolute right-8 top-6 text-sm font-bold text-slate-400">kg</span>
        </div>
      </div>
    </div>
  );

  const renderConditionSelector = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <h3 className="text-xl font-bold text-slate-900 text-center mb-6">What do you want to record today?</h3>
      <div className="grid grid-cols-1 gap-4">
        {[
          { id: 'bp', label: 'Blood Pressure', icon: Activity, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-200' },
          { id: 'diabetes', label: 'Diabetes / Sugar', icon: Droplet, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-200' },
          { id: 'heart', label: 'Heart Monitor', icon: Heart, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
        ].map(opt => (
          <button
            key={opt.id}
            type="button"
            onClick={() => toggleCondition(opt.id)}
            className={`p-6 rounded-3xl border-2 text-left flex items-center gap-4 transition-all ${selectedConditions.includes(opt.id)
              ? `${opt.bg} ${opt.border} shadow-sm ring-1 ring-offset-2 ring-blue-500`
              : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
          >
            <div className={`p-3 rounded-2xl bg-white shadow-sm ${opt.color}`}>
              <opt.icon className="w-6 h-6" />
            </div>
            <div className="flex-grow">
              <p className="font-bold text-slate-800">{opt.label}</p>
              <p className="text-xs text-slate-400 font-medium">Click to select</p>
            </div>
            {selectedConditions.includes(opt.id) && <CheckCircle2 className="w-6 h-6 text-blue-500" />}
          </button>
        ))}
      </div>
    </div>
  );

  const renderDataInputs = () => (
    <div className="space-y-8 animate-in slide-in-from-right duration-300">

      {/* BP & Heart Input Group */}
      {(selectedConditions.includes('bp') || selectedConditions.includes('heart')) && (
        <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-slate-800">Blood Pressure & Heart Rate</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Systolic</label>
              <div className="relative">
                <input type="number" className="w-full px-3 py-3 bg-slate-50 rounded-xl font-bold text-slate-800 outline-blue-500" placeholder="120"
                  value={formData.vitals.systolic} onChange={e => setFormData({ ...formData, vitals: { ...formData.vitals, systolic: e.target.value } })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Diastolic</label>
              <div className="relative">
                <input type="number" className="w-full px-3 py-3 bg-slate-50 rounded-xl font-bold text-slate-800 outline-blue-500" placeholder="80"
                  value={formData.vitals.diastolic} onChange={e => setFormData({ ...formData, vitals: { ...formData.vitals, diastolic: e.target.value } })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Pulse</label>
              <div className="relative">
                <input type="number" className="w-full px-3 py-3 bg-slate-50 rounded-xl font-bold text-slate-800 outline-blue-500" placeholder="72"
                  value={formData.vitals.pulse} onChange={e => setFormData({ ...formData, vitals: { ...formData.vitals, pulse: e.target.value } })} />
                <span className="absolute right-2 top-3 text-[10px] font-bold text-slate-400">bpm</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Diabetes Input Group */}
      {selectedConditions.includes('diabetes') && (
        <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Droplet className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-slate-800">Blood Glucose & Insulin</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Glucose</label>
              <div className="relative">
                <input type="number" className="w-full px-3 py-3 bg-slate-50 rounded-xl font-bold text-slate-800 outline-blue-500" placeholder="95"
                  value={formData.vitals.sugar} onChange={e => setFormData({ ...formData, vitals: { ...formData.vitals, sugar: e.target.value } })} />
                <span className="absolute right-3 top-3.5 text-xs text-slate-400">mg/dL</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">BloodPressure</label>
              <div className="relative">
                <input type="number" className="w-full px-3 py-3 bg-slate-50 rounded-xl font-bold text-slate-800 outline-blue-500" placeholder="80"
                  value={formData.vitals.diastolic} onChange={e => setFormData({ ...formData, vitals: { ...formData.vitals, diastolic: e.target.value } })} />
                <span className="absolute right-3 top-3.5 text-xs text-slate-400">mmHg</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Insulin</label>
              <div className="relative">
                <input type="number" step="0.1" className="w-full px-3 py-3 bg-slate-50 rounded-xl font-bold text-slate-800 outline-blue-500" placeholder="0"
                  value={formData.vitals.insulin} onChange={e => setFormData({ ...formData, vitals: { ...formData.vitals, insulin: e.target.value } })} />
                <span className="absolute right-3 top-3.5 text-xs text-slate-400">µU</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {selectedConditions.length === 0 && (
        <div className="text-center p-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <p className="text-slate-400 font-bold">No conditions selected to record.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-xl mx-auto py-4 min-h-screen flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full">
          <ChevronLeft className="w-6 h-6 text-slate-600" />
        </button>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${i <= step ? 'bg-blue-600' : 'bg-slate-200'}`} />
          ))}
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-grow">
        {step === 1 && renderRoutine()}
        {step === 2 && renderSymptoms()}
        {step === 3 && renderWeight()}
        {step === 4 && renderConditionSelector()}
        {step === 5 && renderDataInputs()}
      </div>

      <div className="mt-8">
        {step < 5 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all"
          >
            Next Step <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all"
          >
            Submit Update
          </button>
        )}
      </div>
    </div>
  );
};

export default DailyUpdateForm;
