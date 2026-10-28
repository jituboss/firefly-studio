/**
 * RFC 4180 CSV, read as text and nothing else.
 *
 * Hand-written rather than exceljs's reader, because that one guesses: it
 * turns "03/04/2026" into a Date in the SERVER's timezone and "007" into 7,
 * and an import must see exactly what the user typed so `lib/import/cells.ts`
 * can apply its own, stated rules. Handles quoted fields, doubled quotes,
 * newlines inside quotes, CRLF, a UTF-8 BOM, and `;` as the separator when the
 * header row uses it (what Excel writes in comma-decimal locales).
 */
export function parseCsv(input: string): string[][] {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const firstLine = text.slice(0, text.search(/\r?\n|$/));
  const separator =
    (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]!;
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"' && field === '') {
      quoted = true;
    } else if (char === separator) {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
