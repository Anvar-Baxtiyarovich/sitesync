'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface AuthorUser {
  fullName: string;
  username: string;
  jobTitle: string;
  avatarUrl: string;
  nativeLanguage: string;
}

interface MessageItem {
  id: string;
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
  author: AuthorUser;
  translationsJson: {
    uz: string;
    ru: string;
    en: string;
    zh: string;
  };
}

export default function GroupChatPage({ params }: { params: { lang: string; id: string } }) {
  const groupId = params?.id || 'grp_wind_01';
  const [activeLang, setActiveLang] = useState<'uz' | 'ru' | 'en' | 'zh'>(
    (params?.lang as any) || 'uz'
  );

  // Active Sender Profile Simulator
  const [activeSender, setActiveSender] = useState<'uz' | 'zh' | 'en' | 'ru'>('uz');

  const senderProfiles = {
    uz: {
      name: 'Anvar Khudoyberdiev',
      job: 'Site Manager (Obyekt Boshlig\'i)',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      lang: 'uz',
    },
    zh: {
      name: 'Li Wei (李伟)',
      job: 'EPC Project Director (项目总监)',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      lang: 'zh',
    },
    en: {
      name: 'Sarah Jenkins',
      job: 'QA/QC Lead Engineer',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      lang: 'en',
    },
    ru: {
      name: 'Dmitry Ivanov',
      job: 'Chief Civil Engineer',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      lang: 'ru',
    },
  };

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [expandedOriginalIds, setExpandedOriginalIds] = useState<Record<string, boolean>>({});

  // Multiple File Attachment State
  const [selectedFiles, setSelectedFiles] = useState<
    Array<{
      url: string;
      name: string;
      type: string;
      size: string;
    }>
  >([]);

  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live Camera Capture States
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);

  // Add Member Modal State
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [newMemberJob, setNewMemberJob] = useState('');
  const [newMemberLang, setNewMemberLang] = useState<'uz' | 'ru' | 'en' | 'zh'>('uz');
  const [addMemberMsg, setAddMemberMsg] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const sampleAttachments = [
    {
      name: '🏗️ Turbine_5_Rotor_Assembly_Blueprint_v3.pdf',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      type: 'PDF',
      size: '4.8 MB',
    },
    {
      name: '📸 Foundation_Pouring_Site_Inspection.jpg',
      url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800',
      type: 'IMAGE',
      size: '2.3 MB',
    },
    {
      name: '📊 Dashtobod_EPC_Project_Timeline_Schedule.pdf',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      type: 'PDF',
      size: '1.2 MB',
    },
  ];

  // Camera Management Functions
  const startCamera = async (mode = facingMode) => {
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: true,
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera Access Error:', err);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (isRecording) {
      stopRecordingVideo();
    }
    setIsCameraModalOpen(false);
  };

  const openCameraModal = async () => {
    setIsAttachmentModalOpen(false);
    setIsCameraModalOpen(true);
    setTimeout(() => startCamera(facingMode), 200);
  };

  const flipCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const photoFile = {
        url: dataUrl,
        name: `📸 camera_photo_${timestamp}.jpg`,
        type: 'IMAGE',
        size: '1.8 MB',
      };

      setSelectedFiles((prev) => [...prev, photoFile]);
      stopCamera();
    }
  };

  const startRecordingVideo = () => {
    if (!mediaStreamRef.current) return;

    recordedChunksRef.current = [];
    try {
      const recorder = new MediaRecorder(mediaStreamRef.current);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/mp4' });
        const videoUrl = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        const videoFile = {
          url: videoUrl,
          name: `🎥 camera_video_${timestamp}.mp4`,
          type: 'VIDEO',
          size: `${(blob.size / (1024 * 1024)).toFixed(1)} MB`,
        };

        setSelectedFiles((prev) => [...prev, videoFile]);
        stopCamera();
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('MediaRecorder Error:', err);
    }
  };

  const stopRecordingVideo = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
      }
    }
  };

  const handleDeviceFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const filesArray = Array.from(e.target.files).map((file) => {
      const isImg = file.type.startsWith('image/');
      const isVid = file.type.startsWith('video/');
      const fileUrl = URL.createObjectURL(file);
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);

      return {
        url: fileUrl,
        name: file.name,
        type: isImg ? 'IMAGE' : isVid ? 'VIDEO' : file.name.endsWith('.pdf') ? 'PDF' : 'DOCUMENT',
        size: `${sizeMb} MB`,
      };
    });

    setSelectedFiles((prev) => [...prev, ...filesArray]);
    setIsAttachmentModalOpen(false);
  };

  const toggleSampleFile = (sample: { url: string; name: string; type: string; size: string }) => {
    setSelectedFiles((prev) => {
      const exists = prev.some((f) => f.name === sample.name);
      if (exists) {
        return prev.filter((f) => f.name !== sample.name);
      } else {
        return [...prev, sample];
      }
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/v1/groups/${groupId}/messages`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Fetch messages error:', err);
    }
  };

  useEffect(() => {
    fetchMessages();
    // 5 soniyada bir yangi xabarlarni tekshirish
    const pollInterval = setInterval(fetchMessages, 5000);
    return () => clearInterval(pollInterval);
  }, [groupId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddMemberMsg(null);

    try {
      const res = await fetch(`/api/v1/groups/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newMemberName,
          username: newMemberUsername,
          jobTitle: newMemberJob,
          nativeLanguage: newMemberLang,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAddMemberMsg(`✅ ${data.message || 'A-zo qo-shildi!'}`);
        setNewMemberName('');
        setNewMemberUsername('');
        setNewMemberJob('');
        setTimeout(() => {
          setIsAddMemberOpen(false);
          setAddMemberMsg(null);
        }, 1500);
      }
    } catch {
      setAddMemberMsg('❌ Xatolik yuz berdi.');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim() && selectedFiles.length === 0) return;

    setIsSending(true);
    const profile = senderProfiles[activeSender];

    try {
      const res = await fetch(`/api/v1/groups/${groupId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: profile.name,
          authorJob: profile.job,
          authorAvatar: profile.avatar,
          sourceLanguage: profile.lang,
          contentRaw: inputContent,
          attachmentsJson: selectedFiles.length > 0 ? selectedFiles : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.groupMessage) {
        setMessages((prev) => [...prev, data.groupMessage]);
      }

      setInputContent('');
      setSelectedFiles([]);
    } catch (err) {
      console.error('Send message error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const toggleOriginal = (id: string) => {
    setExpandedOriginalIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
      {/* Top Group Navbar */}
      <header className="bg-slate-800 border-b border-slate-700 p-4 px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-4">
          <Link
            href={`/${activeLang}/groups`}
            className="w-9 h-9 rounded-xl bg-slate-700 hover:bg-slate-600 flex items-center justify-center font-bold text-white transition"
          >
            ←
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white">
                Dashtobod Wind Turbine EPC Team 🌬️
              </h1>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                4-WAY AI SYNC
              </span>
            </div>
            <p className="text-xs text-slate-400">
              A-zolar: Anvar (UZ), Li Wei (ZH), Sarah (EN), Dmitry (RU)
            </p>
          </div>
        </div>

        {/* Action Buttons: Add Member & Language Switcher */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsAddMemberOpen(true)}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <span>👤+</span>
            <span>A-zo Qo-shish</span>
          </button>

          <div className="bg-slate-900 p-1 rounded-xl border border-slate-700 flex text-xs font-bold">
            {[
              { code: 'uz', label: '🇺🇿 UZB' },
              { code: 'ru', label: '🇷🇺 RUS' },
              { code: 'en', label: '🇬🇧 ENG' },
              { code: 'zh', label: '🇨🇳 CHN' },
            ].map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setActiveLang(l.code as any)}
                className={`px-2.5 py-1 rounded-lg transition ${
                  activeLang === l.code
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Active Sender Profile Simulator Bar */}
      <div className="bg-slate-800/60 border-b border-slate-700/80 p-3 px-6 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-emerald-400">
            👤 Kim bo-lib xabar yozmoqchisiz (Sender Simulator):
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {[
            { key: 'uz', label: '🇺🇿 Anvar (Site Manager)' },
            { key: 'zh', label: '🇨🇳 Li Wei (Project Director)' },
            { key: 'en', label: '🇬🇧 Sarah (QA Lead)' },
            { key: 'ru', label: '🇷🇺 Dmitry (Civil Eng)' },
          ].map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setActiveSender(p.key as any)}
              className={`px-3 py-1.5 rounded-xl font-bold transition text-xs whitespace-nowrap ${
                activeSender === p.key
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Stream Container */}
      <main className="flex-1 p-4 md:p-6 max-w-4xl w-full mx-auto space-y-4 overflow-y-auto">
        {messages.map((msg) => {
          const translatedText = msg.translationsJson?.[activeLang] || msg.contentRaw;
          const isOriginalExpanded = expandedOriginalIds[msg.id];

          return (
            <div key={msg.id} className="flex items-start gap-3 group">
              <img
                src={msg.author.avatarUrl}
                alt={msg.author.fullName}
                className="w-10 h-10 rounded-2xl border border-slate-700 object-cover mt-1"
              />

              <div className="flex-1 bg-slate-800 border border-slate-700 rounded-3xl p-4 shadow-lg space-y-2">
                <div className="flex justify-between items-center border-b border-slate-700/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{msg.author.fullName}</span>
                    <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-700">
                      {msg.author.jobTitle}
                    </span>
                    <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                      {msg.sourceLanguage.toUpperCase()}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-500">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Auto-Translated Message Content */}
                <p className="text-slate-100 text-sm font-medium leading-relaxed">
                  {translatedText}
                </p>

                {/* Multi-File Attachments Gallery or Single File Display */}
                {((msg.attachmentsJson && msg.attachmentsJson.length > 0) || msg.fileUrl) && (
                  <div className="mt-3 pt-3 border-t border-slate-700/60 space-y-2">
                    {/* Render Multi-File Array */}
                    {msg.attachmentsJson && msg.attachmentsJson.length > 0 ? (
                      <div className="space-y-2">
                        {/* Image Grid */}
                        {msg.attachmentsJson.some((f) => f.type === 'IMAGE') && (
                          <div className="grid grid-cols-2 gap-2">
                            {msg.attachmentsJson
                              .filter((f) => f.type === 'IMAGE')
                              .map((img, i) => (
                                <div key={i} className="space-y-1">
                                  <img
                                    src={img.url}
                                    alt={img.name}
                                    className="max-h-48 w-full rounded-2xl border border-slate-700 object-cover shadow-sm hover:scale-[1.02] transition"
                                  />
                                  <span className="text-[10px] text-slate-400 font-bold block truncate">
                                    📸 {img.name}
                                  </span>
                                </div>
                              ))}
                          </div>
                        )}

                        {/* Video Player Display */}
                        {msg.attachmentsJson
                          .filter((f) => f.type === 'VIDEO')
                          .map((vid, i) => (
                            <div key={i} className="space-y-1">
                              <video
                                src={vid.url}
                                controls
                                className="max-h-60 w-full rounded-2xl border border-slate-700 object-cover shadow-sm"
                              />
                              <span className="text-[10px] text-slate-400 font-bold block truncate">
                                🎥 {vid.name} ({vid.size || 'Video'})
                              </span>
                            </div>
                          ))}

                        {/* Document List */}
                        {msg.attachmentsJson
                          .filter((f) => f.type !== 'IMAGE' && f.type !== 'VIDEO')
                          .map((doc, i) => (
                            <a
                              key={i}
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-3 bg-slate-900 hover:bg-slate-950 border border-slate-700 rounded-2xl flex items-center justify-between gap-3 group transition"
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                <span className="text-2xl p-2 bg-slate-800 rounded-xl border border-slate-700">
                                  📄
                                </span>
                                <div className="overflow-hidden">
                                  <span className="font-bold text-xs text-white block truncate group-hover:text-emerald-400 transition">
                                    {doc.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block font-mono">
                                    {doc.type || 'PDF'} • {doc.size || '1.5 MB'}
                                  </span>
                                </div>
                              </div>
                              <span className="px-3 py-1.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold rounded-xl whitespace-nowrap">
                                📥 Yuklab Olish
                              </span>
                            </a>
                          ))}
                      </div>
                    ) : (
                      /* Single Legacy File Fallback */
                      msg.fileType === 'IMAGE' ? (
                        <div className="space-y-1.5">
                          <img
                            src={msg.fileUrl!}
                            alt={msg.fileName || 'Attachment'}
                            className="max-h-60 rounded-2xl border border-slate-700 object-cover shadow-sm hover:scale-[1.01] transition"
                          />
                          <span className="text-[10px] text-slate-400 font-bold block">
                            📸 {msg.fileName} ({msg.fileSize || 'Image'})
                          </span>
                        </div>
                      ) : msg.fileType === 'VIDEO' ? (
                        <div className="space-y-1.5">
                          <video
                            src={msg.fileUrl!}
                            controls
                            className="max-h-60 w-full rounded-2xl border border-slate-700 object-cover shadow-sm"
                          />
                          <span className="text-[10px] text-slate-400 font-bold block">
                            🎥 {msg.fileName} ({msg.fileSize || 'Video'})
                          </span>
                        </div>
                      ) : (
                        <a
                          href={msg.fileUrl!}
                          target="_blank"
                          rel="noreferrer"
                          className="p-3 bg-slate-900 hover:bg-slate-950 border border-slate-700 rounded-2xl flex items-center justify-between gap-3 group transition"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <span className="text-2xl p-2 bg-slate-800 rounded-xl border border-slate-700">
                              📄
                            </span>
                            <div className="overflow-hidden">
                              <span className="font-bold text-xs text-white block truncate group-hover:text-emerald-400 transition">
                                {msg.fileName || 'Blueprint Document.pdf'}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-mono">
                                {msg.fileType || 'PDF'} • {msg.fileSize || '3.5 MB'}
                              </span>
                            </div>
                          </div>
                          <span className="px-3 py-1.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold rounded-xl whitespace-nowrap">
                            📥 Yuklab Olish
                          </span>
                        </a>
                      )
                    )}
                  </div>
                )}

                {/* Original Raw Text Inspector */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => toggleOriginal(msg.id)}
                    className="text-[10px] font-bold text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <span>{isOriginalExpanded ? '▲ Asl nusxasini yashirish' : `▼ Asl nusxasi (${msg.sourceLanguage.toUpperCase()})`}</span>
                  </button>

                  {isOriginalExpanded && (
                    <div className="mt-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-slate-300 italic font-mono">
                      "{msg.contentRaw}"
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </main>

      {/* Message Input Box & File Attachment Options */}
      <footer className="bg-slate-800 border-t border-slate-700 p-4 pb-20 sticky bottom-0 z-30 space-y-3">
        {/* Hidden File Input for Device Selection */}
        <input
          type="file"
          ref={fileInputRef}
          multiple
          onChange={handleDeviceFilesSelected}
          className="hidden"
        />

        {/* Selected Files Chips Indicator Bar */}
        {selectedFiles.length > 0 && (
          <div className="max-w-4xl mx-auto p-3 bg-slate-900 border border-slate-700 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <span>📎</span> Biriktirilgan fayllar ({selectedFiles.length} ta):
              </span>
              <button
                type="button"
                onClick={() => setSelectedFiles([])}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-200 uppercase"
              >
                Barchasini tozalash ✕
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl flex items-center gap-2 text-xs text-white shadow-sm"
                >
                  <span>{file.type === 'IMAGE' ? '📸' : '📄'}</span>
                  <span className="font-bold max-w-[200px] truncate">{file.name}</span>
                  <span className="text-[10px] font-mono text-slate-400">{file.size}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="w-4 h-4 rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 font-bold flex items-center justify-center text-[10px] ml-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-3">
          {/* File Attachment Button -> Opens Persistent Modal */}
          <button
            type="button"
            onClick={() => setIsAttachmentModalOpen(true)}
            className="p-3.5 bg-slate-700 hover:bg-slate-600 text-white rounded-2xl font-bold transition flex items-center justify-center text-sm shadow-md gap-1"
            title="Fayllar yoki chizmalar biriktirish"
          >
            <span>📎</span>
            {selectedFiles.length > 0 && (
              <span className="bg-emerald-500 text-slate-900 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                {selectedFiles.length}
              </span>
            )}
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              placeholder={
                activeSender === 'zh'
                  ? '输入消息... (将自动翻译为乌兹别克语/英语/俄语)'
                  : activeSender === 'en'
                  ? 'Type message... (Will auto-translate to UZ/ZH/RU)'
                  : 'Xabar yozing... (Avtomatik ravishda Xitoy/Ingliz/Rus tillariga tarjima qilinadi)'
              }
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              className="w-full p-3.5 px-5 rounded-2xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-24"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
              AI SYNC {senderProfiles[activeSender].lang.toUpperCase()}
            </span>
          </div>

          <button
            type="submit"
            disabled={isSending}
            className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-2xl shadow-lg transition disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
          >
            <span>🚀</span>
            <span>{isSending ? 'Tarjima qilinmoqda...' : 'Yuborish'}</span>
          </button>
        </form>
      </footer>

      {/* Modal: File Selection Menu (Device vs System Samples) */}
      {isAttachmentModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-700 text-slate-100">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>📎</span>
                <span>Fayl va Chizmalar Biriktirish (Multiple Files)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAttachmentModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-700 text-slate-300 font-bold hover:bg-slate-600 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Option 1: Device File Picker */}
              <div className="p-4 bg-slate-900 border border-slate-700 rounded-2xl space-y-2">
                <span className="font-bold text-sm text-white block">
                  💻 1. Qurilmadagi Fayllardan Tanlash
                </span>
                <p className="text-slate-400 text-[11px]">
                  Kompyuter yoki telefoningizdan istalgancha rasm (`.jpg`, `.png`), chizma (`.pdf`) yoki hujjatlarni bir vaqtda tanlang.
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-md mt-2"
                >
                  <span>📂</span>
                  <span>Qurilmadan Fayllarni Tanlash (Multiple Files)</span>
                </button>
              </div>

              {/* Option 2: System Sample Engineering Blueprints */}
              <div className="p-4 bg-slate-900 border border-slate-700 rounded-2xl space-y-3">
                <span className="font-bold text-sm text-white block">
                  📂 2. Tizimdagi Namuna Chizmalar va Hujjatlardan Tanlash
                </span>
                <div className="space-y-2">
                  {sampleAttachments.map((f) => {
                    const isChecked = selectedFiles.some((item) => item.name === f.name);
                    return (
                      <button
                        key={f.name}
                        type="button"
                        onClick={() => toggleSampleFile(f)}
                        className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                          isChecked
                            ? 'bg-emerald-950/80 border-emerald-500 text-white'
                            : 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] font-bold ${
                            isChecked ? 'bg-emerald-500 border-emerald-500 text-slate-900' : 'border-slate-600'
                          }`}>
                            {isChecked ? '✓' : ''}
                          </span>
                          <span className="font-medium text-[11px] truncate">{f.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 ml-2 whitespace-nowrap">
                          {f.size}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Option 3: Live Camera Capture (Photo & Video) */}
              <div className="p-4 bg-slate-900 border border-slate-700 rounded-2xl space-y-2">
                <span className="font-bold text-sm text-white block">
                  📸 3. Kamera Orqali Surat yoki Video Olish
                </span>
                <p className="text-slate-400 text-[11px]">
                  Telefoningiz yoki kompyuteringiz kamerasini yoqib, obyektni jonli shaklda suratga yoki videoga oling.
                </p>
                <button
                  type="button"
                  onClick={openCameraModal}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-md mt-2"
                >
                  <span>📷</span>
                  <span>Kamerani Yoqish (Surat / Video)</span>
                </button>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-700 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAttachmentModalOpen(false)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition text-center"
                >
                  Tayyor ({selectedFiles.length} ta fayl biriktirildi) ✓
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Live Camera Capture Viewport */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-700 text-slate-100 relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">📸</span>
                <h3 className="text-base font-black text-white">Jonli Kamera (Live Viewport)</h3>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 font-bold hover:bg-slate-700 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Video Preview Canvas */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {isRecording && (
                <div className="absolute top-4 left-4 bg-red-600/90 text-white font-mono text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span>🔴 REC {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:{String(recordingSeconds % 60).padStart(2, '0')}</span>
                </div>
              )}

              <button
                type="button"
                onClick={flipCamera}
                className="absolute top-4 right-4 bg-slate-800/80 hover:bg-slate-800 text-white p-2 rounded-xl border border-slate-700 text-xs font-bold shadow-md transition"
                title="Kamerani almashtirish"
              >
                🔄 Almashtirish
              </button>
            </div>

            {/* Camera Controls */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={capturePhoto}
                disabled={isRecording}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-lg transition flex items-center gap-2 disabled:opacity-40"
              >
                <span>📸</span>
                <span>Suratga Olish</span>
              </button>

              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecordingVideo}
                  className="px-5 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-2xl shadow-lg transition flex items-center gap-2"
                >
                  <span>🎥</span>
                  <span>Video Yozishni Boshlash</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecordingVideo}
                  className="px-5 py-3 bg-slate-100 hover:bg-white text-slate-900 font-bold text-xs rounded-2xl shadow-lg transition flex items-center gap-2 animate-pulse"
                >
                  <span>⏹️</span>
                  <span>Videoni To-xtatish va Saqlash</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Member to Project Group */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-700 text-slate-100">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>👤+</span>
                <span>Guruhga Yangi A-zo Qo-shish</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddMemberOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-700 text-slate-300 font-bold hover:bg-slate-600 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4 text-xs">
              {/* Select from Contacts List */}
              <div className="p-3 bg-slate-900 border border-slate-700 rounded-2xl space-y-2">
                <label className="block font-bold uppercase tracking-wider text-emerald-400 text-[11px] flex items-center gap-1">
                  <span>📇</span>
                  <span>1. Kontaktlarimdan Tanlash</span>
                </label>
                <div className="flex gap-2">
                  <Link
                    href={`/${activeLang}/contacts`}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5 text-[11px]"
                  >
                    <span>📇</span>
                    <span>Kontaktlarim Ro-yxatini Ochish</span>
                  </Link>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                  A-zoning Ismi va Familiyasi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="masalan: Bekzod Rahimov"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full p-3 border border-slate-600 rounded-xl bg-slate-900 text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Username (Foydalanuvchi Nomi yoki @alias) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="masalan: bekzod_qa"
                  value={newMemberUsername}
                  onChange={(e) => setNewMemberUsername(e.target.value)}
                  className="w-full p-3 border border-slate-600 rounded-xl bg-slate-900 text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Lavozimi (Job Title)
                </label>
                <input
                  type="text"
                  placeholder="masalan: Concrete Specialist, Electrical Inspector"
                  value={newMemberJob}
                  onChange={(e) => setNewMemberJob(e.target.value)}
                  className="w-full p-3 border border-slate-600 rounded-xl bg-slate-900 text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                  A-zoning Ona Tili (Ko-p Tilli Chat Uchun)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { code: 'uz', label: '🇺🇿 O-zbekcha' },
                    { code: 'ru', label: '🇷🇺 Русский' },
                    { code: 'en', label: '🇬🇧 English' },
                    { code: 'zh', label: '🇨🇳 中文' },
                  ].map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => setNewMemberLang(l.code as any)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 ${
                        newMemberLang === l.code
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-900 border-slate-700 text-slate-400'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {addMemberMsg && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold rounded-xl">
                  {addMemberMsg}
                </div>
              )}


              <div className="flex justify-end gap-2 border-t border-slate-700 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-xl"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition"
                >
                  Guruhga Qo-shish 🚀
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
