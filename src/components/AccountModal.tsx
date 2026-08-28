import { useState, FormEvent } from 'react';
import { User as UserIcon, Shield, Key, X, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { User as UserType, AuthState } from '../types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  auth: AuthState;
}

export default function AccountModal({ isOpen, onClose, auth }: AccountModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen || !auth.user) return null;

  const user = auth.user;
  const isAdmin = user.role === 'Administrateur';

  const handlePasswordChange = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (currentPassword !== user.password) {
      setError('Mot de passe actuel incorrect.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }

    if (newPassword.length < 3) {
      setError('Le nouveau mot de passe est trop court.');
      return;
    }

    // In a real app, this would make an API call to change the password.
    // Here we will just simulate success. (The password change won't persist across hard reloads for the mock user, but it's enough for the prototype).
    setSuccess('Mot de passe mis à jour avec succès.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm sm:p-0">
      <div 
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200/50 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-black text-slate-900 flex items-center">
            <UserIcon className="h-6 w-6 mr-3 text-indigo-600" />
            Mon Compte
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 md:p-6 overflow-y-auto custom-scrollbar space-y-6">
          
          <div className="flex items-center space-x-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className={`h-14 w-14 rounded-full flex items-center justify-center shrink-0 ${isAdmin ? 'bg-red-100' : 'bg-indigo-100'}`}>
              {isAdmin ? (
                <Shield className="h-7 w-7 text-red-600" />
              ) : (
                <UserIcon className="h-7 w-7 text-indigo-600" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">{user.fullName}</h3>
              <p className="text-sm font-medium text-slate-500 mt-0.5">@{user.username}</p>
            </div>
            <div className="ml-auto">
              <span className={`px-2.5 py-1 text-xs font-black uppercase tracking-wider rounded-lg ${user.role === 'Administrateur' ? 'bg-red-100 text-red-700' : user.role === 'Direction' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                {user.role === 'Direction' ? 'Directeur' : user.role === 'Administrateur' ? `Chef de service ${user.service?.replace('&', 'et')}` : `Employé ${user.service?.replace('&', 'et')}`}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 flex items-center border-b border-slate-100 pb-2">
              <Key className="h-4 w-4 mr-2 text-slate-400" />
              Modifier le mot de passe
            </h4>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-600 font-medium flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                {success}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mot de passe actuel
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Confirmer le mot de passe
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
