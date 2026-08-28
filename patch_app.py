import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
if 'DatabasesTab' not in content:
    content = content.replace(
        "import SettingsTab from './components/SettingsTab';",
        "import SettingsTab from './components/SettingsTab';\nimport DatabasesTab from './components/DatabasesTab';"
    )
    if 'import DatabasesTab' not in content:
        # Just put it after Sidebar
        content = content.replace(
            "import Sidebar from './components/Sidebar';",
            "import Sidebar from './components/Sidebar';\nimport DatabasesTab from './components/DatabasesTab';"
        )

# Add state
state_code = """
  const [importHistory, setImportHistory] = useState<DatabaseImport[]>(() => {
    const activeDb = localStorage.getItem('gis_dgpc_selected_db');
    if (activeDb) {
      const saved = localStorage.getItem(`database_${activeDb}_imports`);
      if (saved) return JSON.parse(saved);
    }
    return [];
  });
"""

if 'setImportHistory' not in content:
    content = content.replace(
        "const [tableSearch, setTableSearch] = useState('');",
        "const [tableSearch, setTableSearch] = useState('');\n" + state_code
    )
    # also add it to dependencies if needed, or simply let it be.

# Add the render code
render_code = """
        {activeTab === 'settings' && (
          <SettingsTab
            user={auth.user!}
            onLogout={() => {
              setAuth({ isAuthenticated: false, user: null });
              localStorage.removeItem('elec_stock_auth');
            }}
          />
        )}
        
        {activeTab === 'databases' && (
          <DatabasesTab
            importHistory={importHistory}
            onImport={(newItems, fileInfo) => {
              const activeDb = localStorage.getItem('gis_dgpc_selected_db');
              const newImport: DatabaseImport = {
                id: `import-${Date.now()}`,
                fileName: fileInfo.fileName,
                importDate: new Date().toLocaleString('fr-FR'),
                recordCount: fileInfo.recordCount,
                status: fileInfo.status
              };
              
              const newHistory = [newImport, ...importHistory];
              setImportHistory(newHistory);
              if (activeDb) {
                localStorage.setItem(`database_${activeDb}_imports`, JSON.stringify(newHistory));
              }

              // Append to equipments (global list)
              const updatedEquipments = [...localOverrides, ...newItems];
              setLocalOverrides(updatedEquipments);
              if (activeDb) {
                localStorage.setItem(`database_${activeDb}_equipments`, JSON.stringify(updatedEquipments));
              }
              
              // Also add to HistoryLog for traceability
              const historyLog = {
                id: `M-IMPORT-${Date.now()}`,
                date: new Date().toLocaleString('fr-FR', { hour12: false }),
                type: 'Création' as const,
                equipmentId: 'N/A',
                equipmentNom: `Import: ${fileInfo.fileName}`,
                quantite: fileInfo.recordCount,
                employe: auth.user?.fullName || 'Utilisateur',
                employeUsername: auth.user?.username || 'user',
                service: 'Patrimoine',
                notes: `Ajout automatique à la base globale (${fileInfo.recordCount} articles).`
              };
              setHistoryLogs(prev => [historyLog, ...prev]);
            }}
          />
        )}
"""

if "activeTab === 'databases'" not in content:
    content = content.replace(
        "{activeTab === 'settings' && (\n          <SettingsTab",
        render_code.split("{activeTab === 'settings' && (\n          <SettingsTab")[0] + "{activeTab === 'settings' && (\n          <SettingsTab"
    )

    # Wait, my replace might fail. Let's do it safer.
    content = re.sub(
        r"\{\s*activeTab\s*===\s*'settings'\s*&&\s*\(\s*<SettingsTab[\s\S]*?/>\s*\)\s*\}",
        lambda m: m.group(0) + "\n\n        {activeTab === 'databases' && (\n          <DatabasesTab\n            importHistory={importHistory}\n            onImport={(newItems, fileInfo) => {\n              const activeDb = localStorage.getItem('gis_dgpc_selected_db');\n              const newImport = {\n                id: `import-${Date.now()}`,\n                fileName: fileInfo.fileName,\n                importDate: new Date().toLocaleString('fr-FR'),\n                recordCount: fileInfo.recordCount,\n                status: fileInfo.status\n              };\n              const newHistory = [newImport, ...importHistory];\n              setImportHistory(newHistory);\n              if (activeDb) {\n                localStorage.setItem(`database_${activeDb}_imports`, JSON.stringify(newHistory));\n              }\n              const updatedEquipments = [...localOverrides, ...newItems];\n              setLocalOverrides(updatedEquipments);\n              if (activeDb) {\n                localStorage.setItem(`database_${activeDb}_equipments`, JSON.stringify(updatedEquipments));\n              }\n              const historyLog = {\n                id: `M-IMPORT-${Date.now()}`,\n                date: new Date().toLocaleString('fr-FR', { hour12: false }),\n                type: 'Création',\n                equipmentId: 'N/A',\n                equipmentNom: `Import: ${fileInfo.fileName}`,\n                quantite: fileInfo.recordCount,\n                employe: auth.user?.fullName || 'Utilisateur',\n                employeUsername: auth.user?.username || 'user',\n                service: 'Patrimoine',\n                notes: `Ajout automatique à la base globale (${fileInfo.recordCount} articles).`\n              };\n              setHistoryLogs(prev => [historyLog, ...prev]);\n            }}\n          />\n        )}\n",
        content
    )

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("App patched.")
