import { Home, MessageCircle, Sparkles, Library, Target } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'profile', icon: Home, label: 'Home' },
    { id: 'chat', icon: MessageCircle, label: 'Chat' },
    { id: 'imagination', icon: Sparkles, label: 'Imagine' },
    { id: 'library', icon: Library, label: 'Library' },
    { id: 'planner', icon: Target, label: 'Planner' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40" style={{
      background: 'linear-gradient(180deg, rgba(20, 18, 24, 0.85) 0%, rgba(30, 26, 35, 0.9) 100%)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255, 255, 255, 0.08)'
    }}>
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
                  isActive ? 'text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Icon
                  className={`transition-transform duration-200 ${
                    isActive ? 'scale-110' : 'scale-100'
                  }`}
                  size={24}
                />
                <span className="text-xs">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* iOS-style home indicator */}
      <div className="flex justify-center pb-2">
        <div className="w-32 h-1 bg-white/30 rounded-full" />
      </div>
    </div>
  );
}