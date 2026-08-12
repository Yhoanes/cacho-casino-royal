import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Smile, ChevronDown, Sparkles } from 'lucide-react';

const EXPRESS_EMOTES = ['🤣', '🤡', '💀', '🤫', '🤬', '🤑'];

export default function GameChat({
  socket,
  roomCode,
  currentUserId,
  currentUserName,
  messages = [],
  onSendMessage,
  onSendEmote,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showEmotePicker, setShowEmotePicker] = useState(false);
  const [inputText, setInputText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnreadCount(0);
    }
  }, [messages, isOpen]);

  // Handle new message arrival when closed
  useEffect(() => {
    if (!isOpen && messages.length > 0) {
      setUnreadCount((prev) => prev + 1);
    }
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
    setShowEmotePicker(false);
  };

  const handleEmoteClick = (emote) => {
    onSendEmote(emote);
    setShowEmotePicker(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 select-none">
      {/* Floating Collapsible Trigger Button */}
      {!isOpen && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="p-3.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-zinc-950 shadow-gold-glow border border-amber-300 transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer group"
            title="Abrir Chat de la Mesa"
          >
            <MessageSquare className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* Unread Badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-600 border-2 border-zinc-950 text-white font-black text-xs flex items-center justify-center animate-bounce shadow-lg">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      )}

      {/* Floating Glassmorphic Chat Box */}
      {isOpen && (
        <div className="w-80 sm:w-96 glass-panel-gold rounded-3xl p-4 shadow-2xl border-2 border-amber-400/70 flex flex-col h-96 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-amber-500/20 mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-400 stroke-[2.5]" />
              <h4 className="font-black font-cinzel text-amber-400 text-base">
                Chat Casino
              </h4>
            </div>

            <div className="flex items-center gap-2">
              {/* Quick Emote Reaction Bar Trigger */}
              <button
                type="button"
                onClick={() => setShowEmotePicker(!showEmotePicker)}
                className={`p-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${
                  showEmotePicker
                    ? 'bg-amber-500/30 border-amber-400 text-amber-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-amber-400'
                }`}
                title="Reacciones Rápidas (Emotes)"
              >
                <Smile className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Emote Reactions Bar */}
          {showEmotePicker && (
            <div className="mb-3 p-2 rounded-2xl bg-zinc-950/90 border border-amber-500/30 grid grid-cols-6 gap-1 animate-fade-in shadow-inner">
              {EXPRESS_EMOTES.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => handleEmoteClick(em)}
                  className="p-2 rounded-xl text-xl hover:bg-amber-500/20 hover:scale-125 transition-all text-center"
                >
                  {em}
                </button>
              ))}
            </div>
          )}

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-500 italic text-center font-medium">
                Sin mensajes. ¡Sé el primero en chatear! 🎲
              </div>
            ) : (
              messages.map((msg) => {
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

          {/* Input Box */}
          <form onSubmit={handleSend} className="mt-3 flex gap-2 pt-2 border-t border-amber-500/20">
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
  );
}
