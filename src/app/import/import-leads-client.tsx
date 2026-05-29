"use client";

import { useMemo, useState } from "react";
import { leadStatuses, type LeadStatus } from "@/types/lead";

type ParsedLead = {
  email: string | null;
  full_name: string;
  notes: string | null;
  phone: string | null;
  source: string | null;
  status: LeadStatus;
};

type RawRow = {
  email?: string;
  full_name?: string;
  notes?: string;
  phone?: string;
  source?: string;
  status?: string;
};

type ValidationError = {
  message: string;
  row: number;
};

type ImportSummary = {
  failed: number;
  imported: number;
};

const supportedColumns = ["full_name", "email", "phone", "source", "status", "notes"];
const maxRows = 10000;

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && inQuotes && nextCharacter === '"') {
      current += '"';
      index += 1;
    } else if (character === '"') {
      inQuotes = !inQuotes;
    } else if (character === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }

  values.push(current.trim());
  return values;
}

function parseCsv(text: string) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (!lines.length) {
    return { errors: [{ message: "CSV file is empty.", row: 0 }], rows: [] as RawRow[] };
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim().toLowerCase());
  const errors: ValidationError[] = [];

  if (!headers.includes("full_name")) {
    errors.push({ message: "Missing required full_name column.", row: 1 });
  }

  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce<RawRow>((row, header, index) => {
      if (supportedColumns.includes(header)) {
        row[header as keyof RawRow] = values[index]?.trim() ?? "";
      }
      return row;
    }, {});
  });

  return { errors, rows };
}

function normalizeStatus(status?: string): LeadStatus {
  const match = leadStatuses.find(
    (leadStatus) => leadStatus.toLowerCase() === status?.trim().toLowerCase(),
  );

  return match ?? "New";
}

function validateRows(rows: RawRow[], headerErrors: ValidationError[]) {
  const errors = [...headerErrors];
  const validRows: ParsedLead[] = [];

  rows.slice(0, maxRows).forEach((row, index) => {
    const rowNumber = index + 2;
    const fullName = row.full_name?.trim() ?? "";
    const email = row.email?.trim() ?? "";
    const status = normalizeStatus(row.status);

    if (!fullName) {
      errors.push({ message: "Full name is required.", row: rowNumber });
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ message: "Email format is invalid.", row: rowNumber });
      return;
    }

    validRows.push({
      email: email || null,
      full_name: fullName,
      notes: row.notes?.trim() || null,
      phone: row.phone?.trim() || null,
      source: row.source?.trim() || null,
      status,
    });
  });

  if (rows.length > maxRows) {
    errors.push({ message: "CSV exceeds the 10,000 row maximum.", row: maxRows + 1 });
  }

  return {
    errors,
    totalRows: rows.length,
    validRows,
  };
}

export function ImportLeadsClient() {
  const [fileName, setFileName] = useState("");
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [totalRows, setTotalRows] = useState(0);
  const [validRows, setValidRows] = useState<ParsedLead[]>([]);

  const previewRows = useMemo(() => validRows.slice(0, 10), [validRows]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setSummary(null);
    setValidRows([]);
    setErrors([]);
    setTotalRows(0);

    if (!file) {
      return;
    }

    setFileName(file.name);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setErrors([{ message: "Only .csv files are supported.", row: 0 }]);
      return;
    }

    const text = await file.text();
    const parsed = parseCsv(text);
    const validation = validateRows(parsed.rows, parsed.errors);
    setErrors(validation.errors);
    setTotalRows(validation.totalRows);
    setValidRows(validation.validRows);
  }

  async function importLeads() {
    setImporting(true);
    setSummary(null);

    try {
      const response = await fetch("/api/import-leads", {
        body: JSON.stringify({ leads: validRows }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as ImportSummary & { error?: string };

      if (!response.ok) {
        setErrors([{ message: result.error || "Import failed.", row: 0 }]);
        return;
      }

      setSummary({ failed: result.failed, imported: result.imported });
    } finally {
      setImporting(false);
    }
  }

  return (
    <section className="mt-8 space-y-6">
      <div className="rounded-xl border border-white/10 bg-zinc-950 p-6">
        <label className="block">
          <span className="text-sm font-bold uppercase tracking-[0.16em] text-zinc-500">
            Upload CSV
          </span>
          <input
            accept=".csv"
            className="mt-4 block w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-sm text-zinc-300 file:mr-4 file:rounded-lg file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:text-sm file:font-black file:text-black"
            onChange={handleFileChange}
            type="file"
          />
        </label>
        {fileName && <p className="mt-3 text-sm text-zinc-500">{fileName}</p>}
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <article className="rounded-xl border border-white/10 bg-zinc-950 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Total Rows
          </p>
          <p className="mt-4 text-4xl font-black text-orange-500">{totalRows}</p>
        </article>
        <article className="rounded-xl border border-white/10 bg-zinc-950 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Valid Rows
          </p>
          <p className="mt-4 text-4xl font-black text-orange-500">{validRows.length}</p>
        </article>
        <article className="rounded-xl border border-white/10 bg-zinc-950 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Invalid Rows
          </p>
          <p className="mt-4 text-4xl font-black text-orange-500">{errors.length}</p>
        </article>
      </div>

      {errors.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6">
          <h2 className="text-xl font-black text-red-100">Validation Errors</h2>
          <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
            {errors.slice(0, 100).map((error, index) => (
              <p className="text-sm text-red-200" key={`${error.row}-${index}`}>
                Row {error.row}: {error.message}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-zinc-950 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black">Import Preview</h2>
            <p className="mt-2 text-sm text-zinc-500">First 10 valid rows.</p>
          </div>
          <button
            className="rounded-lg bg-orange-500 px-5 py-3 text-sm font-black text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!validRows.length || importing}
            onClick={importLeads}
            type="button"
          >
            {importing ? "Importing..." : "Import Valid Leads"}
          </button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="border-b border-white/10 text-xs uppercase tracking-[0.16em] text-zinc-500">
              <tr>
                {supportedColumns.map((column) => (
                  <th className="px-4 py-3" key={column}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {previewRows.map((row, index) => (
                <tr key={`${row.full_name}-${index}`}>
                  <td className="px-4 py-3 font-bold text-white">{row.full_name}</td>
                  <td className="px-4 py-3 text-zinc-400">{row.email || "-"}</td>
                  <td className="px-4 py-3 text-zinc-400">{row.phone || "-"}</td>
                  <td className="px-4 py-3 text-zinc-400">{row.source || "-"}</td>
                  <td className="px-4 py-3 text-zinc-400">{row.status}</td>
                  <td className="px-4 py-3 text-zinc-400">{row.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!previewRows.length && (
          <div className="mt-6 rounded-lg border border-dashed border-white/10 bg-black p-8 text-center">
            <p className="font-bold">No valid rows to preview</p>
            <p className="mt-2 text-sm text-zinc-500">Upload a CSV file to validate leads.</p>
          </div>
        )}
      </div>

      {summary && (
        <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-6">
          <h2 className="text-xl font-black text-orange-100">Import Summary</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <p className="rounded-lg bg-black p-4 text-sm font-bold text-zinc-300">
              Imported: <span className="text-orange-400">{summary.imported}</span> leads
            </p>
            <p className="rounded-lg bg-black p-4 text-sm font-bold text-zinc-300">
              Failed: <span className="text-orange-400">{summary.failed}</span> leads
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
