const fs = require('fs');
let code = fs.readFileSync('src/components/EquipmentModal.tsx', 'utf8');

const targetStr = `          {/* Form Content - Scrollable */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              
            {/* Row 1: ID & Code-Barres */}`;

const replaceStr = `          {/* Form Content - Scrollable */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              
            {/* AI Assistant Section */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                  <span className="text-xl">✨</span> Assistant IA : Génération de Fiche Technique
                </h3>
                <p className="text-xs text-indigo-700 mt-1">
                  Importez un document (PDF, Image, TXT) pour pré-remplir automatiquement les informations de l'article.
                </p>
                {errors.ai && <p className="text-xs text-red-600 mt-2 font-bold">{errors.ai}</p>}
              </div>
              <div className="shrink-0 relative">
                <input 
                  type="file" 
                  accept="image/*,.pdf,.txt,.doc,.docx"
                  onChange={handleFileUploadForAI}
                  disabled={isAIGenerating}
                  className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer disabled:cursor-not-allowed"
                />
                <button 
                  type="button" 
                  disabled={isAIGenerating}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-70"
                >
                  {isAIGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Analyse en cours...
                    </>
                  ) : (
                    <>Importer un document</>
                  )}
                </button>
              </div>
            </div>

            {/* Row 1: ID & Code-Barres */}`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/components/EquipmentModal.tsx', code);
