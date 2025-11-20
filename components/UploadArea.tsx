/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
// @ts-expect-error - pdfjs worker bundled via CDN path resolution on client
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.js?url";
import mammoth from "mammoth";
import type { ParsedCv } from "../app/page";

// Configure PDF.js worker
// nextjs bundler will treat ?url as external and use at runtime
if (typeof window !== "undefined" && (pdfjsLib as any).GlobalWorkerOptions) {
  (pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

type Props = {
  onParsed: (items: ParsedCv[]) => void;
};

export default function UploadArea({ onParsed }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);

  const onPick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setParsing(true);
      setStatusText(`Parsing ${files.length} file(s)...`);
      const parsed: ParsedCv[] = [];
      let idx = 0;
      for (const file of Array.from(files)) {
        idx += 1;
        setStatusText(`Parsing (${idx}/${files.length}): ${file.name}`);
        try {
          const text = await extractTextFromFile(file);
          parsed.push({ fileName: file.name, text });
        } catch (err) {
          parsed.push({ fileName: file.name, text: "" });
        }
      }
      onParsed(parsed);
      setParsing(false);
      setStatusText(`Parsed ${parsed.length} file(s).`);
    },
    [onParsed]
  );

  const onInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      await handleFiles(e.target.files);
      if (inputRef.current) inputRef.current.value = "";
    },
    [handleFiles]
  );

  const onDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      await handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  return (
    <section
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 1px 2px rgba(16,24,40,0.08)"
      }}
    >
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        style={{
          border: "2px dashed",
          borderColor: dragOver ? "#0ea5e9" : "#cbd5e1",
          borderRadius: 12,
          padding: 24,
          textAlign: "center",
          background: dragOver ? "#f0f9ff" : "white",
          transition: "all 120ms ease"
        }}
      >
        <p style={{ margin: 0, fontWeight: 600 }}>Drop up to 100 CVs (PDF, DOCX, TXT)</p>
        <div style={{ height: 8 }} />
        <p style={{ margin: 0, color: "#475569" }}>Or</p>
        <div style={{ height: 8 }} />
        <button
          onClick={onPick}
          style={{
            background: "#0ea5e9",
            color: "white",
            border: "none",
            borderRadius: 8,
            padding: "10px 14px",
            cursor: "pointer"
          }}
        >
          Choose files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          multiple
          onChange={onInputChange}
          style={{ display: "none" }}
        />
        {statusText && (
          <>
            <div style={{ height: 8 }} />
            <p style={{ margin: 0, color: "#475569" }}>{parsing ? "Working..." : "Done"} {statusText}</p>
          </>
        )}
      </div>
    </section>
  );
}

async function extractTextFromFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const ext = file.name.toLowerCase().split(".").pop();
  if (ext === "pdf") {
    return await extractTextFromPdf(arrayBuffer);
  }
  if (ext === "docx") {
    return await extractTextFromDocx(arrayBuffer);
  }
  if (ext === "txt") {
    const text = new TextDecoder().decode(arrayBuffer);
    return text;
  }
  return "";
}

async function extractTextFromPdf(arrayBuffer: ArrayBuffer): Promise<string> {
  const loadingTask = (pdfjsLib as any).getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const maxPages = pdf.numPages;
  const pageTexts: string[] = [];
  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str);
    pageTexts.push(strings.join(" "));
  }
  return pageTexts.join("\n\n");
}

async function extractTextFromDocx(arrayBuffer: ArrayBuffer): Promise<string> {
  const { value } = await mammoth.extractRawText({ arrayBuffer });
  return value || "";
}

