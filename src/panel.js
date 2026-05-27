export function openPanel(course) {
  document.getElementById('p-code').textContent  = `${course.subject} ${course.catalogNumber}`;
  document.getElementById('p-title').textContent = course.title;
  document.getElementById('p-meta').innerHTML    = `
    <span>${course.credits} credit${course.credits !== 1 ? 's' : ''}</span>
    <span>${course.career || ''}</span>
    ${course.group       ? `<span>${course.group}</span>`                   : ''}
    ${course.instructor  ? `<span>Instructor: ${course.instructor}</span>`  : ''}
  `;
  document.getElementById('p-desc').textContent     = course.description || 'No description available.';
  document.getElementById('p-sections').innerHTML   = `<div class="panel-spin">Loading sections…</div>`;
  document.getElementById('panel').classList.add('open');
  document.getElementById('panel').setAttribute('aria-hidden', 'false');
  fetchSections(course);
}

export function closePanel() {
  const p = document.getElementById('panel');
  p.classList.remove('open');
  p.setAttribute('aria-hidden', 'true');
}

async function fetchSections(course) {
  try {
    const url  = `https://content.osu.edu/v2/classes/search?q=${encodeURIComponent(course.subject + ' ' + course.catalogNumber)}&subject=${course.subject.toLowerCase()}&pageSize=200`;
    const json = await (await fetch(url)).json();
    const item = (json.data?.courses ?? []).find(x => x.course.courseId === course.id);
    const secs = item?.sections ?? [];

    if (!secs.length) {
      document.getElementById('p-sections').innerHTML = `<div class="panel-spin">No current sections found.</div>`;
      return;
    }

    const rows = secs.slice(0, 10).map(s => {
      const inst = s.meetings?.[0]?.instructors?.[0]?.displayName ?? 'TBA';
      const days = ['monday','tuesday','wednesday','thursday','friday']
        .filter(d => s.meetings?.[0]?.[d])
        .map(d => d.slice(0, 2).toUpperCase()).join('');
      const t0   = s.meetings?.[0]?.startTime ?? '';
      const t1   = s.meetings?.[0]?.endTime   ?? '';
      const time = t0 ? `${t0}–${t1}` : '';
      const stat = s.enrollmentStatus ?? 'Unknown';
      const cls  = stat === 'Open' ? 'open' : stat === 'Closed' ? 'closed' : 'wait';
      const enr  = s.enrollmentTotal ?? '?';
      const wl   = s.waitlistTotal;
      return `<div class="sec">
        <div class="sec-row">${s.section} · ${s.instructionMode || ''}</div>
        <div class="sec-row">${inst}${days ? ' · ' + days : ''}${time ? ' ' + time : ''}</div>
        <div class="sec-row"><span class="${cls}">${stat}</span> · ${enr} enrolled${wl ? `, ${wl} waitlist` : ''}</div>
      </div>`;
    }).join('');

    document.getElementById('p-sections').innerHTML =
      `<p class="sec-head">${secs.length} section${secs.length !== 1 ? 's' : ''} offered</p>${rows}`;
  } catch {
    document.getElementById('p-sections').innerHTML = `<div class="panel-spin">Could not load sections.</div>`;
  }
}
