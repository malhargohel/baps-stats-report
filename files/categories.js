// Each seva category: how to recognise its submissions, which metrics matter
// for it, and the visual identity it carries through the report view.

export const ALL_METRICS = {
  totalAttendance:     { label: "Attendance",            unit: "" },
  bloodUnits:          { label: "Blood units",           unit: "units" },
  bloodLitres:         { label: "Blood collected",       unit: "L" },
  donors:              { label: "Donors",                unit: "" },
  treesPlanted:        { label: "Trees planted",         unit: "" },
  volunteerHours:      { label: "Volunteer hours",       unit: "hrs" },
  blanketsCollected:   { label: "Blankets collected",    unit: "" },
  blanketsDistributed: { label: "Blankets given",        unit: "" },
  toysCollected:       { label: "Toys collected",        unit: "" },
  toysDistributed:     { label: "Toys given",            unit: "" },
  foodKg:              { label: "Food collected",        unit: "kg" },
  mealsProvided:       { label: "Meals served",          unit: "" },
  foodPackages:        { label: "Food packages",         unit: "" },
};

export const CATEGORIES = [
  {
    id: "all",
    name: "Every event",
    tagline: "The complete picture across all seva activities",
    accent: "var(--c-all)",
    glyph: "lotus",
    match: () => true,
    headlineMetric: "totalAttendance",
    metrics: [
      "totalAttendance", "volunteerHours", "bloodLitres", "donors",
      "treesPlanted", "mealsProvided", "blanketsDistributed", "toysDistributed",
    ],
  },
  {
    id: "blood",
    name: "Blood donation",
    tagline: "Donation camps — units, litres and the donors who gave",
    accent: "var(--c-blood)",
    glyph: "drop",
    match: (t) => /blood|donation|donate/i.test(t),
    headlineMetric: "bloodLitres",
    metrics: ["bloodLitres", "bloodUnits", "donors", "volunteerHours", "totalAttendance"],
  },
  {
    id: "tree",
    name: "Tree plantation",
    tagline: "Greening drives — every sapling in the ground",
    accent: "var(--c-tree)",
    glyph: "leaf",
    match: (t) => /tree|plant|green|environment|sapling/i.test(t),
    headlineMetric: "treesPlanted",
    metrics: ["treesPlanted", "volunteerHours", "totalAttendance"],
  },
  {
    id: "food",
    name: "Food relief",
    tagline: "Meals, packages and food gathered for the community",
    accent: "var(--c-food)",
    glyph: "bowl",
    match: (t) => /food|meal|annakut|grocery|hunger|kitchen/i.test(t),
    headlineMetric: "mealsProvided",
    metrics: ["mealsProvided", "foodPackages", "foodKg", "volunteerHours", "totalAttendance"],
  },
  {
    id: "blanket",
    name: "Blanket drive",
    tagline: "Warmth collected and handed to those who need it",
    accent: "var(--c-blanket)",
    glyph: "blanket",
    match: (t) => /blanket|warm|winter|clothing|cloth/i.test(t),
    headlineMetric: "blanketsDistributed",
    metrics: ["blanketsDistributed", "blanketsCollected", "volunteerHours", "totalAttendance"],
  },
  {
    id: "toy",
    name: "Toy drive",
    tagline: "Toys gathered and given to bring children joy",
    accent: "var(--c-toy)",
    glyph: "toy",
    match: (t) => /toy|gift|children|kids/i.test(t),
    headlineMetric: "toysDistributed",
    metrics: ["toysDistributed", "toysCollected", "volunteerHours", "totalAttendance"],
  },
];

export const getCategory = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];

// Rows belonging to a category. "all" returns everything; others match on the
// event-type text, with a fallback to any row that actually carries the
// category's headline metric (so data shows even if the type label is blank).
export function rowsForCategory(rows, cat) {
  if (cat.id === "all") return rows;
  const matched = rows.filter((r) => cat.match(r.eventType || ""));
  if (matched.length) return matched;
  return rows.filter((r) => (parseFloat(r[cat.headlineMetric]) || 0) > 0);
}
