import re

with open('src/components/VerificationTab.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update summaryRows calculation logic
summary_logic_start = content.find("const summaryRows: ComparisonSummaryRow[] = useMemo(() => {")
summary_logic_end = content.find("  }, [results, tolerance]);", summary_logic_start) + len("  }, [results, tolerance]);")

new_summary_logic = """const summaryRows: ComparisonSummaryRow[] = useMemo(() => {
    if (!results) return [];
    const list: ComparisonSummaryRow[] = [];
    const articles = results.articles || [];
    const tolStr = tolerance || '0%';
    const tolNum = parseFloat(tolStr.replace(/[^0-9.]/g, '')) || 0;
    const isStrict = tolStr === '0%' || tolStr === '±0%';

    articles.forEach((art: any, artIdx: number) => {
      const artNom = art.designation || `Fourniture N°${artIdx + 1}`;
      const caracs = art.caracteristiques || [];

      caracs.forEach((c: any, cIdx: number) => {
        const caracName = c.caracteristique || `Spécification ${cIdx + 1}`;
        const val1 = String(c.valeur_demandee || c.valeur_doc1 || '—');
        const val2 = String(c.valeur_proposee || c.valeur_doc2 || '—');
        const rawEcart = c.ecart || c.ecart_constate || '0';
        
        let isConf = true;
        let ecartDesc = rawEcart;
        let ecartTolDesc = '';

        // Try extracting numbers for smart comparison
        const num1Match = val1.match(/([+-]?\d+(?:\.\d+)?)/);
        const num2Match = val2.match(/([+-]?\d+(?:\.\d+)?)/);

        if (num1Match && num2Match) {
          const num1 = parseFloat(num1Match[1]);
          const num2 = parseFloat(num2Match[1]);
          
          const diff = Math.abs(num2 - num1);
          const allowedDiff = (num1 * tolNum) / 100;
          
          isConf = diff <= allowedDiff;
          
          const sign = num2 > num1 ? '+' : (num2 < num1 ? '-' : '');
          
          if (diff === 0) {
            ecartDesc = '0';
          } else {
             ecartDesc = `${sign}${diff.toFixed(2).replace(/\.?0+$/, '')}`;
          }
          
          if (isStrict) {
             ecartTolDesc = isConf ? 'Conforme' : `Tolérance 0% dépassée`;
          } else {
             ecartTolDesc = isConf ? `Conforme (Dans la marge ${tolStr})` : `Inconformité (> marge ${tolStr})`;
          }
          
        } else {
          // Textual fallback
          const clean1 = val1.toLowerCase().replace(/\s+/g, ' ').trim();
          const clean2 = val2.toLowerCase().replace(/\s+/g, ' ').trim();
          
          if (clean1 === clean2 || clean1 === '—') {
            isConf = true;
            ecartDesc = 'Identique';
            ecartTolDesc = 'Conforme';
          } else {
            if (isStrict) {
              isConf = false;
              ecartDesc = 'Différent';
              ecartTolDesc = 'Inconformité (Tolérance 0%)';
            } else {
               const isExplicitNonConf = c.criticite === 'non_conforme' || (c.resultat && c.resultat.toLowerCase().includes('non conforme'));
               isConf = !isExplicitNonConf;
               ecartDesc = rawEcart !== '—' ? rawEcart : 'Différent';
               ecartTolDesc = isExplicitNonConf ? 'Inconformité' : 'Conforme';
            }
          }
        }

        list.push({
          id: `row-${artIdx}-${cIdx}`,
          articleNom: artNom,
          caracteristique: caracName,
          designationComplete: `${artNom} — ${caracName}`,
          pageDoc1: c.page_doc1 || 'P.1',
          sectionDoc1: c.section_doc1 || '',
          ligneDoc1: c.ligne_doc1 || 'L.1',
          pageDoc2: c.page_doc2 || 'P.2',
          sectionDoc2: c.section_doc2 || '',
          ligneDoc2: c.ligne_doc2 || 'L.1',
          valeurDoc1: val1,
          valeurDoc2: val2,
          differenceConstatee: ecartDesc,
          toleranceAppliquee: tolStr,
          ecartParRapportTolerance: ecartTolDesc,
          statut: isConf ? 'Conforme' : 'Non conforme',
          isConforme: isConf,
          observation: c.observation || (isConf ? 'Spécification conforme' : 'Divergence')
        });
      });
    });

    return list;
  }, [results, tolerance]);"""

content = content[:summary_logic_start] + new_summary_logic + content[summary_logic_end:]

# 2. Update the UI rendering of the table.
# I'll replace everything from "{/* Filter and Search Bar for Articles */}" 
# up to the end of the results div.

ui_start = content.find("{/* Filter and Search Bar for Articles */}")
ui_end = content.find("              </div>\n            )}\n\n          </div>\n        )}\n\n        {/* ========================================================= */}\n        {/* SUB-TAB 2:")

if ui_start != -1 and ui_end != -1:
    new_ui = """{/* Single Master Table as requested */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-slate-200">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setFilterStatus('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        filterStatus === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Tous les critères ({filteredSummaryRows.length || 0})
                    </button>
                    <button
                      onClick={() => setFilterStatus('conforme')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        filterStatus === 'conforme' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      Conformes ({filteredSummaryRows.filter((r) => r.isConforme).length || 0})
                    </button>
                    <button
                      onClick={() => setFilterStatus('divergence')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        filterStatus === 'divergence' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      Inconformités ({filteredSummaryRows.filter((r) => !r.isConforme).length || 0})
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={summarySearch}
                      onChange={(e) => setSummarySearch(e.target.value)}
                      placeholder="Rechercher..."
                      className="w-full md:w-64 pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-purple-500"
                    />
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white mt-6 shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-black">
                        <th className="p-4 border-r border-slate-800 w-1/4">Nom de l'article</th>
                        <th className="p-4 border-r border-slate-800">Spécifications du Doc 1</th>
                        <th className="p-4 border-r border-slate-800">Spécifications Doc 2</th>
                        <th className="p-4 border-r border-slate-800 text-center">L'écart</th>
                        <th className="p-4 text-center">Conforme ou non</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs font-medium">
                      {filteredSummaryRows.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-12 text-center text-slate-400 font-bold">
                            Aucun élément ne correspond à votre recherche.
                          </td>
                        </tr>
                      ) : (
                        filteredSummaryRows.map((row, idx) => {
                          const isConf = row.isConforme;
                          return (
                            <tr key={idx} className={`transition-colors ${!isConf ? 'bg-red-50/30 hover:bg-red-50/60' : 'hover:bg-slate-50'}`}>
                              <td className="p-4 border-r border-slate-200 align-top">
                                <div className="font-black text-slate-900 text-sm mb-1">{row.articleNom}</div>
                                <div className="text-slate-600 font-semibold">{row.caracteristique}</div>
                              </td>
                              <td className="p-4 border-r border-slate-200 align-top">
                                <div className="font-mono text-slate-800 bg-slate-100 px-2 py-1.5 rounded-lg inline-block border border-slate-200">
                                  {row.valeurDoc1}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-2 font-bold uppercase">
                                  Doc 1 : {row.pageDoc1}, {row.ligneDoc1}
                                </div>
                              </td>
                              <td className="p-4 border-r border-slate-200 align-top">
                                <div className={`font-mono px-2 py-1.5 rounded-lg inline-block border ${isConf ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-red-50 text-red-900 border-red-200'}`}>
                                  {row.valeurDoc2}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-2 font-bold uppercase">
                                  Doc 2 : {row.pageDoc2}, {row.ligneDoc2}
                                </div>
                              </td>
                              <td className="p-4 border-r border-slate-200 align-top text-center">
                                <div className="font-mono font-bold text-slate-800">{row.differenceConstatee}</div>
                                <div className="text-[10px] text-slate-500 mt-1">{row.toleranceAppliquee !== '0%' ? `Marge : ${row.toleranceAppliquee}` : 'Marge : 0%'}</div>
                              </td>
                              <td className="p-4 align-top text-center">
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider ${
                                  isConf ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {isConf ? <Check className="h-4 w-4 mr-1.5" /> : <X className="h-4 w-4 mr-1.5" />}
                                  {isConf ? 'Conforme' : 'Inconformité'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
"""
    content = content[:ui_start] + new_ui + content[ui_end:]

# Also remove the 7-column table that's earlier in the UI, if present.
# It seems there's a `<div className="mt-8 pt-8 border-t border-slate-200">` 
# which wraps "TABLEAU RÉCAPITULATIF GLOBAL (7 COLONNES)"
# Let's see if we can find it and remove it.
seven_col_start = content.find("{/* ========================================================= */}")
if seven_col_start != -1:
    seven_col_end = content.find("{/* Filter and Search Bar for Articles */}")
    if seven_col_end != -1 and seven_col_end > seven_col_start:
        content = content[:seven_col_start] + content[seven_col_end:]

with open('src/components/VerificationTab.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied.")
