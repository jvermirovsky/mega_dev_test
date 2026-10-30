// Splits a ticket's reports into the problems they report. Pure: the component passes the data in.
import { causeOf, uniqueById, type Cause, type Report, type Tenant } from '#lib/kb/causes';

// `one-day`: the date is off by a day, not by a month flip (desk-notes.json lists these reports).
export type Problem = Cause | 'one-day' | 'unplaced';
export const PROBLEMS: readonly Problem[] = ['parser', 'hint', 'one-day', 'unplaced'];

export function problemOf(r: Report, t: Tenant | undefined, oneDay: readonly string[]): Problem {
  if (oneDay.includes(r.id)) return 'one-day';
  return causeOf(r, t) ?? 'unplaced';
}

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  taggedAs: Record<string, number>;
  tenants: number;
  firstSeen: string;
  lastSeen: string;
};

export type Breakdown = { exported: number; unique: number; groups: ProblemGroup[] };

export function breakdown(
  rows: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDay: readonly string[],
): Breakdown {
  const unique = uniqueById(rows).filter((r) => r.mergedInto === ticket);
  const groups = PROBLEMS.map((problem) => {
    const reports = unique.filter((r) => problemOf(r, tenantOf(r), oneDay) === problem);
    const days = reports.map((r) => r.receivedAt.slice(0, 10)).sort();
    return {
      problem,
      reports,
      taggedAs: reports.reduce<Record<string, number>>((n, r) => ({ ...n, [r.meta.intakeTag]: (n[r.meta.intakeTag] ?? 0) + 1 }), {}),
      tenants: new Set(reports.map((r) => r.tenant)).size,
      firstSeen: days[0] ?? '',
      lastSeen: days[days.length - 1] ?? '',
    };
  }).filter((g) => g.reports.length > 0);
  return { exported: rows.filter((r) => r.mergedInto === ticket).length, unique: unique.length, groups };
}

// Reports whose intake tag names a different cause than the tenant does (the tag is a guess).
export function misTagged(g: ProblemGroup): number {
  return g.problem === 'parser' || g.problem === 'hint' ? g.reports.filter((r) => r.meta.intakeTag !== g.problem).length : 0;
}
