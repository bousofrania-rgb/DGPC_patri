import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  User, 
  Search, 
  MessageSquare, 
  ShieldAlert, 
  CheckCheck, 
  Users, 
  Sparkles,
  Info,
  Calendar,
  Layers,
  MapPin,
  Clock,
  ChevronDown
} from 'lucide-react';
import { User as UserType, UserRole } from '../types';

export interface DirectMessage {
  id: string;
  senderUsername: string;
  recipientUsername: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface InternalMessagesProps {
  currentUser: UserType;
}

const DEFAULT_MESSAGES: DirectMessage[] = [
  {
    id: 'msg-1',
    senderUsername: 'patrimoine',
    recipientUsername: 'directeur',
    content: "Mon général, l'inventaire du patrimoine de Rabat-Salé-Kénitra a été mis à jour dans le Google Sheet. Le niveau de stock des tentes d'intervention de crise est optimal.",
    timestamp: "08/07/2026 09:15",
    isRead: true
  },
  {
    id: 'msg-2',
    senderUsername: 'directeur',
    recipientUsername: 'patrimoine',
    content: "Bien reçu, Commandant. Assurez-vous que l'état d'entretien des tentes soit révisé pour la prochaine commission logistique.",
    timestamp: "08/07/2026 10:30",
    isRead: true
  },
  {
    id: 'msg-3',
    senderUsername: 'employe',
    recipientUsername: 'dml',
    content: "Chef, j'ai constaté un écart de quantité de 2 unités sur le défibrillateur Zoll DSA dans le dépôt DML 2. Dois-je passer une commande d'urgence ?",
    timestamp: "08/07/2026 14:22",
    isRead: true
  },
  {
    id: 'msg-4',
    senderUsername: 'dml',
    recipientUsername: 'employe',
    content: "Oui, saisissez immédiatement une alerte de stock faible et générez le bon de réapprovisionnement automatique.",
    timestamp: "08/07/2026 14:45",
    isRead: true
  },
  {
    id: 'msg-5',
    senderUsername: 'electinfo',
    recipientUsername: 'directeur',
    content: "Mon général, nous testons actuellement la liaison RFID pour l'identification instantanée des matériels électriques.",
    timestamp: "09/07/2026 08:30",
    isRead: false
  }
];

export default function InternalMessages({ currentUser }: InternalMessagesProps) {
  const [messages, setMessages] = useState<DirectMessage[]>(() => {
    const saved = localStorage.getItem('gis_dgpc_messages');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('gis_dgpc_messages', JSON.stringify(DEFAULT_MESSAGES));
    return DEFAULT_MESSAGES;
  });

  const [activeContact, setActiveContact] = useState<UserType | null>(null);
  const [typedMessage, setTypedMessage] = useState('');
  const [searchContactTerm, setSearchContactTerm] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load registered users list from custom and system mock users
  const [allUsers, setAllUsers] = useState<UserType[]>([]);

  useEffect(() => {
    // 1. Gather default static users
    const staticUsers: UserType[] = [
      { id: 'u-dir-1', username: 'directeur', role: 'Direction', fullName: 'Directeur Général', service: 'Direction Générale', region: 'Rabat-Salé-Kénitra' },
      { id: 'u-pat-1', username: 'patrimoine', role: 'Administrateur', fullName: 'Chef de Service Patrimoine', service: 'Patrimoine', region: 'Rabat-Salé-Kénitra' },
      { id: 'u-electinfo-1', username: 'electinfo', role: 'Administrateur', fullName: 'Chef de Service Électrique & Informatique', service: 'Électricité & Informatique', region: 'Rabat-Salé-Kénitra' },
      { id: 'u-dml-1', username: 'dml', role: 'Administrateur', fullName: 'Chef de Service DML', service: 'DML', region: 'Rabat-Salé-Kénitra' },
      { id: 'u-emp-1', username: 'employe', role: 'Employé', fullName: 'Employé de Stock', service: 'DML', region: 'Rabat-Salé-Kénitra' }
    ];

    // 2. Fetch from custom users (if any)
    const custom = localStorage.getItem('gis_dgpc_custom_users');
    const customUsersList: UserType[] = custom ? JSON.parse(custom) : [];

    // 3. Combine avoiding duplicates based on username
    const combined: UserType[] = [...staticUsers];
    customUsersList.forEach(customU => {
      if (!combined.some(u => u.username.toLowerCase() === customU.username.toLowerCase())) {
        combined.push(customU);
      }
    });

    setAllUsers(combined);
  }, []);

  // Filter contacts based on strict role-based access control matrix
  const allowedContacts = allUsers.filter(contact => {
    // Cannot message oneself
    if (contact.username.toLowerCase() === currentUser.username.toLowerCase()) return false;

    const myRole = currentUser.role;
    const contactRole = contact.role;
    const myService = currentUser.service || '';
    const contactService = contact.service || '';

    // Matrix Rules:
    // 1. Directeur can ONLY communicate with Administrateurs (of any service/region)
    if (myRole === 'Direction') {
      return contactRole === 'Administrateur';
    }

    // 2. Administrateur can communicate with:
    //    - Directeur (Direction)
    //    - Employés of their OWN service
    if (myRole === 'Administrateur') {
      if (contactRole === 'Direction') return true;
      if (contactRole === 'Employé') {
        // Must belong to the same service
        const myServiceClean = myService.toLowerCase().replace(/service\s+/i, '');
        const contactServiceClean = contactService.toLowerCase().replace(/service\s+/i, '');
        return myServiceClean === contactServiceClean || 
               myServiceClean.includes(contactServiceClean) || 
               contactServiceClean.includes(myServiceClean);
      }
      return false;
    }

    // 3. Employés can ONLY communicate with the Administrateur of their OWN service
    if (myRole === 'Employé') {
      if (contactRole === 'Administrateur') {
        const myServiceClean = myService.toLowerCase().replace(/service\s+/i, '');
        const contactServiceClean = contactService.toLowerCase().replace(/service\s+/i, '');
        return myServiceClean === contactServiceClean || 
               myServiceClean.includes(contactServiceClean) || 
               contactServiceClean.includes(myServiceClean);
      }
      return false;
    }

    return false;
  });

  // Filter allowed contacts by search term
  const filteredContacts = allowedContacts.filter(contact => {
    const term = searchContactTerm.toLowerCase();
    return (
      contact.fullName.toLowerCase().includes(term) ||
      contact.username.toLowerCase().includes(term) ||
      (contact.service || '').toLowerCase().includes(term) ||
      (contact.region || '').toLowerCase().includes(term)
    );
  });

  // Automatically select the first allowed contact if none active
  useEffect(() => {
    if (!activeContact && filteredContacts.length > 0) {
      setActiveContact(filteredContacts[0]);
    }
  }, [filteredContacts, activeContact]);

  // Scroll to bottom when opening/changing a conversation
  useEffect(() => {
    if (activeContact) {
      chatEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [activeContact]);

  // Filter messages for active chat
  const activeChatMessages = activeContact
    ? messages.filter(msg => 
        (msg.senderUsername === currentUser.username && msg.recipientUsername === activeContact.username) ||
        (msg.senderUsername === activeContact.username && msg.recipientUsername === currentUser.username)
      )
    : [];

  // Mark active chat messages as read
  useEffect(() => {
    if (activeContact) {
      const updated = messages.map(msg => {
        if (msg.senderUsername === activeContact.username && msg.recipientUsername === currentUser.username && !msg.isRead) {
          return { ...msg, isRead: true };
        }
        return msg;
      });
      setMessages(updated);
      localStorage.setItem('gis_dgpc_messages', JSON.stringify(updated));
    }
  }, [activeContact]);

  // Load messages from localStorage whenever the current user changes to ensure fresh data
  useEffect(() => {
    const saved = localStorage.getItem('gis_dgpc_messages');
    if (saved) {
      setMessages(JSON.parse(saved));
    }
  }, [currentUser.username]);

  // Handle message send
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !activeContact) return;

    const now = new Date();
    const formattedTimestamp = now.toLocaleDateString('fr-FR') + " " + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const newMsg: DirectMessage = {
      id: `msg-${Date.now()}`,
      senderUsername: currentUser.username,
      recipientUsername: activeContact.username,
      content: typedMessage.trim(),
      timestamp: formattedTimestamp,
      isRead: false // Sent messages are unread for the recipient until they open it
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    localStorage.setItem('gis_dgpc_messages', JSON.stringify(updated));
    setTypedMessage('');

    // Smooth scroll to bottom on message sent
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  // Helper styles for user role badges
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'Direction':
        return {
          code: 'DR',
          label: 'Directeur',
          bg: 'bg-red-500',
          text: 'text-red-500',
          lightBg: 'bg-red-50 text-red-700 border-red-200'
        };
      case 'Administrateur':
        return {
          code: 'AD',
          label: 'Administrateur',
          bg: 'bg-amber-500',
          text: 'text-amber-500',
          lightBg: 'bg-amber-50 text-amber-700 border-amber-200'
        };
      case 'Employé':
        return {
          code: 'EM',
          label: 'Employé',
          bg: 'bg-sky-500',
          text: 'text-sky-500',
          lightBg: 'bg-sky-50 text-sky-700 border-sky-200'
        };
      default:
        return {
          code: 'US',
          label: 'Utilisateur',
          bg: 'bg-slate-500',
          text: 'text-slate-500',
          lightBg: 'bg-slate-50 text-slate-700 border-slate-200'
        };
    }
  };

  // Count unread messages from a specific contact
  const getUnreadCount = (contactUsername: string) => {
    return messages.filter(msg => 
      msg.senderUsername === contactUsername && 
      msg.recipientUsername === currentUser.username && 
      !msg.isRead
    ).length;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 h-[600px] md:h-[calc(100vh-13rem)] min-h-[500px]">
      
      {/* 1. Left Contact List Sidebar (Cols 1-4) */}
      <div className="hidden md:flex md:col-span-4 border-r border-slate-100 flex-col bg-slate-50/50 h-full">
        {/* Header Search Box */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center">
            <Users className="h-4.5 w-4.5 text-red-600 mr-2" />
            Messagerie Interne
          </h2>
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchContactTerm}
              onChange={(e) => setSearchContactTerm(e.target.value)}
              placeholder="Rechercher un contact..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 focus:bg-white border border-transparent focus:border-red-400 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-400 transition-all"
            />
          </div>
        </div>

        {/* Info Alert Context on Permissions */}
        <div className="p-3 bg-red-50/70 border-b border-red-100/50 text-[10px] text-red-800 font-bold leading-relaxed flex items-start gap-2">
          <Info className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
          <p>
            Rôle : <span className="underline font-black">{currentUser.role === 'Direction' ? 'Directeur' : currentUser.role === 'Administrateur' ? 'Chef de Service' : 'Employé'}</span>. Vous communiquez conformément aux habilitations de sécurité DGPC.
          </p>
        </div>

        {/* Contact List scroll container */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100/60 p-2 space-y-1">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-semibold text-xs px-4">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
              Aucun contact autorisé ou trouvé dans votre service.
            </div>
          ) : (
            filteredContacts.map(contact => {
              const unread = getUnreadCount(contact.username);
              const isActive = activeContact?.username === contact.username;
              const badge = getRoleBadge(contact.role);

              return (
                <button
                  key={contact.id}
                  onClick={() => setActiveContact(contact)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all border cursor-pointer ${
                    isActive
                      ? 'bg-red-50 text-red-800 border-red-100 shadow-xs'
                      : 'bg-transparent text-slate-700 border-transparent hover:bg-white hover:border-slate-200/60'
                  }`}
                >
                  {/* Circle Initials Badge representing DR, AD, EM */}
                  <div className={`h-11 w-11 rounded-full flex items-center justify-center font-black text-xs text-white shrink-0 shadow-sm ${badge.bg}`}>
                    {badge.code}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black truncate text-slate-900">{contact.fullName}</span>
                      {unread > 0 && (
                        <span className="h-4.5 min-w-[18px] px-1 rounded-full bg-red-600 text-white font-black text-[9px] flex items-center justify-center animate-bounce">
                          {unread}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 truncate flex items-center">
                      <Layers className="h-3 w-3 mr-1 shrink-0" />
                      {contact.service}
                    </p>
                    <p className="text-[9px] text-slate-500 font-semibold mt-0.5 flex items-center truncate">
                      <MapPin className="h-3 w-3 mr-0.5 shrink-0 text-red-500" />
                      {contact.region || 'DGPC'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Main Chat Conversation Screen (Cols 5-12) */}
      <div className="col-span-12 md:col-span-8 flex flex-col bg-white h-full overflow-hidden">
        {activeContact ? (
          <>
            {/* Active Contact Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-black text-xs text-white shrink-0 ${getRoleBadge(activeContact.role).bg}`}>
                  {getRoleBadge(activeContact.role).code}
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">{activeContact.fullName}</h3>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${getRoleBadge(activeContact.role).lightBg}`}>
                      {getRoleBadge(activeContact.role).label}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold">•</span>
                    <span className="text-[9px] text-slate-500 font-bold">{activeContact.service}</span>
                  </div>
                </div>
              </div>

              {/* Quick Contact Switcher Dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-black uppercase text-slate-400 hidden lg:inline-block">Échanger avec :</label>
                <div className="relative">
                  <select
                    value={activeContact.username}
                    onChange={(e) => {
                      const found = allowedContacts.find(c => c.username === e.target.value);
                      if (found) setActiveContact(found);
                    }}
                    className="appearance-none pl-3 pr-8 py-2 bg-slate-100 hover:bg-slate-200 border border-transparent hover:border-slate-300 rounded-2xl text-xs font-black text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-red-400 transition-all"
                  >
                    {allowedContacts.map(c => {
                      const unread = getUnreadCount(c.username);
                      const badgeText = unread > 0 ? ` (${unread} ✉️)` : '';
                      const badge = getRoleBadge(c.role);
                      return (
                        <option key={c.id} value={c.username}>
                          {c.fullName} ({badge.label}){badgeText}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-3.5 h-3 w-3 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Message Body Container */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/20">
              {activeChatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 font-semibold text-xs">
                  <Sparkles className="h-10 w-10 text-amber-500/70 animate-pulse mb-3" />
                  <p className="text-slate-600 font-black mb-1">Début de la conversation sécurisée</p>
                  <p className="max-w-xs text-[10px] text-slate-400 font-bold">
                    Envoyez un message pour démarrer la liaison logistique directe. Vos échanges sont cryptés.
                  </p>
                </div>
              ) : (
                activeChatMessages.map((msg, index) => {
                  const isMe = msg.senderUsername === currentUser.username;
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2 animate-fade-in`}
                    >
                      {/* Avatar for recipient only */}
                      {!isMe && (
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-black text-[10px] text-white shrink-0 ${getRoleBadge(activeContact.role).bg}`}>
                          {getRoleBadge(activeContact.role).code}
                        </div>
                      )}

                      <div className={`max-w-[75%] space-y-1`}>
                        <div className={`rounded-3xl p-3.5 text-xs font-medium leading-relaxed ${
                          isMe 
                            ? 'bg-red-600 text-white rounded-br-none shadow-md shadow-red-600/5' 
                            : 'bg-white text-slate-800 border border-slate-200/60 rounded-bl-none shadow-xs'
                        }`}>
                          {msg.content}
                        </div>
                        <div className={`flex items-center gap-1.5 px-1.5 text-[9px] text-slate-400 font-bold ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <span>{msg.timestamp}</span>
                          {isMe && <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Message Box */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 flex items-center gap-2 bg-white">
              <input
                type="text"
                required
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                placeholder="Rédiger votre message logistique d'urgence..."
                className="flex-1 px-4 py-3 bg-slate-50 focus:bg-white border border-slate-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-2xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
              />
              <button
                type="submit"
                className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-lg shadow-red-500/10 hover:shadow-red-500/25 transition-all cursor-pointer flex items-center justify-center shrink-0"
              >
                <Send className="h-4.5 w-4.5 transform rotate-0" />
              </button>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 font-bold">
            <MessageSquare className="h-14 w-14 text-slate-200 animate-bounce mb-3" />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Messagerie GIS-DGPC</h3>
            <p className="max-w-xs text-[11px] text-slate-400 mt-1">
              Sélectionnez un contact autorisé dans le panneau latéral pour entamer la communication.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
