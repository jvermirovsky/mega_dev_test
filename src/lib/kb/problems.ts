// Splits a ticket's reports into the problems they report, the way the desk counts them:
// by the tenant's cause (causes.ts), counted once per id. Pure: the component passes the data in.
import { causeOf, uniqueById, type Cause, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = Cause | 'unplaced';
export const PROBLEMS: readonly Problem[] = ['parser', 'hint', 'unplaced'];

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  taggedAs: Record<string, number>;
  tenants: number;
  firstSeen: string;
  lastSeen: string;
  // Reports the desk read as a one-day move (desk-notes.json); counted here, footnoted.
  readAsOneDay: number;
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
    const reports = unique.filter((r) => (causeOf(r, tenantOf(r)) ?? 'unplaced') === problem);
    const days = reports.map((r) => r.receivedAt.slice(0, 10)).sort();
    return {
      problem,
      reports,
      taggedAs: reports.reduce<Record<string, number>>((n, r) => ({ ...n, [r.meta.intakeTag]: (n[r.meta.intakeTag] ?? 0) + 1 }), {}),
      tenants: new Set(reports.map((r) => r.tenant)).size,
      firstSeen: days[0] ?? '',
      lastSeen: days[days.length - 1] ?? '',
      readAsOneDay: reports.filter((r) => oneDay.includes(r.id)).length,
    };
  }).filter((g) => g.reports.length > 0);
  return { exported: rows.filter((r) => r.mergedInto === ticket).length, unique: unique.length, groups };
}

// Reports whose intake tag names a different cause than the tenant does (the tag is a guess).
export function misTagged(g: ProblemGroup): number {
  return g.problem === 'unplaced' ? 0 : g.reports.filter((r) => r.meta.intakeTag !== g.problem).length;
}
