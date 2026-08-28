import { useState, FormEvent } from 'react';
import { User, Lock, LogIn, AlertCircle, RefreshCw, Settings, Database, Check, Shield } from 'lucide-react';
import { AuthState } from '../types';
import { fetchLoginUsers } from '../lib/publicSheets';

interface LoginScreenProps {
  onLogin: (auth: AuthState) => void;
  spreadsheetId: string;
  loginSpreadsheetId?: string;
  appsScriptUrl?: string;
  onUpdateSpreadsheetIds?: (mainId: string, loginId: string, appsScriptUrl?: string) => void;
  onBack?: () => void;
}

export default function LoginScreen({ 
  onLogin, 
  spreadsheetId, 
  loginSpreadsheetId, 
  appsScriptUrl, 
  onUpdateSpreadsheetIds, 
  onBack 
}: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Config parameters
  const [showConfig, setShowConfig] = useState(false);
  const [tempMainId, setTempMainId] = useState(spreadsheetId);
  const [tempLoginId, setTempLoginId] = useState(loginSpreadsheetId || spreadsheetId);
  const [tempAppsScriptUrl, setTempAppsScriptUrl] = useState(appsScriptUrl || '');
  const [configSuccess, setConfigSuccess] = useState('');

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const trimmedUsername = username.trim();
      const trimmedPassword = password.trim();

      if (!trimmedUsername) {
        setError("Veuillez saisir votre Nom et Prénom.");
        setIsLoading(false);
        return;
      }

      if (!trimmedPassword || trimmedPassword.length !== 6) {
        setError("Le mot de passe doit être un code à 6 chiffres.");
        setIsLoading(false);
        return;
      }

      // Fetch users dynamically from Google Sheet 'Login' tab
      const targetLoginId = tempLoginId.trim() || loginSpreadsheetId || spreadsheetId;
      const fetchedUsers = await fetchLoginUsers(targetLoginId, appsScriptUrl);
      
      // Look for matching user
      const matchedUser = fetchedUsers.find(
        (u) => 
          (u.fullName.toLowerCase().trim() === trimmedUsername.toLowerCase() || 
           u.username.toLowerCase().trim() === trimmedUsername.toLowerCase()) && 
          u.password === trimmedPassword
      );

      if (!matchedUser) {
        setError("Identifiants non reconnus. Veuillez vérifier votre Nom et Prénom ainsi que votre code secret à 6 chiffres.");
        setIsLoading(false);
        return;
      }

      // Success login
      onLogin({
        isAuthenticated: true,
        user: matchedUser,
      });

    } catch (err: any) {
      console.error("Login error:", err);
      setError(
        "Impossible de contacter la base de données. Vérifiez votre connexion Internet et la disponibilité de la feuille 'Login'."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = (e: FormEvent) => {
    e.preventDefault();
    setConfigSuccess('');
    setError('');

    const mainId = tempMainId.trim();
    const loginId = tempLoginId.trim();
    const scriptUrl = tempAppsScriptUrl.trim();

    if (!mainId) {
      setError("L'ID du Google Sheet principal est obligatoire.");
      return;
    }

    localStorage.setItem('elec_stock_spreadsheet_id', mainId);
    localStorage.setItem('gis_login_db_id', loginId);
    localStorage.setItem('elec_stock_apps_script_url', scriptUrl);

    if (onUpdateSpreadsheetIds) {
      onUpdateSpreadsheetIds(mainId, loginId, scriptUrl);
    }

    setConfigSuccess("Configuration mise à jour avec succès !");
    setTimeout(() => {
      setConfigSuccess('');
      setShowConfig(false);
    }, 1800);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-100/90 relative select-none overflow-x-hidden font-sans">
      
      {/* Background Geo Matrix Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-70 pointer-events-none" />

      {/* Top Institutional Header Bar */}
      <header className="relative z-10 w-full bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-white p-0.5 border border-slate-200 shadow-xs flex items-center justify-center">
              <img 
                src="https://i.ibb.co/j9sKPQCP/Logo-PC.png" 
                alt="Logo Protection Civile" 
                className="h-full w-full object-contain" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="text-[10px] font-black tracking-widest text-[#C84B31] uppercase leading-none">
                Royaume du Maroc • Ministère de l'Intérieur
              </div>
              <div className="text-sm font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                Direction Générale de la Protection Civile
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl">
            <Shield className="h-4 w-4 text-[#C84B31]" />
            <span className="text-xs font-bold text-slate-700">Système SIG • Patrimoine RSK</span>
          </div>
        </div>
      </header>

      {/* Main Centered Login Card */}
      <main className="relative z-10 max-w-xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 md:py-16 flex-1 flex items-center justify-center">
        <div className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-7 sm:p-10 relative">
          
          {/* Settings button */}
          <button
            type="button"
            onClick={() => {
              setShowConfig(!showConfig);
              setConfigSuccess('');
            }}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
            title="Paramètres de synchronisation"
          >
            <Settings className={`h-5 w-5 ${showConfig ? 'rotate-90 text-[#C84B31]' : ''} transition-transform duration-300`} />
          </button>

          {showConfig ? (
            /* Configuration Form */
            <div className="animate-fadeIn">
              <div className="mb-6 text-center">
                <div className="inline-flex p-3 bg-red-50 text-[#C84B31] rounded-2xl mb-3">
                  <Database className="h-6 w-6" />
                </div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
                  Configuration des liaisons
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Gestion des sources de données Google Sheets
                </p>
              </div>

              {configSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 flex items-center">
                  <Check className="h-4 w-4 mr-2 text-emerald-600 shrink-0" />
                  <span>{configSuccess}</span>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-start">
                  <AlertCircle className="h-4 w-4 mr-2 text-red-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSaveConfig} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-600 mb-1 tracking-wider">
                    ID du Google Sheet Principal
                  </label>
                  <input
                    type="text"
                    required
                    value={tempMainId}
                    onChange={(e) => setTempMainId(e.target.value)}
                    className="block w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#C84B31] focus:outline-none"
                    placeholder="ID du fichier d'inventaire"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-600 mb-1 tracking-wider">
                    ID du Google Sheet de Login
                  </label>
                  <input
                    type="text"
                    value={tempLoginId}
                    onChange={(e) => setTempLoginId(e.target.value)}
                    className="block w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#C84B31] focus:outline-none"
                    placeholder="Optionnel (si séparé)"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-600 mb-1 tracking-wider">
                    URL de l'Apps Script de Synchronisation
                  </label>
                  <input
                    type="url"
                    value={tempAppsScriptUrl}
                    onChange={(e) => setTempAppsScriptUrl(e.target.value)}
                    className="block w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#C84B31] focus:outline-none"
                    placeholder="https://script.google.com/macros/s/.../exec"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowConfig(false);
                      setTempMainId(spreadsheetId);
                      setTempLoginId(loginSpreadsheetId || spreadsheetId);
                      setTempAppsScriptUrl(appsScriptUrl || '');
                    }}
                    className="flex-1 py-2.5 border border-slate-200 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#C84B31] hover:bg-[#B8422A] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-[#C84B31]/20"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Standard Login Form */
            <>
              <div className="text-center mb-6">
                <div className="mx-auto h-22 w-22 bg-white p-2.5 rounded-3xl border border-slate-200 shadow-md flex items-center justify-center mb-3.5">
                  <img 
                    src="https://i.ibb.co/j9sKPQCP/Logo-PC.png" 
                    alt="Logo DGPC" 
                    className="h-full w-full object-contain" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="text-[10px] font-extrabold text-[#C84B31] uppercase tracking-widest bg-red-50 px-3.5 py-1 rounded-full inline-block mb-2 border border-red-100">
                  Portail d'Accès Sécurisé
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  GIS-PATRIMOINE
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Direction Générale de la Protection Civile
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-700 flex items-start animate-fadeIn">
                  <AlertCircle className="h-4 w-4 mr-2.5 text-red-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleLoginSubmit}>
                {/* Nom et Prénom */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-700 mb-1.5 tracking-wider">
                    Nom et Prénom
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      disabled={isLoading}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full pl-10 pr-3.5 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#C84B31] focus:border-[#C84B31] text-sm font-semibold text-slate-900 bg-slate-50/70 disabled:opacity-50 focus:bg-white focus:outline-none"
                      placeholder="Ex: Mohamed El Amrani"
                    />
                  </div>
                </div>

                {/* Password 6 digits */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-700 mb-1.5 tracking-wider">
                    Code d'accès secret (6 chiffres)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      required
                      disabled={isLoading}
                      maxLength={6}
                      pattern="\d{6}"
                      value={password}
                      onChange={(e) => setPassword(e.target.value.replace(/\D/g, ''))}
                      className="block w-full pl-10 pr-3.5 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#C84B31] focus:border-[#C84B31] text-sm font-mono tracking-[0.25em] text-slate-900 bg-slate-50/70 disabled:opacity-50 focus:bg-white focus:outline-none"
                      placeholder="••••••"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-4 px-5 border border-transparent rounded-xl shadow-lg text-xs font-black uppercase tracking-wider text-white bg-[#C84B31] hover:bg-[#B8422A] transition-all items-center cursor-pointer shadow-[#C84B31]/25 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Vérification des droits...
                      </>
                    ) : (
                      <>
                        <LogIn className="h-4 w-4 mr-2" />
                        Ouvrir la session
                      </>
                    )}
                  </button>
                </div>

                {/* Quick login profiles helper */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-center mb-2">
                    Profils d'accès rapides par grade :
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setUsername('Colonel Ahmed Mansouri');
                        setPassword('123456');
                      }}
                      className="px-2 py-1.5 bg-slate-50 hover:bg-red-50 hover:text-[#C84B31] border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 text-center transition-all cursor-pointer truncate"
                      title="Colonel Ahmed Mansouri (Commandement Supérieur - 123456)"
                    >
                      👑 Colonel Mansouri
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUsername('Lieutenant-colonel Karim Alami');
                        setPassword('234567');
                      }}
                      className="px-2 py-1.5 bg-slate-50 hover:bg-red-50 hover:text-[#C84B31] border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 text-center transition-all cursor-pointer truncate"
                      title="Lieutenant-colonel Karim Alami (Lt. Colonel - 234567)"
                    >
                      🎖️ Lt. Colonel Alami
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUsername('Commandant Mohamed El Amrani');
                        setPassword('345678');
                      }}
                      className="px-2 py-1.5 bg-slate-50 hover:bg-red-50 hover:text-[#C84B31] border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 text-center transition-all cursor-pointer truncate"
                      title="Commandant Mohamed El Amrani (Commandant - 345678)"
                    >
                      ⭐ Cdt. El Amrani
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUsername('Capitaine Rachid Bennani');
                        setPassword('654321');
                      }}
                      className="px-2 py-1.5 bg-slate-50 hover:bg-red-50 hover:text-[#C84B31] border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 text-center transition-all cursor-pointer truncate"
                      title="Capitaine Rachid Bennani (Capitaine - 654321)"
                    >
                      🛡️ Cap. Bennani
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUsername('Adjudant-chef Tariq Drissi');
                        setPassword('112233');
                      }}
                      className="px-2 py-1.5 bg-slate-50 hover:bg-red-50 hover:text-[#C84B31] border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 text-center transition-all cursor-pointer truncate"
                      title="Adjudant-chef Tariq Drissi (Employé - 112233)"
                    >
                      👤 Adj-chef Drissi
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUsername('Sergent Youssef Chraibi');
                        setPassword('998877');
                      }}
                      className="px-2 py-1.5 bg-slate-50 hover:bg-red-50 hover:text-[#C84B31] border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 text-center transition-all cursor-pointer truncate"
                      title="Sergent Youssef Chraibi (Employé - 998877)"
                    >
                      👤 Sgt. Chraibi
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}

          {onBack && !isLoading && (
            <div className="pt-4 mt-5 border-t border-slate-100 flex justify-center">
              <button
                onClick={onBack}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center cursor-pointer"
              >
                Retour à l'accueil
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 border-t border-slate-200/80 bg-white/80 backdrop-blur-xs text-center text-[10px] text-slate-500 font-medium">
        Direction Générale de la Protection Civile — Service Gestion du Patrimoine RSK © {new Date().getFullYear()}
      </footer>

    </div>
  );
}
