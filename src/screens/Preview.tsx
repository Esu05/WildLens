import { Button, Photo } from '../components/ui';

export function Preview({ photo, onRetake, onIdentify }: { photo: Blob; onRetake: () => void; onIdentify: () => void }) {
  return (
    <main className="safe-t safe-b flex h-app flex-col gap-5 px-5">
      <h1 className="sr-only">Review your photo</h1>
      <div className="min-h-0 flex-1 pt-2">
        <Photo blob={photo} alt="The photo you just took" className="h-full w-full rounded-3xl" />
      </div>
      <div className="flex flex-col gap-3">
        <Button variant="secondary" onClick={onRetake}>Retake</Button>
        <Button onClick={onIdentify}>Identify</Button>
      </div>
    </main>
  );
}
