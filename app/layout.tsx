export const metadata = {
  title: "CV Summarizer to Google Sheets",
  description: "Upload multiple CVs, get summaries, export to Sheets or CSV"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif",
          color: "#0f172a",
          background: "#f8fafc"
        }}
      >
        {children}
      </body>
    </html>
  );
}

