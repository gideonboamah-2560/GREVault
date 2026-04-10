import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  BrainCircuit, 
  LayoutDashboard, 
  MessageSquare, 
  Plus, 
  Search, 
  X,
  ChevronRight,
  GraduationCap,
  Trophy,
  History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { getWordDetails, chatWithTutor } from '@/lib/gemini';

// --- Types ---
interface Word {
  id: string;
  term: string;
  definition: string;
  synonyms: string[];
  example: string;
  learned: boolean;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

// --- Mock Data ---
const INITIAL_WORDS: Word[] = [
  {
    id: '1',
    term: 'Abate',
    definition: 'To become less active, less intense, or less in amount.',
    synonyms: ['Decrease', 'Subside', 'Decline'],
    example: 'As I began my speech, my feelings of nervousness quickly abated.',
    learned: true,
    difficulty: 'Medium'
  },
  {
    id: '2',
    term: 'Anomalous',
    definition: 'Deviating from what is standard, normal, or expected.',
    synonyms: ['Abnormal', 'Irregular', 'Atypical'],
    example: 'The scientist was puzzled by the anomalous results of the experiment.',
    learned: false,
    difficulty: 'Hard'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [words, setWords] = useState<Word[]>(INITIAL_WORDS);
  const [searchQuery, setSearchQuery] = useState('');
  const [newWord, setNewWord] = useState('');
  const [isAddingWord, setIsAddingWord] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // --- Handlers ---
  const handleAddWord = async () => {
    if (!newWord.trim()) return;
    setIsAddingWord(true);
    toast.info(`Fetching details for "${newWord}"...`);
    
    const details = await getWordDetails(newWord);
    if (details) {
      const word: Word = {
        id: Date.now().toString(),
        term: newWord,
        definition: details.definition || 'No definition found.',
        synonyms: details.synonyms || [],
        example: details.example || 'No example provided.',
        learned: false,
        difficulty: 'Medium'
      };
      setWords([word, ...words]);
      setNewWord('');
      toast.success(`Added "${newWord}" to your vault!`);
    } else {
      toast.error('Failed to fetch word details. Please try again.');
    }
    setIsAddingWord(false);
  };

  const toggleLearned = (id: string) => {
    setWords(words.map(w => w.id === id ? { ...w, learned: !w.learned } : w));
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsChatLoading(true);

    const aiResponse = await chatWithTutor(userMsg, []);
    setChatMessages(prev => [...prev, { role: 'ai', content: aiResponse || "I'm sorry, I couldn't process that." }]);
    setIsChatLoading(false);
  };

  const filteredWords = words.filter(w => 
    w.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.definition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: words.length,
    learned: words.filter(w => w.learned).length,
    remaining: words.filter(w => !w.learned).length,
    mastery: words.length > 0 ? Math.round((words.filter(w => w.learned).length / words.length) * 100) : 0
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
      <Toaster position="top-center" />
      
      {/* Sidebar / Navigation */}
      <nav className="fixed left-0 top-0 h-full w-20 md:w-64 bg-white border-r border-gray-200 z-50 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl">
            <GraduationCap className="text-white w-6 h-6" />
          </div>
          <h1 className="hidden md:block font-bold text-xl tracking-tight">GRE Vault</h1>
        </div>

        <div className="flex-1 px-4 py-6 space-y-2">
          <NavItem 
            icon={<LayoutDashboard />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<BookOpen />} 
            label="Vocabulary" 
            active={activeTab === 'vocabulary'} 
            onClick={() => setActiveTab('vocabulary')} 
          />
          <NavItem 
            icon={<BrainCircuit />} 
            label="Practice" 
            active={activeTab === 'practice'} 
            onClick={() => setActiveTab('practice')} 
          />
          <NavItem 
            icon={<MessageSquare />} 
            label="AI Tutor" 
            active={activeTab === 'tutor'} 
            onClick={() => setActiveTab('tutor')} 
          />
        </div>

        <div className="p-6 border-t border-gray-100">
          <div className="hidden md:block">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Progress</p>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-indigo-600"
                initial={{ width: 0 }}
                animate={{ width: `${stats.mastery}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">{stats.mastery}% Mastered</p>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="ml-20 md:ml-64 p-4 md:p-10">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <header>
                <h2 className="text-3xl font-bold">Welcome back, Scholar</h2>
                <p className="text-gray-500 mt-1">Here's your GRE preparation overview.</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Words" value={stats.total} icon={<BookOpen className="text-blue-500" />} />
                <StatCard title="Mastered" value={stats.learned} icon={<Trophy className="text-yellow-500" />} />
                <StatCard title="Learning" value={stats.remaining} icon={<History className="text-indigo-500" />} />
                <StatCard title="Mastery Rate" value={`${stats.mastery}%`} icon={<BrainCircuit className="text-purple-500" />} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Recent Words</CardTitle>
                    <CardDescription>The latest additions to your vault.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {words.slice(0, 3).map(word => (
                        <div key={word.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <div>
                            <p className="font-bold text-lg">{word.term}</p>
                            <p className="text-sm text-gray-500 line-clamp-1">{word.definition}</p>
                          </div>
                          <Badge variant={word.learned ? "default" : "outline"}>
                            {word.learned ? "Mastered" : "Learning"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <Button variant="link" className="mt-4 p-0" onClick={() => setActiveTab('vocabulary')}>
                      View all words <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>AI Tutor Tip</CardTitle>
                    <CardDescription>Daily study advice.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                      <p className="text-indigo-900 italic">
                        "Mnemonics are your best friend for GRE vocab. Try to associate 'Anomalous' with 'A-Normal' to remember it means deviating from normal."
                      </p>
                    </div>
                    <Button className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700" onClick={() => setActiveTab('tutor')}>
                      Ask AI Tutor
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === 'vocabulary' && (
            <motion.div 
              key="vocabulary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold">Vocabulary Vault</h2>
                  <p className="text-gray-500">Manage and learn your GRE word list.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      placeholder="Search words..." 
                      className="pl-10 w-full md:w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button className="bg-indigo-600" onClick={() => setIsAddingWord(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Add Word
                  </Button>
                </div>
              </div>

              {isAddingWord && (
                <Card className="border-indigo-200 bg-indigo-50/30">
                  <CardContent className="pt-6">
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Enter a new GRE word..." 
                        value={newWord}
                        onChange={(e) => setNewWord(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
                        disabled={isAddingWord && newWord === ''}
                      />
                      <Button onClick={handleAddWord} disabled={!newWord.trim() || isAddingWord}>
                        {isAddingWord ? 'AI Fetching...' : 'Add with AI'}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setIsAddingWord(false)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Our AI will automatically fetch the definition, synonyms, and an example sentence.
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredWords.map(word => (
                  <WordCard 
                    key={word.id} 
                    word={word} 
                    onToggleLearned={() => toggleLearned(word.id)} 
                  />
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'practice' && (
            <motion.div 
              key="practice"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl mx-auto space-y-8 py-10"
            >
              <div className="text-center">
                <h2 className="text-3xl font-bold">Flashcard Practice</h2>
                <p className="text-gray-500">Test your knowledge of the vault.</p>
              </div>
              
              <Flashcard words={words.filter(w => !w.learned)} />
            </motion.div>
          )}

          {activeTab === 'tutor' && (
            <motion.div 
              key="tutor"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-[calc(100vh-120px)] flex flex-col"
            >
              <Card className="flex-1 flex flex-col overflow-hidden">
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2">
                    <BrainCircuit className="text-indigo-600" />
                    AI GRE Tutor
                  </CardTitle>
                  <CardDescription>Ask anything about GRE Verbal, Quant, or AWA.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
                  <ScrollArea className="flex-1 p-6">
                    <div className="space-y-6">
                      {chatMessages.length === 0 && (
                        <div className="text-center py-20">
                          <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="text-indigo-600 w-8 h-8" />
                          </div>
                          <h3 className="font-bold text-lg">How can I help you today?</h3>
                          <p className="text-gray-500 max-w-xs mx-auto mt-2">
                            Try asking: "Explain the difference between 'Pragmatic' and 'Practical'" or "Give me a math tip for geometry."
                          </p>
                        </div>
                      )}
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-4 rounded-2xl ${
                            msg.role === 'user' 
                              ? 'bg-indigo-600 text-white rounded-tr-none' 
                              : 'bg-gray-100 text-gray-900 rounded-tl-none'
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {isChatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-none flex gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  <div className="p-4 border-t bg-gray-50">
                    <form onSubmit={handleChatSubmit} className="flex gap-2">
                      <Input 
                        placeholder="Type your question..." 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="bg-white"
                      />
                      <Button type="submit" className="bg-indigo-600" disabled={isChatLoading || !chatInput.trim()}>
                        Send
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Subcomponents ---

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
        active 
          ? 'bg-indigo-50 text-indigo-600 font-semibold shadow-sm' 
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <span className={active ? 'text-indigo-600' : 'text-gray-400'}>
        {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
      </span>
      <span className="hidden md:block">{label}</span>
    </button>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <Card className="border-none shadow-sm bg-white">
      <CardContent className="p-6 flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-gray-50">
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function WordCard({ word, onToggleLearned }: { word: Word, onToggleLearned: () => void, key?: string }) {
  return (
    <Card className="group hover:shadow-md transition-all border-gray-100">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-2xl">{word.term}</CardTitle>
          <Badge variant={word.difficulty === 'Hard' ? 'destructive' : 'secondary'}>
            {word.difficulty}
          </Badge>
        </div>
        <CardDescription className="text-gray-600 text-base leading-relaxed">
          {word.definition}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {word.synonyms.map((s, i) => (
            <Badge key={i} variant="outline" className="bg-gray-50/50 text-gray-500 font-normal">
              {s}
            </Badge>
          ))}
        </div>
        <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100/50">
          <p className="text-sm text-indigo-900 italic">"{word.example}"</p>
        </div>
        <Separator className="bg-gray-100" />
        <Button 
          variant={word.learned ? "outline" : "default"} 
          className={`w-full ${word.learned ? 'border-green-200 text-green-600 hover:bg-green-50' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          onClick={onToggleLearned}
        >
          {word.learned ? 'Mastered ✓' : 'Mark as Learned'}
        </Button>
      </CardContent>
    </Card>
  );
}

function Flashcard({ words }: { words: Word[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (words.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
        <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="font-bold text-xl">All caught up!</h3>
        <p className="text-gray-500 mt-2">You've mastered all the words in your vault.</p>
      </div>
    );
  }

  const currentWord = words[currentIndex];

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, 200);
  };

  return (
    <div className="space-y-6">
      <div 
        className="relative h-80 w-full perspective-1000 cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <motion.div 
          className="w-full h-full relative transition-all duration-500 preserve-3d"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
        >
          {/* Front */}
          <div className="absolute inset-0 backface-hidden bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center justify-center p-10 text-center">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4">Word</span>
            <h3 className="text-5xl font-bold">{currentWord.term}</h3>
            <p className="text-gray-400 mt-10 text-sm">Click to flip</p>
          </div>
          
          {/* Back */}
          <div className="absolute inset-0 backface-hidden bg-indigo-600 text-white rounded-3xl shadow-xl flex flex-col items-center justify-center p-10 text-center rotate-y-180">
            <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-4">Definition</span>
            <p className="text-xl font-medium leading-relaxed">{currentWord.definition}</p>
            <div className="mt-6 pt-6 border-t border-indigo-500 w-full">
              <p className="text-sm text-indigo-200 italic">"{currentWord.example}"</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex items-center justify-between px-4">
        <p className="text-sm text-gray-500">Card {currentIndex + 1} of {words.length}</p>
        <Button onClick={nextCard} variant="outline" className="rounded-full px-8">
          Next Card <ChevronRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
