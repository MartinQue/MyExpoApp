import { useEffect, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ChevronRight, MapPin, Clock, TrendingUp, Award, BookOpen, Utensils } from 'lucide-react';
import { motion } from 'motion/react';
import { mockFeedCards } from '../utils/mock-data';

interface ProfileTabProps {
  onNavigate: (tab: string) => void;
}

export function ProfileTab({ onNavigate }: ProfileTabProps) {
  const [timeOfDay, setTimeOfDay] = useState('Morning');
  const [feedCards, setFeedCards] = useState(mockFeedCards);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('Morning');
    else if (hour < 18) setTimeOfDay('Afternoon');
    else setTimeOfDay('Evening');
  }, []);

  const getContextIcon = (context: string) => {
    switch (context) {
      case 'gym': return Award;
      case 'finance': return TrendingUp;
      case 'learning': return BookOpen;
      case 'cooking': return Utensils;
      default: return Clock;
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{
      background: 'linear-gradient(to bottom, #1a1820 0%, #2d2535 50%, #f5f1ed 100%)'
    }}>
      {/* Header - Warm off-white with glassmorphism */}
      <div className="text-white p-6 rounded-b-3xl shadow-lg" style={{
        background: 'linear-gradient(135deg, rgba(245, 241, 237, 0.15) 0%, rgba(220, 210, 200, 0.1) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl mb-1">Good {timeOfDay}!</h1>
            <p className="text-blue-100 text-sm">Here's your personalized feed</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <MapPin size={24} />
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          <Badge className="bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30">
            <Clock size={14} className="mr-1" />
            {timeOfDay}
          </Badge>
          <Badge className="bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30">
            <MapPin size={14} className="mr-1" />
            Home
          </Badge>
        </div>
      </div>

      {/* Mini Planner Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mx-4 mt-6"
      >
        <Card
          onClick={() => onNavigate('planner')}
          className="bg-gradient-to-r from-orange-500 to-pink-500 text-white cursor-pointer hover:shadow-xl transition-shadow border-0"
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80 mb-1">What's up next</p>
                <h3 className="text-lg">Gym session - Leg day</h3>
                <p className="text-sm text-white/90 mt-1">Today, 6:00 PM</p>
              </div>
              <ChevronRight size={28} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Contextual Feed */}
      <div className="px-4 mt-6 space-y-4">
        <h2 className="text-lg text-gray-600 mb-3">Your Story Today</h2>
        
        {feedCards.map((card, index) => {
          const ContextIcon = card.icon ? getContextIcon(card.context || '') : null;
          
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (index + 2) }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                {card.image && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={card.image}
                      alt={card.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      {card.title && (
                        <h3 className="text-lg mb-1">{card.title}</h3>
                      )}
                      <p className="text-gray-600">{card.content}</p>
                      {card.author && (
                        <p className="text-sm text-gray-500 mt-2 italic">— {card.author}</p>
                      )}
                    </div>
                    {ContextIcon && (
                      <div className="ml-3 bg-blue-100 p-2 rounded-lg">
                        <ContextIcon size={20} className="text-blue-600" />
                      </div>
                    )}
                  </div>
                  {card.type === 'achievement' && (
                    <Button className="w-full mt-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      View Progress
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Motivational Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mx-4 mt-8 mb-6 text-center"
      >
        <p className="text-gray-500 text-sm italic">
          "Every step forward is a step toward your best self"
        </p>
      </motion.div>
    </div>
  );
}