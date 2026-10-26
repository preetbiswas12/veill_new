/**
 * Local-only demo content for Alice's thread.
 *
 * The encrypted media pipeline needs two signed-in sessions to be seen — but
 * the bubbles themselves (photo, video, document, voice) are UI worth reviewing
 * without that setup. When the thread with `alice` is opened, these rows are
 * appended below whatever real history exists. They look and behave like
 * outgoing/incoming media, and say plainly in the action bar that they are
 * local content.
 */

export interface DemoMsg {
  id: string;
  side: 'own' | 'them';
  kind: 'text' | 'photo' | 'video' | 'file' | 'voice';
  /** For text and file rows. */
  text?: string;
  /** Size label for files, e.g. "1.8 MB". */
  meta?: string;
  /** Video and voice durations, in seconds. */
  seconds?: number;
  /** When the row is stamped, in epoch ms, resolved per screen open. */
  at: number;
}

interface DemoSpec extends Omit<DemoMsg, 'at'> {
  /** How long ago the row lands, in ms. */
  ago: number;
}

const SPECS: DemoSpec[] = [
  { id: 'hello', side: 'own', kind: 'text', text: 'Hey Alice! This thread carries local demo content — photo, video, file and voice 🙂', ago: 6.5 * 60_000 },
  { id: 're-hello', side: 'them', kind: 'text', text: 'Nice — let me see it.', ago: 6 * 60_000 },
  { id: 'photo', side: 'own', kind: 'photo', ago: 5 * 60_000 },
  { id: 'video', side: 'own', kind: 'video', seconds: 45, ago: 4.5 * 60_000 },
  { id: 'file', side: 'them', kind: 'file', text: 've-handoff-notes.pdf', meta: '1.8 MB · document', ago: 4 * 60_000 },
  { id: 'voice', side: 'own', kind: 'voice', seconds: 23, ago: 3.5 * 60_000 },
  { id: 'closer', side: 'them', kind: 'text', text: 'The waveform actually animates — nice touch.', ago: 3 * 60_000 },
];

export const demoThread = (): DemoMsg[] => {
  const now = Date.now();
  return SPECS.map((spec) => ({ ...spec, at: now - spec.ago }));
};
