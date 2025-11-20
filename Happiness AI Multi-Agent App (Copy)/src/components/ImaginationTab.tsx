import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Video, 
  Upload, 
  Wand2,
  Lock,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function ImaginationTab() {
  const [prompt, setPrompt] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [generatedMedia, setGeneratedMedia] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationType, setGenerationType] = useState<'image' | 'video'>('image');
  const [freeTrialsLeft, setFreeTrialsLeft] = useState(3);

  const handleGenerate = async () => {
    if (!prompt.trim() && uploadedImages.length === 0) return;

    if (freeTrialsLeft <= 0) {
      // Show paywall
      alert('You\'ve used all your free trials! Subscribe to continue creating amazing content.');
      return;
    }

    setIsGenerating(true);

    // Simulate generation
    setTimeout(() => {
      const newMedia = {
        id: Date.now().toString(),
        type: generationType,
        prompt: prompt,
        url: generationType === 'image' 
          ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe'
          : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
        thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
        timestamp: new Date(),
      };

      setGeneratedMedia([newMedia, ...generatedMedia]);
      setIsGenerating(false);
      setFreeTrialsLeft(freeTrialsLeft - 1);
      setPrompt('');
    }, 3000);
  };

  const models = [
    { id: 'sora', name: 'Sora', type: 'video', isPro: true },
    { id: 'dalle', name: 'DALL-E 3', type: 'image', isPro: false },
    { id: 'midjourney', name: 'Midjourney', type: 'image', isPro: true },
    { id: 'runway', name: 'Runway', type: 'video', isPro: true },
    { id: 'stable-diffusion', name: 'Stable Diffusion', type: 'image', isPro: false },
  ];

  const examplePrompts = [
    'Me surfing on a tropical beach at sunset',
    'Professional headshot in business attire',
    'Dancing at a concert with friends',
    'Cooking in a modern kitchen',
  ];

  return (
    <div className="min-h-screen pb-20" style={{
      background: 'linear-gradient(to bottom, #2d1b3d 0%, #4a2c5a 50%, #f5e6d3 100%)'
    }}>
      {/* Header - Dark to warm gradient with glassmorphism */}
      <div className="text-white p-6 rounded-b-3xl shadow-lg" style={{
        background: 'linear-gradient(135deg, rgba(141, 88, 180, 0.2) 0%, rgba(218, 165, 32, 0.15) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl mb-1">Imagination Studio</h1>
            <p className="text-purple-100 text-sm">Bring your visions to life</p>
          </div>
          <Sparkles size={32} />
        </div>

        <div className="flex gap-2 mt-4">
          <Badge className="bg-white/20 backdrop-blur-sm border-white/30">
            <Zap size={14} className="mr-1" />
            {freeTrialsLeft} free {freeTrialsLeft === 1 ? 'trial' : 'trials'} left
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Creation Type Tabs */}
        <Tabs value={generationType} onValueChange={(v) => setGenerationType(v as 'image' | 'video')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="image" className="flex items-center gap-2">
              <ImageIcon size={16} />
              Image
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-2">
              <Video size={16} />
              Video
            </TabsTrigger>
          </TabsList>

          <TabsContent value="image" className="space-y-4 mt-4">
            <CreateSection
              type="image"
              prompt={prompt}
              setPrompt={setPrompt}
              uploadedImages={uploadedImages}
              setUploadedImages={setUploadedImages}
              isGenerating={isGenerating}
              onGenerate={handleGenerate}
              examplePrompts={examplePrompts}
              models={models.filter(m => m.type === 'image')}
            />
          </TabsContent>

          <TabsContent value="video" className="space-y-4 mt-4">
            <CreateSection
              type="video"
              prompt={prompt}
              setPrompt={setPrompt}
              uploadedImages={uploadedImages}
              setUploadedImages={setUploadedImages}
              isGenerating={isGenerating}
              onGenerate={handleGenerate}
              examplePrompts={examplePrompts}
              models={models.filter(m => m.type === 'video')}
            />
          </TabsContent>
        </Tabs>

        {/* Generated Content Gallery */}
        {generatedMedia.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Creations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {generatedMedia.map((media, index) => (
                  <motion.div
                    key={media.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
                  >
                    <ImageWithFallback
                      src={media.thumbnail}
                      alt={media.prompt}
                      className="w-full h-full object-cover"
                    />
                    {media.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Video className="text-white" size={32} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-2 left-2 right-2 text-white text-xs">
                        {media.prompt}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscription CTA */}
        {freeTrialsLeft <= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Lock size={24} />
                  <div className="flex-1">
                    <h3 className="text-lg mb-2">Unlock Unlimited Creativity</h3>
                    <p className="text-sm text-purple-100 mb-4">
                      Get unlimited access to all AI models, faster generation, and exclusive features.
                    </p>
                    <Button className="bg-white text-purple-600 hover:bg-purple-50">
                      Subscribe Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

interface CreateSectionProps {
  type: 'image' | 'video';
  prompt: string;
  setPrompt: (prompt: string) => void;
  uploadedImages: string[];
  setUploadedImages: (images: string[]) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  examplePrompts: string[];
  models: any[];
}

function CreateSection({
  type,
  prompt,
  setPrompt,
  uploadedImages,
  setUploadedImages,
  isGenerating,
  onGenerate,
  examplePrompts,
  models,
}: CreateSectionProps) {
  return (
    <>
      {/* Model Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Choose AI Model</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {models.map((model) => (
              <Badge
                key={model.id}
                variant="outline"
                className="cursor-pointer hover:bg-purple-50 hover:border-purple-300"
              >
                {model.name}
                {model.isPro && <Lock size={12} className="ml-1" />}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upload Images */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload Reference Images</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer">
            <Upload className="mx-auto mb-2 text-gray-400" size={32} />
            <p className="text-sm text-gray-600">Upload 1-3 images to help AI learn your features</p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB each</p>
          </div>
        </CardContent>
      </Card>

      {/* Prompt Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Describe Your Vision</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`Describe what you want to create... e.g., "Me ${
              type === 'video' ? 'dancing at a beach party' : 'as a superhero'
            }"`}
            className="min-h-[100px]"
          />

          {/* Example Prompts */}
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Try these ideas:</p>
            <div className="flex gap-2 flex-wrap">
              {examplePrompts.map((example, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="cursor-pointer hover:bg-purple-50 hover:border-purple-300"
                  onClick={() => setPrompt(example)}
                >
                  {example}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <Button
        onClick={onGenerate}
        disabled={isGenerating || (!prompt.trim() && uploadedImages.length === 0)}
        className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
      >
        {isGenerating ? (
          <span className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Wand2 size={20} />
            </motion.div>
            Generating...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Sparkles size={20} />
            Generate {type === 'image' ? 'Image' : 'Video'}
          </span>
        )}
      </Button>
    </>
  );
}