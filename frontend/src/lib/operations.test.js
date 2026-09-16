import test from 'node:test';
import assert from 'node:assert/strict';
import { activeAlerts, prioritize, latestByKit, observedRecently, coordinates, predictionMatchesKit, formatDate } from './operations.js';

test('a resolved alert must never count as an open incident', () => {
  const alerts = [{status:'active',kitId:'A'}, {status:'acknowledged',kitId:'B'}, {status:'resolved',kitId:'C'}, {kitId:'D'}];
  assert.deepEqual(activeAlerts(alerts).map(a=>a.kitId), ['A','B']);
  assert.deepEqual(activeAlerts(undefined), []);
});
test('priority precedes recency and does not mutate API records', () => {
  const alerts = [{severity:'low',createdAt:'2026-09-16'}, {severity:'critical',createdAt:'2026-09-14'}, {severity:'critical',createdAt:'2026-09-15'}];
  const sorted = prioritize(alerts);
  assert.equal(sorted[0], alerts[2]);
  assert.equal(sorted[1], alerts[1]);
  assert.equal(alerts[0].severity, 'low');
});
test('latest readings are selected per kit, irrespective of payload order', () => {
  const readings = [{kitId:'A',createdAt:'2026-09-15',solar:{power_w:30}}, {kitId:'B',createdAt:'2026-09-16'}, {kitId:'A',createdAt:'2026-09-16',solar:{power_w:0}}, {createdAt:'2026-09-17'}];
  const result=latestByKit(readings);
  assert.equal(result.size, 2);
  assert.equal(result.get('A').solar.power_w, 0);
});
test('missing, stale and future timestamps are not recent signals', () => {
  const now=Date.parse('2026-09-16T12:00:00Z');
  assert.equal(observedRecently({createdAt:'2026-09-16T11:55:00Z'},now),true);
  assert.equal(observedRecently({createdAt:'2026-09-16T11:54:59Z'},now),false);
  assert.equal(observedRecently({createdAt:'2026-09-16T12:01:00Z'},now),false);
  assert.equal(observedRecently({},now),false);
});
test('missing coordinates must not become an invented zero position', () => {
  assert.equal(coordinates({gpsCoordinates:{latitude:null,longitude:null}}),null);
  assert.equal(coordinates({gpsCoordinates:{latitude:91,longitude:12}}),null);
  assert.equal(coordinates({gpsCoordinates:{latitude:'',longitude:12}}),null);
  assert.deepEqual(coordinates({gpsCoordinates:{latitude:0,longitude:0}}),[0,0]);
  assert.deepEqual(coordinates({gpsCoordinates:{latitude:'-4.3',longitude:'15.2'}}),[-4.3,15.2]);
});
test('a prediction belongs only to the selected kit', () => {
  assert.equal(predictionMatchesKit({kitId:'A',result:{status:'ok'}},'A'),true);
  assert.equal(predictionMatchesKit({kitId:'B',result:{status:'ok'}},'A'),false);
  assert.equal(predictionMatchesKit({result:{status:'ok'}},'A'),false);
  assert.equal(predictionMatchesKit({kitId:'A',result:{kit_id:'B'}},'A'),false);
  assert.equal(predictionMatchesKit({result:{identity:{kit_id:'A'}}},'A'),true);
  assert.equal(predictionMatchesKit({kitId:'A'},'A'),false);
});
test('unknown dates are not presented as current observations', () => {
  assert.equal(formatDate(undefined),'Date non renseignée');
  assert.equal(formatDate('invalid'),'Date non renseignée');
});
