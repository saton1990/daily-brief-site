const fs = require('fs/promises');
const path = require('path');
const { TIME_ZONE, CONFIG } = require('./config');

const PUBLIC_DIR = path.join(process.cwd(), 'public');

function nowParts() {
  const now = new Date();

  const dateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const get = (type) => dateParts.find((p) => p.type === type)?.value;

  const date = `${get('year')}-${get('month')}-${get('day')}`;

  const generatedAt = new Intl.DateTimeFormat('zh-CN', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(now);

  return { date, generatedAt };
}

function decodeHtml(text = '') {
  return text
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .trim();
}

function stripHtml(text = '') {
  return decodeHtml(text)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? decodeHtml(match[1]) : '';
}

function parseRss(xml, feedName) {
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) || [];

  return itemBlocks.map((block) => {
    const title = stripHtml(getTag(block, 'title'));
    const link = stripHtml(getTag(block, 'link'));
    const description = stripHtml(getTag(block, 'description'));
    const pubDate = stripHtml(getTag(block, 'pubDate'));
    const source = stripHtml(getTag(block, 'source')) || feedName;

    return {
      title,
      link,
      description,
      pubDate,
      source,
      feedName,
    };
  }).filter((item) => item.title && item.link);
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'daily-brief-site/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFeed(feed) {
  try {
    const xml = await fetchText(feed.url);
    return parseRss(xml, feed.name);
  } catch (error) {
    console.warn(`Feed failed: ${feed.name} - ${error.message}`);
    return [];
  }
}

function normalize(text = '') {
  return text.toLowerCase().replace(/\s+/g, '');
}

function keywordHits(text, keywords) {
  const normalized = normalize(text);
  return keywords.filter((word) => normalized.includes(normalize(word)));
}

function scoreItem(item, section) {
  const text = `${item.title} ${item.description} ${item.source}`;

  const excluded = keywordHits(text, section.exclude || []);
  if (excluded.length > 0) {
    return {
      accepted: false,
      score: -999,
      matched: [],
      rejectedBy: excluded,
    };
  }

  const matched = keywordHits(text, section.include || []);
  if (matched.length === 0) {
    return {
      accepted: false,
      score: 0,
      matched: [],
      rejectedBy: [],
    };
  }

  let score = matched.length * 10;

  const titleHits = keywordHits(item.title, section.include || []);
  score += titleHits.length * 8;

  if (item.pubDate) {
    const published = new Date(item.pubDate);
    if (!Number.isNaN(published.getTime())) {
      const hoursOld = (Date.now() - published.getTime()) / 1000 / 60 / 60;
      if (hoursOld < 24) score += 10;
      else if (hoursOld < 72) score += 5;
    }
  }

  return {
    accepted: true,
    score,
    matched,
    rejectedBy: [],
  };
}

function cleanTitle(title = '') {
  return title
    .replace(/\s+-\s+.*$/, '')
    .replace(/\s+_\s+.*$/, '')
    .trim();
}

function shortText(text = '', max = 130) {
  const clean = stripHtml(text);
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max)}……`;
}

function reasonFor(sectionId, item, matched) {
  const text = `${item.title} ${item.description}`;

  if (sectionId === 'stocks') {
    if (/财报|盈利|营收|利润|业绩/.test(text)) {
      return '它影响市场对公司增长质量和估值的判断，适合重点看营收、利润率和管理层指引。';
    }
    if (/降息|通胀|利率|美联储/.test(text)) {
      return '它会影响科技股估值中枢，尤其是高估值 AI、芯片和成长股。';
    }
    if (/AI|芯片|半导体|英伟达|Nvidia|AMD/.test(text)) {
      return '它属于 AI 主线或芯片供应链信息，容易带动相关板块情绪。';
    }
    return '它反映了美股市场的风险偏好变化，适合观察资金流向和板块轮动。';
  }

  if (sectionId === 'creator') {
    if (/猫|猫咪|宠物|萌宠/.test(text)) {
      return '它和猫咪内容直接相关，可以用来判断观众最近对萌宠内容的兴趣点。';
    }
    if (/AI视频|AIGC|剪辑|短视频/.test(text)) {
      return '它和内容生产方式有关，适合观察 AI 视频、剪辑节奏和账号包装的新玩法。';
    }
    return '它和短视频内容生态有关，但需要二次改造成猫咪视角后再使用。';
  }

  if (sectionId === 'life') {
    if (/职场|上班|加班|裁员|领导|同事/.test(text)) {
      return '它能转化成职场压迫、画饼、背锅、加班等中年共鸣剧情。';
    }
    if (/房贷|车贷|债务|收入/.test(text)) {
      return '它击中普通人的财务压力，适合做成“猫替人审判现实压力”的爽感反转。';
    }
    if (/婚姻|夫妻|亲子|孩子|家庭/.test(text)) {
      return '它适合做家庭关系、亲子压力、夫妻疲惫类短剧选题。';
    }
    return '它能补充“中年疲惫但还要继续生活”的情绪底色。';
  }

  return `它命中了「${matched.slice(0, 3).join(' / ')}」等关键词，和本站选题方向有关。`;
}

function makeCard(item, section, matched, score) {
  return {
    title: cleanTitle(item.title),
    source: item.source || item.feedName || '未知来源',
    url: item.link,
    publishedAt: item.pubDate || '',
    summary: shortText(item.description || item.title, 150),
    reason: reasonFor(section.id, item, matched),
    matchedKeywords: matched.slice(0, 6),
    score,
  };
}

function dedupeItems(items) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const key = normalize(cleanTitle(item.title));
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

async function buildSection(section) {
  const feeds = section.feedKeys.flatMap((key) => CONFIG.feeds[key] || []);
  const rawItems = [];

  for (const feed of feeds) {
    const items = await fetchFeed(feed);
    rawItems.push(...items);
  }

  const scored = dedupeItems(rawItems)
    .map((item) => {
      const result = scoreItem(item, section);
      return {
        item,
        ...result,
      };
    })
    .filter((row) => row.accepted)
    .sort((a, b) => b.score - a.score)
    .slice(0, section.maxItems)
    .map((row) => makeCard(row.item, section, row.matched, row.score));

  return {
    id: section.id,
    title: section.title,
    cards: scored,
    emptyMessage: scored.length
      ? ''
      : '今天没有抓到足够相关的可靠内容。本站规则是：宁愿留空，也不硬塞无关信息。',
  };
}

function buildSummary(sections) {
  const bullets = [];

  for (const section of sections) {
    const first = section.cards[0];
    if (first) {
      bullets.push(`【${section.title.replace(/^\d+\s*/, '')}】${first.title}`);
    }
  }

  if (bullets.length === 0) {
    return [
      '今天没有抓到足够相关的内容，系统已自动过滤掉不匹配的信息。',
      '这不是故障，而是为了避免出现高考、造船、体育娱乐等无关内容。',
    ];
  }

  return bullets.slice(0, 5);
}

function buildScriptIdeas(sections) {
  const creator = sections.find((s) => s.id === 'creator');
  const life = sections.find((s) => s.id === 'life');

  const creatorTop = creator?.cards?.[0];
  const lifeTop = life?.cards?.[0];

  const ideas = [];

  if (lifeTop) {
    ideas.push({
      title: '咕噜审判画饼领导',
      hook: '领导说“年轻人不要只看钱”，咕噜从桌底钻出来开始审判。',
      setup: lifeTop.title,
      punchline: '咕噜把领导的 PPT 翻到最后一页：原来涨薪预算是 0。',
      format: '现实人类世界 + 一只会审判的猫',
    });
  }

  if (creatorTop) {
    ideas.push({
      title: '猫咪账号今天不要跟风垃圾热点',
      hook: '运营想把无关热点硬塞进猫咪视频，咕噜直接按住键盘。',
      setup: creatorTop.title,
      punchline: '咕噜：不是所有热搜都配进我的猫粮碗。',
      format: '猫咪日常 + 内容创作者吐槽',
    });
  }

  ideas.push({
    title: '中年人下班后的一分钟复活',
    hook: '人类回家瘫在沙发上，猫先嫌弃，后默默靠近。',
    setup: '房贷、工作、家庭压力叠加后的日常疲惫。',
    punchline: '人类说“今天又废了”，猫把爪子放上去：批准你再活一天。',
    format: '温情现实风 + 轻喜剧结尾',
  });

  return ideas.slice(0, 3);
}

async function main() {
  await fs.mkdir(PUBLIC_DIR, { recursive: true });

  const { date, generatedAt } = nowParts();

  const sections = [];
  for (const section of CONFIG.sections) {
    const built = await buildSection(section);
    sections.push(built);
  }

  const data = {
    site: CONFIG.site,
    date,
    generatedAt,
    summary: buildSummary(sections),
    sections,
    scriptIdeas: buildScriptIdeas(sections),
  };

  await fs.writeFile(
    path.join(PUBLIC_DIR, 'data.json'),
    JSON.stringify(data, null, 2),
    'utf8'
  );

  await fs.writeFile(
    path.join(PUBLIC_DIR, `brief-${date}.json`),
    JSON.stringify(data, null, 2),
    'utf8'
  );

  console.log(`Daily brief generated: ${date}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
