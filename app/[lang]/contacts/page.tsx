'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface ContactUser {
  id: string;
  fullName: string;
  username: string;
  jobTitle: string;
  avatarUrl: string;
  nativeLanguage: string;
  email: string;
}

interface ContactItem {
  id: string;
  userId: string;
  contactId: string;
  contact: ContactUser;
  createdAt: string;
}

interface DirectMsgItem {
  id: string;
  senderId: string;
  receiverId: string;
  sourceLanguage: string;
  contentRaw: string;
  createdAt: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: string;
  attachmentsJson?: Array<{
    url: string;
    name: string;
    type: string;
    size: string;
  }>;
  sender: ContactUser;
  receiver: ContactUser;
  translationsJson: {
    uz: string;
    ru: string;
    en: string;
    zh: string;
  };
}

export default function ContactsPage({ params }: { params: { lang: string } }) {
  const activeLang = params?.lang || 'uz';
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addInput, setAddInput] = useState('');
  const [addMsg, setAddMsg] = useState<string | null>(null);

  // Active Direct Chat Modal State
  const [activeContact, setActiveContact] = useState<ContactUser | null>(null);
  const [directMessages, setDirectMessages] = useState<DirectMsgItem[]>([]);
  const [dmInput, setDmInput] = useState('');
  const [isSendingDm, setIsSendingDm] = useState(false);
  const [expandedOriginalIds, setExpandedOriginalIds] = useState<Record<string, boolean>>({});

  const dmChatEndRef = useRef<HTMLDivElement>(null);

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/v1/contacts');
      const data = await res.json();
      if (data.contacts) {
        setContacts(data.contacts);
      }
    } catch (err) {
      console.error('Fetch contacts error:', err);
    }
  };

  useEffect(() => {
    fetchContacts();
    // 10 soniyada bir kontaktlarni yangilash
    const pollInterval = setInterval(fetchContacts, 10000);
    return () => clearInterval(pollInterval);
  }, []);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addInput.trim()) return;

    setAddMsg(null);
    try {
      const res = await fetch('/api/v1/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: addInput }),
      });

      const data = await res.json();
      if (res.ok && data.contact) {
        setAddMsg(`✅ ${data.message}`);
        setAddInput('');
        fetchContacts();
        setTimeout(() => {
          setIsAddModalOpen(false);
          setAddMsg(null);
        }, 1500);
      } else {
        setAddMsg(`❌ ${data.error || 'Xatolik yuz berdi'}`);
      }
    } catch {
      setAddMsg('❌ Xatolik yuz berdi.');
    }
  };

  const handleRemoveContact = async (contactId: string) => {
    if (!confirm("Ushbu kontaktni o'chirishni xohlaysizmi?")) return;

    try {
      await fetch(`/api/v1/contacts?contactId=${contactId}`, {
        method: 'DELETE',
      });
      setContacts((prev) => prev.filter((c) => c.contactId !== contactId));
    } catch (err) {
      console.error('Remove contact error:', err);
    }
  };

  const openDirectChat = async (contact: ContactUser) => {
    setActiveContact(contact);
    try {
      const res = await fetch(`/api/v1/directs/${contact.id}/messages`);
      const data = await res.json();
      if (data.messages) {
        setDirectMessages(data.messages);
      }
    } catch (err) {
      console.error('Fetch direct messages error:', err);
    }
  };

  useEffect(() => {
    dmChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [directMessages]);

  // Aktiv chat ochiq bo'lsa, 3 soniyada bir yangi xabarlarni tekshirish
  useEffect(() => {
    if (!activeContact) return;
    const fetchDmMessages = async () => {
      try {
        const res = await fetch(`/api/v1/directs/${activeContact.id}/messages`);
        const data = await res.json();
        if (data.messages) setDirectMessages(data.messages);
      } catch {}
    };
    fetchDmMessages();
    const pollInterval = setInterval(fetchDmMessages, 3000);
    return () => clearInterval(pollInterval);
  }, [activeContact?.id]);

  const handleSendDirectMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dmInput.trim() || !activeContact) return;

    setIsSendingDm(true);
    try {
      const res = await fetch(`/api/v1/directs/${activeContact.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceLanguage: activeLang,
          contentRaw: dmInput,
        }),
      });

      const data = await res.json();
      if (res.ok && data.directMessage) {
        setDirectMessages((prev) => [...prev, data.directMessage]);
        setDmInput('');
      }
    } catch (err) {
      console.error('Send direct message error:', err);
    } finally {
      setIsSendingDm(false);
    }
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.contact.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contact.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contact.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 px-6 sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link
              href={`/${activeLang}/groups`}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold text-white transition border border-slate-700"
            >
              ←
            </Link>
            <div>
              <h1 className="text-xl font-black text-white flex items-center gap-2">
                <span>📇</span>
                <span>Kontaktlarim & Shaxsiy Chatlar</span>
              </h1>
              <p className="text-xs text-slate-400">
                Hamkasblar bilan bog-lanish va yakkama-yakka (1-on-1) AI tarjimangiz
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
          >
            <span>👤+</span>
            <span>Yangi Kontakt Qo-shish</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Search Bar */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-lg flex items-center gap-3">
          <span className="text-lg text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Kontaktlardan qidirish (ism, username yoki lavozim)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-slate-500"
          />
        </div>

        {/* Contacts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between space-y-4 hover:border-slate-700 transition group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={item.contact.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                      alt={item.contact.fullName}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-700"
                    />
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 absolute -bottom-0.5 -right-0.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm group-hover:text-emerald-400 transition">
                      {item.contact.fullName}
                    </h3>
                    <span className="text-[11px] text-slate-400 block font-mono">
                      {item.contact.username}
                    </span>
                    <span className="text-[10px] text-emerald-300 font-bold bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 mt-1 inline-block">
                      {item.contact.nativeLanguage.toUpperCase()} (Ona tili)
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveContact(item.contactId)}
                  className="w-7 h-7 rounded-xl bg-slate-800 hover:bg-red-600/30 text-slate-400 hover:text-red-300 text-xs font-bold transition flex items-center justify-center"
                  title="Kontaktlardan o'chirish"
                >
                  ✕
                </button>
              </div>

              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-[11px] text-slate-400">
                <span>💼 Lavozimi: </span>
                <span className="text-white font-medium">{item.contact.jobTitle || 'Mutaxassis'}</span>
              </div>

              <button
                type="button"
                onClick={() => openDirectChat(item.contact)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2"
              >
                <span>💬</span>
                <span>Shaxsiy Xabar Yozish (1-on-1 Chat)</span>
              </button>
            </div>
          ))}
        </div>

        {filteredContacts.length === 0 && (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
            <span className="text-4xl block">📇</span>
            <h3 className="text-base font-bold text-white">Kontaktlar topilmadi</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Yuqoridagi "Yangi Kontakt Qo-shish" tugmasi orqali hamkasblaringizning username yoki ismini kiriting.
            </p>
          </div>
        )}
      </main>

      {/* Modal: Add New Contact */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-700 text-slate-100">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>👤+</span>
                <span>Yangi Kontakt Qo-shish</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 font-bold hover:bg-slate-700 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddContact} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Username, Email yoki Ismi bo-yicha qidirish *
                </label>
                <input
                  type="text"
                  required
                  placeholder="masalan: @liwei_epc, sarah@qa.com yoki Dmitry"
                  value={addInput}
                  onChange={(e) => setAddInput(e.target.value)}
                  className="w-full p-3.5 border border-slate-700 rounded-2xl bg-slate-950 text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {addMsg && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold rounded-xl text-center">
                  {addMsg}
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition"
                >
                  Kontaktlarga Qo-shish 🚀
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Direct 1-on-1 Chat Stream */}
      {activeContact && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-2xl w-full h-[85vh] shadow-2xl border border-slate-700 text-slate-100 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 px-6 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <img
                  src={activeContact.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                  alt={activeContact.fullName}
                  className="w-10 h-10 rounded-2xl border border-slate-600 object-cover"
                />
                <div>
                  <h3 className="font-black text-white text-base flex items-center gap-2">
                    <span>{activeContact.fullName}</span>
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                      {activeContact.nativeLanguage.toUpperCase()}
                    </span>
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    {activeContact.username} • {activeContact.jobTitle || 'Field Engineer'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveContact(null)}
                className="w-8 h-8 rounded-full bg-slate-700 text-slate-300 font-bold hover:bg-slate-600 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Direct Messages Oqimi */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-slate-950">
              {directMessages.map((msg) => {
                const isMe = msg.sender.email === 'anvar@sitesync.io';
                const translatedText = msg.translationsJson?.[activeLang as keyof typeof msg.translationsJson] || msg.contentRaw;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-md rounded-2xl p-3.5 space-y-1 shadow-md ${
                        isMe
                          ? 'bg-emerald-600 text-white rounded-br-none'
                          : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
                      }`}
                    >
                      <p className="text-sm font-medium leading-relaxed">{translatedText}</p>
                      <span className="text-[9px] opacity-70 block text-right">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={dmChatEndRef} />
            </div>

            {/* Direct Message Input */}
            <form onSubmit={handleSendDirectMessage} className="p-4 bg-slate-800 border-t border-slate-700 flex items-center gap-3">
              <input
                type="text"
                placeholder={`${activeContact.fullName}ga shaxsiy xabar yozing... (Avtomatik 4 tilli tarjimada keladi)`}
                value={dmInput}
                onChange={(e) => setDmInput(e.target.value)}
                className="flex-1 p-3.5 px-5 rounded-2xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={isSendingDm}
                className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-2xl shadow-lg transition disabled:opacity-50 flex items-center gap-2"
              >
                <span>🚀</span>
                <span>Yuborish</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
