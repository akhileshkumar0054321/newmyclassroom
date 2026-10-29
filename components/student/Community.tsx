import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Check, Copy, Download, FileText, Link2, MessageCircle, Mic, MicOff, Plus, Search, Send, ShieldCheck, Users, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Badge, Button, Card, Dialog, EmptyState, ErrorState, IconTile, Skeleton } from './UI';
import { NotesReader } from './NotesReader';

type Profile = { id: string; uid: string; display_name: string };
type RecordItem = { id: string; kind: 'NOTE' | 'TEST' | 'RESULT'; title: string; content: any; owner_id: string; created_at: string };

function useRefresh(table: string, refresh: () => void, scope = '') {
  useEffect(() => {
    const channel = supabase.channel(`refresh-${table}-${Math.random()}`).on('postgres_changes', { event: '*', schema: 'public', table }, refresh).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [table, scope]);
}

const INITIAL_DEMO_ITEMS: RecordItem[] = [
  {
    id: 'demo-item-1',
    kind: 'NOTE',
    title: 'Computer Architecture: Cache Hierarchy & Interrupt Cycles',
    content: {
      markdown: `# Computer Architecture: Cache Hierarchy & Interrupt Cycles

> [!KEY] TL;DR: Cache memory bridges the massive speed gap between CPU cores and main RAM using spatial and temporal locality, while vectored interrupts let external peripherals signal asynchronous events without polling.

## 1. Learning objectives
- Differentiate L1, L2, and L3 cache hierarchies and understand latency differences.
- Calculate effective memory access time (EMAT) and cache hit ratios.
- Compare memory-mapped I/O with isolated I/O.
- Trace the hardware-level Interrupt Service Routine (ISR) sequence.

## 2. Prerequisites
- Binary and hexadecimal number representations.
- Basic CPU register architecture (PC, SP, Flags).

## 3. Core concepts

### Principle of Locality
Caches work because computer programs do not access memory randomly.
- **Temporal Locality**: If a memory location is referenced, it will tend to be referenced again soon (e.g., loop counters).
- **Spatial Locality**: If a memory location is referenced, nearby locations will tend to be referenced soon (e.g., sequential array traversals).

### Effective Memory Access Time (EMAT)
$$EMAT = h \\cdot t_{cache} + (1 - h) \\cdot (t_{cache} + t_{memory})$$

Where $h$ is the hit ratio, $t_{cache}$ is cache latency (e.g. 1-4 ns), and $t_{memory}$ is DRAM latency (e.g. 50-80 ns).

## 4. How it works, step by step: Hardware Interrupt Handling
1. **Device Assertion**: Peripheral pulls the interrupt line (e.g., \`INT\` pin) high.
2. **Current Instruction Completion**: CPU completes the currently executing instruction.
3. **Context Preservation**: CPU pushes the Program Counter (\`PC\`) and Processor Status Word (\`PSW\`) onto the stack.
4. **Vector Fetch**: CPU pulses \`INTA\` (Interrupt Acknowledge) and reads the interrupt vector address from the bus.
5. **ISR Execution**: CPU branches to the vector address to run device-specific driver code.
6. **Return**: Execution of \`IRET\` pops the saved flags and \`PC\`, returning to user code.

## 5. Key formulas, rules and facts
| Parameter | Definition | Typical Value |
|---|---|---|
| L1 Cache | Dedicated per-core instructions/data cache | 32 KB - 64 KB, ~1 ns |
| L2 Cache | Larger per-core intermediate cache | 512 KB - 1 MB, ~3-4 ns |
| L3 Cache | Shared LLC across all CPU cores | 16 MB - 96 MB, ~10-15 ns |
| DRAM | Off-die system main memory | 16 GB - 64 GB, ~60-80 ns |

> [!TIP]
> Always optimize nested loops to access multi-dimensional arrays row-by-row in C/C++ to exploit CPU cache line fills!

- [x] Memory hierarchy and hit ratio calculations
- [x] Direct-mapped vs set-associative cache placement
- [ ] Interrupt masking (RIM/SIM) in microprocessors`
    },
    owner_id: 'demo-student-id',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'demo-item-2',
    kind: 'TEST',
    title: 'Cellular Respiration & Krebs Cycle Diagnostic Test',
    content: {
      title: 'Cellular Respiration & Krebs Cycle Diagnostic',
      subject: 'Biochemistry / NEET Biology',
      questions: [
        {
          id: 1,
          text: 'Where does the citric acid (Krebs) cycle take place in eukaryotic cells?',
          type: 'MCQ',
          options: ['Cytosol', 'Mitochondrial matrix', 'Inner mitochondrial membrane', 'Peroxisome'],
          correctAnswer: 'Mitochondrial matrix',
          explanation: 'The citric acid cycle enzymes are located in the mitochondrial matrix, except succinate dehydrogenase which is bound to the inner membrane.'
        },
        {
          id: 2,
          text: 'How many net ATP molecules are produced per molecule of glucose strictly through glycolysis?',
          type: 'MCQ',
          options: ['2 net ATP', '4 net ATP', '32 net ATP', '36 net ATP'],
          correctAnswer: '2 net ATP',
          explanation: 'Glycolysis consumes 2 ATP in the preparatory phase and generates 4 ATP in the payoff phase, yielding a net gain of 2 ATP.'
        }
      ]
    },
    owner_id: 'demo-student-id',
    created_at: new Date(Date.now() - 3600000 * 20).toISOString()
  }
];

export function StudentLibrary({ me }: { me: Profile }) {
  const [items, setItems] = useState<RecordItem[]>([]);
  const [selected, setSelected] = useState<RecordItem | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'NOTE' | 'TEST' | 'RESULT'>('ALL');
  const [search, setSearch] = useState('');

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const isDemo = localStorage.getItem('mc_demo_mode') === 'true' || me.id === 'demo-student-id';
      if (isDemo) {
        const stored = localStorage.getItem('mc_demo_library');
        if (stored) {
          try { setItems(JSON.parse(stored)); return; } catch {}
        }
        localStorage.setItem('mc_demo_library', JSON.stringify(INITIAL_DEMO_ITEMS));
        setItems(INITIAL_DEMO_ITEMS);
        return;
      }
      const { data, error } = await supabase.from('library_items').select('*').order('created_at', { ascending: false });
      if (error) setError(error.message);
      else setItems(data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);
  useRefresh('library_items', () => void refresh());

  const filtered = items.filter(x => (filter === 'ALL' || x.kind === filter) && x.title.toLowerCase().includes(search.toLowerCase()));

  function exportNote(item: RecordItem) {
    const blob = new Blob([item.content?.markdown || JSON.stringify(item.content, null, 2)], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.title.replace(/[^\w -]/g, '').slice(0, 60) || 'notes'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 feature-library">
      <div className="section-heading">
        <IconTile feature="library"><BookOpen /></IconTile>
        <div>
          <Badge feature="library">PERSONAL COLLECTION</Badge>
          <h1>Your knowledge library.</h1>
          <p>All your notes, generated tests and assessed attempts—curated in one place.</p>
        </div>
      </div>

      <div className="flex flex-wrap justify-between gap-4 items-center">
        <div className="flex flex-wrap gap-2">
          {(['ALL', 'NOTE', 'TEST', 'RESULT'] as const).map(k => (
            <button
              key={k}
              type="button"
              className={`filter-chip ${filter === k ? 'active' : ''}`}
              onClick={() => setFilter(k)}
            >
              {k === 'ALL' ? 'All items' : k === 'NOTE' ? 'Study notes' : k === 'TEST' ? 'Diagnostic tests' : 'Graded results'}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-3 text-[#94A3B8]" size={17} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search titles and topics..."
            aria-label="Search library"
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-[#E8EAF3] bg-white text-sm focus:outline-none focus:border-[#5B5BF0] focus:ring-2 focus:ring-[#5B5BF0]/15"
          />
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={refresh} />}

      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-[#E8EAF3] rounded-[24px] p-6 space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="w-16 h-6 rounded-full" />
                <Skeleton className="w-10 h-10 rounded-2xl" />
              </div>
              <Skeleton className="w-3/4 h-5 rounded-lg" />
              <Skeleton className="w-full h-12 rounded-lg" />
              <Skeleton className="w-1/2 h-4 rounded-lg" />
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(item => {
            const feature = item.kind === 'NOTE' ? 'notes' : item.kind === 'TEST' ? 'generator' : 'mock';
            return (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className="bg-white border border-[#E8EAF3] rounded-[24px] p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#5B5BF0]/5 hover:border-[#5B5BF0]/40 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Badge feature={feature}>{item.kind}</Badge>
                    <IconTile feature={feature}><FileText size={18} /></IconTile>
                  </div>
                  <h3 className="font-bold text-lg text-[#0F172A] line-clamp-2">{item.title}</h3>
                  <p className="text-sm text-[#475569] line-clamp-2 mt-2 leading-relaxed">
                    {item.kind === 'NOTE'
                      ? String(item.content?.markdown || '').replace(/[#*`]/g, '').slice(0, 110)
                      : item.kind === 'TEST'
                      ? `${item.content?.questions?.length || 0} interactive diagnostic questions`
                      : 'Graded student attempt and comprehensive explanations'}
                  </p>
                </div>
                <div className="pt-5 mt-4 border-t border-[#F1F3F9] flex items-center justify-between text-xs text-[#94A3B8]">
                  <span>{item.owner_id === me.id ? 'Personal' : 'Shared by peer'}</span>
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState
            feature="library"
            icon={<BookOpen size={24} />}
            title="Your shelf is waiting"
            description={search ? `No items matched "${search}". Try adjusting your filters.` : "Generate your first comprehensive study notes or interactive test to start building your library."}
            action={search ? <Button variant="secondary" onClick={() => setSearch('')}>Clear search</Button> : undefined}
          />
        </Card>
      )}

      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.title || 'Library item'}>
        {selected && (
          <div className="space-y-4">
            <div className="max-h-[65vh] overflow-y-auto pr-1">
              {selected.kind === 'NOTE' ? (
                <NotesReader markdown={selected.content?.markdown || ''} title={selected.title} />
              ) : (
                <pre className="whitespace-pre-wrap text-xs p-5 rounded-2xl bg-[#F8F9FD] border border-[#E8EAF3] text-[#334155] font-mono overflow-x-auto leading-relaxed">
                  {JSON.stringify(selected.content, null, 2)}
                </pre>
              )}
            </div>
            <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E8EAF3]">
              <Button feature="library" variant="secondary" onClick={() => exportNote(selected)}>
                <Download size={16} /> Download markdown
              </Button>
              {selected.owner_id === me.id && (
                <Button
                  variant="danger"
                  onClick={async () => {
                    if (!confirm('Are you sure you want to delete this item?')) return;
                    const isDemo = localStorage.getItem('mc_demo_mode') === 'true' || me.id === 'demo-student-id';
                    if (isDemo) {
                      const next = items.filter(x => x.id !== selected.id);
                      localStorage.setItem('mc_demo_library', JSON.stringify(next));
                      setItems(next);
                      setSelected(null);
                      return;
                    }
                    const { error } = await supabase.from('library_items').delete().eq('id', selected.id);
                    if (error) setError(error.message);
                    else {
                      setSelected(null);
                      await refresh();
                    }
                  }}
                >
                  Delete item
                </Button>
              )}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

export function Connections({ me }: { me: Profile }) {
  const [uid, setUid] = useState('');
  const [people, setPeople] = useState<Record<string, Profile>>({});
  const [requests, setRequests] = useState<any[]>([]);
  const [grants, setGrants] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const isDemo = localStorage.getItem('mc_demo_mode') === 'true' || me.id === 'demo-student-id';

  async function refresh() {
    setLoading(true);
    try {
      if (isDemo) {
        const demoPeers: Record<string, Profile> = {
          'demo-peer-1': { id: 'demo-peer-1', uid: 'STU-4412', display_name: 'Sarah Jenkins (Mathematics)' },
          'demo-peer-2': { id: 'demo-peer-2', uid: 'STU-1092', display_name: 'Dev Patel (Computer Science)' },
          'demo-peer-3': { id: 'demo-peer-3', uid: 'STU-7731', display_name: 'Maya Lin (Biophysics)' }
        };
        setPeople(demoPeers);
        const stored = localStorage.getItem('mc_demo_connections');
        if (stored) {
          setRequests(JSON.parse(stored));
        } else {
          const initial = [
            { id: 'req-1', requester_id: 'demo-peer-1', recipient_id: me.id, status: 'accepted', created_at: new Date().toISOString() },
            { id: 'req-2', requester_id: 'demo-peer-2', recipient_id: me.id, status: 'pending', created_at: new Date().toISOString() }
          ];
          localStorage.setItem('mc_demo_connections', JSON.stringify(initial));
          setRequests(initial);
        }
        return;
      }
      const [c, g, p] = await Promise.all([
        supabase.from('connections').select('*').order('created_at', { ascending: false }),
        supabase.from('library_grants').select('*'),
        supabase.from('profiles').select('id,uid,display_name')
      ]);
      if (c.error || g.error || p.error) {
        setError(c.error?.message || g.error?.message || p.error?.message || 'Loading failed');
        return;
      }
      setRequests(c.data || []);
      setGrants(g.data || []);
      setPeople(Object.fromEntries((p.data || []).map(x => [x.id, x])));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);
  useRefresh('connections', () => void refresh());
  useRefresh('library_grants', () => void refresh());

  async function sendRequest(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!uid.trim()) return;

    if (isDemo) {
      const match = Object.values(people).find(x => x.uid.toUpperCase() === uid.trim().toUpperCase());
      const newPeer: Profile = match || {
        id: `peer-${Date.now()}`,
        uid: uid.trim().toUpperCase(),
        display_name: `Student (${uid.trim().toUpperCase()})`
      };
      setPeople(prev => ({ ...prev, [newPeer.id]: newPeer }));
      const newReq = { id: `req-${Date.now()}`, requester_id: me.id, recipient_id: newPeer.id, status: 'pending', created_at: new Date().toISOString() };
      const next = [newReq, ...requests];
      localStorage.setItem('mc_demo_connections', JSON.stringify(next));
      setRequests(next);
      setNotice(`Connection request sent to ${newPeer.display_name}.`);
      setUid('');
      return;
    }
    const user = Object.values(people).find(x => x.uid === uid.trim().toUpperCase());
    if (!user) return setError('Student UID not found');
    if (user.id === me.id) return setError('You cannot connect with yourself');
    const { error } = await supabase.from('connections').insert({ requester_id: me.id, recipient_id: user.id });
    if (error) setError(error.message);
    else {
      setNotice('Connection request sent.');
      setUid('');
      await refresh();
    }
  }

  async function changeStatus(id: string, status: string) {
    if (isDemo) {
      const next = requests.map(r => r.id === id ? { ...r, status } : r);
      localStorage.setItem('mc_demo_connections', JSON.stringify(next));
      setRequests(next);
      return;
    }
    const { error } = await supabase.from('connections').update({ status }).eq('id', id);
    if (error) setError(error.message);
    else await refresh();
  }

  async function disconnect(id: string) {
    if (isDemo) {
      const next = requests.filter(r => r.id !== id);
      localStorage.setItem('mc_demo_connections', JSON.stringify(next));
      setRequests(next);
      return;
    }
    const { error } = await supabase.from('connections').delete().eq('id', id);
    if (error) setError(error.message);
    else await refresh();
  }

  async function share(otherId: string, enabled: boolean) {
    if (isDemo) {
      setGrants(prev => enabled ? [...prev, { owner_id: me.id, viewer_id: otherId }] : prev.filter(g => g.viewer_id !== otherId));
      return;
    }
    const response = enabled
      ? await supabase.from('library_grants').insert({ owner_id: me.id, viewer_id: otherId })
      : await supabase.from('library_grants').delete().eq('owner_id', me.id).eq('viewer_id', otherId);
    if (response.error) setError(response.error.message);
    else await refresh();
  }

  function handleCopyUid() {
    navigator.clipboard.writeText(me.uid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6 feature-connect">
      <div className="section-heading">
        <IconTile feature="connect"><Link2 /></IconTile>
        <div>
          <Badge feature="connect">STUDY NETWORK</Badge>
          <h1>Collaborate and share.</h1>
          <p>Connect with peers by unique student ID. Control library permissions per student.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Your UID Card */}
        <div className="bg-white border border-[#E8EAF3] rounded-[24px] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="font-bold text-base text-[#0F172A]">Your Unique Student ID</h2>
          </div>
          <p className="text-sm text-[#64748B] mb-4">Share this code with your classmates so they can find and invite you.</p>
          <div className="flex items-center gap-3">
            <code className="px-4 py-2.5 rounded-full bg-[#F8F9FD] border border-[#E8EAF3] font-mono font-bold text-sm text-[#0F172A] tracking-wider">
              {me.uid}
            </code>
            <Button feature="connect" variant="secondary" onClick={handleCopyUid}>
              {copied ? <><Check size={16} className="text-emerald-600" /> Copied</> : <><Copy size={16} /> Copy UID</>}
            </Button>
          </div>
        </div>

        {/* Send Request Card */}
        <div className="bg-white border border-[#E8EAF3] rounded-[24px] p-6 shadow-sm">
          <h2 className="font-bold text-base text-[#0F172A] mb-2">Send Connection Request</h2>
          <p className="text-sm text-[#64748B] mb-4">Enter a student UID (e.g. STU-4412 or STU-1092) to connect.</p>
          <form onSubmit={sendRequest} className="flex gap-2">
            <input
              value={uid}
              onChange={e => setUid(e.target.value)}
              required
              placeholder="e.g. STU-4412"
              className="flex-1 px-4 py-2.5 rounded-full border border-[#E8EAF3] bg-white text-sm focus:outline-none focus:border-[#C026D3] focus:ring-2 focus:ring-[#C026D3]/15 font-mono uppercase"
            />
            <Button feature="connect" type="submit">
              <Plus size={16} /> Connect
            </Button>
          </form>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={refresh} />}
      {notice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} className="text-emerald-600 hover:text-emerald-800"><X size={16} /></button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-white border border-[#E8EAF3] rounded-[24px] p-5 flex justify-between items-center">
              <div className="space-y-2">
                <Skeleton className="w-36 h-5 rounded-lg" />
                <Skeleton className="w-24 h-4 rounded-lg" />
              </div>
              <Skeleton className="w-24 h-9 rounded-full" />
            </div>
          ))}
        </div>
      ) : requests.length > 0 ? (
        <div className="space-y-3">
          {requests.map(c => {
            const other = c.requester_id === me.id ? c.recipient_id : c.requester_id;
            const accepted = c.status === 'accepted';
            const granted = grants.some(g => g.owner_id === me.id && g.viewer_id === other);
            const received = c.recipient_id === me.id;
            return (
              <div
                key={c.id}
                className="bg-white border border-[#E8EAF3] rounded-[24px] p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-[#C026D3]/30"
              >
                <div>
                  <h3 className="font-bold text-base text-[#0F172A]">{people[other]?.display_name || 'Student'}</h3>
                  <p className="text-xs text-[#64748B] mt-0.5 font-mono">
                    UID: {people[other]?.uid || other} · <span className="capitalize">{c.status}</span>
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap items-center">
                  {received && c.status === 'pending' ? (
                    <>
                      <Button feature="connect" onClick={() => changeStatus(c.id, 'accepted')}>
                        Accept request
                      </Button>
                      <Button feature="connect" variant="secondary" onClick={() => changeStatus(c.id, 'declined')}>
                        Decline
                      </Button>
                    </>
                  ) : accepted ? (
                    <>
                      <Button feature="connect" variant="secondary" onClick={() => share(other, !granted)}>
                        <ShieldCheck size={16} />
                        {granted ? 'Revoke library access' : 'Allow library access'}
                      </Button>
                      <Button variant="danger" onClick={() => disconnect(c.id)}>
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Badge feature="connect">{received ? 'Declined' : 'Awaiting response'}</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState
            feature="connect"
            icon={<Link2 size={24} />}
            title="Your study circle starts here"
            description="Invite a classmate using their student UID to share notes, exchange study material, and collaborate."
          />
        </Card>
      )}
    </div>
  );
}

export function StudyGroups({ me }: { me: Profile }) {
  const [groups, setGroups] = useState<any[]>([]);
  const [current, setCurrent] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [members, setMembers] = useState<Record<string, Profile>>({});
  const [name, setName] = useState('');
  const [uid, setUid] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [recording, setRecording] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  const isDemo = localStorage.getItem('mc_demo_mode') === 'true' || me.id === 'demo-student-id';

  async function refreshGroups() {
    if (isDemo) {
      const demoGroups = [
        { id: 'grp-1', name: 'Algorithms & Data Structures Club', creator_id: me.id },
        { id: 'grp-2', name: 'NEET & Medical Sciences 2026', creator_id: 'demo-peer-1' },
        { id: 'grp-3', name: 'GATE / University Core Hub', creator_id: 'demo-peer-2' }
      ];
      setGroups(demoGroups);
      if (!current) setCurrent(demoGroups[0]);
      setMembers({
        [me.id]: me,
        'demo-peer-1': { id: 'demo-peer-1', uid: 'STU-4412', display_name: 'Sarah Jenkins' },
        'demo-peer-2': { id: 'demo-peer-2', uid: 'STU-1092', display_name: 'Dev Patel' }
      });
      return;
    }
    const [m, p] = await Promise.all([
      supabase.from('group_members').select('group_id'),
      supabase.from('profiles').select('id,uid,display_name')
    ]);
    if (m.error || p.error) {
      setError(m.error?.message || p.error?.message || 'Could not load groups');
      return;
    }
    setMembers(Object.fromEntries((p.data || []).map(x => [x.id, x])));
    const ids = (m.data || []).map(x => x.group_id);
    if (ids.length) {
      const { data } = await supabase.from('study_groups').select('*').in('id', ids);
      setGroups(data || []);
      if (!current && data && data.length > 0) setCurrent(data[0]);
    } else {
      setGroups([]);
    }
  }

  async function refreshMessages() {
    if (!current) return;
    if (isDemo) {
      const stored = localStorage.getItem(`mc_demo_msgs_${current.id}`);
      if (stored) {
        setMessages(JSON.parse(stored));
      } else {
        const initial = [
          { id: 'm-1', group_id: current.id, sender_id: 'demo-peer-1', body: 'Hey everyone! Has anyone reviewed the cache coherence and interrupt notes?', created_at: new Date(Date.now() - 3600000).toISOString() },
          { id: 'm-2', group_id: current.id, sender_id: me.id, body: 'Yes! Generated clean study notes on 8085 and cache hierarchy. Take a look in the notes reader.', created_at: new Date(Date.now() - 1800000).toISOString() },
          { id: 'm-3', group_id: current.id, sender_id: 'demo-peer-2', body: 'Awesome, practicing the mock test right now.', created_at: new Date(Date.now() - 600000).toISOString() }
        ];
        localStorage.setItem(`mc_demo_msgs_${current.id}`, JSON.stringify(initial));
        setMessages(initial);
      }
      return;
    }
    const { data, error } = await supabase.from('group_messages').select('*').eq('group_id', current.id).order('created_at', { ascending: true }).limit(200);
    if (error) setError(error.message);
    else setMessages(data || []);
  }

  useEffect(() => { void refreshGroups(); }, []);
  useEffect(() => { void refreshMessages(); }, [current?.id]);
  useRefresh('group_members', () => void refreshGroups());
  useRefresh('group_messages', () => void refreshMessages(), current?.id || '');
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    if (isDemo) {
      const newGroup = { id: `grp-${Date.now()}`, name: name.trim(), creator_id: me.id };
      const next = [...groups, newGroup];
      setGroups(next);
      setCurrent(newGroup);
      setName('');
      return;
    }
    const { data, error } = await supabase.from('study_groups').insert({ name: name.trim(), creator_id: me.id }).select().single();
    if (error) return setError(error.message);
    const joined = await supabase.from('group_members').insert({ group_id: data.id, user_id: me.id });
    if (joined.error) return setError(joined.error.message);
    setName('');
    await refreshGroups();
    setCurrent(data);
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!uid.trim() || !current) return;
    if (isDemo) {
      alert(`Student with UID "${uid}" added to ${current.name}!`);
      setUid('');
      return;
    }
    const { error } = await supabase.rpc('add_group_member_by_uid', { target_group: current.id, target_uid: uid });
    if (error) setError(error.message);
    else {
      setUid('');
      await refreshGroups();
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !current) return;
    if (isDemo) {
      const newMsg = { id: `msg-${Date.now()}`, group_id: current.id, sender_id: me.id, body: body.trim(), created_at: new Date().toISOString() };
      const next = [...messages, newMsg];
      localStorage.setItem(`mc_demo_msgs_${current.id}`, JSON.stringify(next));
      setMessages(next);
      setBody('');
      return;
    }
    const { error } = await supabase.from('group_messages').insert({ group_id: current.id, sender_id: me.id, body: body.trim() });
    if (error) setError(error.message);
    else {
      setBody('');
      await refreshMessages();
    }
  }

  async function upload(file: File, kind: 'file' | 'voice' = 'file') {
    if (!current) return;
    if (file.size > 10 * 1024 * 1024) return setError('Maximum attachment size is 10 MB');
    if (isDemo) {
      const newMsg = {
        id: `msg-${Date.now()}`,
        group_id: current.id,
        sender_id: me.id,
        body: '',
        attachment_name: file.name,
        message_type: kind,
        created_at: new Date().toISOString()
      };
      const next = [...messages, newMsg];
      localStorage.setItem(`mc_demo_msgs_${current.id}`, JSON.stringify(next));
      setMessages(next);
      return;
    }
    const safe = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const path = `${me.id}/${crypto.randomUUID()}-${safe}`;
    const uploaded = await supabase.storage.from('study-attachments').upload(path, file, { contentType: file.type || 'application/octet-stream' });
    if (uploaded.error) return setError(uploaded.error.message);
    const { error } = await supabase.from('group_messages').insert({
      group_id: current.id,
      sender_id: me.id,
      body: '',
      attachment_path: path,
      attachment_name: file.name,
      message_type: kind
    });
    if (error) setError(error.message);
    else await refreshMessages();
  }

  async function download(m: any) {
    if (isDemo || !m.attachment_path) {
      alert(`Downloading demo attachment: ${m.attachment_name || 'document.pdf'}`);
      return;
    }
    const { data, error } = await supabase.storage.from('study-attachments').download(m.attachment_path);
    if (error) return setError(error.message);
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = m.attachment_name || 'attachment';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function toggleRecord() {
    if (recording) {
      recorder.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: BlobPart[] = [];
      const r = new MediaRecorder(stream);
      recorder.current = r;
      r.ondataavailable = e => chunks.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        void upload(new File(chunks, `voice-${Date.now()}.webm`, { type: r.mimeType || 'audio/webm' }), 'voice');
      };
      r.start();
      setRecording(true);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="space-y-6 feature-groups">
      <div className="section-heading">
        <IconTile feature="groups"><Users /></IconTile>
        <div>
          <Badge feature="groups">STUDY CIRCLES</Badge>
          <h1>Group discussion and files.</h1>
          <p>Exchange ideas, notes, documents and voice memos in topic-dedicated circles.</p>
        </div>
      </div>

      <div className="bg-white border border-[#E8EAF3] rounded-[24px] p-6 shadow-sm">
        <form onSubmit={create} className="flex gap-3 items-end flex-wrap">
          <label className="flex-1 min-w-[240px]">
            <span className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">New Study Group</span>
            <input
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Distributed Systems & OS Lab"
              maxLength={80}
              className="w-full px-4 py-2.5 rounded-full border border-[#E8EAF3] bg-white text-sm focus:outline-none focus:border-[#0891B2] focus:ring-2 focus:ring-[#0891B2]/15"
            />
          </label>
          <Button feature="groups" type="submit">
            <Plus size={16} /> Create group
          </Button>
        </form>
      </div>

      {error && <ErrorState message={error} onRetry={refreshGroups} />}

      <div className="grid lg:grid-cols-[280px_1fr] gap-5">
        {/* Group Selector */}
        <aside className="bg-white border border-[#E8EAF3] rounded-[24px] p-4 shadow-sm space-y-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#64748B] px-3 py-1">Your groups ({groups.length})</h3>
          <div className="space-y-1">
            {groups.map(g => (
              <button
                key={g.id}
                type="button"
                className={`w-full text-left rounded-2xl p-3 text-sm font-semibold transition flex items-center justify-between ${
                  current?.id === g.id
                    ? 'bg-[#EBF7FB] text-[#0891B2] border border-[#0891B2]/20'
                    : 'text-[#334155] hover:bg-[#F8F9FD]'
                }`}
                onClick={() => setCurrent(g)}
              >
                <span className="truncate">{g.name}</span>
                {current?.id === g.id && <span className="w-1.5 h-1.5 rounded-full bg-[#0891B2]" />}
              </button>
            ))}
            {!groups.length && (
              <p className="text-xs text-[#94A3B8] p-3">No study groups yet. Create one above to get started.</p>
            )}
          </div>
        </aside>

        {/* Active Group Chat */}
        <div className="bg-white border border-[#E8EAF3] rounded-[24px] p-6 shadow-sm min-h-[460px] flex flex-col justify-between">
          {current ? (
            <>
              {/* Header */}
              <div className="flex flex-wrap justify-between items-center border-b border-[#F1F3F9] pb-4 mb-4 gap-3">
                <div>
                  <h3 className="font-bold text-base text-[#0F172A]">{current.name}</h3>
                  <p className="text-xs text-[#64748B]">
                    {current.creator_id === me.id ? 'You are the group creator' : 'Group member'}
                  </p>
                </div>
                {current.creator_id === me.id && (
                  <form onSubmit={addMember} className="flex gap-2">
                    <input
                      className="w-36 px-3 py-1.5 rounded-full border border-[#E8EAF3] text-xs focus:outline-none focus:border-[#0891B2]"
                      value={uid}
                      onChange={e => setUid(e.target.value)}
                      placeholder="Add member UID"
                      required
                    />
                    <Button feature="groups" variant="secondary" type="submit" title="Add member by UID">
                      <Plus size={14} /> Add
                    </Button>
                  </form>
                )}
              </div>

              {/* Messages feed */}
              <div className="flex-1 max-h-[360px] overflow-y-auto space-y-3 pr-2 mb-4">
                {messages.map(m => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] rounded-2xl p-3.5 text-sm ${
                      m.sender_id === me.id
                        ? 'ml-auto bg-[#0F172A] text-white rounded-br-sm'
                        : 'bg-[#F8F9FD] border border-[#E8EAF3] text-[#0F172A] rounded-bl-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <p className={`text-[11px] font-bold ${m.sender_id === me.id ? 'text-[#93C5FD]' : 'text-[#0891B2]'}`}>
                        {members[m.sender_id]?.display_name || (m.sender_id === me.id ? 'You' : 'Student')}
                      </p>
                      <span className={`text-[10px] ${m.sender_id === me.id ? 'text-slate-400' : 'text-[#94A3B8]'}`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {m.body && <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>}
                    {m.attachment_name && (
                      <button
                        type="button"
                        className={`flex items-center gap-2 text-xs font-semibold mt-2 px-3 py-1.5 rounded-full transition ${
                          m.sender_id === me.id
                            ? 'bg-white/10 hover:bg-white/20 text-white'
                            : 'bg-white border border-[#E8EAF3] hover:bg-[#F1F3F9] text-[#0F172A]'
                        }`}
                        onClick={() => download(m)}
                      >
                        {m.message_type === 'voice' ? <Mic size={14} /> : <Download size={14} />} {m.attachment_name}
                      </button>
                    )}
                  </div>
                ))}
                <div ref={bottom} />
              </div>

              {/* Composer */}
              <form onSubmit={sendMessage} className="flex gap-2 items-center pt-2 border-t border-[#F1F3F9]">
                <label aria-label="Attach file" title="Attach study material" className="cursor-pointer p-2.5 rounded-full border border-[#E8EAF3] text-[#64748B] hover:bg-[#F8F9FD] hover:text-[#0F172A] transition">
                  <FileText size={17} />
                  <input
                    type="file"
                    hidden
                    accept=".pdf,.md,.txt,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) void upload(f);
                      e.target.value = '';
                    }}
                  />
                </label>
                <button
                  type="button"
                  aria-label={recording ? 'Stop voice recording' : 'Record voice memo'}
                  title={recording ? 'Stop recording' : 'Record voice memo'}
                  className={`p-2.5 rounded-full border border-[#E8EAF3] transition ${
                    recording ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse' : 'text-[#64748B] hover:bg-[#F8F9FD] hover:text-[#0F172A]'
                  }`}
                  onClick={toggleRecord}
                >
                  {recording ? <MicOff size={17} /> : <Mic size={17} />}
                </button>
                <input
                  className="flex-1 min-w-0 px-4 py-2.5 rounded-full border border-[#E8EAF3] bg-white text-sm focus:outline-none focus:border-[#0891B2] focus:ring-2 focus:ring-[#0891B2]/15"
                  aria-label="Message your group"
                  placeholder="Share a thought, question, or note..."
                  value={body}
                  onChange={e => setBody(e.target.value)}
                />
                <Button feature="groups" disabled={!body.trim()} aria-label="Send message" type="submit">
                  <Send size={16} />
                </Button>
              </form>
            </>
          ) : (
            <EmptyState
              feature="groups"
              icon={<MessageCircle size={24} />}
              title="A dedicated room for focused study"
              description="Select a group from the left panel, or create a new group above to begin collaborating."
            />
          )}
        </div>
      </div>
    </div>
  );
}
