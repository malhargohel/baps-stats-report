// ---- Jotform data layer -------------------------------------------------
const FORM_ID = "261613290999872";
const API_KEY = "c420ad0e80347ee226a9dc2fcd1a0ca5";

export async function fetchSubmissions() {
  const res = await fetch(
    `https://api.jotform.com/form/${FORM_ID}/submissions?apiKey=${API_KEY}&limit=1000&orderby=created_at`,
    { headers: { "Content-Type": "application/json" } }
  );
  if (!res.ok) throw new Error(`Couldn't reach Jotform (status ${res.status}). Check the connection and try again.`);
  const json = await res.json();
  if (json.responseCode !== 200) throw new Error(json.message || "Jotform returned an unexpected response.");

  return json.content.map((sub) => {
    const a = sub.answers || {};
    const get = (...labels) => {
      for (const label of labels) {
        const match = Object.values(a).find((f) =>
          (f.text || "").toLowerCase().includes(label.toLowerCase())
        );
        if (match) return match.answer ?? null;
      }
      return null;
    };

    const rawDate = get("Event Date");
    let eventDate = null;
    if (rawDate && typeof rawDate === "object") {
      const { year, month, day } = rawDate;
      if (year) eventDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    } else if (typeof rawDate === "string") {
      eventDate = rawDate;
    }

    return {
      submissionId: sub.id,
      submittedAt: sub.created_at,
      centre:              get("Centre", "Location"),
      eventType:           get("Event Type"),
      eventDate,
      totalAttendance:     get("Total Attendance"),
      bloodUnits:          get("Units of Blood"),
      bloodLitres:         get("Litres of Blood"),
      donors:              get("Number of Donors"),
      treesPlanted:        get("Trees Planted"),
      volunteerHours:      get("Volunteer Hours"),
      blanketsCollected:   get("Blankets Collected"),
      blanketsDistributed: get("Blankets Distributed"),
      toysCollected:       get("Toys Collected"),
      toysDistributed:     get("Toys Distributed"),
      foodKg:              get("Food Collected"),
      mealsProvided:       get("Meals Provided"),
      foodPackages:        get("Food Packages"),
      otherOutcomeDesc:    get("Other Charity"),
      otherOutcomeQty:     get("Quantity"),
      submitterName:       get("Full Name"),
    };
  });
}

// ---- maths helpers ------------------------------------------------------
export const fmt = (v) => parseFloat(v) || 0;
export const sumField = (rows, key) => rows.reduce((a, r) => a + fmt(r[key]), 0);

export function groupBy(rows, key) {
  return rows.reduce((acc, r) => {
    const k = r[key] || "Unknown";
    (acc[k] = acc[k] || []).push(r);
    return acc;
  }, {});
}

// ---- CSV export ---------------------------------------------------------
function toCSV(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const r of rows)
    lines.push(headers.map((h) => `"${(r[h] ?? "").toString().replace(/"/g, '""')}"`).join(","));
  return lines.join("\n");
}

export function downloadCSV(rows, filename) {
  const blob = new Blob([toCSV(rows)], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
