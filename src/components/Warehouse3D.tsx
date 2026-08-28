import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Box, 
  MapPin, 
  Layers, 
  RotateCw, 
  Info, 
  AlertTriangle, 
  Search, 
  Plus, 
  Minus, 
  Package, 
  ExternalLink,
  Sliders,
  Grid,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Warehouse,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Truck,
  ArrowRight,
  Barcode,
  Tag,
  Radio,
  FileText,
  Activity
} from 'lucide-react';
import { Equipment, User } from '../types';

interface Warehouse3DProps {
  user: User;
  equipments: Equipment[];
  onUpdateEquipment: (updated: Equipment) => void;
  onSync: (action: 'update', item: Equipment) => void;
  onNavigateTab?: (tab: string) => void;
}

interface WarehouseZoneDef {
  id: string;
  code: string;
  name: string;
  category: string;
  color: string;
  bgRgba: string;
  borderColor: string;
  gridArea: string;
  racks: string[];
  dimensions: string;
  description: string;
}

// 1 000 m² Warehouse Zones (50m x 20m)
const WAREHOUSE_1000M2_ZONES: WarehouseZoneDef[] = [
  {
    id: 'zone_nord',
    code: 'Zone Nord',
    name: 'Zone Nord - Tentes & Secours d\'Urgence',
    category: 'Secours',
    color: '#10B981',
    bgRgba: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.6)',
    gridArea: 'nord',
    racks: ['N-01', 'N-02', 'N-03', 'N-04', 'N-05', 'N-06'],
    dimensions: '20m × 8m (160 m²)',
    description: 'Tentes de secours, bâches, lits de camp et matériels de premier abri d\'urgence.'
  },
  {
    id: 'zone_sud',
    code: 'Zone Sud',
    name: 'Zone Sud - Générateurs & Énergie',
    category: 'Énergie',
    color: '#F59E0B',
    bgRgba: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.6)',
    gridArea: 'sud',
    racks: ['S-01', 'S-02', 'S-03', 'S-04', 'S-05', 'S-06'],
    dimensions: '20m × 8m (160 m²)',
    description: 'Groupes électrogènes mobiles, projecteurs de zone autonome, tourets et câbles électriques.'
  },
  {
    id: 'zone_est',
    code: 'Zone Est',
    name: 'Zone Est - Médical & Assistance Vitale',
    category: 'Médical',
    color: '#EF4444',
    bgRgba: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.6)',
    gridArea: 'est',
    racks: ['E-01', 'E-02', 'E-03', 'E-04'],
    dimensions: '15m × 8m (120 m²)',
    description: 'Défibrillateurs (DSA), sacs d\'intervention médicale, civières, respirateurs de transport.'
  },
  {
    id: 'zone_ouest',
    code: 'Zone Ouest',
    name: 'Zone Ouest - Télécoms & Réseau de Crise',
    category: 'Télécom',
    color: '#3B82F6',
    bgRgba: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.6)',
    gridArea: 'ouest',
    racks: ['W-01', 'W-02', 'W-03', 'W-04'],
    dimensions: '15m × 8m (120 m²)',
    description: 'Postes radio VHF/UHF, baies de communication d\'urgence, valises satellites.'
  },
  {
    id: 'zone_quai',
    code: 'Zone Quai',
    name: 'Zone Quai & Réception / Expédition',
    category: 'Transit',
    color: '#64748B',
    bgRgba: 'rgba(100, 116, 139, 0.15)',
    borderColor: 'rgba(100, 116, 139, 0.6)',
    gridArea: 'quai',
    racks: ['Q-01', 'Q-02', 'Q-03', 'Q-04'],
    dimensions: '20m × 10m (200 m²)',
    description: 'Quais de déchargement niveleurs avec portes sectionnelles, zone de contrôle et transit.'
  }
];

export default function Warehouse3D({
  user,
  equipments,
  onUpdateEquipment,
  onSync,
  onNavigateTab
}: Warehouse3DProps) {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>('zone_nord');
  const [selectedItem, setSelectedItem] = useState<Equipment | null>(null);
  const [rotationX, setRotationX] = useState<number>(32);
  const [rotationY, setRotationY] = useState<number>(-22);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [viewPreset, setViewPreset] = useState<'3d-iso' | '2d-plan' | 'allee' | 'nord' | 'sud' | 'quai'>('3d-iso');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAlertOnly, setFilterAlertOnly] = useState(false);
  const [colorMode, setColorMode] = useState<'category' | 'status'>('category');

  // Drag rotation interaction on 3D canvas
  const isDraggingRef = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || viewPreset === '2d-plan') return;
    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    setRotationY(prev => Math.max(-80, Math.min(80, prev + deltaX * 0.4)));
    setRotationX(prev => Math.max(10, Math.min(75, prev - deltaY * 0.4)));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Preset switch handler
  const handleApplyPreset = (preset: '3d-iso' | '2d-plan' | 'allee' | 'nord' | 'sud' | 'quai') => {
    setViewPreset(preset);
    switch (preset) {
      case '3d-iso':
        setRotationX(35);
        setRotationY(-25);
        setZoomLevel(1);
        setSelectedZoneId(null);
        break;
      case '2d-plan':
        setRotationX(0);
        setRotationY(0);
        setZoomLevel(1);
        break;
      case 'allee':
        setRotationX(15);
        setRotationY(-5);
        setZoomLevel(1.2);
        break;
      case 'nord':
        setRotationX(30);
        setRotationY(-35);
        setZoomLevel(1.3);
        setSelectedZoneId('zone_nord');
        break;
      case 'sud':
        setRotationX(30);
        setRotationY(30);
        setZoomLevel(1.3);
        setSelectedZoneId('zone_sud');
        break;
      case 'quai':
        setRotationX(20);
        setRotationY(0);
        setZoomLevel(1.25);
        setSelectedZoneId('zone_quai');
        break;
    }
  };

  // Map equipments to zones and racks
  const zoneDataMap = useMemo(() => {
    const map: Record<string, { zone: WarehouseZoneDef; items: Equipment[]; totalQty: number; alertCount: number }> = {};
    
    WAREHOUSE_1000M2_ZONES.forEach(z => {
      map[z.id] = { zone: z, items: [], totalQty: 0, alertCount: 0 };
    });

    equipments.forEach(eq => {
      // Find matching zone
      const zName = (eq.zone || '').toLowerCase();
      let matchedZone = WAREHOUSE_1000M2_ZONES.find(z => 
        zName.includes(z.category.toLowerCase()) || 
        zName.includes(z.code.toLowerCase()) ||
        (z.id === 'zone_nord' && (zName.includes('nord') || zName.includes('secours') || zName.includes('a'))) ||
        (z.id === 'zone_sud' && (zName.includes('sud') || zName.includes('énergie') || zName.includes('elect') || zName.includes('b'))) ||
        (z.id === 'zone_est' && (zName.includes('est') || zName.includes('médical') || zName.includes('c'))) ||
        (z.id === 'zone_ouest' && (zName.includes('ouest') || zName.includes('télécom') || zName.includes('info') || zName.includes('d'))) ||
        (z.id === 'zone_quai' && (zName.includes('quai') || zName.includes('transit')))
      );

      if (!matchedZone) {
        matchedZone = WAREHOUSE_1000M2_ZONES[0];
      }

      map[matchedZone.id].items.push(eq);
      map[matchedZone.id].totalQty += Number(eq.quantite) || 0;
      if ((Number(eq.quantite) || 0) <= (Number(eq.qteMin) || 0)) {
        map[matchedZone.id].alertCount += 1;
      }
    });

    return map;
  }, [equipments]);

  // Overall statistics for 1 000 m²
  const warehouseStats = useMemo(() => {
    const totalItemsCount = equipments.reduce((acc, e) => acc + (Number(e.quantite) || 0), 0);
    const uniqueRefs = equipments.length;
    const totalAlerts = equipments.filter(e => (Number(e.quantite) || 0) <= (Number(e.qteMin) || 0)).length;
    // Capacity estimate: 1 000 m² warehouse can store ~3500 m³ or ~2000 total items
    const estimatedCapacity = 2000;
    const occupancyRate = Math.min(100, Math.round((totalItemsCount / estimatedCapacity) * 100));

    return {
      totalItemsCount,
      uniqueRefs,
      totalAlerts,
      occupancyRate
    };
  }, [equipments]);

  // Search matches
  const matchedItemIds = useMemo(() => {
    if (!searchQuery && !filterAlertOnly) return new Set<string>();
    const ids = new Set<string>();
    const term = searchQuery.toLowerCase();

    equipments.forEach(item => {
      const matchText = !searchQuery || 
        item.nom.toLowerCase().includes(term) ||
        item.reference.toLowerCase().includes(term) ||
        (item.codeBarres && item.codeBarres.toLowerCase().includes(term)) ||
        (item.rfid && item.rfid.toLowerCase().includes(term)) ||
        (item.marque && item.marque.toLowerCase().includes(term));
      
      const matchAlert = !filterAlertOnly || (Number(item.quantite) <= Number(item.qteMin));

      if (matchText && matchAlert) {
        ids.add(item.id);
      }
    });
    return ids;
  }, [equipments, searchQuery, filterAlertOnly]);

  // Handle rapid quantity increment/decrement
  const handleAdjustQuantity = (item: Equipment, delta: number) => {
    const newQty = Math.max(0, (Number(item.quantite) || 0) + delta);
    const updated: Equipment = {
      ...item,
      quantite: newQty,
      derniereMaj: new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };
    onUpdateEquipment(updated);
    onSync('update', updated);
    if (selectedItem?.id === item.id) {
      setSelectedItem(updated);
    }
  };

  const activeZoneObj = WAREHOUSE_1000M2_ZONES.find(z => z.id === selectedZoneId);
  const activeZoneItems = selectedZoneId ? (zoneDataMap[selectedZoneId]?.items || []) : equipments;

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      
      {/* Header Banner - 1 000 m² DGPC Central Depot */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-0.5 rounded-full flex items-center gap-1.5">
                <Box className="h-3.5 w-3.5" />
                Dépôt Logistique Central • Sidi Allal Bahraoui
              </span>
              <span className="text-xs font-bold text-slate-400">
                Superficie Totale : 1 000 m² (50m × 20m)
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
              Visualisation 3D Interactive du Stock
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Modélisation spatiale tridimensionnelle des rayonnages, allées de circulation et emplacements réels des équipements.
            </p>
          </div>

          {/* Key Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Taux d'occupation</span>
              <span className="text-xl font-black text-emerald-400">{warehouseStats.occupancyRate}%</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Quantité totale</span>
              <span className="text-xl font-black text-white">{warehouseStats.totalItemsCount}</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Références</span>
              <span className="text-xl font-black text-amber-300">{warehouseStats.uniqueRefs}</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Alertes seuil</span>
              <span className={`text-xl font-black ${warehouseStats.totalAlerts > 0 ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>
                {warehouseStats.totalAlerts}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Camera Presets, Color Mode, and Live Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Preset Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
            Vues :
          </span>
          <button
            onClick={() => handleApplyPreset('3d-iso')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              viewPreset === '3d-iso' ? 'bg-[#C84B31] text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span>3D Isométrique</span>
          </button>
          <button
            onClick={() => handleApplyPreset('2d-plan')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              viewPreset === '2d-plan' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Grid className="h-3.5 w-3.5" />
            <span>Plan 2D Top-Down</span>
          </button>
          <button
            onClick={() => handleApplyPreset('allee')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              viewPreset === 'allee' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Allée Centrale</span>
          </button>
          <button
            onClick={() => handleApplyPreset('nord')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              viewPreset === 'nord' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Nord (Secours)</span>
          </button>
          <button
            onClick={() => handleApplyPreset('sud')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              viewPreset === 'sud' ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Sud (Énergie)</span>
          </button>
        </div>

        {/* Color Mode Toggle and Search */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setZoomLevel(prev => Math.max(0.7, prev - 0.15))}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors cursor-pointer"
              title="Zoom arrière"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs font-bold text-slate-700 font-mono">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(1.8, prev + 0.15))}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors cursor-pointer"
              title="Zoom avant"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          {/* Search box */}
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Spotlight article (nom, réf, CB)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:border-[#C84B31]"
            />
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          </div>

          {/* Alert filter */}
          <button
            onClick={() => setFilterAlertOnly(!filterAlertOnly)}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              filterAlertOnly 
                ? 'bg-red-50 border-red-300 text-red-700 shadow-xs' 
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
            }`}
            title="Filtrer uniquement les articles en alerte"
          >
            <AlertTriangle className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Stage & Inspector Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* 3D Viewport Stage (8 Cols) */}
        <div 
          className="lg:col-span-8 bg-slate-950 rounded-3xl border border-slate-800 p-6 relative overflow-hidden shadow-2xl select-none"
          style={{ minHeight: '620px' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Overlay Top Bar: Dimensions & Active Info */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-3.5 py-1.5 text-[11px] font-black text-slate-300 flex items-center gap-2 shadow-lg">
              <Building2 className="h-4 w-4 text-[#C84B31]" />
              <span>Hangar 1 000 m² (50m × 20m) • Hauteur sous plafond 7.5m</span>
            </div>

            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] font-bold text-slate-400">
              {viewPreset === '2d-plan' ? 'Mode Plan 2D' : 'Faites glisser pour faire pivoter la vue 3D'}
            </div>
          </div>

          {/* 3D Perspective Stage Container */}
          <div 
            className="w-full h-full flex items-center justify-center pt-8 pb-4"
            style={{
              perspective: viewPreset === '2d-plan' ? 'none' : '1400px',
              perspectiveOrigin: '50% 40%'
            }}
          >
            <motion.div
              animate={{
                rotateX: viewPreset === '2d-plan' ? 0 : rotationX,
                rotateY: viewPreset === '2d-plan' ? 0 : rotationY,
                scale: zoomLevel
              }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              className="w-full max-w-[680px] aspect-[16/10] relative rounded-2xl p-4 transition-all duration-300"
              style={{
                transformStyle: 'preserve-3d',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
              }}
            >
              
              {/* Floor Surface Markings (Grid, Safety Hazard Lanes & Central Aisle) */}
              <div className="absolute inset-2 border border-slate-700/60 rounded-xl bg-slate-900/90 overflow-hidden">
                
                {/* Micro-grid lines on floor representing epoxy tiles */}
                <div 
                  className="absolute inset-0 opacity-15"
                  style={{
                    backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                  }}
                />

                {/* Central Driveway / Allée Centrale (3.5m Forklift Passage) */}
                <div className="absolute top-1/2 left-0 right-0 h-14 -translate-y-1/2 bg-slate-800/80 border-y-2 border-dashed border-amber-400/40 flex items-center justify-between px-6">
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-amber-400/80">
                    <span>◄ ALLÉE CENTRALE DE CIRCULATION CHARIOTS (3.50m) ►</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Truck className="h-4 w-4 text-amber-400" />
                    <span className="text-[8px] font-bold text-slate-400">Vitesse max 8 km/h</span>
                  </div>
                </div>

                {/* Pedestrian Safety Walkways (Green stripes) */}
                <div className="absolute top-2 left-2 right-2 h-4 bg-emerald-950/40 border-b border-emerald-500/30 flex items-center px-4">
                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">
                    CHEMINEMENT PIÉTON SÉCURISÉ - NORD
                  </span>
                </div>
                <div className="absolute bottom-2 left-2 right-2 h-4 bg-emerald-950/40 border-t border-emerald-500/30 flex items-center px-4">
                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">
                    CHEMINEMENT PIÉTON SÉCURISÉ - SUD
                  </span>
                </div>

                {/* Racks and Zones Rendered in 3D Space */}
                <div className="absolute inset-6 grid grid-cols-12 grid-rows-6 gap-3">
                  
                  {/* ZONE NORD (Top Left - 6 cols) */}
                  <div 
                    onClick={() => setSelectedZoneId('zone_nord')}
                    className={`col-span-7 row-span-2 rounded-xl border p-2.5 relative transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                      selectedZoneId === 'zone_nord'
                        ? 'border-emerald-500 bg-emerald-950/30 ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-950/50'
                        : 'border-slate-800 bg-slate-900/60 hover:border-emerald-500/60'
                    }`}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        Zone Nord • Secours & Tentes
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 font-bold">
                        {zoneDataMap['zone_nord']?.totalQty || 0} pcs
                      </span>
                    </div>

                    {/* 3D Racks Shelves Simulation (N-01 to N-06) */}
                    <div className="grid grid-cols-6 gap-1.5 mt-1.5 flex-1 items-end">
                      {['N-01', 'N-02', 'N-03', 'N-04', 'N-05', 'N-06'].map((rackCode, idx) => {
                        const rackItems = (zoneDataMap['zone_nord']?.items || []).filter(item => 
                          (item.emplacement || '').includes(rackCode) || idx === 0
                        );
                        const hasSearchMatch = rackItems.some(i => matchedItemIds.has(i.id));

                        return (
                          <div
                            key={rackCode}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (rackItems[0]) setSelectedItem(rackItems[0]);
                              setSelectedZoneId('zone_nord');
                            }}
                            className={`h-16 rounded-lg border flex flex-col justify-between p-1 transition-all relative ${
                              hasSearchMatch 
                                ? 'border-amber-400 bg-amber-400/30 ring-2 ring-amber-400 animate-pulse'
                                : 'border-slate-700/80 bg-slate-800/80 hover:bg-emerald-900/40 hover:border-emerald-400'
                            }`}
                            style={{
                              transform: 'translateZ(12px)',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
                            }}
                            title={`Rayonnage ${rackCode}`}
                          >
                            <span className="text-[7px] font-mono font-black text-emerald-300">{rackCode}</span>
                            
                            {/* Pallet boxes */}
                            <div className="space-y-0.5">
                              <div className="h-2 bg-emerald-500/80 rounded-xs" />
                              <div className="h-2 bg-emerald-600/80 rounded-xs" />
                              <div className="h-2 bg-emerald-700/80 rounded-xs" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ZONE EST (Top Right - 5 cols) */}
                  <div 
                    onClick={() => setSelectedZoneId('zone_est')}
                    className={`col-span-5 row-span-2 rounded-xl border p-2.5 relative transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                      selectedZoneId === 'zone_est'
                        ? 'border-red-500 bg-red-950/30 ring-2 ring-red-400/50 shadow-lg shadow-red-950/50'
                        : 'border-slate-800 bg-slate-900/60 hover:border-red-500/60'
                    }`}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-red-400 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-red-400" />
                        Zone Est • Médical & DSA
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 font-bold">
                        {zoneDataMap['zone_est']?.totalQty || 0} pcs
                      </span>
                    </div>

                    {/* 3D Racks E-01 to E-04 */}
                    <div className="grid grid-cols-4 gap-1.5 mt-1.5 flex-1 items-end">
                      {['E-01', 'E-02', 'E-03', 'E-04'].map((rackCode) => {
                        return (
                          <div
                            key={rackCode}
                            className="h-16 rounded-lg border border-slate-700/80 bg-slate-800/80 hover:bg-red-900/40 hover:border-red-400 flex flex-col justify-between p-1 transition-all"
                            style={{ transform: 'translateZ(12px)' }}
                            title={`Rayonnage ${rackCode}`}
                          >
                            <span className="text-[7px] font-mono font-black text-red-300">{rackCode}</span>
                            <div className="space-y-0.5">
                              <div className="h-2 bg-red-500/80 rounded-xs" />
                              <div className="h-2 bg-red-600/80 rounded-xs" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Empty Aisle Central Space (Rows 3 & 4) */}
                  <div className="col-span-12 row-span-2 pointer-events-none" />

                  {/* ZONE SUD (Bottom Left - 7 cols) */}
                  <div 
                    onClick={() => setSelectedZoneId('zone_sud')}
                    className={`col-span-7 row-span-2 rounded-xl border p-2.5 relative transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                      selectedZoneId === 'zone_sud'
                        ? 'border-amber-500 bg-amber-950/30 ring-2 ring-amber-400/50 shadow-lg shadow-amber-950/50'
                        : 'border-slate-800 bg-slate-900/60 hover:border-amber-500/60'
                    }`}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-amber-400 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        Zone Sud • Générateurs & Énergie
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 font-bold">
                        {zoneDataMap['zone_sud']?.totalQty || 0} pcs
                      </span>
                    </div>

                    {/* 3D Racks S-01 to S-06 */}
                    <div className="grid grid-cols-6 gap-1.5 mt-1.5 flex-1 items-end">
                      {['S-01', 'S-02', 'S-03', 'S-04', 'S-05', 'S-06'].map((rackCode) => {
                        return (
                          <div
                            key={rackCode}
                            className="h-16 rounded-lg border border-slate-700/80 bg-slate-800/80 hover:bg-amber-900/40 hover:border-amber-400 flex flex-col justify-between p-1 transition-all"
                            style={{ transform: 'translateZ(12px)' }}
                            title={`Rayonnage ${rackCode}`}
                          >
                            <span className="text-[7px] font-mono font-black text-amber-300">{rackCode}</span>
                            <div className="space-y-0.5">
                              <div className="h-2 bg-amber-500/80 rounded-xs" />
                              <div className="h-2 bg-amber-600/80 rounded-xs" />
                              <div className="h-2 bg-amber-700/80 rounded-xs" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ZONE OUEST (Bottom Right - 5 cols) */}
                  <div 
                    onClick={() => setSelectedZoneId('zone_ouest')}
                    className={`col-span-5 row-span-2 rounded-xl border p-2.5 relative transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                      selectedZoneId === 'zone_ouest'
                        ? 'border-blue-500 bg-blue-950/30 ring-2 ring-blue-400/50 shadow-lg shadow-blue-950/50'
                        : 'border-slate-800 bg-slate-900/60 hover:border-blue-500/60'
                    }`}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-blue-400 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-blue-400" />
                        Zone Ouest • Télécoms & Réseau
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 font-bold">
                        {zoneDataMap['zone_ouest']?.totalQty || 0} pcs
                      </span>
                    </div>

                    {/* 3D Racks W-01 to W-04 */}
                    <div className="grid grid-cols-4 gap-1.5 mt-1.5 flex-1 items-end">
                      {['W-01', 'W-02', 'W-03', 'W-04'].map((rackCode) => {
                        return (
                          <div
                            key={rackCode}
                            className="h-16 rounded-lg border border-slate-700/80 bg-slate-800/80 hover:bg-blue-900/40 hover:border-blue-400 flex flex-col justify-between p-1 transition-all"
                            style={{ transform: 'translateZ(12px)' }}
                            title={`Rayonnage ${rackCode}`}
                          >
                            <span className="text-[7px] font-mono font-black text-blue-300">{rackCode}</span>
                            <div className="space-y-0.5">
                              <div className="h-2 bg-blue-500/80 rounded-xs" />
                              <div className="h-2 bg-blue-600/80 rounded-xs" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

              </div>

            </motion.div>
          </div>

          {/* Bottom HUD Bar: Legend & Orbit status */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none z-20">
            {/* Color Category Legend */}
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-3.5 py-1.5 flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-300">
              <span className="text-slate-500 uppercase font-black">Légende :</span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Secours
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Énergie
              </span>
              <span className="flex items-center gap-1.5 text-red-400">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" /> Médical
              </span>
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-400" /> Télécoms
              </span>
            </div>

            {/* Reset View Button */}
            <button
              onClick={() => handleApplyPreset('3d-iso')}
              className="pointer-events-auto bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <RotateCw className="h-3.5 w-3.5 text-amber-400" />
              <span>Réinitialiser la vue</span>
            </button>
          </div>
        </div>

        {/* Right Inspector & Equipment List (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Active Zone Detail Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div 
                  className="h-8 w-8 rounded-xl flex items-center justify-center text-white shadow-xs"
                  style={{ backgroundColor: activeZoneObj?.color || '#C84B31' }}
                >
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-900">
                    {activeZoneObj?.name || 'Vue Globale du Stock'}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-bold">
                    {activeZoneObj?.dimensions || '1 000 m² total'}
                  </span>
                </div>
              </div>

              <span className="text-xs font-black font-mono text-[#C84B31] bg-red-50 px-2.5 py-1 rounded-lg">
                {activeZoneItems.length} article(s)
              </span>
            </div>

            {activeZoneObj && (
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {activeZoneObj.description}
              </p>
            )}

            {/* Items List in Selected Zone */}
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {activeZoneItems.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs font-medium">
                  Aucun équipement affecté dans cette zone.
                </div>
              ) : (
                activeZoneItems.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  const isAlert = (Number(item.quantite) || 0) <= (Number(item.qteMin) || 0);

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                        isSelected 
                          ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                          : 'bg-slate-50/80 hover:bg-slate-100/80 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded ${
                            isSelected ? 'bg-white/20 text-amber-300' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {item.emplacement || 'Rack 01'}
                          </span>
                          <span className={`text-xs font-black truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                            {item.nom}
                          </span>
                        </div>

                        <div className={`flex items-center gap-2 text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          <span>Réf : {item.reference || 'N/A'}</span>
                          <span>•</span>
                          <span>{item.categorie}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-sm font-black block ${
                          isAlert ? 'text-red-500 animate-pulse' : (isSelected ? 'text-emerald-400' : 'text-emerald-700')
                        }`}>
                          {item.quantite} {item.unite || 'pcs'}
                        </span>
                        {isAlert && (
                          <span className="text-[9px] font-bold text-red-500">
                            Min : {item.qteMin}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected Item Quick Inspector & Real-time adjustment */}
          {selectedItem && (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-5 shadow-xl border border-slate-700 space-y-4 animate-fadeIn">
              <div className="flex items-start justify-between gap-2 border-b border-slate-700/80 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                    Fiche Article 3D
                  </span>
                  <h4 className="text-sm font-black text-white mt-0.5">
                    {selectedItem.nom}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Réf : {selectedItem.reference} • Marque : {selectedItem.marque || 'DGPC'}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Grid metadata */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Zone & Emplacement</span>
                  <span className="font-bold text-amber-300 text-[11px] mt-0.5 block">
                    {selectedItem.zone} / {selectedItem.emplacement || 'Rack'}
                  </span>
                </div>
                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Code-Barres / RFID</span>
                  <span className="font-mono text-[10px] text-slate-200 mt-0.5 block truncate">
                    {selectedItem.codeBarres || selectedItem.rfid || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Quantity live adjustment buttons */}
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Stock en rayon</span>
                  <span className="text-xl font-black text-emerald-400">
                    {selectedItem.quantite} <span className="text-xs text-slate-300">{selectedItem.unite || 'unités'}</span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleAdjustQuantity(selectedItem, -1)}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-bold transition-all cursor-pointer"
                    title="Diminuer d'1 unité (Sortie rapide)"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleAdjustQuantity(selectedItem, +1)}
                    className="p-2 bg-[#C84B31] hover:bg-[#b54027] rounded-xl text-white font-bold transition-all cursor-pointer"
                    title="Ajouter 1 unité (Entrée rapide)"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('stock')}
                    className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
                  >
                    Voir dans l'inventaire
                  </button>
                )}
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('transactions-sorties')}
                    className="flex-1 py-2 px-3 bg-[#C84B31] hover:bg-[#b54027] text-white rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
                  >
                    Émettre un Bon
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
