import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Image as ImageIcon, 
  Video, 
  FileText,
  Mic,
  Search,
  Filter,
  Play,
  Calendar,
  Users
} from 'lucide-react';
import { motion } from 'motion/react';
import { Input } from './ui/input';
import { mockLibraryItems } from '../utils/mock-data';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function LibraryTab() {
  const [activeTab, setActiveTab] = useState<'personal' | 'notes'>('personal');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const personalItems = mockLibraryItems.personal;
  const notesItems = mockLibraryItems.notes;

  return (
    <div className="min-h-screen pb-20" style={{
      background: 'linear-gradient(to bottom, #1e1a28 0%, #3d2f4a 50%, #f5ebe0 100%)'
    }}>
      {/* Header - Two-tone glassmorphism */}
      <div className="text-white p-6 rounded-b-3xl shadow-lg" style={{
        background: 'linear-gradient(135deg, rgba(100, 120, 200, 0.2) 0%, rgba(230, 215, 195, 0.15) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl mb-1">Library</h1>
            <p className="text-indigo-100 text-sm">Your organized archive</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
          >
            <Filter size={24} />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-300" size={20} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your library..."
            className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-indigo-200 focus:bg-white/30"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'personal' | 'notes')}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <ImageIcon size={16} />
              Personal
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <FileText size={16} />
              Notes
            </TabsTrigger>
          </TabsList>

          {/* Personal Media Tab */}
          <TabsContent value="personal" className="space-y-4">
            {/* Filter Tags */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <Badge
                variant={selectedFilter === null ? 'default' : 'outline'}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setSelectedFilter(null)}
              >
                All
              </Badge>
              <Badge
                variant={selectedFilter === 'image' ? 'default' : 'outline'}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setSelectedFilter('image')}
              >
                <ImageIcon size={14} className="mr-1" />
                Images
              </Badge>
              <Badge
                variant={selectedFilter === 'video' ? 'default' : 'outline'}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setSelectedFilter('video')}
              >
                <Video size={14} className="mr-1" />
                Videos
              </Badge>
            </div>

            {/* Media Grid */}
            <div className="grid grid-cols-2 gap-3">
              {personalItems
                .filter((item) => !selectedFilter || item.type === selectedFilter)
                .map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group">
                      <div className="relative aspect-square">
                        <ImageWithFallback
                          src={item.type === 'image' ? item.url : item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        {item.type === 'video' && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                            <div className="bg-white rounded-full p-3">
                              <Play className="text-indigo-600" size={24} />
                            </div>
                            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                              {item.duration}
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                            <p className="text-sm mb-1">{item.title}</p>
                            <div className="flex gap-1 flex-wrap">
                              {item.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-xs bg-white/20 hover:bg-white/30"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <p className="text-xs text-gray-500">{item.date}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
            </div>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-4">
            {notesItems.map((note, index) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="mb-1">{note.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar size={14} />
                          {note.date}
                        </div>
                      </div>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {note.type === 'meeting' ? (
                          <>
                            <Users size={14} />
                            Meeting
                          </>
                        ) : (
                          <>
                            <Mic size={14} />
                            Voice
                          </>
                        )}
                      </Badge>
                    </div>

                    {note.type === 'meeting' && 'summary' in note && (
                      <>
                        <p className="text-sm text-gray-600 mb-3">{note.summary}</p>
                        
                        {note.actionItems && note.actionItems.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm mb-2">Action Items:</p>
                            <ul className="space-y-1">
                              {note.actionItems.map((item, i) => (
                                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                  <span className="text-blue-600 mt-1">•</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {note.participants && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Users size={14} />
                            {note.participants.join(', ')}
                          </div>
                        )}
                      </>
                    )}

                    {note.type === 'voice-memo' && 'transcript' in note && (
                      <>
                        <p className="text-sm text-gray-600 mb-2">{note.transcript}</p>
                        <p className="text-xs text-gray-500">Duration: {note.duration}</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}