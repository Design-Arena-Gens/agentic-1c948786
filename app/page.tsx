/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useMemo, useState } from "react";
import UploadArea from "@components/UploadArea";
import ResultsTable from "@components/ResultsTable";
import { summarizeCv } from "@lib/summarize";
import { downloadCsv } from "@lib/csv";

export type ParsedCv = {
  fileName: string;
  text: string;
};

export type CvSummary = {
  fileName: string;
  candidateName: string;
  email: string;
  phone: string;
  yearsExperience: string;
  topSkills: string[];
  summary: string;
};

export default function Page() {
  const [jobDescription, setJobDescription] = useState("");
  const [parsedCvs, setParsedCvs] = useState<ParsedCv[]>([]);
  const [summaries, setSummaries] = useState<CvSummary[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [sheetsStatus, setSheetsStatus] = useState<null | string>(null);

  const hasResults = summaries.length > 0;

  const handleFilesParsed = useCallback((items: ParsedCv[]) => {
    setParsedCvs(items);
  }, []);

  const processSummaries = useCallback(async () => {
    setIsProcessing(true);
    try {
      const results = parsedCvs.map((cv) => summarizeCv(cv.text, cv.fileName, jobDescription));
      setSummaries(results);
    } finally {
      setIsProcessing(false);
    }
  }, [parsedCvs, jobDescription]);

  const exportCsv = useCallback(() => {
    if (!hasResults) return;
    downloadCsv(
      summaries.map((s) => ({
        "File Name": s.fileName,
        "Candidate Name": s.candidateName,
        Email: s.email,
        Phone: s.phone,
        "Years Experience": s.yearsExperience,
        "Top Skills": s.topSkills.join(", "),
        Summary: s.summary
      })),
      "cv_summaries.csv"
    );
  }, [hasResults, summaries]);

  const exportToSheets = useCallback(async () => {
    if (!hasResults) return;
    setIsExporting(true);
    setSheetsStatus(null);
    try {
      const response = await fetch("/api/export-to-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: summaries.map((s) => [
            s.fileName,
            s.candidateName,
            s.email,
            s.phone,
            s.yearsExperience,
            s.topSkills.join(", "),
            s.summary
          ])
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to export to Google Sheets");
      }
      setSheetsStatus("Exported to Google Sheets successfully.");
    } catch (err: any) {
      setSheetsStatus(err?.message || "Failed to export to Google Sheets");
    } finally {
      setIsExporting(false);
    }
  }, [hasResults, summaries]);

  const canExportToSheets = useMemo(() => {
    // The API will handle missing credentials; this flag is just UI hint
    return true;
  }, []);

  return (
    <main
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "32px 20px"
      }}
    >
      <header style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <img alt="logo" src="https://fav.farm/??" width={32} height={32} />
        <h1 style={{ margin: 0, fontSize: 22 }}>CV Summarizer ? Google Sheets</h1>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 16,
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 1px 2px rgba(16,24,40,0.08)"
        }}
      >
        <label style={{ fontWeight: 600 }}>Job description or role (optional)</label>
        <textarea
          placeholder="Paste a job description to tailor summaries..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={5}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            resize: "vertical",
            fontFamily: "inherit"
          }}
        />
      </section>

      <div style={{ height: 16 }} />

      <UploadArea onParsed={handleFilesParsed} />

      <div style={{ height: 16 }} />

      <section
        style={{
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 1px 2px rgba(16,24,40,0.08)"
        }}
      >
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={processSummaries}
            disabled={parsedCvs.length === 0 || isProcessing}
            style={{
              background: "#0ea5e9",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "10px 14px",
              cursor: parsedCvs.length === 0 || isProcessing ? "not-allowed" : "pointer"
            }}
          >
            {isProcessing ? "Processing..." : `Generate summaries (${parsedCvs.length})`}
          </button>

          <button
            onClick={exportCsv}
            disabled={!hasResults}
            style={{
              background: "#334155",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "10px 14px",
              cursor: !hasResults ? "not-allowed" : "pointer"
            }}
          >
            Download CSV
          </button>

          <button
            onClick={exportToSheets}
            disabled={!hasResults || isExporting || !canExportToSheets}
            style={{
              background: "#16a34a",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "10px 14px",
              cursor: !hasResults || isExporting || !canExportToSheets ? "not-allowed" : "pointer"
            }}
          >
            {isExporting ? "Exporting..." : "Export to Google Sheets"}
          </button>
        </div>

        {sheetsStatus && (
          <p style={{ marginTop: 12, color: sheetsStatus.includes("success") ? "#16a34a" : "#b91c1c" }}>
            {sheetsStatus}
          </p>
        )}
      </section>

      <div style={{ height: 16 }} />

      {hasResults && <ResultsTable summaries={summaries} />}
    </main>
  );
}

