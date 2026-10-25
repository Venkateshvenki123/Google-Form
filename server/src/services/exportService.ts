import * as XLSX from 'xlsx';

export interface ExportFieldInfo {
  id: string;
  label: string;
  fieldType: string;
}

export interface ExportResponseRow {
  responseId: string;
  submittedAt: string;
  respondentEmail: string;
  answers: Record<string, any>;
  metadata?: Record<string, any>;
}

export function generateExportData(
  fields: ExportFieldInfo[],
  responses: ExportResponseRow[]
): { headers: string[]; rows: any[][] } {
  // Columns: # | Submission ID | Submitted At | Respondent Email | [Dynamic Fields...]
  const dynamicFieldHeaders = fields
    .filter(f => f.fieldType !== 'section')
    .map(f => f.label || `Field ${f.id.slice(0, 6)}`);

  const headers = ['#', 'Submission ID', 'Submitted At', 'Respondent Email', ...dynamicFieldHeaders];

  const rows = responses.map((resp, index) => {
    const rowData: any[] = [
      index + 1,
      resp.responseId,
      new Date(resp.submittedAt).toLocaleString(),
      resp.respondentEmail || 'N/A',
    ];

    fields
      .filter(f => f.fieldType !== 'section')
      .forEach(f => {
        const val = resp.answers[f.id];
        if (val === undefined || val === null) {
          rowData.push('');
        } else if (Array.isArray(val)) {
          rowData.push(val.join(', '));
        } else if (typeof val === 'object') {
          // File upload or structured answer
          if (val.url) {
            rowData.push(val.originalName ? `${val.originalName} (${val.url})` : val.url);
          } else {
            rowData.push(JSON.stringify(val));
          }
        } else if (typeof val === 'boolean') {
          rowData.push(val ? 'Yes' : 'No');
        } else {
          rowData.push(String(val));
        }
      });

    return rowData;
  });

  return { headers, rows };
}

export function generateCsv(headers: string[], rows: any[][]): string {
  const escapeCsv = (val: any): string => {
    const str = val === null || val === undefined ? '' : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    headers.map(escapeCsv).join(','),
    ...rows.map(row => row.map(escapeCsv).join(',')),
  ];

  return lines.join('\r\n');
}

export function generateExcelBuffer(headers: string[], rows: any[][], sheetName: string = 'Responses'): Buffer {
  const wb = XLSX.utils.book_new();
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  const colWidths = headers.map((h, i) => {
    let maxLen = h.length;
    for (const row of rows) {
      const cellVal = row[i] !== undefined ? String(row[i]) : '';
      if (cellVal.length > maxLen) {
        maxLen = Math.min(cellVal.length, 50);
      }
    }
    return { wch: Math.max(maxLen + 3, 12) };
  });
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
}
