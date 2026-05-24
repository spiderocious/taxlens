import { useRef, useState } from 'react';
import { Show } from 'meemaw';

import { AppText, Callout, ErrorState } from '@taxlens/ui';
import { IconUpload } from '@icons';

interface StatementDropzoneProps {
  readonly uploading: boolean;
  readonly error: string | null;
  readonly onFile: (file: File) => void;
}

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB — mirrors STATEMENT_MAX_BYTES default

// PDF picker + drag/drop. Client-side guards (type + size) are UX only; the
// backend re-validates. On a valid pick we hand the File up to UploadFlow.
export function StatementDropzone({ uploading, error, onFile }: StatementDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  function pick(file: File | undefined) {
    setLocalError(null);
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setLocalError('That isn’t a PDF. Export your bank statement as a PDF and try again.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setLocalError('That file is over 10 MB. Try a shorter statement (3–12 months).');
      return;
    }
    onFile(file);
  }

  return (
    <section className="grid gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          pick(e.dataTransfer.files[0]);
        }}
        disabled={uploading}
        className={[
          'grid place-items-center gap-3 rounded-card border-2 border-dashed px-6 py-12 text-center transition-colors',
          'focus:outline-none focus-visible:ring-[3px] focus-visible:ring-clay-500/45 disabled:opacity-60',
          dragOver ? 'border-clay-500 bg-clay-50' : 'border-edge-strong bg-paper-sheet hover:border-ink-muted',
        ].join(' ')}
      >
        <span className="grid h-12 w-12 place-items-center rounded-full bg-clay-50 text-clay-700">
          <IconUpload size={22} aria-hidden="true" />
        </span>
        <AppText variant="heading-3">{uploading ? 'Uploading…' : 'Drop your statement PDF here'}</AppText>
        <AppText variant="body-sm" className="text-ink-muted">
          or click to choose a file · PDF, 3–12 months, up to 10 MB
        </AppText>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </button>

      <Show when={localError !== null}>
        <ErrorState title="That file won’t work" description={localError ?? ''} />
      </Show>
      <Show when={error !== null}>
        <ErrorState title="Upload failed" description={error ?? ''} />
      </Show>

      <Callout heading="Your statement is never stored">
        We read it once to extract your inflows, then discard the file. No account, nothing saved.
      </Callout>
    </section>
  );
}
