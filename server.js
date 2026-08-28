const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const allowedOrigin = process.env.CLIENT_URL || '*';
const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'el-osfoora' });
});
app.get('/vendor/phaser.min.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'node_modules', 'phaser', 'dist', 'phaser.min.js'));
});

// Serve reference images
app.use('/assets/refs', express.static(__dirname));

const PORT = process.env.PORT || 3000;

// Character definitions
const CHARACTERS = {
  bashmohandes: {
    id: 'bashmohandes',
    name: 'البشمهندس',
    title: 'مهندس السوفت وير',
    color: '#ff6600',
    speed: 200,
    specialMove: 'ديبريس الكود (Debug Beam)',
    specialDesc: 'ليزر كودي بيصلح السيرفر أو يفجر التارجت',
    taskSpecial: 'حل البجات اللي السيرفر مطلعها',
    physics: { speedMod: 1.0, bounce: 0.2, knockback: 1.0, noseHitbox: 0 }
  },
  pablo: {
    id: 'pablo',
    name: 'بابلو',
    title: 'جرافيك ديزاينر بريمو',
    color: '#3498db',
    speed: 180,
    specialMove: 'خبطة بالكرش / سحابة دخان',
    specialDesc: 'Belly Bump بيهز الماب وسحابة دخان سيجارة',
    taskSpecial: 'عدل البوستر لمقاس 1080x1080',
    physics: { speedMod: 0.9, bounce: 0.8, knockback: 1.8, noseHitbox: 0 }
  },
  samaool: {
    id: 'samaool',
    name: 'سمعول',
    title: 'ديزاينر وكوير هجومي',
    color: '#2ecc71',
    speed: 215,
    specialMove: 'شوطة الموزة (Design Kick)',
    specialDesc: 'كورة تلتف في الوش مع Hitbox مناخير ممتد',
    taskSpecial: 'فرّغ الخلفية بـ Pen Tool',
    physics: { speedMod: 1.08, bounce: 0.3, knockback: 1.1, noseHitbox: 18 }
  },
  musa: {
    id: 'musa',
    name: 'موسى',
    title: 'ماركتنج ليد وبطل الجيم',
    color: '#e67e22',
    speed: 195,
    specialMove: 'يافطة إعلانات في الوش',
    specialDesc: 'Advertising Blitz زقة غشيمة 2x Knockback',
    taskSpecial: 'شغّل حملة فيسبوك أدز قبل ما الميزانية تضيع',
    physics: { speedMod: 1.0, bounce: 0.4, knockback: 2.2, noseHitbox: 0 }
  },
  abdelmonem: {
    id: 'abdelmonem',
    name: 'منعم',
    title: 'أصغر ديزاينر في مصر',
    color: '#9b59b6',
    speed: 250,
    specialMove: 'جريت البكسلات (Pixel Dash)',
    specialDesc: 'سرعة البرق 1.25x مع وميض بكسلات',
    taskSpecial: 'اعمل Export للأيقونات بسرعة',
    physics: { speedMod: 1.25, bounce: 0.5, knockback: 0.8, noseHitbox: 0 }
  },
  shatlawi: {
    id: 'shatlawi',
    name: 'الشطلاوي',
    title: 'مبرمج ومونتير 4K',
    color: '#1abc9c',
    speed: 210,
    specialMove: 'قص التايم لاين (Timeline Slice)',
    specialDesc: 'ضربة مقصية ورشاقة لاعب حريف',
    taskSpecial: 'رندر الفيديو على 4K من غير كراش',
    physics: { speedMod: 1.05, bounce: 0.4, knockback: 1.2, noseHitbox: 0 }
  }
};

const BOT_NAMES = ['البشمهندس', 'بابلو', 'سمعول', 'موسى', 'منعم', 'الشطلاوي'];
const BOT_SLANG_CHAT = [
  'والله أنا كنت في البوفيه بعمل شاي بحليب!',
  'يا جماعة أنا شاكك في اللي كان بيجري ورا السيرفر!',
  'حد شاف مين قطع النور؟',
  'أنا لسه مخلص تاسك الراوتر ومكنتش جنب الجثة!',
  'والله العظيم مظلوم ومفيش غيري مخلص تاسكاته!',
  'سكيب يا جماعة مفيش دليل قاطع!',
  'ده كان طالع من فتحة التكييف قدام عيني!',
  'يا عم اطرده ده شكله هو المخرّب اللي هيلبسنا في الحيط!'
];

// Room state storage
const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function createRoom(hostId, hostName, characterId = 'bashmohandes') {
  const code = generateRoomCode();
  const room = {
    code,
    hostId,
    state: 'LOBBY', // LOBBY, PLAYING, MEETING, EJECTION, GAMEOVER
    players: new Map(),
    bodies: [],
    gameTimer: 600, // 10 minutes game duration (600 seconds)
    settings: {
      tasksCount: 7 // default 7 tasks per employee (options: 5, 7, 9, 12)
    },
    sabotage: {
      active: null, // 'lights', 'server', 'ac'
      timer: 0,
      fixedBy: []
    },
    tasksProgress: 0, // 0 to 100%
    totalTasksCount: 0,
    completedTasksCount: 0,
    emergencyCooldown: 0,
    meeting: {
      caller: null,
      reason: null, // 'EMERGENCY' or 'REPORT'
      deadBody: null,
      votes: new Map(),
      timer: 0,
      intervalId: null
    },
    gameLoopInterval: null
  };

  // Add host
  room.players.set(hostId, {
    id: hostId,
    socketId: hostId,
    name: hostName || 'البشمهندس',
    character: characterId,
    isBot: false,
    isHost: true,
    isAlive: true,
    role: null, // 'EMPLOYEE' or 'SABOTEUR'
    x: 400,
    y: 300,
    vx: 0,
    vy: 0,
    dir: 'right',
    tasks: [],
    killCooldown: 0,
    hasVoted: false
  });

  rooms.set(code, room);
  return room;
}

function getAvailableCharacter(room) {
  const taken = new Set(Array.from(room.players.values()).map(p => p.character));
  const allChars = Object.keys(CHARACTERS);
  for (const c of allChars) {
    if (!taken.has(c)) return c;
  }
  return allChars[Math.floor(Math.random() * allChars.length)];
}

function getSanitizedRoom(room) {
  return {
    code: room.code,
    hostId: room.hostId,
    state: room.state,
    gameTimer: room.gameTimer,
    settings: room.settings || { tasksCount: 7 },
    players: Array.from(room.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      character: p.character,
      isBot: p.isBot,
      isHost: p.isHost,
      isAlive: p.isAlive,
      x: p.x,
      y: p.y,
      vx: p.vx,
      vy: p.vy,
      dir: p.dir,
      role: room.state === 'GAMEOVER' ? p.role : undefined, // Hide role until game over
      hasVoted: p.hasVoted
    })),
    bodies: room.bodies,
    sabotage: room.sabotage,
    tasksProgress: room.tasksProgress,
    emergencyCooldown: room.emergencyCooldown
  };
}

// ================= EGYPTIAN MULTI-TIER TASK CATALOG =================
const TASK_CATALOG = {
  // Short Tasks (Single Step)
  short: [
    {
      id: 'card_swipe',
      stationId: 'card_swipe',
      name: 'تاسك كارت الدخول: بصمة الحضور',
      room: 'reception',
      roomName: 'الاستقبال',
      type: 'short',
      stage: 1,
      totalStages: 1
    },
    {
      id: 'hr_stamp',
      stationId: 'hr_stamp',
      name: 'تاسك أختام HR: اعتماد استمارة الإجازة',
      room: 'ceo',
      roomName: 'مكتب المدير',
      type: 'short',
      stage: 1,
      totalStages: 1
    },
    {
      id: 'trash_empty',
      stationId: 'trash_empty',
      name: 'تاسك المفرمة: تفريغ سلة الورق',
      room: 'hallway',
      roomName: 'الممر الرئيسي',
      type: 'short',
      stage: 1,
      totalStages: 1
    },
    {
      id: 'router',
      stationId: 'router',
      name: 'تاسك الراوتر: شيل الفيشة ورستر النت',
      room: 'servers',
      roomName: 'السيرفرات والـ IT',
      type: 'short',
      stage: 1,
      totalStages: 1
    },
    {
      id: 'water_cooler',
      stationId: 'water_cooler',
      name: 'تاسك الكولدير: ملء كوب مياه ساقعة',
      room: 'buffet',
      roomName: 'البوفيه',
      type: 'short',
      stage: 1,
      totalStages: 1
    },
    {
      id: 'air_conditioner',
      stationId: 'air_conditioner',
      name: 'تاسك التكييف: ضبط الريموت على 24°C',
      room: 'hallway',
      roomName: 'الممر الرئيسي',
      type: 'short',
      stage: 1,
      totalStages: 1
    },
    {
      id: 'sanitize_hands',
      stationId: 'sanitize_hands',
      name: 'تاسك التعقيم: كحول الجل 3 ضغطات',
      room: 'reception',
      roomName: 'الاستقبال',
      type: 'short',
      stage: 1,
      totalStages: 1
    },
    {
      id: 'light_switch',
      stationId: 'light_switch',
      name: 'تاسك النجفة: تشغيل مفاتيح إضاءة الممر',
      room: 'hallway',
      roomName: 'الممر الرئيسي',
      type: 'short',
      stage: 1,
      totalStages: 1
    }
  ],

  // Medium Tasks (Focused Minigames)
  medium: [
    {
      id: 'wires',
      stationId: 'wires',
      name: 'تاسك السويتش: توصيل كابلات الشبكة',
      room: 'servers',
      roomName: 'السيرفرات والـ IT',
      type: 'medium',
      stage: 1,
      totalStages: 1
    },
    {
      id: 'printer_jam',
      stationId: 'printer_jam',
      name: 'تاسك البرنتر: تسليك الورقة المحشورة',
      room: 'reception',
      roomName: 'الاستقبال',
      type: 'medium',
      stage: 1,
      totalStages: 1
    },
    {
      id: 'budget',
      stationId: 'budget',
      name: 'تاسك الميزانية: عد فلوس العهدة والفاتورة',
      room: 'marketing',
      roomName: 'الماركتنج والميزانية',
      type: 'medium',
      stage: 1,
      totalStages: 1
    },
    {
      id: 'bugs',
      stationId: 'bugs',
      name: 'تاسك البجات: صيد حشرات الكود',
      room: 'servers',
      roomName: 'السيرفرات والـ IT',
      type: 'medium',
      stage: 1,
      totalStages: 1
    },
    {
      id: 'coffee',
      stationId: 'coffee',
      name: 'تاسك القهوة: اظبط السكر والبن واقفل الكنكة',
      room: 'buffet',
      roomName: 'البوفيه',
      type: 'medium',
      stage: 1,
      totalStages: 1
    },
    {
      id: 'stapler',
      stationId: 'stapler',
      name: 'تاسك الدباسة: تدبيس أوراق العقد المهم',
      room: 'ceo',
      roomName: 'مكتب المدير',
      type: 'medium',
      stage: 1,
      totalStages: 1
    },
    {
      id: 'sticky_notes',
      stationId: 'sticky_notes',
      name: 'تاسك لوحة المهام: تنظيم ستيكي نوتس الشغل',
      room: 'design',
      roomName: 'قسم الديزاين',
      type: 'medium',
      stage: 1,
      totalStages: 1
    },
    {
      id: 'shred_secrets',
      stationId: 'shred_secrets',
      name: 'تاسك السرية: فرم مستندات زيادة المرتبات',
      room: 'ceo',
      roomName: 'مكتب المدير',
      type: 'medium',
      stage: 1,
      totalStages: 1
    }
  ],

  // Long Multi-Stage Tasks (2 Stages across distinct rooms)
  long: [
    {
      id: 'backup_data',
      stationId: 'backup_download',
      name: 'تاسك الباك-أب: تحميل داتا السيرفر (1/2)',
      room: 'servers',
      roomName: 'السيرفرات والـ IT',
      type: 'long',
      stage: 1,
      totalStages: 2,
      stages: [
        {
          stage: 1,
          stationId: 'backup_download',
          name: 'تاسك الباك-أب: تحميل داتا السيرفر (1/2)',
          room: 'servers',
          roomName: 'السيرفرات والـ IT'
        },
        {
          stage: 2,
          stationId: 'data_upload',
          name: 'تاسك الباك-أب: رفع الداتا على لابتوب العميل (2/2)',
          room: 'meeting',
          roomName: 'قاعة الاجتماعات'
        }
      ]
    },
    {
      id: 'tea_delivery',
      stationId: 'tea_buffet',
      name: 'تاسك ضيافة الاجتماع: صب الشاي المظبوط (1/2)',
      room: 'buffet',
      roomName: 'البوفيه',
      type: 'long',
      stage: 1,
      totalStages: 2,
      stages: [
        {
          stage: 1,
          stationId: 'tea_buffet',
          name: 'تاسك ضيافة الاجتماع: صب الشاي المظبوط (1/2)',
          room: 'buffet',
          roomName: 'البوفيه'
        },
        {
          stage: 2,
          stationId: 'deliver_tea',
          name: 'تاسك ضيافة الاجتماع: تقديم صينية الشاي (2/2)',
          room: 'meeting',
          roomName: 'قاعة الاجتماعات'
        }
      ]
    },
    {
      id: 'invoice_approval',
      stationId: 'invoice_start',
      name: 'تاسك الفاتورة: استخراج فاتورة المصاريف (1/2)',
      room: 'marketing',
      roomName: 'الماركتنج والميزانية',
      type: 'long',
      stage: 1,
      totalStages: 2,
      stages: [
        {
          stage: 1,
          stationId: 'invoice_start',
          name: 'تاسك الفاتورة: استخراج فاتورة المصاريف (1/2)',
          room: 'marketing',
          roomName: 'الماركتنج والميزانية'
        },
        {
          stage: 2,
          stationId: 'invoice_ceo',
          name: 'تاسك الفاتورة: توقيع الشيك واعتماده من المدير (2/2)',
          room: 'ceo',
          roomName: 'مكتب المدير'
        }
      ]
    },
    {
      id: 'fix_projector',
      stationId: 'projector_cable',
      name: 'تاسك العرض: أخذ كابل HDMI من السيرفرات (1/2)',
      room: 'servers',
      roomName: 'السيرفرات والـ IT',
      type: 'long',
      stage: 1,
      totalStages: 2,
      stages: [
        {
          stage: 1,
          stationId: 'projector_cable',
          name: 'تاسك العرض: أخذ كابل HDMI من السيرفرات (1/2)',
          room: 'servers',
          roomName: 'السيرفرات والـ IT'
        },
        {
          stage: 2,
          stationId: 'projector_screen',
          name: 'تاسك العرض: تشغيل بروجيكتور الاجتماع (2/2)',
          room: 'meeting',
          roomName: 'قاعة الاجتماعات'
        }
      ]
    },
    {
      id: 'order_koshary',
      stationId: 'koshary_pickup',
      name: 'تاسك الغداء: استلام علب الكشري من الدليفري (1/2)',
      room: 'reception',
      roomName: 'الاستقبال',
      type: 'long',
      stage: 1,
      totalStages: 2,
      stages: [
        {
          stage: 1,
          stationId: 'koshary_pickup',
          name: 'تاسك الغداء: استلام علب الكشري من الدليفري (1/2)',
          room: 'reception',
          roomName: 'الاستقبال'
        },
        {
          stage: 2,
          stationId: 'koshary_distribute',
          name: 'تاسك الغداء: توزيع الكشري والشطة في البوفيه (2/2)',
          room: 'buffet',
          roomName: 'البوفيه'
        }
      ]
    }
  ]
};

function generatePlayerTasks(characterId, tasksCount = 7, usageTracker = null) {
  const count = Number(tasksCount) || 7;

  let numShort = 2, numMed = 3, numLong = 1;
  if (count <= 5) {
    numShort = 2; numMed = 2; numLong = 0;
  } else if (count === 7) {
    numShort = 2; numMed = 3; numLong = 1;
  } else if (count === 9) {
    numShort = 3; numMed = 3; numLong = 2;
  } else if (count >= 12) {
    numShort = 4; numMed = 4; numLong = 3;
  }

  // Unique distribution picker: picks the least frequently assigned tasks first!
  const pickDistinct = (catalogList, neededCount, tierKey) => {
    const list = [...catalogList];
    list.sort((a, b) => {
      const countA = usageTracker ? (usageTracker[tierKey]?.[a.id] || 0) : 0;
      const countB = usageTracker ? (usageTracker[tierKey]?.[b.id] || 0) : 0;
      if (countA !== countB) return countA - countB;
      return Math.random() - 0.5;
    });

    const chosen = list.slice(0, neededCount);
    if (usageTracker && usageTracker[tierKey]) {
      chosen.forEach(item => {
        usageTracker[tierKey][item.id] = (usageTracker[tierKey][item.id] || 0) + 1;
      });
    }
    return chosen;
  };

  const selectedTasks = [];

  // 1. Short tasks
  const chosenShort = pickDistinct(TASK_CATALOG.short, numShort, 'short');
  chosenShort.forEach(t => selectedTasks.push({ ...t, completed: false }));

  // 2. Medium tasks
  const chosenMed = pickDistinct(TASK_CATALOG.medium, numMed, 'medium');
  chosenMed.forEach(t => selectedTasks.push({ ...t, completed: false }));

  // 3. Long tasks
  const chosenLong = pickDistinct(TASK_CATALOG.long, numLong, 'long');
  chosenLong.forEach(orig => {
    selectedTasks.push({
      ...orig,
      stage: 1,
      totalStages: orig.totalStages,
      stages: orig.stages.map(s => ({ ...s })),
      completed: false
    });
  });

  // 4. Character Special Task (Always 1 per employee)
  const specialTaskName = CHARACTERS[characterId]?.taskSpecial || 'إنجاز تاسك الديدلاين الخاص';
  const specialRoom = (characterId === 'bashmohandes' || characterId === 'shatlawi') ? 'servers'
    : (characterId === 'musa') ? 'marketing'
    : (characterId === 'buffet' ? 'buffet' : 'design');

  const specialTask = {
    id: `special_${characterId}`,
    stationId: `special_${characterId}`,
    name: specialTaskName,
    room: specialRoom,
    roomName: specialRoom === 'servers' ? 'السيرفرات والـ IT' : specialRoom === 'marketing' ? 'الماركتنج والميزانية' : 'قسم الديزاين',
    type: 'special',
    stage: 1,
    totalStages: 1,
    completed: false
  };

  selectedTasks.push(specialTask);
  return selectedTasks;
}

function startGame(room) {
  room.state = 'PLAYING';
  room.bodies = [];
  room.tasksProgress = 0;
  room.completedTasksCount = 0;
  room.gameTimer = 600; // 10 minutes total game timer (600s)
  room.sabotage = { active: null, timer: 0, fixedBy: [] };
  room.dualKeyState = { breakerA: null, breakerB: null, timeout: null };

  const playerList = Array.from(room.players.values());
  const saboteurCount = Math.max(1, Math.floor(playerList.length / 5));
  const tasksCount = room.settings?.tasksCount || 7;

  // Shared usage tracker ensuring each employee gets different tasks across the office
  const taskUsageTracker = {
    short: {},
    medium: {},
    long: {}
  };

  // Randomly assign saboteur(s)
  const shuffled = [...playerList].sort(() => Math.random() - 0.5);
  shuffled.forEach((p, idx) => {
    p.isAlive = true;
    p.hasVoted = false;
    p.killCooldown = 15; // Initial cooldown
    p.x = 400 + (idx % 3) * 60 - 60;
    p.y = 300 + Math.floor(idx / 3) * 60 - 30;

    if (idx < saboteurCount) {
      p.role = 'SABOTEUR'; // المخرّب / العميل
      p.tasks = []; // Saboteur fakes tasks
    } else {
      p.role = 'EMPLOYEE'; // موظف غلبان
      p.tasks = generatePlayerTasks(p.character, tasksCount, taskUsageTracker);
    }
  });

  // Send role info to each player privately
  playerList.forEach(p => {
    if (!p.isBot) {
      io.to(p.socketId).emit('game_started', {
        role: p.role,
        character: p.character,
        tasks: p.tasks,
        isSaboteur: p.role === 'SABOTEUR',
        saboteurs: p.role === 'SABOTEUR' ? playerList.filter(x => x.role === 'SABOTEUR').map(x => x.name) : [],
        gameTimer: room.gameTimer
      });
    } else {
      p.aiState = 'IDLE';
      p.actionTimer = 0;
      p.memory = { sawKills: [], sawBodies: [], trusted: [], lastAccused: null };
    }
  });

  // Send an authoritative snapshot before clients build their Phaser scenes.
  io.to(room.code).emit('room_updated', getSanitizedRoom(room));

  // Start tick
  if (room.gameLoopInterval) clearInterval(room.gameLoopInterval);
  room.gameLoopInterval = setInterval(() => {
    updateRoomLoop(room);
  }, 1000);
}

function updateRoomLoop(room) {
  if (room.state !== 'PLAYING' && room.state !== 'MEETING') return;

  // 1. Game 10-Minute Deadline Countdown
  if (room.gameTimer > 0) {
    room.gameTimer--;
    const minutes = Math.floor(room.gameTimer / 60);
    const seconds = room.gameTimer % 60;
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    io.to(room.code).emit('game_timer_tick', {
      timer: room.gameTimer,
      formatted: formatted
    });

    if (room.gameTimer <= 0) {
      endGame(room, 'SABOTEUR', 'انتهى ديدلاين المشروع (10 دقائق) والشركة ملحقتش تسلم الشغل للعميل! العميل لغى التعاقد وفلست الشركة! ⏰🔥');
      return;
    }
  }

  // Sabotage timer check
  if (room.sabotage.active === 'server') {
    room.sabotage.timer--;
    if (room.sabotage.timer <= 0) {
      // Saboteur wins by critical server meltdown
      endGame(room, 'SABOTEUR', 'انفجر السيرفر وضاعت داتا الشركة بالكامل! المخرّب انتصر!');
      return;
    }
    io.to(room.code).emit('sabotage_tick', {
      type: 'server',
      timer: room.sabotage.timer
    });
  }

  // Update kill cooldowns & bot behaviors
  const players = Array.from(room.players.values());
  players.forEach(p => {
    if (p.role === 'SABOTEUR' && p.killCooldown > 0) {
      p.killCooldown--;
    }

    // Bot AI simulation
    if (p.isBot && p.isAlive && room.state === 'PLAYING') {
      updateBotAI(room, p);
    }
  });

  // Check victory conditions
  checkWinConditions(room);
}

// ================= MAP DATA & BOT NAVIGATION WAYPOINTS =================
const MAP_TASK_COORDINATES = {
  card_swipe: { x: 140, y: 150, room: 'الاستقبال' },
  hr_stamp: { x: 1180, y: 180, room: 'مكتب المدير' },
  trash_empty: { x: 520, y: 390, room: 'الممر الرئيسي' },
  router: { x: 120, y: 580, room: 'أوضة السيرفرات' },
  water_cooler: { x: 1280, y: 580, room: 'البوفيه' },
  air_conditioner: { x: 880, y: 390, room: 'الممر الرئيسي' },
  sanitize_hands: { x: 200, y: 240, room: 'الاستقبال' },
  light_switch: { x: 350, y: 390, room: 'الممر الرئيسي' },
  wires: { x: 260, y: 640, room: 'أوضة السيرفرات' },
  printer_jam: { x: 300, y: 180, room: 'الاستقبال' },
  budget: { x: 920, y: 720, room: 'قسم الماركتنج' },
  bugs: { x: 320, y: 840, room: 'أوضة السيرفرات' },
  coffee: { x: 1220, y: 680, room: 'البوفيه', isVisual: 'coffee_steam' },
  stapler: { x: 1090, y: 140, room: 'مكتب المدير' },
  sticky_notes: { x: 620, y: 570, room: 'قسم الديزاين' },
  shred_secrets: { x: 1280, y: 240, room: 'مكتب المدير' },
  backup_download: { x: 150, y: 690, room: 'أوضة السيرفرات' },
  data_upload: { x: 880, y: 180, room: 'قاعة الاجتماعات' },
  tea_buffet: { x: 1140, y: 760, room: 'البوفيه' },
  deliver_tea: { x: 500, y: 220, room: 'قاعة الاجتماعات' },
  invoice_start: { x: 820, y: 800, room: 'قسم الماركتنج' },
  invoice_ceo: { x: 1240, y: 120, room: 'مكتب المدير' },
  projector_cable: { x: 250, y: 790, room: 'أوضة السيرفرات' },
  projector_screen: { x: 680, y: 110, room: 'قاعة الاجتماعات' },
  koshary_pickup: { x: 80, y: 220, room: 'الاستقبال' },
  koshary_distribute: { x: 1160, y: 840, room: 'البوفيه' },
  dual_breaker_a: { x: 310, y: 710, room: 'أوضة السيرفرات' },
  dual_breaker_b: { x: 120, y: 90, room: 'الاستقبال' },
  special_bashmohandes: { x: 260, y: 550, room: 'أوضة السيرفرات', isVisual: 'server_glow' },
  special_pablo: { x: 500, y: 620, room: 'قسم الديزاين' },
  special_samaool: { x: 650, y: 750, room: 'قسم الديزاين' },
  special_musa: { x: 840, y: 600, room: 'قسم الماركتنج' },
  special_abdelmonem: { x: 580, y: 820, room: 'قسم الديزاين' },
  special_shatlawi: { x: 130, y: 850, room: 'أوضة السيرفرات' }
};

const MAP_VENTS = [
  { id: 'vent_meeting', x: 470, y: 90, connectsTo: ['vent_servers', 'vent_buffet'] },
  { id: 'vent_servers', x: 90, y: 550, connectsTo: ['vent_meeting', 'vent_ceo'] },
  { id: 'vent_ceo', x: 1290, y: 90, connectsTo: ['vent_servers', 'vent_buffet'] },
  { id: 'vent_buffet', x: 1300, y: 840, connectsTo: ['vent_meeting', 'vent_ceo'] }
];

function getRoomNameAt(x, y) {
  if (y < 330) {
    if (x < 380) return 'الاستقبال';
    if (x > 1000) return 'مكتب المدير';
    return 'قاعة الاجتماعات';
  } else if (y <= 480) {
    return 'الممر الرئيسي';
  } else {
    if (x < 420) return 'أوضة السيرفرات والـ IT';
    if (x < 760) return 'قسم الديزاين';
    if (x < 1060) return 'قسم الماركتنج';
    return 'البوفيه';
  }
}

// Hallway-aware smart movement
function moveBotTowards(room, bot, targetX, targetY, speed = 120) {
  let intermediateX = targetX;
  let intermediateY = targetY;

  const currentZone = bot.y < 340 ? 'TOP' : (bot.y > 480 ? 'BOTTOM' : 'HALL');
  const targetZone = targetY < 340 ? 'TOP' : (targetY > 480 ? 'BOTTOM' : 'HALL');

  // If crossing between top rooms and bottom rooms, route through central hallway (y=410)
  if (currentZone === 'TOP' && targetZone === 'BOTTOM') {
    if (bot.y < 370) {
      intermediateX = bot.x;
      intermediateY = 410;
    }
  } else if (currentZone === 'BOTTOM' && targetZone === 'TOP') {
    if (bot.y > 450) {
      intermediateX = bot.x;
      intermediateY = 410;
    }
  }

  const dx = intermediateX - bot.x;
  const dy = intermediateY - bot.y;
  const dist = Math.hypot(dx, dy);

  if (dist > 6) {
    const step = Math.min(dist, speed);
    const vx = (dx / dist) * step;
    const vy = (dy / dist) * step;
    bot.x += vx;
    bot.y += vy;
    bot.dir = dx >= 0 ? 'right' : 'left';

    io.to(room.code).emit('player_moved', {
      id: bot.id,
      x: Math.round(bot.x),
      y: Math.round(bot.y),
      vx: Math.round(vx),
      vy: Math.round(vy),
      dir: bot.dir
    });
  }
}

// ================= SMART BOT AI LOOP =================
function updateBotAI(room, bot) {
  if (!bot.isAlive || room.state !== 'PLAYING') return;

  // Initialize bot memory & AI state if missing
  if (!bot.memory) {
    bot.memory = { sawKills: [], sawBodies: [], trusted: [], lastAccused: null };
  }
  if (!bot.aiState) bot.aiState = 'IDLE';

  // 1. VISION CHECK: Detect un-reported Dead Bodies nearby (< 130px)
  if (room.bodies && room.bodies.length > 0) {
    for (const body of room.bodies) {
      const dist = Math.hypot(bot.x - body.x, bot.y - body.y);
      if (dist < 130) {
        // Bot spotted a body! Trigger emergency meeting
        startEmergencyMeeting(room, bot, 'REPORT', body);
        return;
      }
    }
  }

  // 2. EMPLOYEE BOT AI
  if (bot.role === 'EMPLOYEE') {
    // Priority A: If witnessed a kill, panic and run to emergency button table (700, 210)!
    if (bot.memory.sawKills.length > 0) {
      const distToButton = Math.hypot(bot.x - 700, bot.y - 210);
      if (distToButton < 50) {
        startEmergencyMeeting(room, bot, 'EMERGENCY');
        return;
      } else {
        moveBotTowards(room, bot, 700, 210, 150);
        return;
      }
    }

    // Priority B: If a Sabotage is active, go fix it!
    if (room.sabotage.active) {
      let targetConsole = { x: 700, y: 410 }; // lights
      if (room.sabotage.active === 'server') targetConsole = { x: 230, y: 850 };
      if (room.sabotage.active === 'ac') targetConsole = { x: 1200, y: 410 };

      const dist = Math.hypot(bot.x - targetConsole.x, bot.y - targetConsole.y);
      if (dist < 50) {
        // Fix sabotage
        room.sabotage = { active: null, timer: 0, fixedBy: [] };
        io.to(room.code).emit('sabotage_fixed', { fixedBy: bot.name });
        io.to(room.code).emit('chat_message', {
          senderId: bot.id,
          senderName: bot.name,
          character: bot.character,
          text: '🔧 صلحت العطل يا شباب، كملوا تاسكاتكم!'
        });
        return;
      } else {
        moveBotTowards(room, bot, targetConsole.x, targetConsole.y, 140);
        return;
      }
    }

    // Priority C: Task Seeking & Working
    if (bot.aiState === 'WORKING') {
      bot.actionTimer = (bot.actionTimer || 3) - 1;
      if (bot.actionTimer <= 0) {
        // Complete current task stage or task
        const currentTask = bot.tasks?.find(t => t.id === bot.currentTargetStationId || !t.completed);
        if (currentTask) {
          if (currentTask.totalStages > 1 && currentTask.stage < currentTask.totalStages) {
            currentTask.stage++;
            const nextStage = currentTask.stages[currentTask.stage - 1];
            currentTask.name = nextStage.name;
            currentTask.stationId = nextStage.stationId;
            currentTask.room = nextStage.room;
            currentTask.roomName = nextStage.roomName;
          } else {
            currentTask.completed = true;
            room.completedTasksCount++;
            room.tasksProgress = Math.min(100, Math.round((room.completedTasksCount / Math.max(1, room.totalTasksCount)) * 100));
            io.to(room.code).emit('tasks_updated', { progress: room.tasksProgress });

            // If visual task, emit visual FX so humans witness innocence!
            const stationData = MAP_TASK_COORDINATES[currentTask.stationId];
            if (stationData && stationData.isVisual) {
              io.to(room.code).emit('visual_task_triggered', {
                playerId: bot.id,
                playerName: bot.name,
                taskType: stationData.isVisual,
                x: bot.x,
                y: bot.y
              });
            }
          }
        }
        bot.aiState = 'IDLE';
        bot.currentTargetStationId = null;
      }
      return;
    }

    // Seeking next task
    const uncompleted = bot.tasks?.filter(t => !t.completed) || [];
    if (uncompleted.length > 0) {
      const nextTask = uncompleted[0];
      bot.currentTargetStationId = nextTask.stationId;
      const targetCoords = MAP_TASK_COORDINATES[nextTask.stationId] || { x: 500, y: 400 };

      const dist = Math.hypot(bot.x - targetCoords.x, bot.y - targetCoords.y);
      if (dist < 45) {
        bot.aiState = 'WORKING';
        bot.actionTimer = Math.floor(Math.random() * 3) + 3; // 3 to 5 seconds
      } else {
        moveBotTowards(room, bot, targetCoords.x, targetCoords.y, 110);
      }
    } else {
      // All tasks done: wander politely between rooms
      if (Math.random() < 0.2) {
        const randomStations = Object.values(MAP_TASK_COORDINATES);
        const rand = randomStations[Math.floor(Math.random() * randomStations.length)];
        moveBotTowards(room, bot, rand.x, rand.y, 90);
      }
    }
  }

  // 3. SABOTEUR BOT AI (Sneaky Stalking, Isolated Kills, Venting & Faking)
  else if (bot.role === 'SABOTEUR') {
    // A: Look for isolated victim if kill cooldown is ready
    if (bot.killCooldown <= 0) {
      const livingEmployees = Array.from(room.players.values()).filter(p => p.isAlive && p.id !== bot.id && p.role !== 'SABOTEUR');
      
      // Find victim with fewest witnesses
      let bestVictim = null;
      let minWitnesses = 999;

      for (const emp of livingEmployees) {
        const witnesses = livingEmployees.filter(other => other.id !== emp.id && Math.hypot(other.x - emp.x, other.y - emp.y) < 220);
        if (witnesses.length < minWitnesses) {
          minWitnesses = witnesses.length;
          bestVictim = emp;
        }
      }

      if (bestVictim) {
        const dist = Math.hypot(bot.x - bestVictim.x, bot.y - bestVictim.y);
        if (dist < 65) {
          // Execute isolated kill!
          executeKill(room, bot, bestVictim);

          // Vent away to escape!
          const nearestVent = MAP_VENTS.find(v => Math.hypot(bot.x - v.x, bot.y - v.y) < 220);
          if (nearestVent) {
            const destVentId = nearestVent.connectsTo[Math.floor(Math.random() * nearestVent.connectsTo.length)];
            const dest = MAP_VENTS.find(v => v.id === destVentId);
            if (dest) {
              bot.x = dest.x;
              bot.y = dest.y;
              io.to(room.code).emit('player_moved', { id: bot.id, x: bot.x, y: bot.y, vx: 0, vy: 0, dir: bot.dir });
            }
          }
          return;
        } else {
          // Stalk victim
          moveBotTowards(room, bot, bestVictim.x, bestVictim.y, 130);
          return;
        }
      }
    }

    // B: If on cooldown or no isolated targets, fake tasks & occasionally trigger sabotage
    if (Math.random() < 0.08 && !room.sabotage.active) {
      // Trigger random sabotage
      const types = ['lights', 'server', 'ac'];
      const sabType = types[Math.floor(Math.random() * types.length)];
      triggerSabotage(room, sabType);
    }

    // Fake task navigation
    if (!bot.targetStation || Math.random() < 0.05) {
      const keys = Object.keys(MAP_TASK_COORDINATES);
      bot.targetStation = keys[Math.floor(Math.random() * keys.length)];
    }
    const coords = MAP_TASK_COORDINATES[bot.targetStation];
    if (coords) {
      const dist = Math.hypot(bot.x - coords.x, bot.y - coords.y);
      if (dist > 45) {
        moveBotTowards(room, bot, coords.x, coords.y, 95);
      }
    }
  }
}

function triggerSabotage(room, type) {
  if (room.sabotage.active || room.state !== 'PLAYING') return;

  room.sabotage.active = type;
  room.sabotage.fixedBy = [];

  let desc = 'عطل في شبكة الإضاءة والكهرباء!';
  if (type === 'server') {
    room.sabotage.timer = 40;
    desc = '⚠️ انهيار في سيرفر الشركة الرئيسي! أصلح السيرفر قبل 40 ثانية وإلا ستفلس الشركة!';
  } else if (type === 'ac') {
    desc = '❄️ عطل في التكييف المركزي! حرارة المكتب أبطأت حركة الموظفين 40%!';
  }

  io.to(room.code).emit('sabotage_triggered', {
    type: type,
    desc: desc,
    timer: room.sabotage.timer
  });
}

function executeKill(room, killer, victim) {
  victim.isAlive = false;
  killer.killCooldown = 25;

  const deadBody = {
    id: `body_${victim.id}_${Date.now()}`,
    victimId: victim.id,
    victimName: victim.name,
    character: victim.character,
    x: victim.x,
    y: victim.y
  };
  room.bodies.push(deadBody);

  const killerChar = CHARACTERS[killer.character];

  io.to(room.code).emit('player_killed', {
    killerId: killer.id,
    killerName: killer.name,
    killerCharacter: killer.character,
    specialMove: killerChar ? killerChar.specialMove : 'شحّور الموظف!',
    victimId: victim.id,
    victimName: victim.name,
    deadBody: deadBody
  });

  // Check if any nearby living employee saw the kill!
  const killerRoom = getRoomNameAt(deadBody.x, deadBody.y);
  room.players.forEach(p => {
    if (p.isAlive && p.id !== killer.id && p.id !== victim.id && p.role === 'EMPLOYEE') {
      const dist = Math.hypot(p.x - deadBody.x, p.y - deadBody.y);
      if (dist < 240) {
        if (!p.memory) p.memory = { sawKills: [], sawBodies: [], trusted: [], lastAccused: null };
        p.memory.sawKills.push({
          killerId: killer.id,
          killerName: killer.name,
          victimName: victim.name,
          roomName: killerRoom
        });
      }
    }
  });

  io.to(room.code).emit('room_updated', getSanitizedRoom(room));
  checkWinConditions(room);
}

function checkWinConditions(room) {
  if (room.state !== 'PLAYING' && room.state !== 'MEETING') return;

  // 0. Project Deadline Expired (10 Minutes)
  if (room.gameTimer <= 0) {
    endGame(room, 'SABOTEUR', 'انتهى ديدلاين المشروع (10 دقائق) والشركة ملحقتش تسلم الشغل للعميل! العميل لغى التعاقد وفلست الشركة! ⏰🔥');
    return;
  }

  const players = Array.from(room.players.values());
  const livingEmployees = players.filter(p => p.isAlive && p.role === 'EMPLOYEE');
  const livingSaboteurs = players.filter(p => p.isAlive && p.role === 'SABOTEUR');

  // 1. All Saboteurs Dead / Ejected
  if (livingSaboteurs.length === 0) {
    endGame(room, 'EMPLOYEES', 'الشركة سلمت البروجكت والعميل دفع! تم كشف وطرد كل المخرّبين! 🎉💼');
    return;
  }

  // In a 1v1 round, keep the game active until someone completes tasks or dies.
  const isOneVsOne = players.length === 2;
  if (livingEmployees.length === 0 || (!isOneVsOne && livingSaboteurs.length >= livingEmployees.length)) {
    endGame(room, 'SABOTEUR', 'الشركة فلست والمخرّب ضحك عليكم! سيطر المخرّبون على الشركة بالكامل! 😈🔥');
    return;
  }

  // 3. All Tasks Completed
  if (room.tasksProgress >= 100) {
    endGame(room, 'EMPLOYEES', 'الشركة سلمت البروجكت والعميل دفع! تم إنجاز كل التاسكات قبل الديدلاين! 🚀');
    return;
  }
}

// ================= DYNAMIC BOT MEETING DISCUSSIONS & REASONING =================
function generateBotMeetingChat(room, bot) {
  const charId = bot.character || 'bashmohandes';
  const isSaboteur = bot.role === 'SABOTEUR';
  const botRoom = getRoomNameAt(bot.x, bot.y);

  // 1. If bot saw a kill: 100% explosive accusation
  if (bot.memory && bot.memory.sawKills && bot.memory.sawKills.length > 0) {
    const kill = bot.memory.sawKills[0];
    return `🚨 يا جدعان أقسم بالله أنا شوفت [${kill.killerName}] بيشحور [${kill.victimName}] في [${kill.roomName}] قدام عيني! صوّتوا عليه وخلصونا!`;
  }

  // 2. If bot reported the body:
  if (room.meeting.reason === 'REPORT' && room.meeting.deadBody && room.meeting.caller === bot.name) {
    const bodyRoom = getRoomNameAt(room.meeting.deadBody.x, room.meeting.deadBody.y);
    return `😱 أنا دخلت [${bodyRoom}] لقيت جثة [${room.meeting.deadBody.victimName}] مرمية على الأرض! مين اللي كان قريب من هناك؟`;
  }

  // 3. If someone is accusing a trusted friend who did visual task:
  if (bot.memory && bot.memory.trusted && bot.memory.trusted.length > 0) {
    const trustedId = bot.memory.trusted[0];
    const trustedPlayer = room.players.get(trustedId);
    if (trustedPlayer && Math.random() < 0.5) {
      return `✨ يا جماعة [${trustedPlayer.name}] بريء 100% وموظف شريف، أنا شفته بعيني بيعمل تاسك بصري والبخار والأنوار طلعت!`;
    }
  }

  // 4. If bot is Saboteur defending or deflecting:
  if (isSaboteur) {
    const alibiRooms = ['البوفيه', 'الاستقبال', 'قسم الماركتنج', 'قسم الديزاين', 'مكتب المدير'];
    const fakeRoom = alibiRooms[Math.floor(Math.random() * alibiRooms.length)];
    const excuses = [
      `والله العظيم مظلوم ومفتريين! أنا كنت في [${fakeRoom}] مخلص تاسكاتي ومشوفتش حد!`,
      `يا جماعة هترموا التهمة عليا والديدلاين هيضيع والشركة هتفلس؟ ركزوا في اللي بيجري!`,
      `أنا لسه مصلح السيرفر ومكنتش هناك خالص! اسألوا الناس اللي كانت معايا!`
    ];
    return excuses[Math.floor(Math.random() * excuses.length)];
  }

  // 5. Personality Slang:
  const personalityLines = {
    bashmohandes: [
      `اللوجز عندي واضحة والسيرفر رصد حركة مريبة في ${botRoom}!`,
      `يا جماعة بلاش تصويت عشوائي، مين معاه إثبات أو شاف حد بيجري؟`,
      `أنا كنت متبّع الكود والتاسكات مظبوطة، مين اللي مخلصش ديدلاينه؟`
    ],
    pablo: [
      `يا جدعان مش وقت هري، العميل مستني البوستر 1080x1080 وأنا عيني طلعت في الديزاين!`,
      `أنا شوفت حد بيتحرك بسرعة جهة السيرفرات وكان مريب جداً!`,
      `هنصوّت على مين ونخلص عشان ألحق أسلّم الشغل؟`
    ],
    samaool: [
      `حاستي السادسة ومناخيري شامين ريحة خيانة مش مريحة في ${botRoom}!`,
      `أنا مفرّغ خلفية اللوجو بـ Pen Tool على الفرازة، وعيني على كل الموظفين!`,
      `اللي مبيعملش تاسكات هو المخرّب، باينة زي الشمس!`
    ],
    musa: [
      `أنا باصم بالعشرة إنه المخرّب، ارموه بره الشركة وأنا المسؤول عن تارجت المبيعات!`,
      `الحملة الإعلانية شغالة بـ 50 ألف وصول ومش هسمح لعميل يبوّظ مجهودنا!`,
      `صوّتوا عليه بسرعة خلينا نلحق الوقت!`
    ],
    abdelmonem: [
      `أنا أصغر واحد في التيم وغلبان، والله كنت بصدّر أيقونات الـ SVG في أمان الله!`,
      `يا باشا أنا شوفت حركة سريعة في الممر بس لحقت نفسي وجريت!`,
      `سكيب يا جماعة عشان منلبسش حد مظلوم!`
    ],
    shatlawi: [
      `يا جماعة سيبوني ألحق رندر الفيديو 4K قبل ما أموت! البريمير بيهنج!`,
      `أنا كنت في أوضة المونتاج مركز في التايم لاين ومشوفتش حاجة!`,
      `مين اللي قطع النور وعطّل الرندر يا جدعان؟`
    ]
  };

  const list = personalityLines[charId] || personalityLines.bashmohandes;
  return list[Math.floor(Math.random() * list.length)];
}

function getBotVoteTarget(room, bot) {
  // 1. If saw a kill: 100% vote for killer
  if (bot.memory && bot.memory.sawKills && bot.memory.sawKills.length > 0) {
    const killerId = bot.memory.sawKills[0].killerId;
    const killer = room.players.get(killerId);
    if (killer && killer.isAlive) {
      return killerId;
    }
  }

  // 2. If bot is Saboteur: vote for living employee or skip
  if (bot.role === 'SABOTEUR') {
    const livingEmployees = Array.from(room.players.values()).filter(p => p.isAlive && p.id !== bot.id && p.role !== 'SABOTEUR');
    if (livingEmployees.length > 0 && Math.random() < 0.75) {
      return livingEmployees[Math.floor(Math.random() * livingEmployees.length)].id;
    }
    return 'SKIP';
  }

  // 3. If bot is employee without direct witness: never vote for trusted players
  const suspectCandidates = Array.from(room.players.values()).filter(p => {
    return p.isAlive && p.id !== bot.id && (!bot.memory || !bot.memory.trusted || !bot.memory.trusted.includes(p.id));
  });

  if (suspectCandidates.length > 0 && Math.random() < 0.65) {
    return suspectCandidates[Math.floor(Math.random() * suspectCandidates.length)].id;
  }
  return 'SKIP';
}

function startEmergencyMeeting(room, caller, reason, deadBody = null) {
  if (room.state === 'MEETING' || room.state === 'EJECTION' || room.state === 'GAMEOVER') return;

  room.state = 'MEETING';
  room.sabotage = { active: null, timer: 0, fixedBy: [] }; // Clear sabotage on meeting

  // Reset votes
  room.players.forEach(p => {
    p.hasVoted = false;
  });

  room.meeting = {
    caller: caller ? caller.name : 'مجهول',
    reason: reason, // 'EMERGENCY' or 'REPORT'
    deadBody: deadBody,
    votes: new Map(), // voterId -> targetId or 'SKIP'
    timer: 45
  };

  // Let clients pause their local physics while the meeting UI is active.
  io.to(room.code).emit('room_updated', getSanitizedRoom(room));

  io.to(room.code).emit('meeting_started', {
    caller: room.meeting.caller,
    reason: reason,
    deadBody: deadBody,
    timer: room.meeting.timer,
    players: Array.from(room.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      character: p.character,
      isAlive: p.isAlive
    }))
  });

  // Opening meeting statement from caller or first available bot
  const livingBots = Array.from(room.players.values()).filter(p => p.isBot && p.isAlive);
  if (livingBots.length > 0) {
    const speakerBot = livingBots.find(b => b.name === room.meeting.caller) || livingBots[0];
    const initialBark = generateBotMeetingChat(room, speakerBot);
    setTimeout(() => {
      io.to(room.code).emit('chat_message', {
        senderId: speakerBot.id,
        senderName: speakerBot.name,
        character: speakerBot.character,
        text: initialBark
      });
    }, 400);
  }

  if (room.meeting.intervalId) clearInterval(room.meeting.intervalId);
  room.meeting.intervalId = setInterval(() => {
    room.meeting.timer--;

    // Dynamic Bot Discussions & Logical Voting during Meeting
    const eligibleBots = Array.from(room.players.values()).filter(p => p.isBot && p.isAlive && !p.hasVoted);
    if (eligibleBots.length > 0 && Math.random() < 0.75) {
      const bot = eligibleBots[Math.floor(Math.random() * eligibleBots.length)];
      
      // Generate intelligent contextual chat
      const chatLine = generateBotMeetingChat(room, bot);
      io.to(room.code).emit('chat_message', {
        senderId: bot.id,
        senderName: bot.name,
        character: bot.character,
        text: chatLine
      });

      // Calculate intelligent vote target
      const voteTarget = getBotVoteTarget(room, bot);
      castVote(room, bot.id, voteTarget);
    }

    if (room.meeting.timer <= 0) {
      clearInterval(room.meeting.intervalId);
      concludeMeeting(room);
    } else {
      io.to(room.code).emit('meeting_tick', { timer: room.meeting.timer });
    }
  }, 1000);
}

function castVote(room, voterId, targetId) {
  const voter = room.players.get(voterId);
  if (!voter || !voter.isAlive || voter.hasVoted) return;

  voter.hasVoted = true;
  room.meeting.votes.set(voterId, targetId);

  io.to(room.code).emit('vote_cast', {
    voterId: voterId,
    votesCount: room.meeting.votes.size,
    totalEligible: Array.from(room.players.values()).filter(p => p.isAlive).length
  });

  // Check if everyone voted
  const livingCount = Array.from(room.players.values()).filter(p => p.isAlive).length;
  if (room.meeting.votes.size >= livingCount) {
    if (room.meeting.intervalId) clearInterval(room.meeting.intervalId);
    concludeMeeting(room);
  }
}

function concludeMeeting(room) {
  room.state = 'EJECTION';
  if (room.meeting.intervalId) clearInterval(room.meeting.intervalId);

  const tally = new Map(); // targetId -> count
  let skipCount = 0;

  room.meeting.votes.forEach((targetId) => {
    if (targetId === 'SKIP') {
      skipCount++;
    } else {
      tally.set(targetId, (tally.get(targetId) || 0) + 1);
    }
  });

  let maxVotes = skipCount;
  let ejectedId = null;
  let isTie = false;

  tally.forEach((count, id) => {
    if (count > maxVotes) {
      maxVotes = count;
    } else if (count === maxVotes && count > 0) {
      isTie = true;
      ejectedId = null;
    }
  });

  let ejectionResult = {
    ejectedPlayer: null,
    wasSaboteur: false,
    message: 'محدش اترَفَد (الاجتماع خلص على خير وما اتفقوش على حد!)'
  };

  if (ejectedId && !isTie) {
    const ejected = room.players.get(ejectedId);
    if (ejected) {
      ejected.isAlive = false;
      const wasSab = ejected.role === 'SABOTEUR';
      ejectionResult = {
        ejectedPlayer: {
          id: ejected.id,
          name: ejected.name,
          character: ejected.character
        },
        wasSaboteur: wasSab,
        message: wasSab
          ? `تم رفد ${ejected.name}، وطلع (هو المخرّب اللي كان هيلبسنا في الحيط!) 🎯💼`
          : `تم رفد ${ejected.name}، وطلع (مكانش المخرّب.. ظلمتوه يا ظلمة!) 😭📄`
      };
    }
  }

  // Clear dead bodies
  room.bodies = [];

  io.to(room.code).emit('meeting_concluded', ejectionResult);

  // Show ejection sequence for 6 seconds then return or end
  setTimeout(() => {
    checkWinConditions(room);
    if (room.state !== 'GAMEOVER') {
      room.state = 'PLAYING';
      // Reset players to meeting room positions
      const living = Array.from(room.players.values()).filter(p => p.isAlive);
      living.forEach((p, idx) => {
        p.x = 400 + (idx % 3) * 60 - 60;
        p.y = 300 + Math.floor(idx / 3) * 60 - 30;
      });
      io.to(room.code).emit('round_resumed', getSanitizedRoom(room));
    }
  }, 6000);
}

function endGame(room, winner, winMessage) {
  room.state = 'GAMEOVER';
  if (room.gameLoopInterval) clearInterval(room.gameLoopInterval);
  if (room.meeting.intervalId) clearInterval(room.meeting.intervalId);

  const finalPlayers = Array.from(room.players.values()).map(p => ({
    id: p.id,
    name: p.name,
    character: p.character,
    role: p.role,
    isAlive: p.isAlive
  }));

  io.to(room.code).emit('game_over', {
    winner: winner, // 'EMPLOYEES' or 'SABOTEUR'
    message: winMessage,
    players: finalPlayers
  });
}

// Socket.io Events
io.on('connection', (socket) => {
  let currentRoomCode = null;
  let playerId = socket.id;

  // Create Room
  socket.on('create_room', ({ playerName, character }) => {
    const charChoice = character || 'bashmohandes';
    const room = createRoom(playerId, playerName || 'البشمهندس', charChoice);
    currentRoomCode = room.code;
    socket.join(room.code);
    socket.emit('room_created', getSanitizedRoom(room));
  });

  // Join Room
  socket.on('join_room', ({ roomCode, playerName, character }) => {
    const code = (roomCode || '').toUpperCase().trim();
    const room = rooms.get(code);

    if (!room) {
      socket.emit('error_message', 'كود الروم مش موجود! اتأكد من الحروف.');
      return;
    }
    if (room.state !== 'LOBBY') {
      socket.emit('error_message', 'اللعبة بدأت بالفعل ومتقدرش تدخل دلوقتي!');
      return;
    }
    if (room.players.size >= 10) {
      socket.emit('error_message', 'الروم كاملة يا فنان (10/10)!');
      return;
    }

    const requestedChar = CHARACTERS[character] ? character : null;
    const characterTaken = requestedChar && Array.from(room.players.values()).some(p => p.character === requestedChar);
    const assignedChar = requestedChar && !characterTaken ? requestedChar : getAvailableCharacter(room);

    room.players.set(playerId, {
      id: playerId,
      socketId: playerId,
      name: playerName || `موظف_${room.players.size + 1}`,
      character: assignedChar,
      isBot: false,
      isHost: false,
      isAlive: true,
      role: null,
      x: 400 + (room.players.size % 3) * 50,
      y: 300 + Math.floor(room.players.size / 3) * 50,
      vx: 0,
      vy: 0,
      dir: 'right',
      tasks: [],
      killCooldown: 0,
      hasVoted: false
    });

    currentRoomCode = code;
    socket.join(code);
    socket.emit('room_joined', getSanitizedRoom(room));
    io.to(code).emit('room_updated', getSanitizedRoom(room));
  });

  // Add Test Bot
  socket.on('add_bot', () => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.hostId !== playerId || room.state !== 'LOBBY') return;
    if (room.players.size >= 10) return;

    const botId = `bot_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const botChar = getAvailableCharacter(room);
    const botName = CHARACTERS[botChar]?.name || `بوت_${room.players.size + 1}`;

    room.players.set(botId, {
      id: botId,
      socketId: botId,
      name: botName,
      character: botChar,
      isBot: true,
      isHost: false,
      isAlive: true,
      role: null,
      x: 400 + (room.players.size % 3) * 50,
      y: 300 + Math.floor(room.players.size / 3) * 50,
      vx: 0,
      vy: 0,
      dir: 'right',
      tasks: [],
      killCooldown: 0,
      hasVoted: false
    });

    io.to(currentRoomCode).emit('room_updated', getSanitizedRoom(room));
  });

  // Change Character
  socket.on('select_character', ({ characterId }) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.state !== 'LOBBY') return;
    const player = room.players.get(playerId);
    const isTaken = Array.from(room.players.values()).some(p => p.id !== playerId && p.character === characterId);
    if (player && CHARACTERS[characterId] && !isTaken) {
      player.character = characterId;
      io.to(currentRoomCode).emit('room_updated', getSanitizedRoom(room));
    }
  });

  // Start Game
  socket.on('start_game', () => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.hostId !== playerId || room.state !== 'LOBBY') return;
    if (room.players.size < 2) {
      socket.emit('error_message', 'لازم لاعبين على الأقل لبدء اللعبة! تقدر تضيف بوتات للتجربة.');
      return;
    }
    startGame(room);
  });

  // Player Movement
  socket.on('player_move', (data) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.state !== 'PLAYING') return;
    const player = room.players.get(playerId);
    if (!player || !player.isAlive) return;

    const requestedX = Number(data.x);
    const requestedY = Number(data.y);
    const requestedVx = Number(data.vx);
    const requestedVy = Number(data.vy);
    if (![requestedX, requestedY, requestedVx, requestedVy].every(Number.isFinite)) return;

    const maxSpeed = (CHARACTERS[player.character]?.speed || 200) * 1.1;
    if (Math.hypot(requestedVx, requestedVy) > maxSpeed || Math.hypot(requestedX - player.x, requestedY - player.y) > 120) return;

    player.x = Math.max(55, Math.min(1345, requestedX));
    player.y = Math.max(55, Math.min(895, requestedY));
    player.vx = requestedVx;
    player.vy = requestedVy;
    player.dir = data.dir === 'left' ? 'left' : 'right';

    socket.to(room.code).emit('player_moved', {
      id: playerId,
      x: player.x,
      y: player.y,
      vx: player.vx,
      vy: player.vy,
      dir: player.dir
    });
  });

  // Vent travel is a server-approved teleport; ordinary movement remains
  // distance-limited above.
  socket.on('use_vent', ({ fromVentId, toVentId }) => {
    const room = rooms.get(currentRoomCode);
    const player = room?.players.get(playerId);
    if (!room || room.state !== 'PLAYING' || !player || !player.isAlive || player.role !== 'SABOTEUR') return;

    const vents = {
      vent_meeting: { x: 470, y: 90, connectsTo: ['vent_servers', 'vent_buffet'] },
      vent_servers: { x: 90, y: 550, connectsTo: ['vent_meeting', 'vent_ceo'] },
      vent_ceo: { x: 1290, y: 90, connectsTo: ['vent_servers', 'vent_buffet'] },
      vent_buffet: { x: 1300, y: 840, connectsTo: ['vent_meeting', 'vent_ceo'] }
    };
    const from = vents[fromVentId];
    const to = vents[toVentId];
    if (!from || !to || !from.connectsTo.includes(toVentId) || Math.hypot(player.x - from.x, player.y - from.y) > 60) return;

    player.x = to.x;
    player.y = to.y;
    player.vx = 0;
    player.vy = 0;
    io.to(room.code).emit('player_moved', { id: playerId, x: player.x, y: player.y, vx: 0, vy: 0, dir: player.dir });
  });

  // Sabotage Trigger
  socket.on('trigger_sabotage', ({ type }) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.state !== 'PLAYING') return;
    const player = room.players.get(playerId);
    if (!player || player.role !== 'SABOTEUR' || !player.isAlive) return;

    if (type === 'lights') {
      room.sabotage = { active: 'lights', timer: 0, fixedBy: [] };
      io.to(room.code).emit('sabotage_triggered', { type: 'lights', desc: 'قطع النور والكهربا في الشركة!' });
    } else if (type === 'server') {
      room.sabotage = { active: 'server', timer: 35, fixedBy: [] };
      io.to(room.code).emit('sabotage_triggered', { type: 'server', timer: 35, desc: 'السيرفر بيفرقع! لازم يتصلح في 35 ثانية!' });
    } else if (type === 'ac') {
      room.sabotage = { active: 'ac', timer: 0, fixedBy: [] };
      io.to(room.code).emit('sabotage_triggered', { type: 'ac', desc: 'التكييف اتقفل والجو خنقة والموظفين بطؤوا!' });
    }
  });

  // Fix Sabotage
  socket.on('fix_sabotage', () => {
    const room = rooms.get(currentRoomCode);
    if (!room || !room.sabotage.active) return;
    const oldType = room.sabotage.active;
    room.sabotage = { active: null, timer: 0, fixedBy: [] };
    io.to(room.code).emit('sabotage_fixed', { type: oldType, message: 'تم تصليح العطل ورجعت الشركة لطبيعتها!' });
  });

  // Kill Action
  socket.on('kill_player', ({ targetId }) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.state !== 'PLAYING') return;
    const killer = room.players.get(playerId);
    const victim = room.players.get(targetId);

    if (!killer || !victim || killer.role !== 'SABOTEUR' || !killer.isAlive || !victim.isAlive) return;
    if (killer.killCooldown > 0) return;

    const dist = Math.hypot(killer.x - victim.x, killer.y - victim.y);
    if (dist > 120) return; // Must be close

    executeKill(room, killer, victim);
  });

  // Report Dead Body
  socket.on('report_body', ({ bodyId }) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.state !== 'PLAYING') return;
    const reporter = room.players.get(playerId);
    if (!reporter || !reporter.isAlive) return;

    const body = room.bodies.find(b => b.id === bodyId);
    startEmergencyMeeting(room, reporter, 'REPORT', body);
  });

  // Emergency Button
  socket.on('emergency_meeting', () => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.state !== 'PLAYING') return;
    const caller = room.players.get(playerId);
    if (!caller || !caller.isAlive) return;

    startEmergencyMeeting(room, caller, 'EMERGENCY', null);
  });

  // Cast Vote
  socket.on('cast_vote', ({ targetId }) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.state !== 'MEETING') return;
    castVote(room, playerId, targetId);
  });

  // Chat Message
  socket.on('send_chat', ({ text }) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.state !== 'MEETING') return;
    const sender = room.players.get(playerId);
    if (!sender) return;

    io.to(room.code).emit('chat_message', {
      senderId: sender.id,
      senderName: sender.name,
      character: sender.character,
      text: text
    });
  });

  // Complete Task / Advance Multi-stage Task
  socket.on('task_completed', ({ taskId }) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.state !== 'PLAYING') return;
    const player = room.players.get(playerId);
    if (!player || player.role !== 'EMPLOYEE') return;

    const task = player.tasks.find(t => t.id === taskId);
    if (!task || task.completed) return;

    // Check if multi-stage task needs to advance to next stage
    if (task.totalStages > 1 && task.stage < task.totalStages) {
      task.stage++;
      const nextStage = task.stages[task.stage - 1];
      task.name = nextStage.name;
      task.stationId = nextStage.stationId;
      task.room = nextStage.room;
      task.roomName = nextStage.roomName;

      socket.emit('task_stage_advanced', {
        taskId: task.id,
        stage: task.stage,
        totalStages: task.totalStages,
        name: task.name,
        stationId: task.stationId,
        room: task.room,
        roomName: task.roomName
      });
      return;
    }

    // Final stage completed
    task.completed = true;
    room.completedTasksCount++;
    room.tasksProgress = Math.min(100, Math.round((room.completedTasksCount / Math.max(1, room.totalTasksCount)) * 100));

    io.to(room.code).emit('tasks_updated', {
      progress: room.tasksProgress,
      completedBy: player.name,
      taskId: taskId
    });

    checkWinConditions(room);
  });

  // Trigger Visual Task Map Effect (Broadcasting visible proof of innocence to all players)
  socket.on('trigger_visual_task', ({ taskType, x, y, stationId }) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.state !== 'PLAYING') return;
    const player = room.players.get(playerId);
    if (!player || player.role !== 'EMPLOYEE') return; // Only genuine employees trigger real map visual effects!

    io.to(room.code).emit('visual_task_triggered', {
      taskType,
      x: Number(x) || 0,
      y: Number(y) || 0,
      stationId: stationId || '',
      playerId: player.id,
      playerName: player.name
    });
  });

  // Dual-Key Synchronized Breaker Task
  socket.on('dual_key_press', ({ breakerId }) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.state !== 'PLAYING') return;
    const player = room.players.get(playerId);
    if (!player || player.role !== 'EMPLOYEE') return;

    if (!room.dualKeyState) {
      room.dualKeyState = { breakerA: null, breakerB: null, timeout: null };
    }

    const now = Date.now();
    const cleanBreaker = (breakerId || 'A').toUpperCase().includes('B') ? 'B' : 'A';

    if (cleanBreaker === 'A') {
      room.dualKeyState.breakerA = { playerId: player.id, playerName: player.name, timestamp: now };
    } else {
      room.dualKeyState.breakerB = { playerId: player.id, playerName: player.name, timestamp: now };
    }

    const a = room.dualKeyState.breakerA;
    const b = room.dualKeyState.breakerB;

    // Check if both A and B were pressed by 2 DIFFERENT employees within 3.5 seconds
    if (a && b && a.playerId !== b.playerId && Math.abs(a.timestamp - b.timestamp) <= 3500) {
      if (room.dualKeyState.timeout) clearTimeout(room.dualKeyState.timeout);
      room.dualKeyState = { breakerA: null, breakerB: null, timeout: null };

      // Progress boost for company (+2 tasks worth)
      room.completedTasksCount = Math.min(room.totalTasksCount, room.completedTasksCount + 2);
      room.tasksProgress = room.totalTasksCount > 0 ? Math.min(100, Math.round((room.completedTasksCount / room.totalTasksCount) * 100)) : 0;

      io.to(room.code).emit('dual_key_success', {
        playerA: a.playerName,
        playerB: b.playerName,
        progress: room.tasksProgress
      });

      io.to(room.code).emit('tasks_updated', {
        progress: room.tasksProgress,
        completedBy: `${a.playerName} & ${b.playerName}`,
        taskId: 'dual_breaker'
      });

      checkWinConditions(room);
    } else {
      // Waiting for partner
      if (room.dualKeyState.timeout) clearTimeout(room.dualKeyState.timeout);

      io.to(room.code).emit('dual_key_waiting', {
        activeBreaker: cleanBreaker,
        playerName: player.name,
        duration: 3.5
      });

      room.dualKeyState.timeout = setTimeout(() => {
        if (room.dualKeyState) {
          room.dualKeyState = { breakerA: null, breakerB: null, timeout: null };
        }
        io.to(room.code).emit('dual_key_expired', {
          breakerId: cleanBreaker
        });
      }, 3500);
    }
  });

  // Update Room Settings (Host only)
  socket.on('update_room_settings', ({ tasksCount }) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.hostId !== playerId || room.state !== 'LOBBY') return;

    const count = Number(tasksCount);
    if ([5, 7, 9, 12].includes(count)) {
      if (!room.settings) room.settings = {};
      room.settings.tasksCount = count;
      io.to(room.code).emit('room_settings_updated', room.settings);
      io.to(room.code).emit('room_updated', getSanitizedRoom(room));
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;

    room.players.delete(playerId);
    if (room.players.size === 0) {
      if (room.gameLoopInterval) clearInterval(room.gameLoopInterval);
      if (room.meeting.intervalId) clearInterval(room.meeting.intervalId);
      rooms.delete(currentRoomCode);
    } else {
      if (room.hostId === playerId) {
        const nextHost = room.players.values().next().value;
        if (nextHost) {
          room.hostId = nextHost.id;
          nextHost.isHost = true;
        }
      }
      io.to(currentRoomCode).emit('room_updated', getSanitizedRoom(room));
      checkWinConditions(room);
    }
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`🎮 خادم لعبة خيانة في المكتب شغال على: http://localhost:${PORT}`);
  });
}

module.exports = app;
