const state = {
  data: null,
  search: '',
  priority: 'all'
};

const el = {
  bigThreeList: document.getElementById('bigThreeList'),
  metaList: document.getElementById('metaList'),
  githubNotes: document.getElementById('githubNotes'),
  fundamentalsGrid: document.getElementById('fundamentalsGrid'),
  booksGrid: document.getElementById('booksGrid'),
  librarySummary: document.getElementById('librarySummary'),
  rootFiles: document.getElementById('rootFiles'),
  optionalFolders: document.getElementById('optionalFolders'),
  searchInput: document.getElementById('searchInput'),
  priorityFilters: document.getElementById('priorityFilters')
};

function setTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  document.documentElement.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
}

function createTag(text) {
  return `<span class="tag">${text}</span>`;
}

function renderList(target, items) {
  target.innerHTML = items.map(item => `<li>${item}</li>`).join('');
}

function renderMeta() {
  const items = [
    ['Database', state.data.database_name],
    ['Version', state.data.database_version],
    ['Platform', state.data.intended_platform],
    ['Repo URL', state.data.github.repository_url_format],
    ['Pages URL', state.data.github.pages_url_format]
  ];
  el.metaList.innerHTML = items.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  renderList(el.githubNotes, state.data.github.notes);
}

function getBookMap() {
  return Object.fromEntries(state.data.lesson_books.map(book => [book.id, book]));
}

function renderFundamentals() {
  const bookMap = getBookMap();
  const q = state.search.trim().toLowerCase();
  const filtered = state.data.fundamentals.filter(item => {
    const text = [item.title, item.goal, item.summary, item.practice_approach].join(' ').toLowerCase();
    const matchedBooks = item.book_ids.map(id => bookMap[id]?.title || '').join(' ').toLowerCase();
    return !q || text.includes(q) || matchedBooks.includes(q);
  });

  if (!filtered.length) {
    el.fundamentalsGrid.innerHTML = '<div class="empty-state">No fundamentals matched your search.</div>';
    return;
  }

  el.fundamentalsGrid.innerHTML = filtered.map(item => {
    const books = item.book_ids.map(id => bookMap[id]?.title).filter(Boolean);
    return `
      <article class="card">
        <div class="kicker">${item.order}. Fundamental Area</div>
        <h3>${item.title}</h3>
        <p><strong>Goal:</strong> ${item.goal}</p>
        <p>${item.summary}</p>
        <p><strong>Practice approach:</strong> ${item.practice_approach}</p>
        <div class="tag-row">${books.map(createTag).join('')}</div>
      </article>
    `;
  }).join('');
}

function renderPriorityFilters() {
  const priorities = ['all', ...new Set(state.data.lesson_books.map(book => book.priority))];
  el.priorityFilters.innerHTML = priorities.map(priority => `
    <button class="filter-chip ${state.priority === priority ? 'active' : ''}" data-priority="${priority}">
      ${priority}
    </button>
  `).join('');

  el.priorityFilters.querySelectorAll('[data-priority]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.priority = btn.dataset.priority;
      renderPriorityFilters();
      renderBooks();
    });
  });
}

function renderBooks() {
  const q = state.search.trim().toLowerCase();
  let books = state.data.lesson_books;

  if (state.priority !== 'all') {
    books = books.filter(book => book.priority === state.priority);
  }

  if (q) {
    books = books.filter(book => {
      const text = [book.title, book.author, book.publisher, ...(book.coverage || [])].join(' ').toLowerCase();
      return text.includes(q);
    });
  }

  if (!books.length) {
    el.booksGrid.innerHTML = '<div class="empty-state">No books matched the current filters.</div>';
    return;
  }

  el.booksGrid.innerHTML = books.map(book => `
    <article class="card">
      <div class="kicker">${book.priority}</div>
      <h3>${book.title}</h3>
      <p><strong>Author:</strong> ${book.author}</p>
      <p><strong>Publisher:</strong> ${book.publisher}</p>
      <div class="tag-row">${(book.coverage || []).map(createTag).join('')}</div>
    </article>
  `).join('');
}

function renderLibrarySummary() {
  const bookMap = getBookMap();
  el.librarySummary.innerHTML = state.data.essential_library_summary.map(group => `
    <article class="panel">
      <div class="kicker">${group.priority}</div>
      <h3>${group.priority}</h3>
      <ul class="bullet-list">
        ${group.books.map(id => `<li>${bookMap[id]?.title || id}</li>`).join('')}
      </ul>
    </article>
  `).join('');
}

function renderStructure() {
  renderList(el.rootFiles, state.data.site_structure.recommended_root_files);
  renderList(el.optionalFolders, state.data.site_structure.optional_folders);
}

function renderBigThree() {
  renderList(el.bigThreeList, state.data.core_concepts.big_three);
}

function bindEvents() {
  document.querySelector('[data-theme-toggle]')?.addEventListener('click', toggleTheme);
  el.searchInput?.addEventListener('input', (event) => {
    state.search = event.target.value;
    renderFundamentals();
    renderBooks();
  });
}

async function init() {
  setTheme();
  bindEvents();
  const response = await fetch('./data/mte-complete-database.json');
  state.data = await response.json();
  renderBigThree();
  renderMeta();
  renderFundamentals();
  renderPriorityFilters();
  renderBooks();
  renderLibrarySummary();
  renderStructure();
}

init().catch(error => {
  console.error(error);
  document.getElementById('main').innerHTML = '<section class="section-block"><div class="container"><div class="empty-state">The database could not be loaded. Make sure data/mte-complete-database.json is present in the repository.</div></div></section>';
});
