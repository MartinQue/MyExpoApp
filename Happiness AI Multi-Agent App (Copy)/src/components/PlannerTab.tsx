import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Target, 
  ChevronRight, 
  Calendar,
  TrendingUp,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Quote
} from 'lucide-react';
import { motion } from 'motion/react';
import { mockPlans, motivationalQuotes } from '../utils/mock-data';

export function PlannerTab() {
  const [plans, setPlans] = useState(mockPlans);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [todayQuote] = useState(
    motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
  );

  const selectedPlanData = plans.find((p) => p.id === selectedPlan);

  if (selectedPlan && selectedPlanData) {
    return <PlanDetailView plan={selectedPlanData} onBack={() => setSelectedPlan(null)} />;
  }

  return (
    <div className="min-h-screen pb-20" style={{
      background: 'linear-gradient(to bottom, #1a2820 0%, #2f4a3d 50%, #f0f5e8 100%)'
    }}>
      {/* Header - Two-tone glassmorphism */}
      <div className="text-white p-6 rounded-b-3xl shadow-lg" style={{
        background: 'linear-gradient(135deg, rgba(80, 180, 120, 0.2) 0%, rgba(235, 240, 220, 0.15) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl mb-1">Your Journey</h1>
            <p className="text-green-100 text-sm">Track your goals and dreams</p>
          </div>
          <Target size={32} />
        </div>

        {/* Today's Quote */}
        <Card className="bg-white/20 backdrop-blur-sm border-white/30 mt-4">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Quote className="text-green-200 shrink-0" size={20} />
              <p className="text-white text-sm italic">{todayQuote}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overview Stats */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="mx-auto mb-2 text-green-600" size={24} />
              <p className="text-2xl">{plans.length}</p>
              <p className="text-xs text-gray-600">Active Goals</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="mx-auto mb-2 text-blue-600" size={24} />
              <p className="text-2xl">
                {Math.round(plans.reduce((acc, p) => acc + p.progress, 0) / plans.length)}%
              </p>
              <p className="text-xs text-gray-600">Avg Progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="mx-auto mb-2 text-purple-600" size={24} />
              <p className="text-2xl">
                {plans.reduce(
                  (acc, p) => acc + p.milestones.filter((m) => m.status === 'completed').length,
                  0
                )}
              </p>
              <p className="text-xs text-gray-600">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Goals List */}
        <div className="space-y-3">
          <h2 className="text-lg text-gray-600 mt-6 mb-3">Your Goals</h2>
          
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                onClick={() => setSelectedPlan(plan.id)}
                className="cursor-pointer hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="mb-1">{plan.title}</h3>
                      <p className="text-sm text-gray-600">{plan.description}</p>
                    </div>
                    <ChevronRight className="text-gray-400 shrink-0" size={20} />
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-600">Progress</span>
                      <span className="text-xs">{plan.progress}%</span>
                    </div>
                    <Progress value={plan.progress} className="h-2" />
                  </div>

                  {/* Next Task */}
                  <div className="bg-green-50 rounded-lg p-3 mb-3">
                    <div className="flex items-start gap-2">
                      <Clock className="text-green-600 shrink-0 mt-0.5" size={16} />
                      <div className="flex-1">
                        <p className="text-xs text-green-800 mb-1">Next up</p>
                        <p className="text-sm">{plan.nextTask}</p>
                        <p className="text-xs text-green-600 mt-1">{plan.dueDate}</p>
                      </div>
                    </div>
                  </div>

                  {/* Milestones Preview */}
                  <div className="flex gap-1">
                    {plan.milestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        className={`flex-1 h-1 rounded-full ${
                          milestone.status === 'completed'
                            ? 'bg-green-500'
                            : milestone.status === 'in-progress'
                            ? 'bg-blue-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Add New Goal Button */}
        <Button className="w-full h-12 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700">
          <Sparkles size={20} className="mr-2" />
          Create New Goal
        </Button>
      </div>
    </div>
  );
}

function PlanDetailView({ plan, onBack }: { plan: any; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-b-3xl shadow-lg">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-white hover:bg-white/20 mb-4 -ml-2"
        >
          ← Back
        </Button>
        
        <h1 className="text-2xl mb-2">{plan.title}</h1>
        <p className="text-green-100 mb-4">{plan.description}</p>

        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-green-100">Overall Progress</span>
            <span className="text-lg">{plan.progress}%</span>
          </div>
          <Progress value={plan.progress} className="h-3 bg-white/20" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Motivation Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Quote className="shrink-0" size={20} />
                <p className="italic text-sm">{plan.motivationQuote}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Next Task */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="text-green-600" size={20} />
              What's Next
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2">{plan.nextTask}</p>
            <Badge variant="outline" className="flex items-center gap-1 w-fit">
              <Calendar size={14} />
              {plan.dueDate}
            </Badge>
          </CardContent>
        </Card>

        {/* Milestones Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {plan.milestones.map((milestone: any, index: number) => (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="shrink-0 mt-1">
                    {milestone.status === 'completed' ? (
                      <CheckCircle2 className="text-green-500" size={24} />
                    ) : milestone.status === 'in-progress' ? (
                      <div className="relative">
                        <Circle className="text-blue-500" size={24} />
                        <motion.div
                          className="absolute inset-0"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        >
                          <Circle className="text-blue-500" size={24} strokeDasharray="50 50" />
                        </motion.div>
                      </div>
                    ) : (
                      <Circle className="text-gray-300" size={24} />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <p className={`${
                      milestone.status === 'completed' ? 'line-through text-gray-500' : ''
                    }`}>
                      {milestone.title}
                    </p>
                    <Badge
                      variant="outline"
                      className={`mt-1 text-xs ${
                        milestone.status === 'completed'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : milestone.status === 'in-progress'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}
                    >
                      {milestone.status === 'completed'
                        ? 'Completed'
                        : milestone.status === 'in-progress'
                        ? 'In Progress'
                        : 'Upcoming'}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Breakdown (mock) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">This Week's Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {['Monday', 'Wednesday', 'Friday'].map((day, i) => (
              <div key={day} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <input type="checkbox" className="w-4 h-4" defaultChecked={i === 0} />
                <div className="flex-1">
                  <p className="text-sm">{day} - Practice session</p>
                  <p className="text-xs text-gray-500">30 minutes</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}