import { imageUrl } from '@/shared/lib/storage';
import { Badge } from '@/shared/ui/feedback';
import type { PdfBlock, PdfDocument } from './pdf-document';

function Block({ block }: { block: PdfBlock }) {
  switch (block.kind) {
    case 'paragraph':
      return <p className="leading-relaxed whitespace-pre-line text-neutral-700">{block.text}</p>;
    case 'list': {
      const List = block.ordered ? 'ol' : 'ul';
      return (
        <List className={block.ordered ? 'list-decimal space-y-2 pl-6' : 'list-disc space-y-1 pl-6'}>
          {block.items.map((item, i) => (
            <li key={i} className="text-neutral-700">
              {item}
            </li>
          ))}
        </List>
      );
    }
    case 'keyValue':
      return (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {block.items.map((item) => (
            <div key={item.label}>
              <dt className="text-xs text-neutral-500">{item.label}</dt>
              <dd className="font-semibold text-neutral-900">{item.value}</dd>
            </div>
          ))}
        </dl>
      );
    case 'table':
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500">
                {block.head.map((cell, i) => (
                  <th
                    key={cell}
                    scope="col"
                    className={i === 0 ? 'py-2 text-left font-medium' : 'py-2 text-right font-medium'}
                  >
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r} className="border-b border-neutral-100 last:border-0">
                  {row.map((cell, i) => (
                    <td key={i} className={i === 0 ? 'py-1.5 whitespace-pre-line' : 'py-1.5 text-right tabular-nums'}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

/** HTML rendering of the same document model used for PDF export. */
export function DocumentPreview({ document }: { document: PdfDocument }) {
  return (
    <article className="space-y-6">
      {document.imageUrl && (
        <img src={imageUrl(document.imageUrl, 1200)} alt="" className="aspect-video w-full rounded-xl object-cover" />
      )}
      <header>
        {document.badges && document.badges.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {document.badges.map((badge) => (
              <Badge key={badge} tone="primary">
                {badge}
              </Badge>
            ))}
          </div>
        )}
        <h2 className="text-2xl font-bold text-neutral-900">{document.title}</h2>
        {document.subtitle && <p className="mt-1 text-neutral-600">{document.subtitle}</p>}
      </header>
      {document.sections.map((section, index) => (
        <section key={`${index}-${section.heading}`} className="space-y-3">
          <h3 className="border-b border-neutral-100 pb-1 font-sans text-lg font-semibold text-primary-700">
            {section.heading}
          </h3>
          {section.blocks.map((block, i) => (
            <Block key={i} block={block} />
          ))}
        </section>
      ))}
    </article>
  );
}
