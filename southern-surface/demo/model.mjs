/** Original, memory-only simulation. No operational code, records, or endpoints. */
export const STAGES = ['New', 'In Review', 'Contact in Progress', 'Qualified', 'Estimate Requested', 'Proposal Sent', 'Won', 'Work in Progress', 'Completed', 'Closed - Lost'];
export const STEPS = [
  ['Run gate & lease', 'Check that this demonstration has no active run, then acquire its simulated lease.'],
  ['Read source checkpoints', 'Resume each fictional source from the position recorded in memory.'],
  ['Collect, qualify & normalize', 'Apply source-specific service-fit rules and map fictional opportunities into a common shape.'],
  ['Validate records', 'Check required opportunity details before enrichment or persistence.'],
  ['Deduplicate opportunities', 'Match source + external ID. Distinct opportunities at one company remain separate.'],
  ['Optional bounded enrichment', 'Attempt optional enrichment within a fixed budget. A timeout does not block an otherwise valid candidate.'],
  ['Revalidate & save candidates', 'Validate again and persist reviewable candidates. No lead score is assigned here.'],
  ['Write checkpoints & run summary', 'Update simulated source positions and release the lease. Human approval remains a separate step.']
];
const candidate = (id, company, project, service, source, externalId, evidence, fit = 'Strong service fit') => ({ id, company, project, service, source, externalId, evidence, fit, status: 'New', captured: 'Sample day 1', missing: 'Contact details omitted from this prototype' });
const SEEDS = [
  candidate('c1', 'Alder Vale Property Cooperative', 'Multifamily maintenance prospect', 'Cleaning', 'HUD directory', 'DEMO-HUD-01', 'Directory prospect'),
  candidate('c2', 'Cedar Span Works', 'Interior repaint package', 'Painting', 'SBA SUBNet', 'DEMO-SBA-01', 'Subcontracting request'),
  candidate('c3', 'Brindle Quay Civic Group', 'LVP replacement opportunity', 'Flooring', 'Municipal public bids', 'DEMO-BID-01', 'Public solicitation')
];
const seedLead = (id, company, project, stage, service, source) => ({ id, company, project, stage, service, source, evidence: 'Fictional reviewed opportunity', score: 78, notes: [], activities: [], followup: 'None' });
export function createState() {
  return { candidates: structuredClone(SEEDS), leads: [
    seedLead('l1', 'Willow Arc Facilities', 'Office flooring replacement', 'New', 'Flooring', 'Municipal public bids'),
    seedLead('l2', 'Cobalt Meadow Builders', 'Interior repaint package', 'Contact in Progress', 'Painting', 'SBA SUBNet'),
    seedLead('l3', 'Fern Lantern Property Group', 'Turnover cleaning', 'Proposal Sent', 'Cleaning', 'HUD directory')
  ], runs: [], run: null, sequence: 4, outcomeStep: 0 };
}
const fingerprint = record => `${record.source}|${record.externalId}`;
function incoming() {
  return [
    structuredClone(SEEDS[1]),
    candidate('', 'Cedar Span Works', 'Separate office repaint package', 'Painting', 'SBA SUBNet', 'DEMO-SBA-02', 'Subcontracting request'),
    candidate('', 'Juniper Loom Housing', 'Long-term property care prospect', 'Cleaning', 'HUD directory', 'DEMO-HUD-02', 'Directory prospect'),
    candidate('', 'Moss Meridian Civic Group', 'Hallway flooring replacement', 'Flooring', 'Municipal public bids', 'DEMO-BID-02', 'Public solicitation'),
    candidate('', '', 'Incomplete source record', 'Flooring', 'USAspending', 'DEMO-AWARD-01', 'Historical award prospect'),
    candidate('', 'Slate Orchard Studio', 'Indoor lighting supply', 'Lighting', 'Municipal public bids', 'DEMO-BID-03', 'Public solicitation', 'Outside service scope')
  ];
}
export function startDiscovery(state, trigger = 'Manual') {
  if (state.run?.active) return false;
  state.run = { active: true, step: -1, trigger, scanned: 0, outOfScope: 0, invalid: 0, duplicates: 0, saved: 0, rows: [], events: [], enrichment: '' };
  return true;
}
export function advanceDiscovery(state) {
  const run = state.run;
  if (!run?.active) return false;
  run.step += 1;
  const messages = [
    'Run allowed; simulated lease acquired.',
    'Fictional source checkpoints loaded.',
    '6 fictional records collected; 1 excluded by source-specific service-fit rules.',
    '1 record missing a company name was excluded.',
    '',
    '1 optional enrichment timed out. The candidate remains eligible without contact details.',
    '',
    'Source checkpoints and summary saved in memory; lease released.'
  ];
  if (run.step === 2) { run.scanned = 6; run.outOfScope = 1; run.rows = incoming().filter(row => row.fit !== 'Outside service scope'); }
  if (run.step === 3) { run.invalid = run.rows.filter(row => !row.company).length; run.rows = run.rows.filter(row => row.company); }
  if (run.step === 4) {
    const seen = new Set(state.candidates.map(fingerprint));
    run.rows = run.rows.filter(row => { const key = fingerprint(row); if (seen.has(key)) { run.duplicates++; return false; } seen.add(key); return true; });
    messages[4] = `${run.duplicates} existing opportunity match${run.duplicates === 1 ? '' : 'es'} skipped. A different opportunity at Cedar Span Works is retained when new.`;
  }
  if (run.step === 5) {
    run.enrichment = run.rows.length ? 'Optional timeout; continued without contact details' : 'No new candidates; enrichment skipped';
    if (!run.rows.length) messages[5] = 'No new candidates require enrichment; optional step skipped.';
  }
  if (run.step === 6) {
    const valid = run.rows.filter(row => row.company && row.service && row.source && row.externalId);
    for (const row of valid) state.candidates.push({ ...row, id: `c${state.sequence++}` });
    run.saved = valid.length;
    messages[6] = `${run.saved} new candidate${run.saved === 1 ? '' : 's'} saved for human review. Verified leads are unchanged.`;
  }
  run.events.push({ title: STEPS[run.step][0], message: messages[run.step] });
  if (run.step === STEPS.length - 1) {
    run.active = false;
    state.runs.unshift({ trigger: run.trigger, scanned: run.scanned, saved: run.saved, duplicates: run.duplicates, invalid: run.invalid, outOfScope: run.outOfScope, events: structuredClone(run.events) });
  }
  return true;
}
export function reviewCandidate(state, id, decision) {
  const row = state.candidates.find(item => item.id === id);
  if (!row || row.status !== 'New' || !['Approved', 'Rejected'].includes(decision)) return false;
  row.status = decision;
  if (decision === 'Approved') {
    state.leads.push({ ...row, id: `l${state.sequence++}`, stage: 'New', score: row.evidence === 'Directory prospect' ? 65 : 82, notes: [], activities: [], followup: 'None' });
  }
  return true;
}
export function listRecords(rows, { query = '', status = 'All', service = 'All', sort = 'company' } = {}) {
  const needle = query.trim().toLowerCase();
  return rows.filter(row => (!needle || [row.company, row.project, row.source, row.service].join(' ').toLowerCase().includes(needle)) &&
    (status === 'All' || (row.stage || row.status) === status) && (service === 'All' || row.service === service))
    .slice().sort((a, b) => sort === 'service' ? a.service.localeCompare(b.service) || a.company.localeCompare(b.company) : sort === 'newest' ? Number(b.id.slice(1)) - Number(a.id.slice(1)) : a.company.localeCompare(b.company) || a.project.localeCompare(b.project));
}
export function updateLead(state, id, stage) {
  const lead = state.leads.find(row => row.id === id);
  if (!lead || !STAGES.includes(stage)) return false;
  lead.stage = stage; return true;
}
export function addNote(state, id, text) {
  const lead = state.leads.find(row => row.id === id);
  const value = text.trim().slice(0, 300);
  if (!lead || !value) return false;
  lead.notes.unshift(value); return true;
}
export function recordOutreach(state, id, followup) {
  const lead = state.leads.find(row => row.id === id);
  if (!lead || !['None', 'Tomorrow (sample)', 'Next week (sample)'].includes(followup)) return false;
  lead.activities.unshift('Manual outreach activity recorded in this visit. No message was sent.');
  lead.followup = followup; return true;
}
export const summary = state => ({ awaiting: state.candidates.filter(row => row.status === 'New').length, leads: state.leads.length, outreach: state.leads.reduce((sum, row) => sum + row.activities.length, 0), followups: state.leads.filter(row => row.followup !== 'None').length });
export const OUTCOME = [
  ['A relevant signal', 'A fictional public bid describes flooring replacement that fits the company’s services. A signal is an opportunity to investigate, not a confirmed customer.'],
  ['Human verification', 'An operator checks the evidence and approves the candidate. Only then does it become a verified lead with an illustrative score.'],
  ['Manual outreach & follow-up', 'The operator contacts the prospect outside this prototype and records an activity and a next step. Discovery does not send outreach.'],
  ['Estimate, proposal & decision', 'After qualification, the operator prepares an estimate and proposal. A won opportunity can move into work in progress.'],
  ['A completed fictional job', 'The operator records the job as completed. This illustrative path shows the workflow; it is not a customer record or evidence of a conversion rate.']
];
export function advanceOutcome(state) { state.outcomeStep = Math.min(state.outcomeStep + 1, OUTCOME.length - 1); }
