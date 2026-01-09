
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User, Save, Building2, Stethoscope, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserProfile: React.FC = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const data = await api.user.getProfile();
                if (data) {
                    // Merge the top-level uid with the nested profile data
                    setProfile({ ...(data.profile || {}), uid: data.uid });
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.user.updateProfile(profile);
            setMsg('Profile updated!');
            setTimeout(() => setMsg(''), 3000);
        } catch (e) {
            setMsg('Failed to update.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
                            <User className="w-6 h-6" />
                        </div>
                        Edit Profile
                    </h2>
                    {msg && <span className="text-sm font-bold text-emerald-600 animate-pulse">{msg}</span>}
                </div>

                <div className="bg-slate-100 p-4 rounded-xl mb-6 text-center border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase">Your Unique ID</p>
                    <p className="text-lg font-mono font-black text-slate-800 tracking-wider select-all">{profile.uid || 'Loading...'}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Share this with your doctor/patient to link accounts.</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                        <input
                            value={profile.name || ''}
                            onChange={e => setProfile({ ...profile, name: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="John Doe"
                        />
                    </div>

                    {/* Common fields (Age, Gender) - keeping generic or can detect role */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Age</label>
                            <input
                                type="number"
                                value={profile.age || ''}
                                onChange={e => setProfile({ ...profile, age: parseInt(e.target.value) })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Gender</label>
                            <select
                                value={profile.gender || ''}
                                onChange={e => setProfile({ ...profile, gender: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full mt-8 bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    {saving ? 'Saving...' : <><Save className="w-5 h-5" /> Save Changes</>}
                </button>
            </div>
        </div>
    );
};

export default UserProfile;
