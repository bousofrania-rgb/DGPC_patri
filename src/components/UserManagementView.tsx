import { useState, useMemo, FormEvent } from 'react';
import { 
  Users, UserPlus, Search, RefreshCw, Check, 
  Trash2, ShieldCheck, ShieldAlert, 
  Building, MapPin, Mail, Lock, Phone, 
  Eye, ToggleLeft, ToggleRight, Sparkles,
  Award, FileSpreadsheet, Download, Edit3
} from 'lucide-react';
import { User as UserType } from '../types';
import { DGPC_GRADES, DGPC_SERVICES, getAuthorizationLevel } from '../lib/permissions';

interface UserManagementViewProps {
  currentUser: UserType | null;
  users: UserType[];
  isLoading: boolean;
  onRefresh: () => void;
  onSaveUser: (userData: Partial<UserType>, isNew: boolean) => Promise<boolean>;
  onDeleteUser: (user: UserType) => Promise<boolean>;
  onToggleStatus?: (user: UserType) => Promise<boolean>;
  loginSpreadsheetId?: string;
  onUpdateLoginSpreadsheetId?: (id: string) => void;
  showToast: (msg: string) => void;
}

export default function UserManagementView({
  currentUser,
  users,
  isLoading,
  onRefresh,
  onSaveUser,
  onDeleteUser,
  showToast
}: UserManagementViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServiceFilter, setSelectedServiceFilter] = useState('Tous');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('Tous');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'Tous' | 'Actif' | 'Désactivé'>('Tous');

  // Modals state
  const [editModalOpen, setEditModalOpen] = useState<'add' | 'edit' | null>(null);
  const [viewingUser, setViewingUser] = useState<UserType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastCreatedBackup, setLastCreatedBackup] = useState<{ fullName: string; password: string; email?: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<UserType>>({
    grade: 'Lieutenant-colonel (Lt. Colonel)',
    fullName: '',
    fonction: 'Chef de Service',
    poste: 'Gestionnaire du Patrimoine',
    service: 'Service Patrimoine',
    matricule: '',
    telephone: '',
    statut: 'Actif',
    password: '',
    region: 'Rabat-Salé-Kénitra',
    ville: 'Rabat',
    email: '',
    notes: ''
  });

  const [confirmDeleteUser, setConfirmDeleteUser] = useState<UserType | null>(null);

  // Computed filtered list
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const s = searchTerm.toLowerCase().trim();
      const matchesSearch = !s || 
        user.fullName.toLowerCase().includes(s) ||
        (user.matricule || '').toLowerCase().includes(s) ||
        (user.grade || '').toLowerCase().includes(s) ||
        (user.service || '').toLowerCase().includes(s) ||
        (user.fonction || '').toLowerCase().includes(s) ||
        (user.email || '').toLowerCase().includes(s) ||
        (user.ville || '').toLowerCase().includes(s);

      const matchesService = selectedServiceFilter === 'Tous' || user.service === selectedServiceFilter;
      const matchesRole = selectedRoleFilter === 'Tous' || user.role === selectedRoleFilter;
      const matchesStatus = selectedStatusFilter === 'Tous' || (user.statut || 'Actif') === selectedStatusFilter;

      return matchesSearch && matchesService && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, selectedServiceFilter, selectedRoleFilter, selectedStatusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => (u.statut || 'Actif') === 'Actif').length;
    const inactive = users.filter(u => u.statut === 'Désactivé').length;
    const command = users.filter(u => getAuthorizationLevel(u) === 'COMMANDEMENT_DIRECTION').length;
    const admin = users.filter(u => getAuthorizationLevel(u) === 'ADMINISTRATEUR_GESTIONNAIRE').length;
    const operateurs = users.filter(u => getAuthorizationLevel(u) === 'EMPLOYE_OPERATIONNEL').length;
    return { total, active, inactive, command, admin, operateurs };
  }, [users]);

  const handleOpenAdd = () => {
    setFormData({
      grade: 'Lieutenant-colonel (Lt. Colonel)',
      fullName: '',
      fonction: 'Chef de Service',
      poste: 'Responsable Logistique & Patrimoine',
      service: 'Service Patrimoine',
      matricule: `DGPC-${Math.floor(1000 + Math.random() * 9000)}`,
      telephone: '+212 6 ',
      statut: 'Actif',
      password: Math.floor(100000 + Math.random() * 900000).toString(),
      region: 'Rabat-Salé-Kénitra',
      ville: 'Rabat',
      email: '',
      notes: ''
    });
    setEditModalOpen('add');
  };

  const handleOpenEdit = (user: UserType) => {
    setFormData({
      id: user.id,
      grade: user.grade || 'Lieutenant-colonel (Lt. Colonel)',
      fullName: user.fullName,
      fonction: user.fonction || 'Employé',
      poste: user.poste || user.fonction || '',
      service: user.service || 'Service Patrimoine',
      matricule: user.matricule || `DGPC-${Math.floor(1000 + Math.random() * 9000)}`,
      telephone: user.telephone || '',
      statut: user.statut || 'Actif',
      password: user.password || '',
      region: user.region || 'Rabat-Salé-Kénitra',
      ville: user.ville || 'Rabat',
      email: user.email || '',
      notes: user.notes || ''
    });
    setEditModalOpen('edit');
  };

  const handleSubmitForm = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.fullName?.trim()) {
      showToast("⚠️ Le Nom et Prénom de l'employé sont obligatoires.");
      return;
    }
    if (!formData.password || !/^\d{6}$/.test(formData.password)) {
      showToast("⚠️ Le code secret d'accès doit être composé d'exactement 6 chiffres.");
      return;
    }

    setIsSaving(true);
    try {
      const isNew = editModalOpen === 'add';
      const success = await onSaveUser(formData, isNew);
      if (success) {
        showToast(isNew ? `✅ Employé ${formData.fullName} ajouté avec succès !` : `✅ Informations de ${formData.fullName} mises à jour !`);
        if (isNew) {
          setLastCreatedBackup({
            fullName: formData.fullName || '',
            password: formData.password || '',
            email: formData.email
          });
        }
        setEditModalOpen(null);
      }
    } catch (err: any) {
      showToast(`⚠️ Erreur : ${err?.message || 'Impossible d\'enregistrer'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleUserStatus = async (user: UserType) => {
    const newStatus: 'Actif' | 'Désactivé' = (user.statut || 'Actif') === 'Actif' ? 'Désactivé' : 'Actif';
    setIsSaving(true);
    try {
      const updated = { ...user, statut: newStatus };
      const success = await onSaveUser(updated, false);
      if (success) {
        showToast(`Statut de ${user.fullName} mis à jour : ${newStatus}`);
      }
    } catch (err: any) {
      showToast(`Erreur lors du changement de statut : ${err?.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#9B2C16] via-[#C84B31] to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-3 border border-white/20">
              <Award className="h-3.5 w-3.5 text-amber-300" />
              Direction Générale de la Protection Civile • RSK
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight flex items-center gap-3">
              <Users className="h-8 w-8 text-amber-300 shrink-0" />
              Gestion des Employés & Droits d'Accès
            </h1>
            <p className="text-xs sm:text-sm text-red-100 mt-2 max-w-3xl leading-relaxed">
              Supervisez les effectifs, attribuez les grades (notamment <strong>Lieutenant-colonel</strong>, <strong>Colonel</strong>, <strong>Commandant</strong>), configurez les niveaux d'autorisation et activez/désactivez les accès aux modules stratégiques de l'application.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 bg-white text-[#C84B31] hover:bg-red-50 transition-all font-black px-5 py-3 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-black/20 hover:scale-102 cursor-pointer"
            >
              <UserPlus className="h-4 w-4 text-[#C84B31]" />
              Nouvel Employé
            </button>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 transition-all cursor-pointer disabled:opacity-50"
              title="Synchroniser avec la base de données"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Backup Alert Banner for newly created employee */}
      {lastCreatedBackup && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-emerald-500 text-white rounded-xl shrink-0 mt-0.5 shadow-sm">
              <Check className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-emerald-950 uppercase tracking-wide">
                Nouveau compte employé créé avec succès !
              </h4>
              <p className="text-xs text-emerald-700 mt-1 font-medium">
                Voici les identifiants d'accès sécurisés à transmettre à l'agent :
              </p>
              <div className="flex flex-wrap gap-4 mt-2.5 bg-white border border-emerald-200 rounded-xl p-3 text-xs font-mono">
                <div>
                  <span className="text-slate-400 font-bold">Employé :</span>{' '}
                  <span className="font-black text-slate-900">{lastCreatedBackup.fullName}</span>
                </div>
                <div className="border-l border-slate-200 pl-4">
                  <span className="text-slate-400 font-bold">Code secret (6 chiffres) :</span>{' '}
                  <span className="font-black text-[#C84B31] tracking-widest text-sm bg-red-50 px-2 py-0.5 rounded border border-red-100">{lastCreatedBackup.password}</span>
                </div>
                {lastCreatedBackup.email && (
                  <div className="border-l border-slate-200 pl-4">
                    <span className="text-slate-400 font-bold">Courriel :</span>{' '}
                    <span className="font-medium text-slate-700">{lastCreatedBackup.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setLastCreatedBackup(null)}
            className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-900 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer self-end md:self-center"
          >
            Fermer
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Effectif</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
          <div className="text-[10px] text-slate-500 font-bold mt-0.5">Agents & Cadres</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Comptes Actifs</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{stats.active}</div>
          <div className="text-[10px] text-slate-500 font-bold mt-0.5">Accès autorisé</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] font-black uppercase tracking-wider text-rose-500">Désactivés</div>
          <div className="text-2xl font-black text-rose-500 mt-1">{stats.inactive}</div>
          <div className="text-[10px] text-slate-500 font-bold mt-0.5">Accès suspendu</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Commandement</div>
          <div className="text-2xl font-black text-indigo-700 mt-1">{stats.command}</div>
          <div className="text-[10px] text-slate-500 font-bold mt-0.5">Col. / Lt-Col. / Dir.</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] font-black uppercase tracking-wider text-amber-600">Gestionnaires</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{stats.admin}</div>
          <div className="text-[10px] text-slate-500 font-bold mt-0.5">Chefs de service</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-600">Opérateurs</div>
          <div className="text-2xl font-black text-slate-800 mt-1">{stats.operateurs}</div>
          <div className="text-[10px] text-slate-500 font-bold mt-0.5">Accès restreint</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, matricule, grade (ex: Lieutenant-colonel), service, ville..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#C84B31] focus:outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Service filter */}
            <select
              value={selectedServiceFilter}
              onChange={(e) => setSelectedServiceFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:bg-white focus:outline-none"
            >
              <option value="Tous">Tous les Services</option>
              {DGPC_SERVICES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:bg-white focus:outline-none"
            >
              <option value="Tous">Tous les statuts</option>
              <option value="Actif">Actifs uniquement</option>
              <option value="Désactivé">Désactivés uniquement</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employees Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <RefreshCw className="h-8 w-8 text-[#C84B31] animate-spin mb-3" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">Chargement de la liste des collaborateurs...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6">
          <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">Aucun employé ne correspond aux critères</h3>
          <p className="text-xs text-slate-500 mt-1">Modifiez vos filtres ou effectuez une nouvelle recherche.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedServiceFilter('Tous');
              setSelectedRoleFilter('Tous');
              setSelectedStatusFilter('Tous');
            }}
            className="mt-4 text-xs font-black uppercase text-[#C84B31] hover:underline cursor-pointer"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => {
            const authLevel = getAuthorizationLevel(user);
            const isInactive = user.statut === 'Désactivé';
            const isHighCommand = authLevel === 'COMMANDEMENT_DIRECTION';
            const isAdmin = authLevel === 'ADMINISTRATEUR_GESTIONNAIRE';

            return (
              <div
                key={user.id || user.fullName}
                className={`bg-white rounded-3xl border transition-all p-5 flex flex-col justify-between gap-4 relative overflow-hidden shadow-xs hover:shadow-md ${
                  isInactive 
                    ? 'border-slate-300 opacity-70 bg-slate-50/70' 
                    : isHighCommand
                    ? 'border-indigo-200'
                    : 'border-slate-200/80'
                }`}
              >
                {/* Visual Accent stripe */}
                <div 
                  className={`absolute top-0 left-0 w-2 h-full ${
                    isInactive 
                      ? 'bg-slate-400' 
                      : isHighCommand
                      ? 'bg-indigo-600'
                      : isAdmin
                      ? 'bg-amber-500'
                      : 'bg-[#C84B31]'
                  }`} 
                />

                <div className="pl-2">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-md border border-slate-200">
                      {user.grade || 'Grade non spécifié'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isInactive
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${isInactive ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                        {user.statut || 'Actif'}
                      </span>
                    </div>
                  </div>

                  {/* Name & Role */}
                  <div className="mt-1">
                    <h3 className="text-base font-black text-slate-900 leading-tight">
                      {user.fullName}
                    </h3>
                    <p className="text-xs font-bold text-slate-600 mt-0.5">
                      {user.poste || user.fonction || 'Opérateur'}
                    </p>
                  </div>

                  {/* Authorization Level indicator */}
                  <div className="mt-3">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${
                      isHighCommand
                        ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                        : isAdmin
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {isHighCommand ? (
                        <>
                          <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                          Commandement • Accès Global
                        </>
                      ) : isAdmin ? (
                        <>
                          <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                          Gestionnaire • Accès Complet
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="h-3.5 w-3.5 text-slate-500" />
                          Employé • Accès Restreint
                        </>
                      )}
                    </span>
                  </div>

                  {/* Info details */}
                  <div className="mt-4 space-y-1.5 text-xs text-slate-600 font-medium">
                    <div className="flex items-center gap-2">
                      <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{user.service || 'Service non renseigné'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{user.ville || 'Rabat'} • {user.region || 'RSK'}</span>
                    </div>

                    {user.matricule && (
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-slate-400 font-bold">Matricule:</span>
                        <span className="font-bold text-slate-800">{user.matricule}</span>
                      </div>
                    )}

                    {user.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate text-slate-700">{user.email}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-xs font-black text-[#C84B31] bg-red-50 border border-red-100 px-2 py-0.5 rounded tracking-widest">
                        {user.password || '••••••'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5 pl-2">
                  <button
                    type="button"
                    onClick={() => setViewingUser(user)}
                    className="flex-1 py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer"
                    title="Consulter la fiche complète"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Fiche
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(user)}
                    className="py-2 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer"
                    title="Modifier les informations"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Modifier
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleUserStatus(user)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      isInactive 
                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                    }`}
                    title={isInactive ? 'Réactiver le compte' : 'Désactiver le compte'}
                  >
                    {isInactive ? <ToggleRight className="h-4 w-4 text-emerald-600" /> : <ToggleLeft className="h-4 w-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmDeleteUser(user)}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl transition-all cursor-pointer"
                    title="Supprimer définitivement"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. MODAL: FICHE COMPLÈTE DE L'EMPLOYÉ */}
      {/* ========================================================================= */}
      {viewingUser && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#C84B31] text-white p-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-xl font-black text-white shadow-inner">
                  {viewingUser.fullName.charAt(0)}
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                    Fiche d'identification employé
                  </div>
                  <h2 className="text-lg sm:text-xl font-black leading-snug">
                    {viewingUser.fullName}
                  </h2>
                  <div className="text-xs text-slate-300 font-semibold mt-0.5">
                    {viewingUser.grade} • {viewingUser.poste || viewingUser.fonction}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setViewingUser(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-2 hover:bg-white/10 rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Status & Auth Level Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Niveau d'Autorisation Système</div>
                  <div className="text-sm font-black text-slate-900 mt-0.5 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-indigo-600" />
                    {getAuthorizationLevel(viewingUser) === 'COMMANDEMENT_DIRECTION'
                      ? 'Commandement Supérieur (Accès Global Total)'
                      : getAuthorizationLevel(viewingUser) === 'ADMINISTRATEUR_GESTIONNAIRE'
                      ? 'Administrateur & Gestionnaire (Accès Complet)'
                      : 'Opérateur / Employé (Accès Restreint)'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                    viewingUser.statut === 'Désactivé'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {viewingUser.statut || 'Actif'}
                  </span>
                </div>
              </div>

              {/* Identity & Career Grid */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-[#C84B31]" />
                  Informations Administratives & Grade
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60">
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Grade Actuel</span>
                    <span className="font-black text-slate-900">{viewingUser.grade || '—'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Matricule DGPC</span>
                    <span className="font-mono font-black text-slate-900">{viewingUser.matricule || 'DGPC-0000'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Service d'Affectation</span>
                    <span className="font-bold text-slate-900">{viewingUser.service || '—'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Fonction / Poste</span>
                    <span className="font-bold text-slate-900">{viewingUser.poste || viewingUser.fonction || '—'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Région</span>
                    <span className="font-bold text-slate-900">{viewingUser.region || 'Rabat-Salé-Kénitra'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Ville d'exercice</span>
                    <span className="font-bold text-slate-900">{viewingUser.ville || 'Rabat'}</span>
                  </div>
                </div>
              </div>

              {/* Modules Permissions Matrix */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  Matrice des Droits & Modules Autorisés
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-emerald-900 text-[11px]">Stock & Patrimoine</span>
                  </div>

                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-emerald-900 text-[11px]">Flux & Distribution</span>
                  </div>

                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-emerald-900 text-[11px]">Bons & Registres</span>
                  </div>

                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-emerald-900 text-[11px]">Visualisation 3D 1 000 m²</span>
                  </div>

                  {/* Financial Module */}
                  <div className={`p-3 rounded-xl border flex items-center gap-2 ${
                    getAuthorizationLevel(viewingUser) !== 'EMPLOYE_OPERATIONNEL'
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}>
                    {getAuthorizationLevel(viewingUser) !== 'EMPLOYE_OPERATIONNEL' ? (
                      <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="text-xs font-black text-rose-600 shrink-0">✕</span>
                    )}
                    <span className="font-bold text-[11px]">Partie Financière (Coûts/Prix)</span>
                  </div>

                  {/* AI Verification */}
                  <div className={`p-3 rounded-xl border flex items-center gap-2 ${
                    getAuthorizationLevel(viewingUser) !== 'EMPLOYE_OPERATIONNEL'
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}>
                    {getAuthorizationLevel(viewingUser) !== 'EMPLOYE_OPERATIONNEL' ? (
                      <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="text-xs font-black text-rose-600 shrink-0">✕</span>
                    )}
                    <span className="font-bold text-[11px]">Vérification IA Automatique</span>
                  </div>
                </div>
              </div>

              {/* Credentials & Contact */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-slate-700" />
                  Accès & Coordonnées
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60">
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Courriel Professionnel</span>
                    <span className="font-bold text-slate-900">{viewingUser.email || 'Non renseigné'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Téléphone</span>
                    <span className="font-bold text-slate-900">{viewingUser.telephone || 'Non renseigné'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Code d'accès secret</span>
                    <span className="font-mono font-black text-[#C84B31] bg-red-50 border border-red-100 px-2 py-0.5 rounded text-sm tracking-widest inline-block mt-0.5">
                      {viewingUser.password || '••••••'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Date de création</span>
                    <span className="font-bold text-slate-900">{viewingUser.createdAt || '01/01/2026'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const userToEdit = viewingUser;
                  setViewingUser(null);
                  handleOpenEdit(userToEdit);
                }}
                className="px-4 py-2.5 bg-[#C84B31] hover:bg-[#B8422A] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                Modifier cette fiche
              </button>

              <button
                type="button"
                onClick={() => setViewingUser(null)}
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MODAL: AJOUTER OU MODIFIER UN EMPLOYÉ */}
      {/* ========================================================================= */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#C84B31] text-white p-6 flex items-center justify-between shrink-0">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-amber-300 font-mono">
                  {editModalOpen === 'add' ? 'Nouveau collaborateur' : 'Mise à jour employé'}
                </div>
                <h3 className="text-base sm:text-lg font-black uppercase tracking-wide mt-0.5">
                  {editModalOpen === 'add' ? 'Créer une fiche employé' : `Modifier la fiche de ${formData.fullName}`}
                </h3>
              </div>
              <button
                onClick={() => setEditModalOpen(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-2 hover:bg-white/10 rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form Form */}
            <form onSubmit={handleSubmitForm} className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Section 1: Identification & Grade */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-[#C84B31]" />
                  Identification & Grade DGPC
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Grade */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1.5 tracking-wider">
                      Grade Hiérarchique *
                    </label>
                    <select
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#C84B31] focus:outline-none"
                    >
                      {DGPC_GRADES.map(g => (
                        <option key={g.id} value={g.label}>
                          {g.label} ({g.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Nom et Prénom */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1.5 tracking-wider">
                      Nom et Prénom *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Karim Bennani"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#C84B31] focus:outline-none"
                    />
                  </div>

                  {/* Matricule */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1.5 tracking-wider">
                      Matricule DGPC
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: DGPC-4892"
                      value={formData.matricule}
                      onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#C84B31] focus:outline-none"
                    />
                  </div>

                  {/* Statut Compte */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1.5 tracking-wider">
                      Statut du compte
                    </label>
                    <select
                      value={formData.statut}
                      onChange={(e) => setFormData({ ...formData, statut: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#C84B31] focus:outline-none"
                    >
                      <option value="Actif">✅ Actif (Accès autorisé)</option>
                      <option value="Désactivé">⛔ Désactivé (Accès suspendu)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Affectation & Responsabilités */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Building className="h-4 w-4 text-indigo-600" />
                  Service & Niveau de Responsabilité
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Service */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1.5 tracking-wider">
                      Service de rattachement *
                    </label>
                    <select
                      value={formData.service}
                      onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#C84B31] focus:outline-none"
                    >
                      {DGPC_SERVICES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Profil d'accès */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1.5 tracking-wider">
                      Profil d'autorisation
                    </label>
                    <select
                      value={formData.fonction}
                      onChange={(e) => setFormData({ ...formData, fonction: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#C84B31] focus:outline-none"
                    >
                      <option value="Directeur Régional">Directeur (Commandement - Accès Global)</option>
                      <option value="Chef de Service">Chef de Service (Administrateur)</option>
                      <option value="Gestionnaire de Stock">Gestionnaire de Stock (Administrateur)</option>
                      <option value="Agent Logistique & Inventaire">Agent Logistique (Employé - Restreint)</option>
                      <option value="Magasinier">Magasinier (Employé - Restreint)</option>
                      <option value="Employé">Employé (Restreint)</option>
                    </select>
                  </div>

                  {/* Poste / Intitulé */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1.5 tracking-wider">
                      Intitulé du poste
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Responsable Dépôt Central"
                      value={formData.poste}
                      onChange={(e) => setFormData({ ...formData, poste: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#C84B31] focus:outline-none"
                    />
                  </div>

                  {/* Ville */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1.5 tracking-wider">
                      Ville d'exercice
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Rabat, Kénitra, Sidi Allal Bahraoui..."
                      value={formData.ville}
                      onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#C84B31] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Sécurité & Coordonnées */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-slate-700" />
                  Code Secret & Coordonnées de Contact
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Code secret 6 chiffres */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1.5 tracking-wider">
                      Code secret d'accès (6 chiffres) *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={6}
                        pattern="\d{6}"
                        required
                        placeholder="Ex: 582910"
                        value={formData.password}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, '');
                          setFormData({ ...formData, password: clean });
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold tracking-widest text-[#C84B31] focus:bg-white focus:ring-2 focus:ring-[#C84B31] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const code = Math.floor(100000 + Math.random() * 900000).toString();
                          setFormData({ ...formData, password: code });
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] bg-red-50 text-[#C84B31] hover:bg-red-100 font-black px-2 py-1 rounded-lg border border-red-200 cursor-pointer"
                      >
                        Générer
                      </button>
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1.5 tracking-wider">
                      Adresse E-mail professionnelle
                    </label>
                    <input
                      type="email"
                      placeholder="Ex: nom@protectioncivile.ma"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#C84B31] focus:outline-none"
                    />
                  </div>

                  {/* Telephone */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1.5 tracking-wider">
                      Numéro de Téléphone
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: +212 661 00 00 00"
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#C84B31] focus:outline-none"
                    />
                  </div>

                  {/* Région */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1.5 tracking-wider">
                      Région
                    </label>
                    <input
                      type="text"
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#C84B31] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-[#C84B31] hover:bg-[#B8422A] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-[#C84B31]/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      {editModalOpen === 'add' ? 'Créer l\'employé' : 'Enregistrer les modifications'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODAL: CONFIRMATION DE SUPPRESSION */}
      {/* ========================================================================= */}
      {confirmDeleteUser && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6">
            <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6" />
            </div>

            <h3 className="text-base font-black text-center text-slate-900 uppercase tracking-wide">
              Supprimer le compte employé ?
            </h3>

            <p className="text-xs text-slate-600 text-center mt-2 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer définitivement la fiche de <strong>{confirmDeleteUser.fullName}</strong> ? Cette action supprimera sa ligne dans la base de données Login du Google Sheet.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setConfirmDeleteUser(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={async () => {
                  const toDelete = confirmDeleteUser;
                  setConfirmDeleteUser(null);
                  if (toDelete) {
                    const success = await onDeleteUser(toDelete);
                    if (success) {
                      showToast(`Employé ${toDelete.fullName} supprimé.`);
                    }
                  }
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-rose-600/20"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
