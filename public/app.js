function escapeHtml(text = '') {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderSummary(summary = []) {
  const list = document.getElementById('summary-list');
  list.innerHTML = summary
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join('');
}

function renderSections(sections = []) {
  const container = document.getElementById('sections');

  container.innerHTML = sections.map((section) => {
    const cardsHtml = section.cards.length
      ? section.cards.map((card) => `
          <article class="card">
            <div class="card-topline">
              <span>${escapeHtml(card.source)}</span>
              <span>${escapeHtml(card.publishedAt || '')}</span>
            </div>

            <h3>
              <a href="${escapeHtml(card.url)}" target="_blank" rel="noopener noreferrer">
                ${escapeHtml(card.title)}
              </a>
            </h3>

            <p class="summary">${escapeHtml(card.summary)}</p>

            <div class="reason-box">
              <div class="reason-title">为什么重要</div>
              <p>${escapeHtml(card.reason)}</p>
            </div>

            <div class="keywords">
              ${(card.matchedKeywords || []).map((word) => `
                <span>${escapeHtml(word)}</span>
              `).join('')}
            </div>
          </article>
        `).join('')
      : `<div class="empty-state">${escapeHtml(section.emptyMessage)}</div>`;

    return `
      <section class="panel">
        <div class="section-heading">
          <p class="eyebrow">Section</p>
          <h2>${escapeHtml(section.title)}</h2>
        </div>
        <div class="card-grid">${cardsHtml}</div>
      </section>
    `;
  }).join('');
}

function renderIdeas(ideas = []) {
  const container = document.getElementById('script-ideas');

  container.innerHTML = ideas.map((idea) => `
    <article class="idea-card">
      <p class="idea-format">${escapeHtml(idea.format)}</p>
      <h3>${escapeHtml(idea.title)}</h3>

      <div class="idea-row">
        <strong>开场钩子</strong>
        <p>${escapeHtml(idea.hook)}</p>
      </div>

      <div class="idea-row">
        <strong>背景</strong>
        <p>${escapeHtml(idea.setup)}</p>
      </div>

      <div class="idea-row">
        <strong>笑点 / 反转</strong>
        <p>${escapeHtml(idea.punchline)}</p>
      </div>
    </article>
  `).join('');
}

async function loadBrief() {
  try {
    const response = await fetch(`./data.json?v=${Date.now()}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    document.getElementById('site-title').textContent = data.site?.title || '咕噜每日简报';
    document.getElementById('site-subtitle').textContent = data.site?.subtitle || '';
    document.getElementById('brief-date').textContent = data.date || '--';
    document.getElementById('generated-at').textContent = `生成时间：${data.generatedAt || '--'}`;

    renderSummary(data.summary || []);
    renderSections(data.sections || []);
    renderIdeas(data.scriptIdeas || []);
  } catch (error) {
    document.getElementById('site-subtitle').textContent = '加载失败，请检查 GitHub Actions 是否成功运行。';
    document.getElementById('sections').innerHTML = `
      <section class="panel">
        <div class="empty-state">
          data.json 没有成功生成。请进入 GitHub 仓库的 Actions 页面查看错误日志。
        </div>
      </section>
    `;
    console.error(error);
  }
}

loadBrief();
