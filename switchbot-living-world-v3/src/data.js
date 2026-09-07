export const scenes = [
  {
    id:'morning', time:'07:00', eyebrow:'MORNING',
    title:'朝、家が先に目を覚ます。',
    body:'カーテンを開けに行かなくても、光と一緒に一日が始まる。',
    room:'2F BEDROOM', essential:['Curtain 3'], recommended:['Hub 3'], upgrade:['Smart Lighting']
  },
  {
    id:'leaving', time:'08:30', eyebrow:'LEAVING HOME',
    title:'出かけるだけで、家も外出モードへ。',
    body:'鍵・照明・空調。外出前の小さな確認を、ひとつの流れに。',
    room:'ENTRANCE', essential:['Lock Ultra'], recommended:['Hub 3'], upgrade:['Sensors']
  },
  {
    id:'coming-home', time:'18:30', eyebrow:'COMING HOME',
    title:'両手がふさがっていても、そのまま帰宅。',
    body:'玄関が開くと、家の中も「ただいま」の状態へ切り替わる。',
    room:'ENTRANCE → LIVING', essential:['Lock Ultra'], recommended:['Face Recognition Keypad','Hub 3'], upgrade:['Curtain 3','Smart Lighting']
  },
  {
    id:'good-night', time:'23:30', eyebrow:'GOOD NIGHT',
    title:'「おやすみ」で、家も眠る。',
    body:'照明、カーテン、玄関。眠る前の確認を、家に任せる。',
    room:'WHOLE HOME', essential:['Hub 3'], recommended:['Curtain 3','Lock Ultra'], upgrade:['Smart Lighting']
  }
];

export const rooms = [
  {id:'entrance', name:'玄関', copy:'手ぶら帰宅と外出モード', scenes:['leaving','coming-home']},
  {id:'living', name:'リビング', copy:'帰宅後の空間を自動で整える', scenes:['coming-home','good-night']},
  {id:'bedroom', name:'寝室', copy:'朝の光と夜の安心を自動化', scenes:['morning','good-night']},
  {id:'whole-home', name:'家全体', copy:'一日の流れをひとつにつなぐ', scenes:['morning','leaving','coming-home','good-night']}
];
