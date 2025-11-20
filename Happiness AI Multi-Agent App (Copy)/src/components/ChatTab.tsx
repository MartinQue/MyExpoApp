import { useState, useRef, useEffect } from 'react';
import { Menu, Mic, Camera, Volume2, Lightbulb, Grid3x3, Paperclip, ChevronDown, MessageSquare, Trash2, Settings, X, Flame, ScanLine, Shirt, Eraser, Speaker } from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { AnimatedAvatar } from './AnimatedAvatar';
import { mockChatHistory } from '../utils/mock-data';

type ViewMode = 'ask' | 'alterego';

export function ChatTab() {
  const [messages, setMessages] = useState(mockChatHistory);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentView, setCurrentView] = useState<ViewMode>('ask');
  const [selectedExpert, setSelectedExpert] = useState('Expert');
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [speakMode, setSpeakMode] = useState(false);
  const [alterEgoStarted, setAlterEgoStarted] = useState(false);
  const [alterEgoChatMode, setAlterEgoChatMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-hide Start talking button after 3-5 seconds on Alter Ego view
  useEffect(() => {
    if (currentView === 'alterego' && !alterEgoStarted) {
      const timer = setTimeout(() => {
        setAlterEgoStarted(true);
      }, 4000); // 4 seconds
      
      return () => clearTimeout(timer);
    }
  }, [currentView, alterEgoStarted]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    setIsSpeaking(true);
    
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: "I understand. Let me help you with that. What would you like to know more about?",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsSpeaking(false);
    }, 1500);
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset < -50 || velocity < -500) {
      setCurrentView('alterego');
    } else if (offset > 50 || velocity > 500) {
      setCurrentView('ask');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
      {/* TOP NAV - 80pt height - FIXED */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-20 px-4 bg-black/40 backdrop-blur-xl border-b border-white/10">
        {/* Left - Hamburger Icon - 24x24pt, 16pt left margin (included in px-4) */}
        <button className="text-white hover:bg-white/10 p-1 rounded-lg transition-colors">
          <Menu size={24} />
        </button>

        {/* Center - Only 2 Tabs: Ask and Alter Ego */}
        <div className="flex items-center gap-5">
          <button
            onClick={() => setCurrentView('ask')}
            className={`relative transition-colors ${
              currentView === 'ask' ? 'text-white' : 'text-[#8A8A8A]'
            }`}
            style={{ fontSize: '16px', fontWeight: 500 }}
          >
            Ask
            {currentView === 'ask' && (
              <motion.div
                layoutId="activeViewTab"
                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white"
                style={{ width: 'calc(100% + 8px)', left: '-4px' }}
              />
            )}
          </button>
          <button
            onClick={() => setCurrentView('alterego')}
            className={`relative transition-colors ${
              currentView === 'alterego' ? 'text-white' : 'text-[#8A8A8A]'
            }`}
            style={{ fontSize: '16px', fontWeight: 500 }}
          >
            Alter Ego
            {currentView === 'alterego' && (
              <motion.div
                layoutId="activeViewTab"
                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white"
                style={{ width: 'calc(100% + 8px)', left: '-4px' }}
              />
            )}
          </button>
        </div>

        {/* Right - Bell or Grid Icon - 24x24pt */}
        <button className="text-white hover:bg-white/10 p-1 rounded-lg transition-colors">
          {currentView === 'ask' ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          ) : (
            <Grid3x3 size={24} />
          )}
        </button>
      </div>

      {/* Main Content Area - Starts BELOW nav with padding */}
      <motion.div
        className="flex-1 relative overflow-hidden"
        style={{ marginTop: '80px', paddingTop: '12px' }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
      >
        <AnimatePresence mode="wait" initial={false}>
          {currentView === 'ask' ? (
            /* ASK VIEW - Solid black background */
            <motion.div
              key="ask"
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 bg-black"
            >
              <div className="h-full flex flex-col px-4 overflow-y-auto pb-[140px]">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center flex-1">
                    <div className="text-center space-y-4">
                      <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full opacity-20" />
                      <h2 className="text-xl text-gray-400">How can I help you today?</h2>
                    </div>
                  </div>
                ) : (
                  <div className="w-full space-y-2.5 py-6">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {message.role === 'user' ? (
                          <div className="flex justify-end">
                            <div className="max-w-[80%] px-4 py-2.5 bg-gray-700/60 backdrop-blur-sm text-white" style={{ borderRadius: '20px' }}>
                              <p>{message.content}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-white space-y-3">
                            <p className="leading-relaxed">{message.content}</p>
                            
                            {/* Action buttons */}
                            <div className="flex items-center gap-3 text-gray-500">
                              <button className="hover:text-white transition-colors" title="Copy">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                              </button>
                              <button className="hover:text-white transition-colors" title="Share">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                                  <polyline points="16 6 12 2 8 6"></polyline>
                                  <line x1="12" y1="2" x2="12" y2="15"></line>
                                </svg>
                              </button>
                              <button className="hover:text-white transition-colors" title="Like">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                                </svg>
                              </button>
                              <button className="hover:text-white transition-colors" title="Dislike">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
                                </svg>
                              </button>
                              <button className="hover:text-white transition-colors" title="Refresh">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="23 4 23 10 17 10"></polyline>
                                  <polyline points="1 20 1 14 7 14"></polyline>
                                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                                </svg>
                              </button>
                              <button className="hover:text-white transition-colors" title="More">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="1"></circle>
                                  <circle cx="19" cy="12" r="1"></circle>
                                  <circle cx="5" cy="12" r="1"></circle>
                                </svg>
                              </button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}

                    {isSpeaking && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="flex gap-2">
                          <motion.div
                            className="w-2 h-2 bg-gray-400 rounded-full"
                            animate={{ scale: [1, 1.5, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                          />
                          <motion.div
                            className="w-2 h-2 bg-gray-400 rounded-full"
                            animate={{ scale: [1, 1.5, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                          />
                          <motion.div
                            className="w-2 h-2 bg-gray-400 rounded-full"
                            animate={{ scale: [1, 1.5, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                          />
                        </div>
                      </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            /* ALTER EGO VIEW - Gradient background */
            <motion.div
              key="alterego"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(ellipse at top, rgba(147, 51, 234, 0.3) 0%, rgba(219, 39, 119, 0.2) 30%, rgba(0, 0, 0, 1) 70%)'
              }}
            >
              <div className="h-full flex flex-col items-center justify-start pb-[200px] relative" style={{ paddingTop: '50px' }}>
                {/* Avatar - 230-270pt width, centered */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="relative flex items-center justify-center"
                  style={{ width: '250px', height: '400px' }}
                >
                  <div className="w-64 h-64 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-full opacity-20 blur-3xl absolute" />
                  <AnimatedAvatar
                    isListening={isListening}
                    isSpeaking={isSpeaking}
                    avatarId="avatar1"
                    fullScreen={false}
                  />
                </motion.div>

                {/* Start Talking Button - Large red pill above chat bar */}
                {!alterEgoStarted && (
                  <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    onClick={() => setAlterEgoStarted(true)}
                    className="absolute z-40 text-white transition-all hover:scale-105 flex items-center justify-center gap-3"
                    style={{
                      bottom: '220px',
                      width: '180px',
                      height: '48px',
                      borderRadius: '24px',
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                      backdropFilter: 'blur(20px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      fontSize: '16px',
                      fontWeight: 500,
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    <span>Start talking</span>
                    {/* Animated Equalizer - 3 tiny moving bars */}
                    <div className="flex items-center gap-0.5">
                      <motion.div
                        animate={{ height: ['8px', '16px', '8px'] }}
                        transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ width: '3px', backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '2px' }}
                      />
                      <motion.div
                        animate={{ height: ['12px', '8px', '12px'] }}
                        transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                        style={{ width: '3px', backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '2px' }}
                      />
                      <motion.div
                        animate={{ height: ['10px', '14px', '10px'] }}
                        transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                        style={{ width: '3px', backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '2px' }}
                      />
                    </div>
                  </motion.button>
                )}

                {/* Right-Side Action Buttons - 24pt right margin, positioned near avatar shoulder */}
                <motion.div
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="fixed z-30"
                  style={{ 
                    right: '24px',
                    top: '30%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  {/* Button specs: 42pt circle, 21pt icons, rgba(0,0,0,0.5) bg */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex items-center justify-center text-white"
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <Flame size={21} />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex items-center justify-center text-white"
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <ScanLine size={21} />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex items-center justify-center text-white"
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <Shirt size={21} />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex items-center justify-center text-white"
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <Eraser size={21} />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex items-center justify-center text-white"
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <Speaker size={21} />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex items-center justify-center text-white"
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <Settings size={21} />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex items-center justify-center text-white"
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <X size={21} />
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* BOTTOM COMPOSER - Total zone: 140pt */}
      {/* Positioned to sit above bottom tab bar with 8-10pt gap */}
      <div className="fixed left-0 right-0 z-50" style={{ bottom: '88px' }}>
        <div className="flex flex-col items-center justify-end" style={{ paddingLeft: '16px', paddingRight: '16px' }}>
          <AnimatePresence mode="wait">
            {currentView === 'ask' ? (
              <div key="ask-input" className="w-full flex flex-col items-center">
                {/* Speak Mode Controls - Row of round buttons above chat bar */}
                {speakMode && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    className="w-full flex items-center justify-center gap-4 mb-4"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center justify-center text-white"
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(27, 30, 35, 0.8)',
                        backdropFilter: 'blur(20px)'
                      }}
                    >
                      <Camera size={22} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center justify-center text-white"
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(27, 30, 35, 0.8)',
                        backdropFilter: 'blur(20px)'
                      }}
                    >
                      <Speaker size={22} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center justify-center text-white"
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(27, 30, 35, 0.8)',
                        backdropFilter: 'blur(20px)'
                      }}
                    >
                      <Mic size={22} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center justify-center text-white"
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(27, 30, 35, 0.8)',
                        backdropFilter: 'blur(20px)'
                      }}
                    >
                      <Settings size={22} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center justify-center text-white"
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(27, 30, 35, 0.8)',
                        backdropFilter: 'blur(20px)'
                      }}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                        <line x1="9" y1="9" x2="9.01" y2="9"></line>
                        <line x1="15" y1="9" x2="15.01" y2="9"></line>
                      </svg>
                    </motion.button>
                  </motion.div>
                )}

                {/* Attachment Menu Popover */}
                {showAttachmentMenu && (
                  <motion.div
                    initial={{ y: 20, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 20, opacity: 0, scale: 0.95 }}
                    className="absolute bottom-24 left-0 right-0 mx-4"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(40px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      borderRadius: '24px',
                      padding: '8px',
                      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
                    }}
                  >
                    <div className="space-y-1">
                      <button 
                        onClick={() => setShowAttachmentMenu(false)}
                        className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-white/10 transition-all text-left"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10">
                          <Camera size={20} className="text-white" />
                        </div>
                        <span className="text-white text-base">Camera</span>
                      </button>
                      <button 
                        onClick={() => setShowAttachmentMenu(false)}
                        className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-white/10 transition-all text-left"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                          </svg>
                        </div>
                        <span className="text-white text-base">Photos</span>
                      </button>
                      <button 
                        onClick={() => setShowAttachmentMenu(false)}
                        className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-white/10 transition-all text-left"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                            <polyline points="13 2 13 9 20 9"></polyline>
                          </svg>
                        </div>
                        <span className="text-white text-base">Files</span>
                      </button>
                      <button 
                        onClick={() => setShowAttachmentMenu(false)}
                        className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-white/10 transition-all text-left"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10">
                          <Lightbulb size={20} className="text-white" />
                        </div>
                        <span className="text-white text-base">Create image</span>
                      </button>
                      <button 
                        onClick={() => setShowAttachmentMenu(false)}
                        className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-white/10 transition-all text-left"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </div>
                        <span className="text-white text-base">Edit image</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ASK VIEW COMPOSER - Translucent glass - TALLER */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1, height: speakMode ? '56px' : '96px' }}
                  exit={{ y: 20, opacity: 0 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(27, 30, 35, 0.8)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: speakMode ? '28px' : '48px',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: '20px',
                    paddingRight: '20px',
                    gap: '14px'
                  }}
                >
                  {/* Paperclip - 24pt */}
                  <button 
                    onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                    className="flex-shrink-0 text-gray-400 hover:text-white transition-colors" 
                    style={{ padding: '6px' }}
                  >
                    <Paperclip size={24} />
                  </button>

                  {/* Text Input - "Ask Anything" */}
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Ask Anything"
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-[#8A8A8A] min-w-0"
                    style={{ 
                      fontSize: '17px',
                      color: 'white',
                      caretColor: 'white'
                    }}
                  />

                  {/* Speak/Stop Button */}
                  <button
                    onClick={() => setSpeakMode(!speakMode)}
                    className="flex-shrink-0 bg-white hover:bg-gray-100 text-black transition-colors flex items-center justify-center gap-2"
                    style={{
                      width: speakMode ? '76px' : '90px',
                      height: speakMode ? '36px' : '46px',
                      borderRadius: speakMode ? '18px' : '23px',
                      fontSize: '16px',
                      fontWeight: 500
                    }}
                  >
                    {speakMode ? (
                      <>
                        <div style={{ width: '8px', height: '8px', backgroundColor: '#EF4444', borderRadius: '2px' }} />
                        <span>Stop</span>
                      </>
                    ) : (
                      <>
                        <Volume2 size={18} />
                        <span>Speak</span>
                      </>
                    )}
                  </button>
                </motion.div>
              </div>
            ) : (
              /* ALTER EGO VIEW COMPOSER */
              <div key="alterego-input" className="w-full flex items-center gap-3">
                {/* Mic + Camera buttons - 40pt circles, positioned to the LEFT of chat bar */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  className="flex gap-3.5 flex-shrink-0"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsListening(!isListening)}
                    className="flex items-center justify-center text-white border border-gray-700/50"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(27, 30, 35, 0.8)',
                      backdropFilter: 'blur(20px)'
                    }}
                  >
                    <Mic size={20} />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center justify-center text-white border border-gray-700/50"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(27, 30, 35, 0.8)',
                      backdropFilter: 'blur(20px)'
                    }}
                  >
                    <Camera size={20} />
                  </motion.button>
                </motion.div>

                {/* Input Bar - Shorter pill shape for Alter Ego */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  className="flex-1"
                  style={{
                    height: '56px',
                    backgroundColor: 'rgba(27, 30, 35, 0.8)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: '18px',
                    paddingRight: '18px',
                    gap: '12px',
                    maxWidth: 'calc(100% - 104px)' // Accounts for mic+camera buttons and gaps
                  }}
                >
                  {/* Paperclip for Alter Ego */}
                  <button 
                    onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                    className="flex-shrink-0 text-gray-400 hover:text-white transition-colors" 
                    style={{ padding: '6px' }}
                  >
                    <Paperclip size={24} />
                  </button>

                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={alterEgoChatMode ? "Chat with Alter Ego" : "Ask Anything"}
                    onFocus={() => setAlterEgoChatMode(true)}
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-[#8A8A8A] min-w-0"
                    style={{ 
                      fontSize: '17px',
                      color: 'white',
                      caretColor: 'white'
                    }}
                  />
                  {/* Text/Call Button */}
                  <button
                    onClick={() => {
                      if (!alterEgoChatMode) {
                        setAlterEgoChatMode(true);
                      } else {
                        handleSend();
                      }
                    }}
                    className="flex-shrink-0 bg-white hover:bg-gray-100 text-black transition-colors flex items-center justify-center gap-2"
                    style={{
                      width: alterEgoChatMode ? '82px' : '82px',
                      height: '46px',
                      borderRadius: '23px',
                      fontSize: '16px',
                      fontWeight: 500
                    }}
                  >
                    {alterEgoChatMode ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                        <span>Call</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare size={16} />
                        <span>Text</span>
                      </>
                    )}
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}