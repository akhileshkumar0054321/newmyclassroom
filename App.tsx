import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  ArrowRight,
  Bell,
  BookOpen,
  ClipboardCheck,
  Copy,
  Check,
  FileText,
  GraduationCap,
  Library as LibraryIcon,
  Link2,
  LogOut,
  MessageCircle,
  NotebookPen,
  Video,
  Sparkles,
  Search,
  Users
} from 'lucide-react';
import { configured, supabase } from './lib/supabase';
import { SmartNotes, MockTests } from './components/student/StudyTools';
import { StudentLibrary, Connections, StudyGroups } from './components/student/Community';
import { Meetings } from './components/student/Meetings';
import { Badge, Button, Card, IconTile, Skeleton } from './components/student/UI';

type Page =
  | 'Dashboard'
  | 'Smart Notes'
  | 'Test Generator'
  | 'Mock Tests'
  | 'My Library'
  | 'Meetings'
  | 'Connect'
  | 'Groups';

type Profile = {
  id: string;
  uid: string;
  display_name: string;
};

const navigation: { label: Page; icon: React.ElementType; group: string; feature: any }[] = [
  { label: 'Dashboard', icon: GraduationCap, group: 'Workspace', feature: 'brand' },
  { label: 'Smart Notes', icon: NotebookPen, group: 'Create & practice', feature: 'notes' },
  { label: 'Test Generator', icon: FileText, group: 'Create & practice', feature: 'generator' },
  { label: 'Mock Tests', icon: ClipboardCheck, group: 'Create & practice', feature: 'mock' },
  { label: 'My Library', icon: LibraryIcon, group: 'Create & practice', feature: 'library' },
  { label: 'Meetings', icon: Video, group: 'Collaborate', feature: 'meetings' },
  { label: 'Connect', icon: Link2, group: 'Collaborate', feature: 'connect' },
  { label: 'Groups', icon: MessageCircle, group: 'Collaborate', feature: 'groups' },
];

const DEMO_PROFILE: Profile = {
  id: 'demo-student-id',
  uid: 'STU-8821',
  display_name: 'Alex Chen'
};

function LoginScreen({ onDemoLogin }: { onDemoLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    });
    setMessage(error ? error.message : 'Check your email for a secure sign-in link.');
    setBusy(false);
  }

  return (
    <div className="min-h-screen bg-[#F8F9FD] flex items-center justify-center p-4 sm:p-8 relative overflow-hidden pastel-blobs">
      {/* Soft Ambient Pastel Blobs */}
      <div className="hero-blob-glow top-[-100px] left-[-80px] w-[450px] h-[450px] bg-[#EEF0FF] rounded-full" />
      <div className="hero-blob-glow top-[15%] right-[-100px] w-[500px] h-[500px] bg-[#FFF2EB] rounded-full" />
      <div className="hero-blob-glow bottom-[-120px] left-[30%] w-[550px] h-[550px] bg-[#EAF9F2] rounded-full" />

      <div className="w-full max-w-[1140px] grid lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10 my-auto">
        {/* Left Side: Airy Brand Presentation & Product Preview */}
        <div className="lg:col-span-7 space-y-7">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white border border-[#E8EAF3] shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#5B5BF0] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#5B5BF0]">
              STUDENT WORKSPACE 2026
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-[16px] bg-[#EEF0FF] border border-[#DDE1FC] text-[#5B5BF0] grid place-items-center shadow-sm">
                <GraduationCap size={26} />
              </span>
              <span className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
                MyClassroom<span className="text-[#5B5BF0]">.AI</span>
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold text-[#0F172A] leading-[1.12] tracking-tight">
              Your brightest ideas deserve a better classroom.
            </h1>

            <p className="text-base sm:text-lg text-[#475569] max-w-xl leading-relaxed">
              Crystal-clear AI study notes, intelligent exam practice, and a private circle for collaborating with classmates.
            </p>
          </div>

          {/* Floating Product Preview Card */}
          <div className="glass-preview-card p-6 max-w-lg space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8EAF3] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Live Preview · Smart Notes
                </span>
              </div>
              <Badge feature="notes">Computer Science</Badge>
            </div>

            <div className="space-y-2">
              <h3 className="font-extrabold text-base text-[#0F172A]">
                Operating Systems: Virtual Memory & Page Replacement
              </h3>
              <p className="text-xs text-[#475569] leading-relaxed line-clamp-2">
                Paging isolates processes into fixed-size physical frames while the MMU translates virtual addresses via high-speed TLB hardware.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1 text-[11px] font-semibold text-slate-500">
              <span className="px-2.5 py-1 rounded-full bg-[#F1F3F9] border border-[#E8EAF3]">3.5 min read</span>
              <span className="px-2.5 py-1 rounded-full bg-[#F1F3F9] border border-[#E8EAF3]">4 formulas</span>
              <span className="px-2.5 py-1 rounded-full bg-[#F1F3F9] border border-[#E8EAF3]">5 practice questions</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <span className="pill-badge bg-white border border-[#E8EAF3] text-slate-700 shadow-sm">
              <BookOpen size={13} className="text-[#7C3AED]" /> Markdown & LaTeX formulas
            </span>
            <span className="pill-badge bg-white border border-[#E8EAF3] text-slate-700 shadow-sm">
              <ClipboardCheck size={13} className="text-[#059669]" /> Instant exam diagnostics
            </span>
            <span className="pill-badge bg-white border border-[#E8EAF3] text-slate-700 shadow-sm">
              <Video size={13} className="text-[#E11D48]" /> Peer study meetings
            </span>
          </div>
        </div>

        {/* Right Side: Clean White Sign-in Card */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-[24px] border border-[#E8EAF3] p-7 sm:p-10 shadow-xl shadow-slate-900/5 space-y-6">
            <div>
              <span className="pill-badge bg-[#EEF0FF] border-[#DDE1FC] text-[#5B5BF0] mb-3">
                SECURE ACCESS
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                Welcome back
              </h2>
              <p className="text-sm text-[#475569] mt-1.5">
                Sign in with your email or explore instantly as a student.
              </p>
            </div>

            <form onSubmit={signIn} className="space-y-4">
              <label className="ui-field">
                <span>Student email address</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@college.edu"
                />
              </label>

              <Button className="w-full ui-button-primary rounded-full" disabled={busy} type="submit">
                {busy ? 'Sending secure link…' : 'Send sign-in link'} <ArrowRight size={17} />
              </Button>
            </form>

            {message && (
              <p
                role="status"
                className={`p-3.5 rounded-2xl text-xs font-semibold ${
                  message.startsWith('Check') ? 'success-banner' : 'error-banner'
                }`}
              >
                {message}
              </p>
            )}

            <div className="pt-4 border-t border-[#E8EAF3] text-center space-y-3">
              <p className="text-xs text-[#94A3B8]">Want to preview without email?</p>
              <Button
                variant="secondary"
                className="w-full rounded-full"
                onClick={onDemoLogin}
              >
                <Sparkles size={16} className="text-[#5B5BF0]" /> Explore as Demo Student (Alex Chen)
              </Button>
              <p className="text-[11px] text-[#94A3B8]">
                Instant access to AI note generation, practice tests, and tools.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ me, go }: { me: Profile; go: (page: Page) => void }) {
  const [stats, setStats] = useState({ libraryCount: 0, connectionsCount: 0, groupsCount: 0 });

  useEffect(() => {
    let cancelled = false;
    const fetchRealStats = async () => {
      try {
        const isDemo = localStorage.getItem('mc_demo_mode') === 'true' || me.id === 'demo-student-id';
        if (isDemo) {
          const storedLib = localStorage.getItem('mc_demo_library');
          const libCount = storedLib ? JSON.parse(storedLib).length : 2;
          const storedConn = localStorage.getItem('mc_demo_connections');
          const connCount = storedConn ? JSON.parse(storedConn).length : 2;
          if (!cancelled) {
            setStats({ libraryCount: libCount, connectionsCount: connCount, groupsCount: 3 });
          }
          return;
        }

        const [libRes, connRes, grpRes] = await Promise.all([
          supabase.from('library_items').select('id', { count: 'exact', head: true }).eq('owner_id', me.id),
          supabase.from('connections').select('id', { count: 'exact', head: true }).or(`requester_id.eq.${me.id},recipient_id.eq.${me.id}`).eq('status', 'accepted'),
          supabase.from('group_members').select('group_id', { count: 'exact', head: true }).eq('user_id', me.id)
        ]);

        if (!cancelled) {
          setStats({
            libraryCount: libRes.count || 0,
            connectionsCount: connRes.count || 0,
            groupsCount: grpRes.count || 0
          });
        }
      } catch (e) {
        console.error('Failed to load real stats:', e);
      }
    };

    void fetchRealStats();
    return () => {
      cancelled = true;
    };
  }, [me.id]);

  const toolDescriptions: Record<string, string> = {
    'Smart Notes': 'Generate structured lessons with formulas, tables, and revision checklists.',
    'Test Generator': 'Create curriculum-aligned diagnostic tests with custom question counts.',
    'Mock Tests': 'Practice multiple-choice drills with real-time scoring and explanations.',
    'My Library': 'Access and review your saved lessons, tests, and graded attempts.',
    'Meetings': 'Start peer video study sessions and screen-sharing with your classmates.',
    'Connect': 'Link with other verified students using their unique student ID.',
    'Groups': 'Collaborate with peers in subject-specific circles with shared notes and voice.'
  };

  return (
    <div className="space-y-8 w-full max-w-[1360px] mx-auto">
      {/* Modern Airy Hero Section */}
      <div className="relative rounded-[24px] bg-white border border-[#E8EAF3] p-6 sm:p-10 shadow-sm overflow-hidden">
        {/* Soft Pastel Background Blobs */}
        <div className="hero-blob-glow top-[-80px] right-[-60px] w-[350px] h-[350px] bg-[#EEF0FF] rounded-full" />
        <div className="hero-blob-glow bottom-[-100px] left-[20%] w-[380px] h-[380px] bg-[#FFF2EB] rounded-full" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEF0FF] border border-[#DDE1FC] text-xs font-bold uppercase tracking-wider text-[#5B5BF0]">
            <Sparkles size={14} /> AI-POWERED STUDENT WORKSPACE
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            Welcome back, {me.display_name} 👋
          </h1>

          <p className="text-sm sm:text-base text-[#475569] leading-relaxed">
            Turn complex topics into crystal-clear study notes with formulas, take diagnostic mock tests, and share knowledge with your study circle.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              className="ui-button-brand ui-button rounded-full"
              onClick={() => go('Smart Notes')}
            >
              <NotebookPen size={17} /> Generate Study Notes
            </button>
            <button
              className="ui-button-secondary ui-button rounded-full"
              onClick={() => go('Mock Tests')}
            >
              <ClipboardCheck size={17} /> Practice Mock Test
            </button>
          </div>
        </div>

        {/* Real Dynamic User Stats Bento Pills */}
        <div className="relative z-10 grid sm:grid-cols-3 gap-3.5 pt-8 mt-6 border-t border-[#E8EAF3]">
          <div className="p-4 rounded-[18px] bg-[#F8F9FD] border border-[#E8EAF3] flex items-center gap-3.5">
            <span className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] grid place-items-center">
              <LibraryIcon size={19} />
            </span>
            <div>
              <p className="text-xl font-extrabold text-[#0F172A] leading-none">
                {stats.libraryCount}
              </p>
              <p className="text-xs text-[#64748B] mt-1 font-medium">Saved in Library</p>
            </div>
          </div>

          <div className="p-4 rounded-[18px] bg-[#F8F9FD] border border-[#E8EAF3] flex items-center gap-3.5">
            <span className="w-10 h-10 rounded-xl bg-[#FDF4FF] text-[#C026D3] border border-[#F5D0FE] grid place-items-center">
              <Link2 size={19} />
            </span>
            <div>
              <p className="text-xl font-extrabold text-[#0F172A] leading-none">
                {stats.connectionsCount}
              </p>
              <p className="text-xs text-[#64748B] mt-1 font-medium">Connected Peers</p>
            </div>
          </div>

          <div className="p-4 rounded-[18px] bg-[#F8F9FD] border border-[#E8EAF3] flex items-center gap-3.5">
            <span className="w-10 h-10 rounded-xl bg-[#ECFEFF] text-[#0891B2] border border-[#A5F3FC] grid place-items-center">
              <Users size={19} />
            </span>
            <div>
              <p className="text-xl font-extrabold text-[#0F172A] leading-none">
                {stats.groupsCount}
              </p>
              <p className="text-xs text-[#64748B] mt-1 font-medium">Active Study Circles</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid of Features */}
      <div>
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Learning Tools
            </h2>
            <p className="text-sm text-[#475569]">
              Designed for your daily academic study workflow.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {navigation
            .filter((n) => n.label !== 'Dashboard')
            .map(({ label, icon: Icon, feature }) => (
              <button
                key={label}
                className={`ui-card ui-card-hover feature-${feature} text-left group`}
                onClick={() => go(label)}
              >
                <div className="flex justify-between items-start">
                  <IconTile feature={feature}>
                    <Icon size={20} />
                  </IconTile>
                  <span className="w-8 h-8 rounded-full bg-[#F8F9FD] border border-[#E8EAF3] grid place-items-center text-slate-400 group-hover:text-[#5B5BF0] group-hover:border-[#DDE1FC] transition-colors">
                    <ArrowRight size={15} />
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-[#0F172A] mt-5">
                  {label}
                </h3>
                <p className="text-xs text-[#475569] mt-1.5 leading-relaxed">
                  {toolDescriptions[label]}
                </p>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [isDemo, setIsDemo] = useState<boolean>(() => {
    const saved = localStorage.getItem('mc_demo_mode');
    return saved !== null ? saved === 'true' : !configured;
  });
  const [session, setSession] = useState<Session | null>(() => {
    if (localStorage.getItem('mc_demo_mode') === 'true' || !configured) {
      return { user: { id: DEMO_PROFILE.id, email: 'alex.chen@student.ai' } } as any;
    }
    return null;
  });
  const [profile, setProfile] = useState<Profile | null>(() => {
    if (localStorage.getItem('mc_demo_mode') === 'true' || !configured) {
      return DEMO_PROFILE;
    }
    return null;
  });
  const [page, setPage] = useState<Page>('Dashboard');
  const [loading, setLoading] = useState(!isDemo);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [copiedUid, setCopiedUid] = useState(false);

  function startDemo() {
    localStorage.setItem('mc_demo_mode', 'true');
    localStorage.setItem('mc_demo_token', 'demo-token');
    setIsDemo(true);
    setSession({ user: { id: DEMO_PROFILE.id, email: 'alex.chen@student.ai' } } as any);
    setProfile(DEMO_PROFILE);
    setLoading(false);
  }

  function handleSignOut() {
    localStorage.removeItem('mc_demo_mode');
    localStorage.removeItem('mc_demo_token');
    setIsDemo(false);
    setSession(null);
    setProfile(null);
    if (configured) {
      void supabase.auth.signOut();
    }
  }

  function copyUid() {
    if (!profile) return;
    void navigator.clipboard.writeText(profile.uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  }

  useEffect(() => {
    if (isDemo || !configured) {
      setLoading(false);
      return;
    }
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession));
    return () => data.subscription.unsubscribe();
  }, [isDemo]);

  useEffect(() => {
    if (isDemo || !configured) return;
    if (!session) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id,uid,display_name')
        .eq('id', session.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) setError(error.message);
      else if (data) setProfile(data);
      else setError('Profile missing. Run supabase/schema.sql and sign in again.');
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [session?.user.id, isDemo]);

  useEffect(() => {
    if (!profile) return;
    if (isDemo) {
      setNotifications([
        { type: 'Study group invite', id: 'nt-1', page: 'Groups' as Page },
        { type: 'Connection request', id: 'nt-2', page: 'Connect' as Page }
      ]);
      return;
    }
    const refresh = async () => {
      const [a, b] = await Promise.all([
        supabase
          .from('connections')
          .select('*')
          .eq('recipient_id', profile.id)
          .eq('status', 'pending'),
        supabase
          .from('meeting_invites')
          .select('*')
          .eq('callee_id', profile.id)
          .eq('status', 'pending')
      ]);
      setNotifications([
        ...(a.data || []).map((i) => ({ type: 'Connection request', id: i.id, page: 'Connect' as Page })),
        ...(b.data || []).map((i) => ({ type: 'Meeting invitation', id: i.id, page: 'Meetings' as Page }))
      ]);
    };
    void refresh();
    const channel = supabase
      .channel(`student-notifications-${profile.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connections' }, () => void refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meeting_invites' }, () => void refresh())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [profile?.id, isDemo]);

  async function save(kind: 'NOTE' | 'TEST' | 'RESULT', title: string, content: unknown) {
    if (!profile) throw new Error('Sign in to save content');
    if (isDemo) {
      const stored = localStorage.getItem('mc_demo_library');
      const prev = stored ? JSON.parse(stored) : [];
      const item = {
        id: `lib-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        owner_id: profile.id,
        kind,
        title,
        content,
        created_at: new Date().toISOString()
      };
      localStorage.setItem('mc_demo_library', JSON.stringify([item, ...prev]));
      return;
    }
    const { error } = await supabase.from('library_items').insert({ owner_id: profile.id, kind, title, content });
    if (error) throw new Error(`Could not save to library: ${error.message}`);
  }

  function navigate(next: Page) {
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FD] flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <Skeleton lines={6} />
        </Card>
      </div>
    );
  }

  if (!session) {
    return <LoginScreen onDemoLogin={startDemo} />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F8F9FD] flex items-center justify-center p-6">
        <div className="ui-card max-w-md text-center space-y-4">
          <p className="text-sm text-slate-700">{error || 'Loading your student profile…'}</p>
          <Button variant="secondary" onClick={handleSignOut} className="rounded-full mx-auto">
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="student-app min-h-screen bg-[#F8F9FD] text-[#0F172A] flex flex-col">
      {/* Sticky Top Header with Centered Brand & Horizontal Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E8EAF3] shadow-xs">
        <div className="w-full px-4 sm:px-8 h-[68px] flex items-center justify-between relative">
          {/* Left Side: Status / Workspace Indicator */}
          <div className="flex items-center gap-3 min-w-[140px]">
            {isDemo ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFFBEB] border border-[#FDE68A] text-xs font-bold text-[#D97706] shadow-2xs">
                <Sparkles size={13} className="text-[#D97706]" />
                <span className="hidden sm:inline">Demo Student:</span> Alex Chen
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EEF0FF] border border-[#DDE1FC] text-xs font-bold text-[#5B5BF0]">
                <span className="w-2 h-2 rounded-full bg-[#5B5BF0] animate-pulse" />
                <span className="hidden sm:inline">Student Workspace</span>
                <span className="sm:hidden">Active</span>
              </div>
            )}
          </div>

          {/* Center: MyClassroom.AI */}
          <div
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => navigate('Dashboard')}
          >
            <span className="w-9 h-9 rounded-[12px] bg-[#EEF0FF] border border-[#DDE1FC] text-[#5B5BF0] grid place-items-center shadow-xs">
              <GraduationCap size={20} />
            </span>
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0F172A] leading-none m-0">
                MyClassroom<span className="text-[#5B5BF0]">.AI</span>
              </h1>
            </div>
          </div>

          {/* Right Side: UID, Notifications & Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5 justify-end min-w-[140px]">
            {/* Quick UID Display */}
            <button
              onClick={copyUid}
              title="Click to copy your student UID"
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F8F9FD] hover:bg-[#F1F3F9] border border-[#E8EAF3] text-xs font-semibold text-slate-700 transition"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-mono text-[11px] font-bold">{profile.uid}</span>
              {copiedUid ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} className="text-slate-400" />}
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                className="w-9 h-9 grid place-items-center rounded-full bg-[#F8F9FD] border border-[#E8EAF3] text-slate-700 hover:bg-slate-100 transition"
                title="Notifications"
                aria-label={`${notifications.length} notifications`}
                onClick={() => navigate(notifications[0]?.page || 'Connect')}
              >
                <Bell size={17} />
              </button>
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold grid place-items-center">
                  {notifications.length}
                </span>
              )}
            </div>

            {/* Profile Avatar / Quick Link */}
            <button
              onClick={() => navigate('Connect')}
              title={`${profile.display_name} (${profile.uid})`}
              className="w-9 h-9 rounded-full bg-[#5B5BF0] text-white font-bold text-xs grid place-items-center shadow-xs border-0"
            >
              {profile.display_name[0]?.toUpperCase() || 'S'}
            </button>

            {/* Sign Out Pill */}
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200/70 transition"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>

        {/* Horizontal Navigation Tabs */}
        <div className="border-t border-[#F1F3F9] bg-white/80 px-4 sm:px-8 py-2 overflow-x-auto scrollbar-none">
          <div className="w-full flex items-center justify-start sm:justify-center gap-1.5 sm:gap-2">
            {navigation.map((n) => {
              const isActive = page === n.label;
              return (
                <button
                  key={n.label}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => navigate(n.label)}
                  className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-[13px] font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[#111827] text-white shadow-xs'
                      : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F3F9]'
                  }`}
                >
                  <n.icon size={15} className={isActive ? 'text-[#A5B4FC]' : 'text-[#64748B]'} />
                  <span>{n.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Full-Page Content Area */}
      <main className="w-full flex-1 flex flex-col">
        <div className="flex-1 w-full max-w-[1360px] mx-auto p-4 sm:p-7 lg:p-9">
          {page === 'Dashboard' ? (
            <Dashboard me={profile} go={navigate} />
          ) : page === 'Smart Notes' ? (
            <SmartNotes save={save} />
          ) : page === 'Test Generator' || page === 'Mock Tests' ? (
            <MockTests save={save} />
          ) : page === 'My Library' ? (
            <StudentLibrary me={profile} />
          ) : page === 'Meetings' ? (
            <Meetings me={profile} />
          ) : page === 'Connect' ? (
            <Connections me={profile} />
          ) : (
            <StudyGroups me={profile} />
          )}
        </div>
      </main>
    </div>
  );
}
