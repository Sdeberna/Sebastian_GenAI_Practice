import { useEffect, useRef, useState } from 'react';
import { Check, Pencil, RefreshCw, Sparkles, X, AlertCircle } from 'lucide-react';

const SUGGESTIONS = [
  "Hi Alex,\n\nThanks for checking. Thursday at 2 PM doesn't work for me. Would Friday after 3 PM suit you instead? Happy to adjust within that window.\n\nBest,\nSam",
  "Hi Alex,\n\nUnfortunately I can't make Thursday at 2 PM. I'm free on Friday any time after 3 PM, if that works on your side.\n\nThanks,\nSam",
  "Hello Alex,\n\nI'm sorry, I'm unavailable Thursday at 2 PM. Could we move it to Friday, anywhere after 3 PM? Let me know what's best.\n\nRegards,\nSam",
];
const EXAMPLE = 'Example: Decline Thursday and propose Friday after 3 PM';

type Phase = 'idle' | 'suggestion' | 'editing';

export default function Home() {
  const [instruction, setInstruction] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState('');
  const [reply, setReply] = useState<string | null>(null);

  const instrRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);
  const replyRef = useRef<HTMLTextAreaElement>(null);
  const focusTarget = useRef<'panel' | 'edit' | 'instr' | 'reply' | null>(null);

  useEffect(() => {
    const t = focusTarget.current;
    focusTarget.current = null;
    const m = { panel: panelRef, edit: editRef, instr: instrRef, reply: replyRef }[t ?? 'panel'];
    if (t) m.current?.focus();
  });

  const generate = () => {
    if (!instruction.trim()) {
      setError('Enter an instruction first, for example: decline Thursday and propose Friday after 3 PM.');
      setStatus('');
      instrRef.current?.focus();
      return;
    }
    setError('');
    setSubmitted(instruction);
    setIdx(0);
    setText(SUGGESTIONS[0]);
    setPhase('suggestion');
    setStatus('Suggestion ready (demo response 1 of 3).');
    focusTarget.current = 'panel';
  };
  const regenerate = () => {
    const n = (idx + 1) % SUGGESTIONS.length;
    setIdx(n); setText(SUGGESTIONS[n]); setPhase('suggestion');
    setStatus(`New suggestion (demo response ${n + 1} of 3).`);
    focusTarget.current = 'panel';
  };
  const edit = () => { setPhase('editing'); setStatus('Editing suggestion.'); focusTarget.current = 'edit'; };
  const cancel = () => {
    setInstruction(submitted); setPhase('idle'); setStatus('Suggestion cancelled. Your instruction was restored.');
    focusTarget.current = 'instr';
  };
  const accept = () => {
    setReply(text); setPhase('idle'); setInstruction(''); setSubmitted('');
    setStatus('Suggestion inserted into your reply draft.');
    focusTarget.current = 'reply';
  };

  const btn = 'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';
  const ghost = `${btn} border border-border bg-card hover:bg-secondary`;

  return (
    <main className="min-h-[100dvh] px-4 py-8 sm:py-14">
      <div className="mx-auto max-w-2xl space-y-5">
        <header className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold tracking-tight">Reply</h1>
          <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground" data-testid="badge-prototype">
            AI simulated - class prototype
          </span>
        </header>

        <article className="rounded-xl border border-card-border bg-card p-5" aria-label="Received email" data-testid="card-received-email">
          <dl className="mb-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
            <dt className="text-muted-foreground">From</dt><dd>Alex Moreno</dd>
            <dt className="text-muted-foreground">Subject</dt><dd className="font-medium">Thursday at 2 PM?</dd>
          </dl>
          <p className="text-[15px] leading-relaxed">
            Hi,<br />Are you available Thursday at 2 PM to go over the project timeline? Let me know.<br /><br />Thanks, Alex
          </p>
        </article>

        <section className="space-y-3" aria-label="Reply">
          {phase === 'idle' && reply === null && <div>
            <label htmlFor="instruction" className="mb-1.5 block text-sm font-medium">Tell the assistant what to write</label>
            <div className={`relative rounded-xl border bg-card transition-shadow focus-within:ring-2 focus-within:ring-ring/40 ${error ? 'border-destructive' : 'border-input'}`}>
              <textarea
                ref={instrRef}
                id="instruction"
                rows={3}
                value={instruction}
                onChange={(e) => { setInstruction(e.target.value); if (error) setError(''); }}
                placeholder={EXAMPLE}
                aria-invalid={!!error}
                aria-describedby={error ? 'instruction-error instruction-hint' : 'instruction-hint'}
                className="block w-full resize-none rounded-xl bg-transparent p-3 pb-12 text-[15px] outline-none placeholder:text-muted-foreground"
                data-testid="input-instruction"
              />
              <button
                type="button"
                onClick={generate}
                className={`${btn} absolute bottom-2 right-2 bg-primary text-primary-foreground hover:brightness-110 active:scale-95`}
                data-testid="button-ai"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" /> Write with AI
              </button>
            </div>
            {error && (
              <p id="instruction-error" role="alert" className="rise mt-1.5 flex items-start gap-1.5 text-sm text-destructive" data-testid="text-error">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{error}
              </p>
            )}
            <p id="instruction-hint" className="mt-1.5 text-xs text-muted-foreground">
              Demo only: responses are prepared in advance and do not interpret what you type. Any non-empty instruction returns the same decline-Thursday, propose-Friday drafts.
            </p>
          </div>}

          {phase !== 'idle' && (
            <div ref={panelRef} tabIndex={-1} role="group" aria-label="AI suggestion" className="rise rounded-xl border border-primary/30 bg-accent/60 p-4 outline-none" data-testid="panel-suggestion">
              <div className="mb-2 flex items-center justify-between text-xs font-medium text-accent-foreground">
                <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" aria-hidden="true" />Suggestion (simulated)</span>
                <span>Demo {idx + 1} of {SUGGESTIONS.length}</span>
              </div>
              {phase === 'editing' ? (
                <>
                  <label htmlFor="suggestion-edit" className="sr-only">Edit suggestion</label>
                  <textarea ref={editRef} id="suggestion-edit" rows={8} value={text} onChange={(e) => setText(e.target.value)}
                    className="w-full rounded-md border border-input bg-card p-3 text-[15px] leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring/40" data-testid="input-suggestion-edit" />
                </>
              ) : (
                <p className="whitespace-pre-line text-[15px] leading-relaxed" data-testid="text-suggestion">{text}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={accept} className={`${btn} bg-primary text-primary-foreground hover:brightness-110`} data-testid="button-accept"><Check className="h-4 w-4" aria-hidden="true" />Accept</button>
                <button type="button" onClick={edit} disabled={phase === 'editing'} className={`${ghost} disabled:opacity-50`} data-testid="button-edit"><Pencil className="h-4 w-4" aria-hidden="true" />Edit</button>
                <button type="button" onClick={regenerate} className={ghost} data-testid="button-regenerate"><RefreshCw className="h-4 w-4" aria-hidden="true" />Regenerate</button>
                <button type="button" onClick={cancel} className={ghost} data-testid="button-cancel"><X className="h-4 w-4" aria-hidden="true" />Cancel</button>
              </div>
            </div>
          )}

          {reply !== null && (
            <div className="rise" data-testid="composer">
              <label htmlFor="reply" className="mb-1.5 block text-sm font-medium">Your reply draft</label>
              <textarea ref={replyRef} id="reply" rows={9} value={reply} onChange={(e) => setReply(e.target.value)}
                className="w-full rounded-xl border border-input bg-card p-3 text-[15px] leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring/40" data-testid="input-reply" />
              <p className="mt-1.5 text-xs text-muted-foreground">Draft only. This prototype does not send email.</p>
            </div>
          )}
        </section>

        <p role="status" aria-live="polite" className="sr-only" data-testid="text-status">{status}</p>
      </div>
    </main>
  );
}
