const storageKey = 'sslj-checks-v1';
const phaseList = document.querySelector('#phases');
const progress = document.querySelector('#progress');
const progressText = document.querySelector('#progress-text');
const clearButton = document.querySelector('#clear');
const dialog = document.querySelector('dialog');
const storageNotice = document.querySelector('#storage');
const offlineNotice = document.querySelector('#offline');

function readChecks() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return new Set(Array.isArray(saved) ? saved : []);
  } catch {
    return new Set();
  }
}

let checks = readChecks();

const sections = phases.map(([title, items], index) => {
  const section = document.createElement('details');
  const summary = document.createElement('summary');
  const name = document.createElement('span');
  const count = document.createElement('span');
  const list = document.createElement('ul');
  name.textContent = `Phase ${index + 1} — ${title}`;
  count.className = 'count';
  summary.append(name, count);
  section.append(summary, list);
  section.open = index === 0;

  const inputs = items.map(([id, task]) => {
    const item = document.createElement('li');
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = id;
    input.addEventListener('change', () => {
      if (storageNotice.hidden) checks = readChecks();
      if (input.checked) checks.add(id);
      else checks.delete(id);
      saveChecks();
    });
    label.append(input, task);
    item.append(label);
    list.append(item);
    return input;
  });

  phaseList.append(section);
  return { count, inputs };
});

progress.max = sections.reduce((total, section) => total + section.inputs.length, 0);

function updateProgress() {
  let completed = 0;
  for (const { count, inputs } of sections) {
    let phaseCompleted = 0;
    for (const input of inputs) {
      input.checked = checks.has(input.value);
      if (input.checked) phaseCompleted++;
    }
    count.textContent = `${phaseCompleted}/${inputs.length}`;
    count.setAttribute('aria-label', `${phaseCompleted} of ${inputs.length} complete`);
    completed += phaseCompleted;
  }
  progress.value = completed;
  progressText.textContent = `${completed} of ${progress.max} complete · ${Math.round(completed / progress.max * 100)}%`;
  clearButton.disabled = completed === 0;
}

function saveChecks() {
  try {
    localStorage.setItem(storageKey, JSON.stringify([...checks]));
    storageNotice.hidden = true;
  } catch {
    storageNotice.textContent = 'This browser could not save your checkmarks. Keep the app open to retain this session.';
    storageNotice.hidden = false;
  }
  updateProgress();
}

clearButton.addEventListener('click', () => {
  dialog.returnValue = 'cancel';
  dialog.showModal();
});
dialog.addEventListener('close', () => {
  if (dialog.returnValue !== 'clear') return;
  checks.clear();
  saveChecks();
});
window.addEventListener('storage', (event) => {
  if (event.key === storageKey || event.key === null) {
    checks = readChecks();
    updateProgress();
  }
});
updateProgress();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(() => navigator.serviceWorker.ready)
    .then(() => {
      offlineNotice.textContent = 'Ready to use offline';
      offlineNotice.hidden = false;
    })
    .catch(() => {
      offlineNotice.textContent = 'Offline setup is unavailable. Open the published app online to try again.';
      offlineNotice.hidden = false;
    });
}
