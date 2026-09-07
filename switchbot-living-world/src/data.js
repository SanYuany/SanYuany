export const products = [
  {
    id: 'curtain3',
    name: 'SwitchBot カーテン3',
    role: '朝の光とカーテンを自動化',
    image: 'https://www.switchbot.jp/cdn/shop/files/CurtainU3_02_v1_1.jpg?v=1753758964',
    url: 'https://www.switchbot.jp/products/switchbot-curtain3'
  },
  {
    id: 'hub3',
    name: 'SwitchBot ハブ3',
    role: '家中のシーンをまとめて動かす',
    image: 'https://www.switchbot.jp/cdn/shop/files/Hub_3_JP_1600x1600_02_1x_f13df486-6ca8-4398-8f4f-7e9636bfc49f.webp?v=1760694016',
    url: 'https://www.switchbot.jp/products/switchbot-hub3'
  },
  {
    id: 'lockUltra',
    name: 'SwitchBot ロックUltra',
    role: '帰宅・外出の入口を自動化',
    image: 'https://www.switchbot.jp/cdn/shop/files/59_2x_070b4f90-1856-4257-8850-9535863d628d.webp?v=1745576039',
    url: 'https://www.switchbot.jp/products/switchbot-lock-ultra'
  },
  {
    id: 'keypadVision',
    name: 'SwitchBot 顔認証パッド',
    role: '立つだけで解錠',
    image: 'https://www.switchbot.jp/cdn/shop/files/Keypad_Vision_JP_1600x1600_1_1x.webp',
    url: 'https://www.switchbot.jp/products/switchbot-keypad-vision'
  },
  {
    id: 'lighting',
    name: 'SwitchBot ライティング',
    role: '時間と暮らしに合わせて照明を調整',
    image: '',
    url: 'https://www.switchbot.jp/pages/lighting-lineup'
  }
];

export const scenes = [
  {
    id: 'morning',
    time: '07:00',
    eyebrow: 'MORNING',
    headline: '朝、家が先に目を覚ます。',
    body: 'カーテンを開けに行かなくても、光と一緒に一日が始まる。',
    room: 'bedroom',
    tone: 'dawn',
    camera: ['house-wide','bedroom-window','bedroom-close'],
    actions: ['QuietDriftでカーテンがゆっくり開く','自然光が寝室に入る','朝のシーンへ切り替わる'],
    essential: ['curtain3'],
    recommended: ['hub3'],
    upgrade: ['lighting']
  },
  {
    id: 'leaving',
    time: '08:30',
    eyebrow: 'LEAVING HOME',
    headline: '出かけるだけで、家も外出モードへ。',
    body: '最後に家を出たら、家電や照明をまとめてオフ。外出後の「あれ、消したっけ？」を減らす。',
    room: 'entrance',
    tone: 'day',
    camera: ['bedroom-close','stairs','entrance-inside','house-wide'],
    actions: ['人がいないことを検知','エアコンなどを自動OFF','玄関を施錠'],
    essential: ['hub3'],
    recommended: ['lockUltra'],
    upgrade: ['lighting']
  },
  {
    id: 'coming-home',
    time: '18:30',
    eyebrow: 'COMING HOME',
    headline: '両手がふさがっていても、そのまま帰宅。',
    body: '玄関の前に立つ。鍵を探さずに解錠。ドアが開くと、家も「ただいま」の状態へ。',
    room: 'entrance',
    tone: 'sunset',
    camera: ['house-wide','entrance-outside','entrance-close','living-wide'],
    actions: ['顔認証で解錠','ドアが開く','照明がON','エアコン・カーテンを帰宅シーンへ'],
    essential: ['lockUltra','keypadVision'],
    recommended: ['hub3'],
    upgrade: ['curtain3','lighting']
  },
  {
    id: 'good-night',
    time: '23:30',
    eyebrow: 'GOOD NIGHT',
    headline: '「おやすみ」で、家も眠る。',
    body: '寝る前の小さな確認をひとつずつやらなくても、夜のシーンにまとめて切り替える。',
    room: 'bedroom',
    tone: 'night',
    camera: ['living-wide','stairs','bedroom-close','house-night'],
    actions: ['カーテンを閉じる','照明を落とす','玄関の施錠状態を確認','夜のシーンへ'],
    essential: ['hub3'],
    recommended: ['curtain3','lockUltra'],
    upgrade: ['lighting']
  }
];

export const rooms = [
  { id: 'entrance', name: '玄関', descriptor: '帰宅・外出', scenes: ['leaving','coming-home'] },
  { id: 'living', name: 'リビング', descriptor: '帰宅後の快適さ', scenes: ['coming-home','good-night'] },
  { id: 'bedroom', name: '寝室', descriptor: '朝と夜', scenes: ['morning','good-night'] },
  { id: 'whole-home', name: '家全体', descriptor: 'シーンでまとめる', scenes: ['leaving','coming-home','good-night'] }
];
