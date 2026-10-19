import React from 'react';
import { CheckSquare, Square, ChevronRight } from 'lucide-react';

interface FormattedAcademicContentProps {
  content?: string | null;
  className?: string;
}

/**
 * Parses inline markdown syntax (**bold**, *italic*, `code`) into clean React nodes.
 */
function renderInlineMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];
  // Tokenize by **bold**, `inline code`, and *italic*
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-100 border border-slate-200 text-indigo-700 font-mono text-[11px] font-semibold"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={idx} className="italic text-slate-800 font-medium">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

/**
 * Renders structured academic markdown content (headings, tables, checklists, bullet lists,
 * numbered lists, and paragraphs) with clean university-grade typography.
 */
export const FormattedAcademicContent: React.FC<FormattedAcademicContentProps> = ({
  content,
  className = '',
}) => {
  if (!content || !content.trim()) {
    return (
      <p className="text-xs text-slate-400 italic">
        No additional reading notes provided for this section.
      </p>
    );
  }

  const rawLines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i].trim();

    // 1. Skip empty lines
    if (!line) {
      i++;
      continue;
    }

    // 2. Markdown Headings (#, ##, ###, ####)
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].replace(/\*\*/g, '').trim();
      blocks.push(
        <div
          key={`h-${i}`}
          className={`pt-3 pb-1.5 border-b border-slate-200/80 flex items-center gap-2.5 ${
            i === 0 ? 'mt-0' : 'mt-4'
          }`}
        >
          <span className="w-1.5 h-4 rounded-full bg-indigo-600 shrink-0" />
          <h4
            className={`${
              level <= 2 ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
            } font-black text-slate-900 tracking-tight`}
          >
            {renderInlineMarkdown(headingText)}
          </h4>
        </div>
      );
      i++;
      continue;
    }

    // 3. Markdown Tables (| Col 1 | Col 2 |)
    if (line.startsWith('|') && line.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('|')) {
        tableLines.push(rawLines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const parseCells = (rowStr: string) =>
          rowStr
            .replace(/^\|/, '')
            .replace(/\|$/, '')
            .split('|')
            .map((c) => c.trim());

        const headers = parseCells(tableLines[0]);
        // Filter out separator lines like | :--- | :--- |
        const dataRows = tableLines
          .slice(1)
          .filter((r) => !/^\|?[\s:|-]+\|?$/.test(r))
          .map(parseCells);

        blocks.push(
          <div
            key={`tbl-${i}`}
            className="my-3 overflow-x-auto rounded-xl border border-slate-200 shadow-2xs bg-white"
          >
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white">
                  {headers.map((h, hIdx) => (
                    <th
                      key={hIdx}
                      className="py-2.5 px-3.5 font-bold text-[11px] uppercase tracking-wider border-b border-slate-800"
                    >
                      {renderInlineMarkdown(h.replace(/\*\*/g, ''))}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dataRows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}
                  >
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className="py-2.5 px-3.5 text-slate-700 leading-relaxed align-top"
                      >
                        {renderInlineMarkdown(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // 4. Checklist items (- [x] or - [ ])
    if (/^[-*]\s+\[[xX ]\]\s+/.test(line)) {
      const checklistItems: { checked: boolean; text: string }[] = [];
      while (i < rawLines.length && /^[-*]\s+\[[xX ]\]\s+/.test(rawLines[i].trim())) {
        const current = rawLines[i].trim();
        const isChecked = /^[-*]\s+\[[xX]\]/.test(current);
        const itemText = current.replace(/^[-*]\s+\[[xX ]\]\s+/, '');
        checklistItems.push({ checked: isChecked, text: itemText });
        i++;
      }

      blocks.push(
        <div key={`chk-${i}`} className="my-2.5 space-y-2">
          {checklistItems.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/70 text-xs text-slate-700 leading-relaxed"
            >
              {item.checked ? (
                <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">{renderInlineMarkdown(item.text)}</div>
            </div>
          ))}
        </div>
      );
      continue;
    }

    // 5. Unordered Bullet Lists (- item or * item)
    if (/^[-•]\s+/.test(line)) {
      const listItems: string[] = [];
      while (i < rawLines.length && /^[-•]\s+/.test(rawLines[i].trim())) {
        listItems.push(rawLines[i].trim().replace(/^[-•]\s+/, ''));
        i++;
      }

      blocks.push(
        <ul key={`ul-${i}`} className="my-2.5 space-y-2">
          {listItems.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2.5 text-xs sm:text-[13px] text-slate-700 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-200/70 shadow-2xs"
            >
              <ChevronRight className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-1" />
              <div className="flex-1">{renderInlineMarkdown(item)}</div>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 6. Ordered Numbered Lists (1. item, 2. item)
    if (/^\d+\.\s+/.test(line)) {
      const orderedItems: { num: string; text: string }[] = [];
      while (i < rawLines.length) {
        const trimmed = rawLines[i].trim();
        const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
        if (numMatch) {
          orderedItems.push({ num: numMatch[1], text: numMatch[2] });
          i++;
          // Also consume indented sub-bullets right beneath a numbered item
          while (i < rawLines.length && /^\s{2,}[-*]\s+/.test(rawLines[i])) {
            const subText = rawLines[i].trim().replace(/^[-*]\s+/, '');
            orderedItems[orderedItems.length - 1].text += ` — ${subText}`;
            i++;
          }
        } else {
          break;
        }
      }

      blocks.push(
        <ol key={`ol-${i}`} className="my-2.5 space-y-2">
          {orderedItems.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs text-xs sm:text-[13px] text-slate-700 leading-relaxed"
            >
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                {item.num}
              </span>
              <div className="flex-1">{renderInlineMarkdown(item.text)}</div>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // 7. Standard Paragraph (merge consecutive plain lines)
    const paraLines: string[] = [];
    while (
      i < rawLines.length &&
      rawLines[i].trim() !== '' &&
      !/^(#{1,4})\s+/.test(rawLines[i].trim()) &&
      !rawLines[i].trim().startsWith('|') &&
      !/^[-*•]\s+/.test(rawLines[i].trim()) &&
      !/^\d+\.\s+/.test(rawLines[i].trim())
    ) {
      paraLines.push(rawLines[i].trim());
      i++;
    }

    if (paraLines.length > 0) {
      blocks.push(
        <p
          key={`p-${i}`}
          className="text-xs sm:text-[13px] text-slate-700 leading-relaxed"
        >
          {renderInlineMarkdown(paraLines.join(' '))}
        </p>
      );
    } else {
      i++;
    }
  }

  return <div className={`space-y-3 ${className}`}>{blocks}</div>;
};

export default FormattedAcademicContent;
