import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Mic, MicOff, MonitorUp, Phone, PhoneOff, Video, Users, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Badge, Button, Card, EmptyState, ErrorState, IconTile } from './UI';

type Profile = { id: string; uid: string; display_name: string };
type Invite = { id: string; caller_id: string; callee_id: string; status: string; created_at: string };

export function Meetings({ me }: { me: Profile }) {
  const [uid, setUid] = useState('');
  const [invites, setInvites] = useState<Invite[]>([]);
  const [active, setActive] = useState<Invite | null>(null);
  const [message, setMessage] = useState('');
  const [mic, setMic] = useState(true);
  const [camera, setCamera] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const localStream = useRef<MediaStream | null>(null);
  const peer = useRef<RTCPeerConnection | null>(null);
  const seenSignals = useRef<Set<number>>(new Set());
  const candidates = useRef<RTCIceCandidateInit[]>([]);
  const activeRef = useRef<Invite | null>(null);

  const isDemo = localStorage.getItem('mc_demo_mode') === 'true' || me.id === 'demo-student-id';

  async function refresh() {
    if (isDemo) {
      setInvites([
        { id: 'inv-1', caller_id: 'demo-peer-1', callee_id: me.id, status: 'pending', created_at: new Date(Date.now() - 300000).toISOString() }
      ]);
      return;
    }
    const { data, error } = await supabase.from('meeting_invites').select('*').order('created_at', { ascending: false }).limit(30);
    if (error) setMessage(error.message);
    else setInvites(data || []);
  }

  useEffect(() => {
    void refresh();
    if (isDemo) return;
    const channel = supabase.channel(`my-meetings-${me.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'meeting_invites' }, () => void refresh()).subscribe();
    return () => { void supabase.removeChannel(channel); cleanup(); };
  }, [me.id]);

  function cleanup() {
    peer.current?.close();
    peer.current = null;
    localStream.current?.getTracks().forEach(t => t.stop());
    localStream.current = null;
    if (localVideo.current) localVideo.current.srcObject = null;
    if (remoteVideo.current) remoteVideo.current.srcObject = null;
    activeRef.current = null;
    setActive(null);
    setIsScreenSharing(false);
    seenSignals.current.clear();
    candidates.current = [];
  }

  async function hangup() {
    if (activeRef.current && !isDemo) await supabase.rpc('end_meeting', { target_id: activeRef.current.id });
    cleanup();
    void refresh();
  }

  async function createCall(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    if (!uid.trim()) return;

    if (isDemo) {
      setMessage(`Invitation sent to student (${uid.trim().toUpperCase()}). Call preview active.`);
      setUid('');
      return;
    }
    const { data, error } = await supabase.from('profiles').select('id').eq('uid', uid.trim().toUpperCase()).maybeSingle();
    if (error || !data) return setMessage(error?.message || 'Student UID not found');
    if (data.id === me.id) return setMessage('You cannot call yourself');
    const result = await supabase.from('meeting_invites').insert({ caller_id: me.id, callee_id: data.id }).select().single();
    if (result.error) setMessage(result.error.message);
    else {
      setMessage('Invitation sent. Waiting for the classmate to accept.');
      setUid('');
      await refresh();
    }
  }

  async function accept(invite: Invite) {
    setMessage('');
    try {
      await initialize(invite, false);
      if (!isDemo) {
        const { error } = await supabase.from('meeting_invites').update({ status: 'accepted' }).eq('id', invite.id);
        if (error) throw error;
      }
      await refresh();
    } catch (e) {
      cleanup();
      setMessage((e as Error).message);
    }
  }

  async function decline(invite: Invite) {
    if (isDemo) {
      setInvites(prev => prev.filter(i => i.id !== invite.id));
      return;
    }
    const { error } = await supabase.from('meeting_invites').update({ status: 'declined' }).eq('id', invite.id);
    if (error) setMessage(error.message);
    else await refresh();
  }

  async function signal(meetingId: string, payload: object) {
    if (isDemo) return;
    const { error } = await supabase.from('meeting_signals').insert({ meeting_id: meetingId, sender_id: me.id, payload });
    if (error) throw error;
  }

  async function handleSignal(row: any) {
    if (row.sender_id === me.id || seenSignals.current.has(row.id) || !peer.current) return;
    seenSignals.current.add(row.id);
    const pc = peer.current;
    const payload = row.payload;
    try {
      if (payload.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.description));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await signal(row.meeting_id, { type: 'answer', description: answer });
      }
      if (payload.type === 'answer') await pc.setRemoteDescription(new RTCSessionDescription(payload.description));
      if (payload.type === 'candidate') {
        if (pc.remoteDescription) await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        else candidates.current.push(payload.candidate);
      }
      if (pc.remoteDescription && candidates.current.length) {
        for (const c of candidates.current) await pc.addIceCandidate(new RTCIceCandidate(c));
        candidates.current = [];
      }
    } catch (e) {
      setMessage(`Call signaling failed: ${(e as Error).message}`);
    }
  }

  async function initialize(invite: Invite, isCaller: boolean) {
    if (peer.current) return;
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStream.current = stream;
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    peer.current = pc;
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
    pc.ontrack = event => {
      if (remoteVideo.current) remoteVideo.current.srcObject = event.streams[0];
    };
    pc.onicecandidate = event => {
      if (event.candidate) void signal(invite.id, { type: 'candidate', candidate: event.candidate.toJSON() }).catch(e => setMessage(e.message));
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') setMessage('Connection failed. A TURN relay may be required on this network.');
    };
    setActive(invite);
    activeRef.current = invite;
    setMic(true);
    setCamera(true);
    setTimeout(() => {
      if (localVideo.current) localVideo.current.srcObject = stream;
    }, 0);
    const { data } = await supabase.from('meeting_signals').select('*').eq('meeting_id', invite.id).order('id');
    for (const row of data || []) await handleSignal(row);
    if (isCaller) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await signal(invite.id, { type: 'offer', description: offer });
    }
  }

  useEffect(() => {
    const pending = invites.find(i => i.caller_id === me.id && i.status === 'accepted' && !peer.current);
    if (pending) void initialize(pending, true).catch(e => setMessage(e.message));
    const ended = invites.find(i => i.id === activeRef.current?.id && i.status === 'ended');
    if (ended) cleanup();
  }, [invites, me.id]);

  useEffect(() => {
    if (!active) return;
    const channel = supabase.channel(`signaling-${active.id}`).on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'meeting_signals',
      filter: `meeting_id=eq.${active.id}`
    }, event => void handleSignal(event.new)).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [active?.id]);

  function toggleMic() {
    localStream.current?.getAudioTracks().forEach(t => t.enabled = !mic);
    setMic(!mic);
  }

  function toggleCamera() {
    localStream.current?.getVideoTracks().forEach(t => t.enabled = !camera);
    setCamera(!camera);
  }

  async function shareScreen() {
    try {
      if (isScreenSharing) {
        // Switch back to camera
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const camTrack = camStream.getVideoTracks()[0];
        const sender = peer.current?.getSenders().find(s => s.track?.kind === 'video');
        if (sender) await sender.replaceTrack(camTrack);
        if (localVideo.current) localVideo.current.srcObject = camStream;
        localStream.current = camStream;
        setIsScreenSharing(false);
        return;
      }
      const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const track = screen.getVideoTracks()[0];
      const sender = peer.current?.getSenders().find(s => s.track?.kind === 'video');
      if (!sender) return;
      const original = localStream.current?.getVideoTracks()[0];
      await sender.replaceTrack(track);
      if (localVideo.current) localVideo.current.srcObject = screen;
      setIsScreenSharing(true);
      track.onended = () => {
        void sender.replaceTrack(original || null);
        if (localVideo.current) localVideo.current.srcObject = localStream.current;
        setIsScreenSharing(false);
      };
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  return (
    <div className="space-y-6 feature-meetings">
      <div className="section-heading">
        <IconTile feature="meetings"><Video /></IconTile>
        <div>
          <Badge feature="meetings">PEER STUDY ROOMS</Badge>
          <h1>Face-to-face learning sessions.</h1>
          <p>Invite classmates by UID for 1-on-1 private video discussion or interactive screen sharing.</p>
        </div>
      </div>

      {/* Invite card */}
      <div className="bg-white border border-[#E8EAF3] rounded-[24px] p-6 shadow-sm">
        <h2 className="font-bold text-base text-[#0F172A] mb-2">Start a Study Call</h2>
        <p className="text-sm text-[#64748B] mb-4">Enter a student's unique ID to ring their workspace for a real-time session.</p>
        <form onSubmit={createCall} className="flex gap-3 flex-wrap">
          <input
            required
            value={uid}
            onChange={e => setUid(e.target.value)}
            placeholder="e.g. STU-4412 or STU-1092"
            className="flex-1 min-w-[240px] px-4 py-2.5 rounded-full border border-[#E8EAF3] bg-white text-sm focus:outline-none focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/15 font-mono uppercase"
          />
          <Button feature="meetings" type="submit">
            <Phone size={16} /> Invite to call
          </Button>
        </form>
      </div>

      {message && <ErrorState message={message} onRetry={() => setMessage('')} />}

      {/* Active Call Interface */}
      {active && (
        <div className="bg-white border border-[#E8EAF3] rounded-[24px] p-6 shadow-md space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F3F9]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="font-bold text-base text-[#0F172A]">Study Session in Progress</h2>
            </div>
            <Badge feature="meetings">P2P ENCRYPTED</Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative rounded-[20px] bg-slate-950 overflow-hidden aspect-video flex items-center justify-center border border-[#E8EAF3]">
              <video ref={remoteVideo} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5">
                <Users size={13} /> Classmate
              </div>
            </div>
            <div className="relative rounded-[20px] bg-slate-950 overflow-hidden aspect-video flex items-center justify-center border border-[#E8EAF3]">
              <video ref={localVideo} autoPlay muted playsInline className="w-full h-full object-cover" />
              <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold">
                You {isScreenSharing && '(Sharing Screen)'}
              </div>
            </div>
          </div>

          {/* Floating Call Controls */}
          <div className="flex justify-center items-center gap-3 pt-2">
            <Button
              feature="meetings"
              variant="secondary"
              aria-label={mic ? 'Mute microphone' : 'Unmute microphone'}
              title={mic ? 'Mute microphone' : 'Unmute microphone'}
              onClick={toggleMic}
            >
              {mic ? <Mic size={18} /> : <MicOff size={18} className="text-rose-500" />}
              <span className="hidden sm:inline">{mic ? 'Mute' : 'Unmuted'}</span>
            </Button>
            <Button
              feature="meetings"
              variant="secondary"
              aria-label={camera ? 'Turn camera off' : 'Turn camera on'}
              title={camera ? 'Turn camera off' : 'Turn camera on'}
              onClick={toggleCamera}
            >
              {camera ? <Camera size={18} /> : <CameraOff size={18} className="text-rose-500" />}
              <span className="hidden sm:inline">{camera ? 'Stop video' : 'Start video'}</span>
            </Button>
            <Button
              feature="meetings"
              variant="secondary"
              aria-label="Share screen"
              title="Share screen"
              onClick={shareScreen}
            >
              <MonitorUp size={18} className={isScreenSharing ? 'text-emerald-500' : ''} />
              <span className="hidden sm:inline">{isScreenSharing ? 'Stop sharing' : 'Share screen'}</span>
            </Button>
            <Button variant="danger" aria-label="End call" title="End call" onClick={hangup}>
              <PhoneOff size={18} />
              <span>Leave room</span>
            </Button>
          </div>

          <p className="text-xs text-center text-[#94A3B8]">
            Direct peer-to-peer WebRTC stream. High fidelity screen-sharing supported.
          </p>
        </div>
      )}

      {/* Meeting requests / History */}
      <div className="bg-white border border-[#E8EAF3] rounded-[24px] p-6 shadow-sm">
        <h3 className="font-bold text-base text-[#0F172A] mb-4">Meeting Requests & History</h3>
        {invites.filter(i => !['ended', 'declined'].includes(i.status)).length > 0 ? (
          <div className="divide-y divide-[#F1F3F9]">
            {invites
              .filter(i => !['ended', 'declined'].includes(i.status))
              .map(invite => (
                <div key={invite.id} className="flex flex-wrap justify-between items-center gap-3 py-4 first:pt-0 last:pb-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[#0F172A]">
                        {invite.caller_id === me.id ? 'Outgoing call invitation' : 'Incoming call invitation'}
                      </span>
                      <Badge feature="meetings">{invite.status}</Badge>
                    </div>
                    <p className="text-xs text-[#94A3B8] mt-1 font-mono">
                      {new Date(invite.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {invite.callee_id === me.id && invite.status === 'pending' && (
                      <>
                        <Button feature="meetings" onClick={() => accept(invite)}>
                          <Phone size={14} /> Accept
                        </Button>
                        <Button feature="meetings" variant="secondary" onClick={() => decline(invite)}>
                          Decline
                        </Button>
                      </>
                    )}
                    {invite.id === active?.id && (
                      <Button variant="danger" onClick={hangup}>
                        <PhoneOff size={14} /> End
                      </Button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <EmptyState
            feature="meetings"
            icon={<Video size={24} />}
            title="No active invitations"
            description="Enter a classmate's UID above to invite them to a live peer study room."
          />
        )}
      </div>
    </div>
  );
}
