const scanForm = element('scanForm');
const scanInput = element('siteUrl');
const scanButton = element('scanButton');
const scanStatus = element('scanStatus');
const scanOutput = element('scanOutput');

function showFindings(result) {
 const confirmedSignals = new Set(result.findings.filter(item => item.id && item.kind !== 'Policy only').map(item => item.id)).size;
 scanStatus.textContent = confirmedSignals
  ? confirmedSignals + ' access type' + (confirmedSignals === 1 ? '' : 's') + ' with source evidence on ' + new URL(result.url).hostname + '.'
  : 'No identifiable access calls or controls found in the scanned source. The site may still request access.';
 const findings = result.findings.map(item => {
  const entry = catalog.find(candidate => candidate.id === item.id);
  const row = document.createElement('li');
  const details = document.createElement('div');
  const title = document.createElement('strong');
  const source = document.createElement('p');
  const snippet = document.createElement('code');
  title.textContent = (entry?.name || 'Camera or microphone') + ' · ' + item.kind;
  source.textContent = item.kind === 'Policy only' ? 'HTTP response header. Defines a policy, without showing a request.' : item.source;
  snippet.textContent = item.evidence;
  details.append(title, source, snippet);
  row.append(details);
  const options = entry ? [entry] : catalog.filter(candidate => ['camera','microphone'].includes(candidate.id));
  for (const option of options) {
   const simulate = document.createElement('button');
   simulate.type = 'button';
   simulate.textContent = 'Simulate ' + option.name.toLowerCase();
   simulate.onclick = () => {
    element('search').value = '';
    element('category').value = '';
    element('kind').value = '';
    select(option);
    element('permissionName').setAttribute('tabindex', '-1');
    element('permissionName').focus();
   };
   row.append(simulate);
  }
  return row;
 });
 element('scanFindings').replaceChildren(...findings);
 const {scannedScripts, failedScripts, skippedExternal, skippedLimit, truncatedScripts, truncatedHtml, truncatedFindings} = result.coverage;
 const notes = [scannedScripts + ' same-site script(s) scanned'];
 if (skippedExternal) notes.push(skippedExternal + ' cross-site script(s) skipped');
 if (skippedLimit) notes.push(skippedLimit + ' same-site script(s) beyond the scan limit');
 if (failedScripts) notes.push(failedScripts + ' script(s) unavailable');
 if (truncatedScripts || truncatedHtml || truncatedFindings) notes.push('some source or findings exceeded size limits');
 element('scanCoverage').textContent = notes.join(' · ') + '. Simulations use sample data and generic behavior for each access type.';
 element('visitSite').href = result.url;
 scanOutput.hidden = false;
}

scanForm.onsubmit = async event => {
 event.preventDefault();
 if (scanButton.disabled) return;
 scanButton.disabled = true;
 scanOutput.hidden = true;
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
