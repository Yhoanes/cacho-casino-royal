import React, { useState, useEffect, useRef } from 'react';
import { Smile, MessageSquare, X, Send, Sparkles } from 'lucide-react';

const RIVALRY_EMOTES = [
  { char: '🤣', title: 'Risa / Me río de tu fallo' },
  { char: '🤡', title: 'Payaso / Jugada tonta' },
  { char: '💀', title: 'Calavera / Te rayaste' },
  { char: '🤫', title: 'Silencio / Te callé' },
  { char: '🤬', title: 'Rabia / Me rayé' },
  { char: '🤑', title: 'Suerte / Tiro perfecto' },
];

export default function SocialControlsFAB({
  roomCode,
  currentUserId,
  chatMessages = [],
  onSendMessage,
  onSendEmote,
}) {
  const [isEmoteOpen, setIsEmoteOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef(null);

  // Auto-scroll chat to bottom when open
  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnreadCount(0);
    }
  }, [chatMessages, isChatOpen]);

  // Handle unread messages badge
  useEffect(() => {
    if (!isChatOpen && chatMessages.length > 0) {
      setUnreadCount((prev) => prev + 1);
    }
  }, [chatMessages]);

  const handleEmoteClick = (emoteChar) => {
    onSendEmote(emoteChar);
    setIsEmoteOpen(false);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 select-none">
      {/* 1. Asynchronous Emotes FAB Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setIsEmoteOpen(!isEmoteOpen);
            if (isChatOpen) setIsChatOpen(false);
          }}
          className={`w-12 h-12 rounded-full border shadow-gold-glow transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer ${
            isEmoteOpen
              ? 'bg-amber-400 text-zinc-950 border-amber-300'
              : 'bg-zinc-950/80 backdrop-blur-xl text-amber-400 border-amber-500/50 hover:border-amber-400'
          }`}
          title="Reacciones de Rivalidad (Emotes)"
        >
          <Smile className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Upward Popover Menu for Emotes (Mobile-First bottom-full) */}
        {isEmoteOpen && (
          <div className="absolute bottom-full mb-3 right-0 flex items-center gap-1.5 p-2 rounded-2xl glass-panel-gold border-2 border-amber-400/90 shadow-2xl animate-fade-in z-50">
            {RIVALRY_EMOTES.map((em) => (
              <button
                key={em.char}
                type="button"
                onClick={() => handleEmoteClick(em.char)}
                className="p-2 sm:p-2.5 rounded-xl text-2xl hover:bg-amber-500/30 hover:scale-125 transition-all text-center cursor-pointer active:scale-90"
                title={em.title}
              >
                {em.char}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. In-Game Chat FAB Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setIsChatOpen(!isChatOpen);
            if (isEmoteOpen) setIsEmoteOpen(false);
          }}
          className={`w-12 h-12 rounded-full shadow-gold-glow transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer ${
            isChatOpen
              ? 'bg-zinc-950 text-amber-400 border-2 border-amber-400'
              : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-zinc-950 border border-amber-300'
          }`}
          title="Chat de la Mesa"
        >
          <MessageSquare className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Unread Message Badge Counter */}
        {!isChatOpen && unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-600 border-2 border-zinc-950 text-white font-black text-xs flex items-center justify-center animate-bounce shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}

        {/* Upward Glassmorphic Chat Drawer (Mobile-First bottom-full) */}
        {isChatOpen && (
          <div className="absolute bottom-full mb-3 right-0 w-80 sm:w-96 glass-panel-gold rounded-3xl p-4 shadow-2xl border-2 border-amber-400/80 flex flex-col h-96 animate-fade-in z-50">
            {/* Chat Header */}
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/20 mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-400 stroke-[2.5]" />
                <h4 className="font-black font-cinzel text-amber-400 text-base">
                  Chat Casino
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Messages Feed */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
              {chatMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-zinc-500 italic text-center font-medium">
                  Sin mensajes en la mesa. ¡Sé el primero! 🎲
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.userId === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] font-bold text-zinc-400 mb-0.5 px-1">
                        {isMe ? 'Tú' : msg.senderName} • {msg.timestamp}
                      </span>
                      <div
                        className={`max-w-[85%] px-3.5 py-2 rounded-2xl font-semibold shadow-md ${
                          isMe
                            ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-950 rounded-tr-none font-bold'
                            : 'bg-zinc-900/90 border border-zinc-800 text-zinc-200 rounded-tl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Emotes inside Chat */}
            <div className="my-2 pt-2 border-t border-amber-500/20 flex items-center justify-between gap-1 overflow-x-auto pb-1">
              {RIVALRY_EMOTES.map((em) => (
                <button
                  key={em.char}
                  type="button"
                  onClick={() => handleEmoteClick(em.char)}
                  className="p-1.5 rounded-xl text-lg hover:bg-amber-500/20 hover:scale-125 transition-all"
                  title={em.title}
                >
                  {em.char}
                </button>
              ))}
            </div>

            {/* Chat Input Form */}
            <form onSubmit={handleSendChat} className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribe un mensaje..."
                maxLength={120}
                className="flex-1 px-3.5 py-2.5 rounded-2xl bg-zinc-950 border border-amber-500/30 text-white placeholder-zinc-500 text-xs font-semibold focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className={`p-2.5 rounded-2xl font-bold transition-all shadow ${
                  inputText.trim()
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-950 hover:scale-105 active:scale-95 cursor-pointer'
                    : 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
