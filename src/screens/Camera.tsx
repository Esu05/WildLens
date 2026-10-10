import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Icon, type IconName } from '../components/ui';

type Facing = 'environment' | 'user';

function RoundButton({ icon, label, onClick, active = false, disabled = false }: {
  icon: IconName; label: string; onClick: () => void; active?: boolean; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active || undefined}
      className={`press flex h-14 w-14 items-center justify-center rounded-full ${active ? 'bg-[#EFE9D8] text-[#26332B]' : 'bg-[#26332B] text-[#F7F5EF]'} disabled:opacity-40`}
    >
      <Icon name={icon} size={26} />
    </button>
  );
}

export function Camera({ onPhoto, onBack }: { onPhoto: (b: Blob) => void; onBack: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [facing, setFacing] = useState<Facing>('environment');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [torchOk, setTorchOk] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [hint, setHint] = useState(true);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setTorchOn(false);

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('This browser can’t open the camera here.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        stop();
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          await v.play().catch(() => undefined);
        }
        const caps = (stream.getVideoTracks()[0]?.getCapabilities?.() ?? {}) as { torch?: boolean };
        setTorchOk(Boolean(caps.torch));
        setError(null);
        setReady(true);
      } catch (e) {
        const name = (e as DOMException)?.name;
        setError(
          name === 'NotAllowedError'
            ? 'WildLens needs permission to use the camera. You can allow it in your browser settings, or choose a photo instead.'
            : 'No camera was found. You can choose a photo instead.',
        );
      }
    })();

    return () => {
      cancelled = true;
      stop();
    };
  }, [facing, stop]);

  useEffect(() => {
    const t = setTimeout(() => setHint(false), 5000);
    return () => clearTimeout(t);
  }, []);

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
      setTorchOn(next);
    } catch {
      setTorchOk(false);
    }
  }

  function shoot() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement('canvas');
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d')?.drawImage(v, 0, 0);
    c.toBlob((b) => b && onPhoto(b), 'image/jpeg', 0.92);
  }

  function picked(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) onPhoto(f);
  }

  return (
    <main className="flex h-app w-full flex-col overflow-hidden bg-[#1B241F] text-[#F7F5EF]">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={picked} aria-label="Choose a photo from your device" />

      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          aria-label="Camera preview"
          className={`h-full w-full object-cover ${ready ? '' : 'invisible'}`}
        />

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-8 text-center">
            <p className="text-lg">{error}</p>
            <Button onClick={() => fileRef.current?.click()} icon="gallery">Choose a photo</Button>
          </div>
        )}

        <div className="safe-t absolute inset-x-0 top-0 flex items-center justify-between px-4">
          <RoundButton icon="back" label="Back" onClick={onBack} />
          {torchOk && <RoundButton icon="flash" label={torchOn ? 'Turn flash off' : 'Turn flash on'} onClick={toggleTorch} active={torchOn} />}
        </div>

        {ready && hint && (
          <p className="rise absolute inset-x-0 bottom-6 mx-auto w-fit rounded-full bg-[#26332B] px-5 py-2 text-base font-medium">
            Keep the subject in frame
          </p>
        )}
      </div>

      <div className="safe-b flex items-center justify-between bg-[#1B241F] px-8 pt-5">
        <RoundButton icon="gallery" label="Choose from gallery" onClick={() => fileRef.current?.click()} />
        <button
          onClick={shoot}
          disabled={!ready}
          aria-label="Take photo"
          className="press flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#F7F5EF] disabled:opacity-40"
        >
          <span className="h-[4.75rem] w-[4.75rem] rounded-full bg-[#F7F5EF]" />
        </button>
        <RoundButton icon="flip" label="Switch camera" onClick={() => setFacing(facing === 'environment' ? 'user' : 'environment')} />
      </div>
    </main>
  );
}
