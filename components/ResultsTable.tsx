import type { CvSummary } from "../app/page";

type Props = {
  summaries: CvSummary[];
};

export default function ResultsTable({ summaries }: Props) {
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
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              {[
                "File Name",
                "Candidate Name",
                "Email",
                "Phone",
                "Years Experience",
                "Top Skills",
                "Summary"
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "10px 12px",
                    borderBottom: "1px solid #e2e8f0",
                    fontWeight: 600,
                    fontSize: 13
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summaries.map((s, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                <td style={{ padding: "10px 12px", fontWeight: 600 }}>{s.fileName}</td>
                <td style={{ padding: "10px 12px" }}>{s.candidateName}</td>
                <td style={{ padding: "10px 12px" }}>{s.email}</td>
                <td style={{ padding: "10px 12px" }}>{s.phone}</td>
                <td style={{ padding: "10px 12px" }}>{s.yearsExperience}</td>
                <td style={{ padding: "10px 12px" }}>{s.topSkills.join(", ")}</td>
                <td style={{ padding: "10px 12px", whiteSpace: "pre-wrap" }}>{s.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

