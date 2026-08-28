import { ShieldCheck, Database, ArrowRight, Shield, MapPin, Lock, Barcode, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

interface WelcomeScreenProps {
  onNext: () => void;
  onConnexion: () => void;
}

export default function WelcomeScreen({ onNext, onConnexion }: WelcomeScreenProps) {
  const currentDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-900 text-slate-100 relative select-none overflow-x-hidden font-sans">
      
      {/* Rich Institutional Background: Micro-grid + Deep Gradient + Moroccan Lattice Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,#0f172a,#1e293b_50%,#0f172a)] opacity-95" />
      
      {/* Subtle Ambient Radial Glows */}
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Micro-dot grid overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Watermark Moroccan Geometric Star */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none">
        <svg viewBox="0 0 100 100" className="w-[700px] h-[700px] text-white stroke-current fill-none stroke-[0.5]">
          <polygon points="50,0 61,39 100,50 61,61 50,100 39,61 0,50 39,39" />
          <polygon points="15,15 50,29 85,15 71,50 85,85 50,71 15,85 29,50" />
          <circle cx="50" cy="50" r="48" />
          <circle cx="50" cy="50" r="35" />
        </svg>
      </div>

      {/* Top Institutional Header Bar */}
      <header className="relative z-10 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-11 w-11 rounded-xl bg-white p-1 border border-slate-700 shadow-xs flex items-center justify-center">
              <img 
                src="https://i.ibb.co/j9sKPQCP/Logo-PC.png" 
                alt="Logo Protection Civile" 
                className="h-full w-full object-contain" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="text-[10px] font-black tracking-widest text-amber-400 uppercase leading-none">
                Royaume du Maroc • Ministère de l'Intérieur
              </div>
              <div className="text-sm font-black text-white tracking-tight leading-tight mt-0.5">
                Direction Générale de la Protection Civile
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-2 bg-slate-800 border border-slate-700 px-3.5 py-1.5 rounded-xl">
            <Shield className="h-4 w-4 text-[#C84B31]" />
            <span className="text-xs font-bold text-slate-200">SIG Patrimoine & Logistique</span>
          </div>
        </div>
      </header>

      {/* Main Centered Institutional Presentation */}
      <main className="relative z-10 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 md:py-16 flex-1 flex items-center justify-center">
        <div className="w-full max-w-xl bg-slate-800/90 backdrop-blur-md rounded-3xl border border-slate-700 shadow-2xl p-8 sm:p-10 relative">
          
          {/* Emblem & Title */}
          <div className="text-center mb-8">
            <div className="mx-auto h-24 w-24 bg-white p-2.5 rounded-3xl border border-amber-500/80 shadow-lg shadow-amber-500/20 flex items-center justify-center mb-4">
              <img 
                src="https://i.ibb.co/j9sKPQCP/Logo-PC.png" 
                alt="Logo Protection Civile" 
                className="h-full w-full object-contain filter drop-shadow-xs" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="inline-flex items-center space-x-2 bg-red-950/80 text-red-300 border border-red-700/60 text-[10px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full mb-2 shadow-2xs">
              <span>Système National SIG</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
              GIS-DGPC
            </h1>
            <p className="text-sm text-slate-400 font-bold mt-1.5">
              Gestion Intelligente du Patrimoine et des Stocks
            </p>
          </div>

          {/* Calendar Widget & Regional Territory Details */}
          <div className="space-y-3 mb-8">
            {/* Discreet Date Badge */}
            <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-red-950/80 text-red-400 rounded-xl border border-red-800/50">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                    Date du Système
                  </div>
                  <div className="text-xs font-black text-white capitalize">
                    {currentDate}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-extrabold bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 px-2.5 py-0.5 rounded-lg">
                ● En Ligne
              </span>
            </div>

            {/* Territory */}
            <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-amber-950/80 text-amber-400 rounded-xl border border-amber-800/50">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                    Territoire d'Affectation
                  </div>
                  <div className="text-xs font-black text-amber-200">
                    Région Rabat-Salé-Kénitra & Magasins Centraux
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60">
                <div className="text-[10px] font-bold text-amber-400 uppercase">Magasins</div>
                <div className="text-xs font-extrabold text-slate-200 mt-0.5">Kénitra & DGPC Siège</div>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60">
                <div className="text-[10px] font-bold text-red-400 uppercase">Dépôt Central</div>
                <div className="text-xs font-extrabold text-slate-200 mt-0.5">Sidi Allal Bahraoui</div>
              </div>
            </div>
          </div>

          {/* Key Capabilities Badges */}
          <div className="grid grid-cols-3 gap-2 mb-8 text-center">
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60">
              <ShieldCheck className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
              <span className="text-[11px] font-extrabold text-slate-300 block">Contrôle RBAC</span>
            </div>
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60">
              <Database className="h-4 w-4 text-amber-400 mx-auto mb-1" />
              <span className="text-[11px] font-extrabold text-slate-300 block">Multi-Bases</span>
            </div>
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60">
              <Barcode className="h-4 w-4 text-red-400 mx-auto mb-1" />
              <span className="text-[11px] font-extrabold text-slate-300 block">Code-barres</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={onNext}
              className="w-full flex justify-center items-center py-4 px-6 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-[#C84B31] hover:bg-[#B8422A] transition-all cursor-pointer shadow-xl shadow-red-950/40 hover:shadow-2xl"
            >
              <span>Entrer dans l'application</span>
              <ArrowRight className="ml-2 h-4 w-4 text-white" />
            </button>

            <button
              onClick={onConnexion}
              className="w-full flex justify-center items-center text-xs font-extrabold text-slate-300 hover:text-white uppercase tracking-wider py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 transition-colors border border-slate-700 cursor-pointer"
            >
              <Lock className="h-3.5 w-3.5 mr-2 text-slate-400" />
              Accès Direct Authentification
            </button>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 border-t border-slate-800 bg-slate-900/80 backdrop-blur-xs text-center text-[10px] text-slate-500 font-medium">
        Direction Générale de la Protection Civile — Service Gestion du Patrimoine RSK © {new Date().getFullYear()}
      </footer>

    </div>
  );
}
