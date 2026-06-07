const TIME_ZONE = 'Asia/Shanghai';

function googleNewsRss(query) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=zh-CN&gl=CN&ceid=CN:zh-Hans`;
}

const CONFIG = {
  site: {
    title: '咕噜每日简报',
    subtitle: '只保留和投资、猫咪内容、中年情绪价值真正有关的信息',
    owner: 'Gulu Studio',
  },

  feeds: {
    stocks: [
      {
        name: '美股 / 科技股 / AI / 财报',
        url: googleNewsRss('美股 OR 纳斯达克 OR 英伟达 OR 特斯拉 OR 苹果 OR 微软 OR Meta OR AI 财报 股票'),
      },
    ],

    creator: [
      {
        name: '猫咪 / 宠物 / 短视频 / AI视频',
        url: googleNewsRss('猫咪 OR 宠物 OR 短视频 OR AI视频 OR 内容创作 OR 抖音 OR 视频号 OR 小红书'),
      },
    ],

    life: [
      {
        name: '职场 / 房贷 / 中年 / 家庭压力',
        url: googleNewsRss('职场压力 OR 房贷 OR 中年危机 OR 婚姻 OR 亲子 OR 家庭压力 OR 打工人'),
      },
    ],

    general: [
      {
        name: '商业 / 科技 / 社会',
        url: googleNewsRss('商业 OR 科技 OR 消费 OR 平台经济 OR AI'),
      },
    ],
  },

  sections: [
    {
      id: 'general',
      title: '01 今日商业与科技观察',
      feedKeys: ['general'],
      maxItems: 5,
      include: [
        'AI', '人工智能', '科技', '商业', '消费', '平台', '经济', '公司', '市场',
        '互联网', '电商', '机器人', '内容', '短视频',
      ],
      exclude: [
        '高考', '中考', '造船', '足球', '篮球', '演唱会', '明星恋情', '彩票',
      ],
    },

    {
      id: 'stocks',
      title: '02 美股异动深度拆解',
      feedKeys: ['stocks'],
      maxItems: 5,
      include: [
        '美股', '纳斯达克', '标普', '道指', '英伟达', 'Nvidia', 'NVDA',
        '特斯拉', 'Tesla', 'TSLA', '苹果', 'Apple', 'AAPL', '微软',
        'Microsoft', 'MSFT', 'Meta', '亚马逊', 'Amazon', 'AMD', 'AI',
        '财报', '降息', '通胀', '估值', '盘前', '盘后', '上涨', '下跌',
        '暴涨', '暴跌', '芯片', '半导体',
      ],
      exclude: [
        '宠物', '猫咪', '高考', '造船', '明星', '演唱会', '彩票', '内容启发',
      ],
    },

    {
      id: 'creator',
      title: '03 猫咪与短视频热点观察',
      feedKeys: ['creator'],
      maxItems: 6,
      include: [
        '猫', '猫咪', '宠物', '萌宠', '短视频', '抖音', '视频号', '小红书',
        'AI视频', 'AIGC', '内容创作', '账号', '流量', '爆款', '剪辑',
      ],
      exclude: [
        '高考', '中考', '造船', '股市', '房价', '篮球', '足球', '战争',
        '彩票', '车祸', '凶杀', '灾害',
      ],
    },

    {
      id: 'life',
      title: '04 咕噜中年日记今日选题',
      feedKeys: ['life'],
      maxItems: 6,
      include: [
        '职场', '上班', '打工人', '裁员', '加班', '房贷', '车贷', '婚姻',
        '夫妻', '亲子', '孩子', '家庭', '中年', '焦虑', '压力', '疲惫',
        '内耗', '领导', '同事',
      ],
      exclude: [
        '高考', '中考', '造船', '明星', '演唱会', '体育', '彩票', '游戏赛事',
      ],
    },
  ],
};

module.exports = {
  TIME_ZONE,
  CONFIG,
};
