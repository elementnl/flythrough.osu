export function setupSearch(courses, flyTo, openPanel) {
  const input = document.getElementById('search');
  const list  = document.getElementById('results');

  input.addEventListener('input', () => {
    const q = input.value.trim().toUpperCase();
    list.innerHTML = '';
    if (q.length < 2) return;

    const hits = courses.filter(c =>
      `${c.subject} ${c.catalogNumber}`.toUpperCase().startsWith(q) ||
      c.title.toUpperCase().includes(q)
    ).slice(0, 9);

    for (const c of hits) {
      const li = document.createElement('li');
      li.innerHTML = `<span class="code">${c.subject} ${c.catalogNumber}</span><div class="name">${c.title}</div>`;
      li.addEventListener('click', () => {
        flyTo(courses.indexOf(c));
        openPanel(c);
        list.innerHTML = '';
        input.value    = '';
        input.blur();
      });
      list.appendChild(li);
    }
  });

  input.addEventListener('keydown', e => {
    if (e.code === 'Escape') { list.innerHTML = ''; input.blur(); }
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('#search-wrap')) list.innerHTML = '';
  });
}
