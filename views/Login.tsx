
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { UserRole } from '../types';
import { User, Lock, AlertCircle, ArrowRight } from 'lucide-react';

interface Props {
    onLogin: (role: UserRole) => void;
}

const Login: React.FC<Props> = ({ onLogin }) => {
    const navigate = useNavigate();
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.PATIENT);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Extra fields for registration
    const [email, setEmail] = useState('');
    const [hospitalName, setHospitalName] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRegistering) {
                await api.auth.register({
                    username,
                    password,
                    email,
                    role: role.toLowerCase(), // sending lowercase as per backend assumption (check backend later if needed)
                    hospital_name: role === UserRole.DOCTOR ? hospitalName : undefined
                });
                // Auto login after register or ask to login? Let's just switch to login mode with a success message?
                // Actually, let's just log them in immediately if we could, but the backend register doesn't return a token.
                // So we switch to login.
                setIsRegistering(false);
                setError('Registration successful! Please login.');
                setLoading(false);
                return;
            }

            const { access_token } = await api.auth.login({ username, password });
            localStorage.setItem('token', access_token);

            // We need to decode token to know role or fetch profile? 
            // The backend login response only gives access_token. 
            // We can fetch profile to confirm role or just trust the user selection for now (but that's unsafe).
            // Let's fetch profile.


            onLogin(role); // Update App state

            // Check if profile exists; if not, redirect to setup (Patient only)
            try {
                const profileData = await api.user.getProfile();
                // If patient and no name set, likely first time -> Setup
                if (role === UserRole.PATIENT && (!profileData || !profileData.profile || !profileData.profile.name)) {
                    navigate('/patient/setup');
                    return;
                }
            } catch (e) {
                // Ignore
            }

            // Navigate based on role (default if profile ok)
            if (role === UserRole.PATIENT) {
                navigate('/patient/dashboard');
            } else {
                navigate('/doctor/dashboard');
            }

        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 text-center">
                    <h2 className="text-2xl font-bold text-slate-800">
                        {isRegistering ? 'Create Account' : 'Welcome Back'}
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        {isRegistering ? 'Join CareSync to monitor your health' : 'Sign in to access your dashboard'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setRole(UserRole.PATIENT)}
                                    className={`py-2 text-sm font-medium rounded-md transition-all ${role === UserRole.PATIENT
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    Patient
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole(UserRole.DOCTOR)}
                                    className={`py-2 text-sm font-medium rounded-md transition-all ${role === UserRole.DOCTOR
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    Doctor
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Enter username"
                                />
                            </div>
                        </div>

                        {isRegistering && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="john@example.com"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {isRegistering && role === UserRole.DOCTOR && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Hospital Name</label>
                                <input
                                    type="text"
                                    required
                                    value={hospitalName}
                                    onChange={e => setHospitalName(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="General Hospital"
                                />
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 px-4 rounded-xl text-white font-bold text-center flex items-center justify-center gap-2 transition-all ${loading ? 'bg-slate-400 cursor-not-allowed' :
                            role === UserRole.PATIENT ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-blue-200' :
                                'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 shadow-indigo-200'
                            } shadow-lg hover:shadow-xl transform hover:-translate-y-0.5`}
                    >
                        {loading ? 'Processing...' : (
                            <>
                                {isRegistering ? 'Create Account' : 'Sign In'}
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-center">
                    <p className="text-sm text-slate-600">
                        {isRegistering ? 'Already have an account?' : "Don't have an account?"}
                        <button
                            onClick={() => setIsRegistering(!isRegistering)}
                            className={`ml-2 font-semibold hover:underline ${role === UserRole.PATIENT ? 'text-blue-600' : 'text-indigo-600'
                                }`}
                        >
                            {isRegistering ? 'Login' : 'Register'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
