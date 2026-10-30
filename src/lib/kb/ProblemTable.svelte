<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { breakdown, misTagged } from '#lib/kb/problems';

  // `issues` maps a problem to the url of the ticket filed for it.
  let { ticket, issues = {} }: { ticket: number; issues?: Record<string, string> } = $props();

  const data = $derived(breakdown(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const tags = (g: { taggedAs: Record<string, number> }) =>
    Object.entries(g.taggedAs)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, n]) => `${tag} ×${n}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{data.unique}</strong> reports merged into #{ticket} ·
  <strong>{data.groups.length}</strong> problems.
  <span class="muted">The export has {data.exported} rows; {data.exported - data.unique} are repeats of an id and are counted once.</span>
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tagged as</th><th>tagged wrong</th><th>tenants</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each data.groups as g (g.problem)}
      <tr>
        <td><code>{g.problem}</code></td>
        <td>{g.reports.length}</td>
        <td class="muted">{tags(g)}</td>
        <td>{g.problem === 'one-day' ? '–' : misTagged(g)}</td>
        <td>{g.tenants}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>{#if issues[g.problem]}<a href={issues[g.problem]}>ticket</a>{:else}not filed{/if}</td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .sum { font-size: 1.1rem; }
  .muted { color: var(--muted); font-size: 0.85em; }
</style>
