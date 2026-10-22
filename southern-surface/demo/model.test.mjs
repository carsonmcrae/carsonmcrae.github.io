import test from 'node:test';
import assert from 'node:assert/strict';
import { STAGES, STEPS, OUTCOME, createState, startDiscovery, advanceDiscovery, reviewCandidate, listRecords, updateLead, addNote, recordOutreach, summary, advanceOutcome } from './model.mjs';

const finishRun = state => { assert.equal(startDiscovery(state), true); while (state.run.active) advanceDiscovery(state); };

test('discovery follows the ordered workflow, persists candidates before checkpoints, and leaves leads unchanged', () => {
  const state = createState();
  assert.equal(startDiscovery(state, 'Scheduled'), true);
  assert.equal(startDiscovery(state), false, 'An active run holds the simulated lease');
  for (let step = 0; step < STEPS.length; step++) {
    assert.equal(advanceDiscovery(state), true);
    assert.equal(state.run.step, step);
    assert.equal(state.run.events[step].title, STEPS[step][0]);
    assert.equal(state.leads.length, 3, 'Discovery cannot create a verified lead');
    assert.equal(state.candidates.length, step < 6 ? 3 : 6, 'Candidates persist only after revalidation');
    assert.equal(state.runs.length, step < 7 ? 0 : 1, 'Run metadata is written after candidates');
  }
  assert.deepEqual([state.run.scanned, state.run.outOfScope, state.run.invalid, state.run.duplicates, state.run.saved], [6, 1, 1, 1, 3]);
  assert.match(state.run.enrichment, /timeout/i);
  assert.equal(state.candidates.some(row => row.company === 'Juniper Loom Housing'), true, 'Optional enrichment failure is fail-open');
  assert.equal(state.candidates.some(row => 'score' in row), false, 'The collector assigns no lead score');
  assert.equal(advanceDiscovery(state), false);
});

test('deduplication retains distinct opportunities at one company and is idempotent across runs', () => {
  const state = createState(); finishRun(state);
  assert.equal(state.candidates.filter(row => row.company === 'Cedar Span Works').length, 2);
  const count = state.candidates.length; finishRun(state);
  assert.equal(state.candidates.length, count);
  assert.equal(state.run.saved, 0);
  assert.equal(state.run.duplicates, 4);
  assert.equal(state.runs.length, 2);
});

test('human approval creates and scores exactly one lead; rejection creates none', () => {
  const state = createState();
  assert.equal(reviewCandidate(state, 'c1', 'Approved'), true);
  assert.equal(state.leads.length, 4);
  assert.equal(state.leads.at(-1).stage, 'New');
  assert.equal(state.leads.at(-1).score, 65);
  assert.equal(reviewCandidate(state, 'c1', 'Approved'), false);
  assert.equal(reviewCandidate(state, 'c1', 'Rejected'), false);
  assert.equal(reviewCandidate(state, 'c2', 'Rejected'), true);
  assert.equal(state.leads.length, 4);
  assert.equal(reviewCandidate(state, 'missing', 'Approved'), false);
  assert.equal(reviewCandidate(state, 'c3', 'Invented'), false);
});

test('search, service, stage, and sorting combine without mutating the source collection', () => {
  const state = createState();
  const original = state.leads.map(row => row.id);
  const result = listRecords(state.leads, { query: '  REPAINT ', service: 'Painting', status: 'Contact in Progress', sort: 'company' });
  assert.deepEqual(result.map(row => row.company), ['Cobalt Meadow Builders']);
  assert.equal(listRecords(state.leads, { query: 'no such company' }).length, 0);
  assert.deepEqual(listRecords(state.leads, { sort: 'newest' }).map(row => row.id), ['l3', 'l2', 'l1']);
  assert.deepEqual(listRecords(state.leads, { sort: 'service' }).map(row => row.service), ['Cleaning', 'Flooring', 'Painting']);
  assert.deepEqual(state.leads.map(row => row.id), original);
});

test('manual lead changes validate stages, trim notes and record a follow-up without changing stage', () => {
  const state = createState();
  for (const stage of STAGES) assert.equal(updateLead(state, 'l1', stage), true);
  assert.equal(updateLead(state, 'l1', 'Automatically contacted'), false);
  assert.equal(addNote(state, 'l1', '   '), false);
  assert.equal(addNote(state, 'l1', '  Confirm scope.  '), true);
  assert.deepEqual(state.leads[0].notes, ['Confirm scope.']);
  assert.equal(recordOutreach(state, 'l1', 'Tomorrow (sample)'), true);
  assert.equal(recordOutreach(state, 'l1', 'Unknown'), false);
  assert.equal(state.leads[0].stage, STAGES.at(-1));
  assert.equal(state.leads[0].activities.length, 1);
  assert.deepEqual(summary(state), { awaiting: 3, leads: 3, outreach: 1, followups: 1 });
});

test('reset by creating fresh state cancels an unfinished run and clears all visit changes', () => {
  let state = createState();
  startDiscovery(state); advanceDiscovery(state); addNote(state, 'l1', 'Disposable note');
  reviewCandidate(state, 'c1', 'Approved'); advanceOutcome(state);
  state = createState();
  assert.equal(state.run, null);
  assert.equal(advanceDiscovery(state), false);
  assert.equal(state.leads.length, 3);
  assert.equal(state.leads[0].notes.length, 0);
  assert.equal(state.candidates[0].status, 'New');
  assert.equal(state.outcomeStep, 0);
  for (let index = 0; index < 20; index++) advanceOutcome(state);
  assert.equal(state.outcomeStep, OUTCOME.length - 1);
  assert.equal(state.leads.some(row => row.stage === 'Completed'), false, 'Fictional outcome walkthrough is independent from pipeline data');
});
