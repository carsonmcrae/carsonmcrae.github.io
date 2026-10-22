import { STAGES, STEPS, OUTCOME, createState, startDiscovery, advanceDiscovery, reviewCandidate, listRecords, updateLead, addNote, recordOutreach, summary, advanceOutcome } from './model.mjs';

let state = createState();
let tab = 'dashboard';
let selection = null;
const filters = { candidates: {}, leads: {} };
const $ = selector => document.querySelector(selector);
const workspace = $('#workspace');
const dialog = $('#detail');
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const options = (values, selected) => values.map(value => `<option${value === selected ? ' selected' : ''}>${escape(value)}</option>`).join('');
const announce = message => { $('#announcement').textContent = message; };
const badge = (text, copper = false) => `<span class="label${copper ? ' copper' : ''}">${escape(text)}</span>`;
function setTab(next, focus = false) {
  tab = next;
  document.querySelectorAll('[role=tab]').forEach(button => { const active = button.dataset.tab === tab; button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1; if (focus && active) button.focus(); });
  workspace.setAttribute('aria-labelledby', `tab-${tab}`);
  render();
}
function heading(title, description, tag = 'Fictional workspace') {
  return `<div class="panel-heading"><div><h2>${title}</h2><p class="muted">${description}</p></div>${badge(tag)}</div>`;
}
function discovery() {
  const run = state.run;
  const controls = run?.active ? `<button class="primary" data-action="next-step">${run.step < 6 ? 'Run next step' : 'Finish run'} <span aria-hidden="true">→</span></button><span class="muted">Step ${run.step + 1} of ${STEPS.length}</span>` : `<button class="primary" data-action="start" data-trigger="Scheduled">Simulate scheduled run <span aria-hidden="true">→</span></button><button class="quiet" data-action="start" data-trigger="Manual">Simulate manual run</button>`;
  return `<article class="card"><div class="discovery-head"><div><p class="eyebrow">Discovery / guided simulation</p><h3>Useful opportunities start with a signal.</h3><p>Advance a deterministic sample run one step at a time. Collectors produce candidates; a person decides which become verified leads.</p></div>${badge(run?.active ? 'Run in progress' : run ? 'Last run complete' : 'Ready to explore', true)}</div>${run ? `<ol class="step-list">${STEPS.map(([title, explanation], index) => `<li class="${index < run.step || !run.active ? 'done' : index === run.step ? 'current' : ''}"${index === run.step && run.active ? ' aria-current="step"' : ''}><span class="step-num" aria-hidden="true">${index < run.step || !run.active ? '✓' : index + 1}</span><div><strong>${title}</strong><p>${index <= run.step ? escape(run.events[index]?.message || explanation) : explanation}</p></div></li>`).join('')}</ol><p class="run-summary">${run.active ? `Next: <strong>${STEPS[run.step + 1]?.[0] || 'Finish run'}</strong>` : `<strong>${run.saved} candidates added</strong> · ${run.duplicates} duplicates skipped · ${run.invalid} invalid · ${run.outOfScope} outside service scope. Human review comes next.`}</p>` : `<div class="source-pills"><span>HUD directory prospects</span><span>SBA SUBNet requests</span><span>Municipal public bids</span><span>USAspending history</span></div><div class="flow-preview"><span>Source signal</span><b aria-hidden="true">→</b><span>Candidate</span><b aria-hidden="true">→</b><span>Human review</span><b aria-hidden="true">→</b><span>Verified lead</span></div><p class="source-note">Source categories reflect the system. Every record and source ID in this demo is invented.</p>`}<div class="actions">${controls}${run && !run.active ? '<button class="quiet" data-action="view" data-view="candidates">Review candidates</button>' : ''}</div></article>`;
}
function dashboard() {
  const counts = summary(state);
  const stats = [['Awaiting review', counts.awaiting, 'Candidates, before approval'], ['Verified leads', counts.leads, 'Sample approved records'], ['Outreach recorded', counts.outreach, 'Manual activity in this visit'], ['Follow-ups noted', counts.followups, 'Manual next steps in this visit']];
  const stages = ['New', 'Contact in Progress', 'Proposal Sent', 'Completed'];
  return `${heading('Operations overview', 'A sample admin workspace for finding opportunities and keeping the next action visible.')}<div class="stat-grid">${stats.map(([label, value, detail]) => `<article class="stat"><p>${label}</p><strong>${value}</strong><p class="stat-detail">${detail}</p></article>`).join('')}</div>${discovery()}<div class="lower-grid"><article class="card"><h3>Pipeline snapshot</h3>${stages.map(stage => `<div class="stage-row"><span>${stage}</span><strong>${state.leads.filter(row => row.stage === stage).length}</strong></div>`).join('')}<p class="source-note">Illustrative totals. Open verified leads to explore all supported stages.</p></article><article class="card"><h3>A clear next action</h3><div class="next-task"><strong>Review the evidence</strong><p>Service fit and source context support a human decision. A directory listing alone does not show buying intent.</p><button class="small quiet" data-action="view" data-view="candidates">Open review queue</button></div><div class="next-task"><strong>Keep outreach deliberate</strong><p>Draft copy, record a manual activity, and note a follow-up in a lead’s details.</p><button class="small quiet" data-action="view" data-view="leads">Explore verified leads</button></div></article></div>`;
}
function listing() {
  const candidateView = tab === 'candidates';
  const filter = filters[tab];
  const statuses = candidateView ? ['New', 'Approved', 'Rejected'] : STAGES;
  return `${heading(candidateView ? 'Candidate review' : 'Verified leads', candidateView ? 'Inspect the signal and service fit. Approval creates a lead; rejection keeps the decision in this visit.' : 'Track a reviewed opportunity, keep local notes, and record a manual next step.')}<div class="filter-bar"><label>Search<input id="filter-query" data-filter="query" type="search" placeholder="Company, project, source…" value="${escape(filter.query || '')}"></label><label>${candidateView ? 'Review status' : 'Lead stage'}<select data-filter="status">${options(['All', ...statuses], filter.status || 'All')}</select></label><label>Service<select data-filter="service">${options(['All', 'Cleaning', 'Flooring', 'Painting'], filter.service || 'All')}</select></label><label>Sort by<select data-filter="sort"><option value="company"${!filter.sort || filter.sort === 'company' ? ' selected' : ''}>Company A–Z</option><option value="newest"${filter.sort === 'newest' ? ' selected' : ''}>Newest first</option><option value="service"${filter.sort === 'service' ? ' selected' : ''}>Service</option></select></label></div><div id="records">${records()}</div><p class="source-note">${candidateView ? 'No score is assigned during collection in this simplified demo. Illustrative lead scoring is shown only after approval. Optional contact enrichment can fail without discarding a valid candidate.' : 'The sample scores are illustrative and added on approval. Follow-up dates and activities are manually recorded; no reminders or messages are sent.'}</p>`;
}
function records() {
  const candidateView = tab === 'candidates';
  const rows = listRecords(candidateView ? state.candidates : state.leads, filters[tab]);
  const total = candidateView ? state.candidates.length : state.leads.length;
  if (!rows.length) return `<div class="empty"><h3>No matching ${candidateView ? 'candidates' : 'leads'}</h3><p>Try a different search or clear the filters.</p><button data-action="clear-filters">Clear filters</button></div>`;
  return `<p class="result-count" role="status">Showing ${rows.length} of ${total} fictional ${candidateView ? 'candidates' : 'leads'}</p><div class="table-wrap"><table><caption class="sr-only">${candidateView ? 'Candidate review queue' : 'Verified lead pipeline'}</caption><thead><tr><th scope="col">Opportunity</th><th scope="col">Source / service</th><th scope="col">${candidateView ? 'Review' : 'Stage'}</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>${rows.map(row => `<tr><td><strong>${escape(row.company)}</strong><small>${escape(row.project)}</small></td><td>${escape(row.source)}<small>${escape(row.service)}</small></td><td>${badge(candidateView ? row.status : row.stage, candidateView && row.status === 'New')}${!candidateView && row.followup !== 'None' ? `<small>Follow-up: ${escape(row.followup)}</small>` : ''}</td><td><button class="small quiet" data-action="detail" data-kind="${candidateView ? 'candidate' : 'lead'}" data-id="${row.id}" aria-label="${candidateView ? 'Review' : 'Open'} ${escape(row.company)}: ${escape(row.project)}">${candidateView ? 'Review' : 'Details'} <span aria-hidden="true">↗</span></button></td></tr>`).join('')}</tbody></table></div>`;
}
function runLog() {
  return `${heading('Discovery run log', 'Inspect what happened, in order. Everything here is generated by the sample simulation.')}${discovery()}<h3 class="source-note">Completed sample runs</h3>${state.runs.length ? state.runs.map((run, index) => `<details class="run-item"><summary>${run.trigger} run ${state.runs.length - index} · ${run.scanned} collected · ${run.saved} candidates saved · ${run.duplicates} duplicates</summary><ul>${run.events.map(event => `<li><strong>${escape(event.title)}</strong><span>${escape(event.message)}</span></li>`).join('')}</ul></details>`).join('') : '<div class="empty"><h3>No completed runs yet</h3><p>Start a simulation above, then advance through each step to write a sample run summary.</p></div>'}`;
}
function render() {
  workspace.innerHTML = tab === 'dashboard' ? dashboard() : tab === 'runs' ? runLog() : listing();
  const counts = summary(state);
  $('#candidate-badge').textContent = counts.awaiting;
  $('#lead-badge').textContent = counts.leads;
  renderOutcome();
}
function renderOutcome() {
  const [title, copy] = OUTCOME[state.outcomeStep];
  $('#outcome').innerHTML = `<div class="outcome-card"><div class="outcome-progress" aria-hidden="true">${OUTCOME.map((_, index) => `<span class="${index <= state.outcomeStep ? 'past' : ''}"></span>`).join('')}</div><p class="eyebrow">Step ${state.outcomeStep + 1} of ${OUTCOME.length} · fictional example</p><h3>${title}</h3><p>${copy}</p><div class="actions">${state.outcomeStep < OUTCOME.length - 1 ? '<button class="quiet" id="outcome-next">Next step <span aria-hidden="true">→</span></button>' : '<button class="quiet" id="outcome-restart">Replay walkthrough</button><a href="../#results">Read the owner-reported results ↗</a>'}</div></div>`;
}
function showDetail(kind, id, message = '') {
  selection = { kind, id };
  const row = (kind === 'candidate' ? state.candidates : state.leads).find(item => item.id === id);
  const candidateView = kind === 'candidate';
  $('#detail-content').innerHTML = `<div class="detail-head"><div><p class="eyebrow">Fictional ${candidateView ? 'candidate' : 'verified lead'}</p><h2 id="detail-title">${escape(row.company)}</h2><p>${escape(row.project)}</p></div><button data-action="close" aria-label="Close details">×</button></div><div class="detail-body"><dl class="detail-facts"><div><dt>Service</dt><dd>${escape(row.service)}</dd></div><div><dt>Source category</dt><dd>${escape(row.source)}</dd></div><div><dt>Evidence kind</dt><dd>${escape(row.evidence)}</dd></div><div><dt>${candidateView ? 'Service fit' : 'Illustrative score'}</dt><dd>${candidateView ? escape(row.fit) : `${row.score} / 100 · assigned on approval`}</dd></div><div><dt>Contact information</dt><dd>Omitted. No real people or contact details.</dd></div><div><dt>${candidateView ? 'Captured' : 'Follow-up'}</dt><dd>${candidateView ? row.captured : row.followup}</dd></div></dl>${candidateView ? candidateActions(row) : leadActions(row)}<p class="inline-status" role="status">${escape(message)}</p></div>`;
  if (!dialog.open) dialog.showModal();
}
function candidateActions(row) {
  return `<section class="detail-section"><h3>Review before approval</h3><p>Check the source context, service fit, and missing information. Directory and historical-award prospects do not establish a current buying need.</p>${row.status === 'New' ? '<div class="actions"><button class="primary" data-action="approve">Approve as verified lead</button><button class="quiet danger" data-action="reject">Reject candidate</button></div><p class="fine-print">Approval adds an illustrative score and starts the lead at New. No outreach is triggered.</p>' : `<p class="source-note">Decision recorded: <strong>${row.status}</strong>. ${row.status === 'Approved' ? 'Find this opportunity in Verified leads.' : 'This opportunity remains in the rejected review history.'}</p>`}</section>`;
}
function leadActions(row) {
  return `<section class="detail-section"><h3>Pipeline stage</h3><form id="stage-form"><label>Current stage<select id="lead-stage">${options(STAGES, row.stage)}</select></label><button class="quiet small" type="submit">Save stage</button></form></section><section class="detail-section"><h3>Notes for this visit</h3>${row.notes.length ? `<ul class="note-list">${row.notes.map(note => `<li>${escape(note)}</li>`).join('')}</ul>` : '<p>No notes yet. Add a fictional next step or observation.</p>'}<form id="note-form"><label>Local note · 300 characters maximum<textarea id="note" maxlength="300" required placeholder="For example: Confirm the project scope before preparing an estimate."></textarea></label><button class="quiet small" type="submit">Add note</button></form></section><section class="detail-section"><h3>Manual outreach workspace</h3><p>Example copy for an operator to review and use manually. This prototype cannot send messages.</p><label>Illustrative draft<textarea id="draft" readonly>Hello — we are reviewing the ${escape(row.project.toLowerCase())} opportunity for ${escape(row.company)}. Could we confirm the scope and timing before discussing a quote?</textarea></label><button class="quiet small" data-action="select-draft">Select draft text</button><form id="outreach-form"><label>Manual follow-up note<select id="followup">${options(['None', 'Tomorrow (sample)', 'Next week (sample)'], row.followup)}</select></label><button class="quiet small" type="submit">Record a manual outreach activity</button></form>${row.activities.length ? `<ul class="note-list">${row.activities.map(activity => `<li>${escape(activity)}</li>`).join('')}</ul>` : '<p class="fine-print">No outreach activities recorded in this visit.</p>'}</section>`;
}
workspace.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'start') { if (startDiscovery(state, button.dataset.trigger)) advanceDiscovery(state); render(); workspace.querySelector('[data-action="next-step"]')?.focus(); announce('Discovery simulation started. Run gate passed. Advance the next step.'); }
  if (action === 'next-step') { advanceDiscovery(state); render(); announce(state.run.events.at(-1).message); (workspace.querySelector('[data-action="next-step"]') || workspace.querySelector('[data-view="candidates"]') || workspace).focus(); }
  if (action === 'view') { setTab(button.dataset.view); workspace.focus(); }
  if (action === 'detail') showDetail(button.dataset.kind, button.dataset.id);
  if (action === 'clear-filters') { filters[tab] = {}; render(); $('#filter-query').focus(); }
});
function filterEvent(event) {
  const key = event.target.dataset.filter;
  if (!key) return;
  filters[tab][key] = event.target.value;
  $('#records').innerHTML = records();
  const rows = listRecords(tab === 'candidates' ? state.candidates : state.leads, filters[tab]);
  announce(`${rows.length} matching fictional ${tab === 'candidates' ? 'candidates' : 'leads'}.`);
}
workspace.addEventListener('input', event => { if (event.target.type === 'search') filterEvent(event); });
workspace.addEventListener('change', filterEvent);
document.querySelector('.tabs').addEventListener('click', event => { const button = event.target.closest('[data-tab]'); if (button) setTab(button.dataset.tab); });
document.querySelector('.tabs').addEventListener('keydown', event => {
  const tabs = [...document.querySelectorAll('[role=tab]')];
  let index = tabs.indexOf(event.target);
  if (index < 0 || !['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  index = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : -1) + tabs.length) % tabs.length;
  setTab(tabs[index].dataset.tab, true);
});
dialog.addEventListener('click', event => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'close') dialog.close();
  if (action === 'select-draft') { $('#draft').focus(); $('#draft').select(); announce('Draft selected for manual copying. No message was sent.'); }
  if (action === 'approve' || action === 'reject') {
    reviewCandidate(state, selection.id, action === 'approve' ? 'Approved' : 'Rejected');
    dialog.close(); render(); announce(action === 'approve' ? 'Candidate approved. A verified lead was created with an illustrative score.' : 'Candidate rejected. Decision saved in this visit.');
  }
});
dialog.addEventListener('submit', event => {
  event.preventDefault();
  const id = selection.id;
  let message = '';
  let focus = '';
  if (event.target.id === 'stage-form') { updateLead(state, id, $('#lead-stage').value); message = 'Stage updated in this visit.'; focus = '#lead-stage'; }
  if (event.target.id === 'note-form') { if (!addNote(state, id, $('#note').value)) return; message = 'Note added in this visit.'; focus = '#note'; }
  if (event.target.id === 'outreach-form') { recordOutreach(state, id, $('#followup').value); message = 'Manual activity recorded. No message or reminder was sent.'; focus = '#followup'; }
  render(); showDetail('lead', id, message); $(focus)?.focus(); announce(message);
});
dialog.addEventListener('close', () => { if (selection) (workspace.querySelector(`[data-id="${selection.id}"]`) || workspace).focus(); });
$('#outcome').addEventListener('click', event => { if (event.target.closest('#outcome-next')) advanceOutcome(state); else if (event.target.closest('#outcome-restart')) state.outcomeStep = 0; else return; renderOutcome(); $('#outcome button')?.focus(); announce(`Fictional walkthrough: ${OUTCOME[state.outcomeStep][0]}`); });
$('#reset').addEventListener('click', () => { dialog.close(); selection = null; state = createState(); filters.candidates = {}; filters.leads = {}; setTab('dashboard'); announce('Demo reset. All visit changes and any active discovery run were cleared.'); });
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
let themeChosen = false;
function applyTheme(dark) { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; $('#theme-toggle').setAttribute('aria-pressed', String(dark)); }
applyTheme(systemTheme.matches);
$('#theme-toggle').addEventListener('click', () => { themeChosen = true; applyTheme(document.documentElement.dataset.theme !== 'dark'); });
systemTheme.addEventListener('change', event => { if (!themeChosen) applyTheme(event.matches); });
const mobileTabs = matchMedia('(max-width: 720px)');
const orientTabs = () => document.querySelector('.tabs').setAttribute('aria-orientation', mobileTabs.matches ? 'horizontal' : 'vertical');
orientTabs();
mobileTabs.addEventListener('change', orientTabs);
render();
