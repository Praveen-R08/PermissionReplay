const scanForm = element('scanForm');
const scanInput = element('siteUrl');
const scanButton = element('scanButton');
const scanStatus = element('scanStatus');
const scanOutput = element('scanOutput');
const simulation = element('simulation');

function detectedPermissions(findings) {
 const requests = new Map();
 for (const item of findings) {
  if (item.kind !== 'Source match') continue;
  const entry = catalog.find(candidate => candidate.id === item.id);
  if (!entry || !['Prompt', 'Picker'].includes(entry.type)) continue;
  if (!requests.has(entry)) requests.set(entry, []);
  requests.get(entry).push(item);
 }
 return requests;
}

function showFindings(result) {
 site = new URL(result.url);
 const requests = detectedPermissions(result.findings);
 scanStatus.textContent = requests.size
  ? 'Found source evidence for ' + requests.size + ' permission option' + (requests.size === 1 ? '' : 's') + ' on ' + site.hostname + '.'
  : 'No permission requests detected in the scanned source. This page may still ask for access when you use it.';
 const findings = element('scanFindings');
 findings.replaceChildren(...Array.from(requests, ([entry, evidence]) => {
  const row = document.createElement('li');
  const details = document.createElement('div');
  const title = document.createElement('strong');
  title.textContent = entry.name;
  details.append(title);
  for (const item of evidence) {
   const source = document.createElement('p');
   const snippet = document.createElement('code');
   source.textContent = item.source + ' ';
   snippet.textContent = item.evidence;
   source.append(snippet);
   details.append(source);
  }
  const simulate = document.createElement('button');
  simulate.type = 'button';
  simulate.textContent = 'Simulate ' + entry.name.toLowerCase();
  simulate.onclick = () => {
   select(entry);
   for (const button of findings.querySelectorAll('button')) button.setAttribute('aria-pressed', String(button === simulate));
   element('permissionName').focus();
  };
  row.append(details, simulate);
  return row;
 }));
 for (const [index, button] of Array.from(findings.querySelectorAll('button')).entries()) {
  button.setAttribute('aria-pressed', String(index === 0));
 }
 element('permissionHeading').hidden = !requests.size;
 findings.hidden = !requests.size;
 const {scannedScripts, failedScripts, skippedExternal, skippedLimit, truncatedScripts, truncatedHtml, truncatedFindings} = result.coverage;
 const notes = [scannedScripts + ' same-site script(s) scanned'];
 if (skippedExternal) notes.push(skippedExternal + ' cross-site script(s) skipped');
 if (skippedLimit) notes.push(skippedLimit + ' same-site script(s) beyond the scan limit');
 if (failedScripts) notes.push(failedScripts + ' script(s) unavailable');
 if (truncatedScripts || truncatedHtml || truncatedFindings) notes.push('some source or findings exceeded size limits');
 if (result.findings.some(item => item.kind === 'Unresolved call')) notes.push('some media requests did not specify camera or microphone in readable code');
 element('scanCoverage').textContent = notes.join(' · ') + '.';
 element('visitSite').href = result.url;
 scanOutput.hidden = false;
 if (requests.size) {
  select(requests.keys().next().value);
  simulation.hidden = false;
 }
}

scanForm.onsubmit = async event => {
 event.preventDefault();
 if (scanButton.disabled) return;
 scanButton.disabled = true;
 scanOutput.hidden = true;
 simulation.hidden = true;
 stop();
 scanStatus.textContent = 'Reading public page source…';
 try {
  const response = await fetch('/api/scan', {
   method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({url:scanInput.value})
  });
  const result = await response.json();
  if (!response.ok) throw Error(result.error || 'The scan could not be completed.');
  showFindings(result);
 } catch (error) {
  scanStatus.textContent = error instanceof SyntaxError ? 'The scan service returned an unexpected response.' : error.message;
 } finally { scanButton.disabled = false; }
};
