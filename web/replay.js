const element = id => document.getElementById(id);
const storageKey = 'permission-replay-v2';
const labels = {
 Prompt: ['Permission prompt', 'Allow access', 'Deny', 'Revoke access', 'A browser may ask for a grant. Grant duration and wording depend on the browser.'],
 Picker: ['Picker or chooser', 'Select sample', 'Cancel', 'End access', 'You choose a specific item, account, device or destination. The scope depends on what you select.'],
 Setting: ['Browser policy or setting', 'Simulate allowed', 'Simulate blocked', 'Simulate blocking', 'Access is governed by browser settings, supported APIs or browser policy. A separate prompt may be absent.'],
 Action: ['User-initiated action', 'Simulate action', 'Skip action', 'End session access', 'A click or other interaction may be required. The browser can impose additional conditions.']
};
let saved = {};
let storageAvailable = true;
try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; }
catch { storageAvailable = false; }
let current, site;
let history, index, timer, renderedHistory;
let comparison = false;

function save() {
 saved[replayKey(current)] = history;
 if (!storageAvailable) return;
 try { localStorage.setItem(storageKey, JSON.stringify(saved)); }
 catch { storageAvailable = false; }
}

function startFrame() {
 return { label: 'Request available', state: 'Requested', active: false, remembered: false, received: [], effect: current.purpose + '.' };
}

function stop() {
 clearInterval(timer);
 timer = null;
}

function replayKey(entry) {
 return site.origin + site.pathname + " " + entry.id;
}

function select(entry, reset = false) {
 stop();
 current = entry;
 const previous = saved[replayKey(entry)];
 history = !reset && Array.isArray(previous) && previous.length ? previous : [startFrame()];
 renderedHistory = null;
 index = history.length - 1;
 element('reportStatus').textContent = '';
 if (reset) save();
 render();
}

function record(action) {
 const previous = history[index];
 const next = { ...previous, received: [...previous.received] };
 const [, grant, decline, end] = labels[current.type];
 switch (action) {
  case 'allow':
  case 'remember':
   Object.assign(next, { remembered: action === 'remember', label: action === 'remember' ? 'Allowed future visits' : grant, state: current.live ? 'Allowed' : 'Completed', active: Boolean(current.live), effect: current.live ? 'Access is active. A sample is recorded below.' : 'The demo recorded the result of this action.' });
   next.received.push(current.sample);
   break;
  case 'deny':
   Object.assign(next, { label: decline, state: 'Denied', active: false, effect: 'This choice adds no new device data or action.' });
   break;
  case 'revoke':
   Object.assign(next, { label: end, state: 'Revoked', active: false, remembered: false, effect: 'Access ended. The example keeps its existing record.' });
   break;
  case 'fallback':
   Object.assign(next, { label: 'Used alternative', effect: current.alternative + '. The access decision stays the same.' });
   next.received.push('Alternative: ' + current.alternative);
   break;
  case 'revisit':
   Object.assign(next, { label: 'Returned to site', ...(
    previous.remembered
     ? { effect: 'The demo site can use the remembered grant on this visit.' }
     : { state: 'Requested', active: false, effect: 'The demo site needs a new decision on this visit.' }
   ) });
   break;
 }
 next.received = [...new Set(next.received)];
 history.push(next);
 index = history.length - 1;
 save();
 render();
}

function seek(step) {
 stop();
 index = step;
 render();
}

function render() {
 const frame = history[index];
 const latest = index === history.length - 1 && !timer;
 const [type, allow, deny, revoke, typeNote] = labels[current.type];
 const supportsDuration = ['location', 'camera', 'microphone'].includes(current.id);
 const content = {
  address: site.hostname, siteName: current.name + ' example', task: current.purpose + '.',
  permissionName: current.name, state: frame.state, instructions: latest ? 'Alternative: ' + current.alternative + '.' : 'Replay view. Return to the final step to make another choice.',
  type, typeNote, allow: supportsDuration ? 'Allow this visit' : allow, deny, revoke, effect: frame.effect,
  live: frame.active ? current.live : 'None',
  received: frame.received.join(' · ') || 'None',
  counter: 'Step ' + (index + 1) + ' of ' + history.length + (storageAvailable ? ' · Stored in this browser' : ' · Stored for this session'),
  compareAllow: current.sample + '. ' + (current.live ? 'Can use ' + current.live.toLowerCase() + ' while access is active.' : 'A completed action is recorded in the timeline.'),
  compareAlt: current.alternative + '.'
 };
 for (const [id, value] of Object.entries(content)) element(id).textContent = value;
 element('state').dataset.value = frame.state;
 element('allow').disabled = !latest || !['Requested', 'Denied', 'Revoked'].includes(frame.state);
 element('remember').hidden = !supportsDuration;
 element('remember').disabled = element('allow').disabled;
 element('deny').disabled = !latest || frame.state !== 'Requested';
 element('revoke').disabled = !latest || !frame.active;
 element('fallback').disabled = !latest || frame.received.includes('Alternative: ' + current.alternative);
 element('revisit').disabled = !latest || frame.state === 'Requested';
 const scrubber = element('scrubber');
 scrubber.max = history.length - 1;
 scrubber.value = index;
 scrubber.disabled = history.length < 2;
 const play = element('play');
 play.disabled = history.length < 2;
 play.textContent = timer ? 'Pause replay' : 'Play replay';
 const events = element('events');
 if (renderedHistory !== history || events.children.length !== history.length) {
  events.replaceChildren(...history.map((event, step) => {
   const item = document.createElement('li');
   const button = document.createElement('button');
   button.textContent = event.label;
   button.dataset.event = step;
   button.onclick = () => seek(step);
   item.append(button);
   return item;
  }));
  renderedHistory = history;
 }
 Array.from(events.children).forEach((item, step) => item.firstChild.setAttribute('aria-pressed', String(step === index)));
}

function exportReport() {
 const rows = history.map((frame, step) => [
  (step + 1) + '. ' + frame.label,
  '   Access: ' + (frame.active ? current.live : 'None'),
  '   Data or action recorded: ' + (frame.received.join(' · ') || 'None')
 ].join('\n'));
 const report = ['Permission Replay — simulation report', current.name + ' · ' + labels[current.type][0], current.purpose, '', ...rows].join('\n');
 const url = URL.createObjectURL(new Blob([report], { type: 'text/plain;charset=utf-8' }));
 const link = document.createElement('a');
 link.href = url;
 link.download = current.id + '-replay.txt';
 document.body.append(link);
 link.click();
 link.remove();
 setTimeout(() => URL.revokeObjectURL(url), 1000);
 element('reportStatus').textContent = 'Exported the full replay as a text report.';
}

for (const action of ['allow', 'remember', 'deny', 'fallback', 'revoke', 'revisit']) element(action).onclick = () => record(action);
element('scrubber').oninput = event => seek(Number(event.target.value));
element('reset').onclick = () => select(current, true);
element('download').onclick = exportReport;
element('compare').onclick = () => {
 comparison = !comparison;
 element('comparison').hidden = !comparison;
 element('compare').setAttribute('aria-pressed', String(comparison));
};
element('play').onclick = () => {
 if (timer) { stop(); render(); return; }
 index = 0;
 timer = setInterval(() => {
  index++;
  if (index === history.length - 1) stop();
  render();
 }, 900);
 render();
};
