const fs = require('fs');
let code = fs.readFileSync('src/components/EquipmentModal.tsx', 'utf8');

const targetStr = `            {/* Footer buttons */}`;

const replaceStr = `            {/* AI Generated Extra Columns */}
            {Object.keys(extraColumns).length > 0 && (
              <div className="bg-slate-50 border-2 border-slate-100 rounded-xl p-4 mt-6">
                <h4 className="text-xs font-black text-slate-800 uppercase mb-3 flex items-center gap-2">
                  <span className="text-indigo-600">⚡</span> Informations Techniques (IA)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(extraColumns).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        {key}
                      </label>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setExtraColumns({ ...extraColumns, [key]: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer buttons */}`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/components/EquipmentModal.tsx', code);
