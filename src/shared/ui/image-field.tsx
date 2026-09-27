import { ImageIcon, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { toUserMessage } from '@/shared/lib/errors';
import { uploadImage } from '@/shared/lib/storage';
import { Button } from './button';
import { Field, Input } from './form';

type ImageFieldProps = {
  label?: string;
  value: string | null | undefined;
  onChange: (url: string) => void;
  folder: string;
  error?: string;
};

/** Image URL input with direct upload to Supabase Storage and live preview. */
export function ImageField({ label = 'Image', value, onChange, folder, error }: ImageFieldProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      onChange(await uploadImage(file, folder));
      toast.success('Image téléversée');
    } catch (err) {
      toast.error(toUserMessage(err));
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  return (
    <Field label={label} error={error} hint="Collez une URL ou téléversez un fichier (PNG, JPEG, WebP — 10 Mo max).">
      {(control) => (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              {...control}
              type="url"
              placeholder="https://…"
              value={value ?? ''}
              onChange={(e) => onChange(e.target.value)}
            />
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              aria-label="Téléverser une image"
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
            <Button variant="subtle" loading={uploading} onClick={() => fileInput.current?.click()}>
              <Upload />
              <span className="hidden sm:inline">Téléverser</span>
            </Button>
            {value && (
              <Button variant="ghost" size="icon" aria-label="Retirer l'image" onClick={() => onChange('')}>
                <Trash2 />
              </Button>
            )}
          </div>
          <div className="flex aspect-video max-w-sm items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
            {value ? (
              <img src={value} alt="Aperçu" className="size-full object-cover" />
            ) : (
              <ImageIcon className="size-10 text-neutral-300" aria-hidden />
            )}
          </div>
        </div>
      )}
    </Field>
  );
}
