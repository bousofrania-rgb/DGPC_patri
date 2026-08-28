import re

with open('src/components/DatabaseSelectionScreen.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the handleFinalizeImport block
pattern = r"const handleFinalizeImport = async \(\) => \{.*?(?=  // ----------------------------------------------------)"
match = re.search(pattern, content, re.DOTALL)

if not match:
    print("Could not find handleFinalizeImport")
else:
    old_code = match.group(0)
    
    new_code = """const handleFinalizeImport = async () => {
    if (!selectedSite || selectedSheetIndices.length === 0) return;

    const chosenYear = importYear.trim() || new Date().getFullYear().toString();
    const finalName = importDbName.trim() || `Patrimoine ${chosenYear}`;
    const timestamp = Date.now();
    
    // Check if a database already exists for this site and year
    let targetDb = databases.find(db => db.siteId === selectedSite.id && db.year === chosenYear && db.service === 'Patrimoine');
    let isNewDb = false;

    if (!targetDb) {
      targetDb = {
        id: `site_${selectedSite.id}_patrimoine_${chosenYear}_${timestamp}`,
        name: finalName,
        description: `Base de données globale pour l'année ${chosenYear} au ${selectedSite.name}.`,
        createdAt: new Date().toLocaleDateString('fr-FR'),
        lastModified: new Date().toLocaleDateString('fr-FR'),
        itemCount: 0,
        region: 'Rabat-Salé-Kénitra',
        year: chosenYear,
        service: 'Patrimoine',
        volet: selectedSite.volet,
        siteId: selectedSite.id,
        siteName: selectedSite.name
      };
      isNewDb = true;
    }

    // Load existing equipments if any
    const existingEquipmentsRaw = localStorage.getItem(`database_${targetDb.id}_equipments`);
    const existingEquipments: any[] = existingEquipmentsRaw ? JSON.parse(existingEquipmentsRaw) : [];
    
    const existingHistoryRaw = localStorage.getItem(`database_${targetDb.id}_history`);
    const existingHistory: any[] = existingHistoryRaw ? JSON.parse(existingHistoryRaw) : [];

    let allNewEquipments: any[] = [];
    let totalNewQuantite = 0;

    for (const idx of selectedSheetIndices) {
      const pSheet = parsedSheets[idx];
      if (!pSheet) continue;
      
      allNewEquipments = [...allNewEquipments, ...pSheet.equipments];
      totalNewQuantite += pSheet.equipments.reduce((sum: number, e: any) => sum + (e.quantite || 0), 0);
    }

    // Merge and deduplicate if necessary, or simply append (as per 'add without replacing')
    const updatedEquipments = [...existingEquipments, ...allNewEquipments];
    targetDb.itemCount = updatedEquipments.length;
    targetDb.lastModified = new Date().toLocaleDateString('fr-FR');

    const newHistoryEvent = {
      id: `M-IMPORT-${timestamp}`,
      date: new Date().toLocaleString('fr-FR', { hour12: false }),
      type: 'Création',
      equipmentId: 'N/A',
      equipmentNom: `Import de fichiers Excel (${allNewEquipments.length} articles)`,
      quantite: totalNewQuantite,
      employe: user.fullName,
      employeUsername: user.username,
      service: 'Patrimoine',
      notes: `Fusion automatique: Ajout de ${allNewEquipments.length} articles à la base de données globale.`
    };
    const updatedHistory = [newHistoryEvent, ...existingHistory];

    // Save to local storage
    localStorage.setItem(`database_${targetDb.id}_equipments`, JSON.stringify(updatedEquipments));
    localStorage.setItem(`database_${targetDb.id}_history`, JSON.stringify(updatedHistory));

    // Update databases state
    let updatedDatabases = [...databases];
    if (isNewDb) {
      updatedDatabases.push(targetDb);
    } else {
      updatedDatabases = updatedDatabases.map(db => db.id === targetDb!.id ? targetDb! : db);
    }
    setDatabases(updatedDatabases);

    // Sync creation with Google Sheets if configured (skipped for now for brevity, or kept minimal)
    const appsScriptUrl = localStorage.getItem('elec_stock_apps_script_url');
    if (appsScriptUrl) {
      try {
        await fetch('/api/sync-sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appsScriptUrl,
            payload: {
              action: isNewDb ? 'createDatabase' : 'updateDatabase',
              sheetName: targetDb.name,
              equipments: updatedEquipments
            }
          })
        });
      } catch (err) {
        console.error("Erreur de synchronisation Google Sheets:", err);
      }
    }

    // Reset import modal
    setExcelFile(null);
    setParsedSheets([]);
    setParseSuccess(null);
    setParseError(null);
    setImportDbName('');
    setShowImportModal(false);
  };
"""
    content = content.replace(old_code, new_code)
    with open('src/components/DatabaseSelectionScreen.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("DatabaseSelectionScreen patched successfully.")
