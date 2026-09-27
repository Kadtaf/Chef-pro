import { FileDown, Pencil, Printer, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { renderPdf, type PdfDocument } from '@/features/export/pdf-document';
import { slugify } from '@/shared/lib/format';
import { toUserMessage } from '@/shared/lib/errors';
import { Button } from '@/shared/ui/button';
import { useConfirm } from '@/shared/ui/confirm-context';

type DetailActionsProps = {
  editTo?: string;
  pdf?: () => PdfDocument;
  pdfName?: string;
  onDelete?: () => Promise<unknown>;
  deleteLabel?: string;
  afterDeleteTo?: string;
  children?: ReactNode;
};

/** Standard action bar of admin detail pages (print, PDF, edit, delete). */
export function DetailActions({
  editTo,
  pdf,
  pdfName = 'document',
  onDelete,
  deleteLabel = 'cet élément',
  afterDeleteTo,
  children,
}: DetailActionsProps) {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);

  const exportPdf = async () => {
    if (!pdf) return;
    setExporting(true);
    try {
      await renderPdf(pdf(), `${slugify(pdfName)}.pdf`);
    } catch (error) {
      toast.error(toUserMessage(error));
    } finally {
      setExporting(false);
    }
  };

  const remove = async () => {
    if (!onDelete) return;
    if (!(await confirm({ title: `Supprimer ${deleteLabel} ?` }))) return;
    await onDelete();
    if (afterDeleteTo) await navigate(afterDeleteTo, { replace: true });
  };

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      {children}
      <Button variant="subtle" onClick={() => window.print()}>
        <Printer />
        Imprimer
      </Button>
      {pdf && (
        <Button variant="subtle" loading={exporting} onClick={() => void exportPdf()}>
          <FileDown />
          PDF
        </Button>
      )}
      {editTo && (
        <Button asChild>
          <Link to={editTo}>
            <Pencil />
            Modifier
          </Link>
        </Button>
      )}
      {onDelete && (
        <Button
          variant="ghost"
          className="text-error-600 hover:bg-error-50"
          aria-label="Supprimer"
          onClick={() => void remove()}
        >
          <Trash2 />
        </Button>
      )}
    </div>
  );
}
