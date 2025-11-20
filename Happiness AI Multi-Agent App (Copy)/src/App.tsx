import { useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { ProfileTab } from './components/ProfileTab';
import { ChatTab } from './components/ChatTab';
import { ImaginationTab } from './components/ImaginationTab';
import { LibraryTab } from './components/LibraryTab';
import { PlannerTab } from './components/PlannerTab';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [activeTab, setActiveTab] = useState('profile');

  const renderTab = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileTab onNavigate={setActiveTab} />;
      case 'chat':
        return <ChatTab />;
      case 'imagination':
        return <ImaginationTab />;
      case 'library':
        return <LibraryTab />;
      case 'planner':
        return <PlannerTab />;
      default:
        return <ProfileTab onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {renderTab()}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <Toaster />
    </div>
  );
}