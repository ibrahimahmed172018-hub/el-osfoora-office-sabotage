/**
 * map.js — Egyptian Corporate Office Map Layout
 * خريطة مكاتب الشركة التفاعلية والمحطات والتاسكات والممرات السرية
 */

const OFFICE_MAP_DATA = {
  width: 1400,
  height: 950,

  // Zones & Rooms
  rooms: [
    { id: 'reception', name: 'الاستقبال (Reception)', x: 50, y: 50, w: 320, h: 260, color: 0x1e293b },
    { id: 'meeting', name: 'قاعة الاجتماعات (Meeting Room)', x: 420, y: 50, w: 560, h: 320, color: 0x0f172a },
    { id: 'ceo', name: 'مكتب المدير (CEO Office)', x: 1030, y: 50, w: 320, h: 260, color: 0x2d1a38 },
    
    { id: 'hallway', name: 'الممر الرئيسي (Main Hallway)', x: 50, y: 340, w: 1300, h: 140, color: 0x111827 },
    
    { id: 'servers', name: 'أوضة السيرفرات والـ IT', x: 50, y: 510, w: 350, h: 390, color: 0x0a192f },
    { id: 'design', name: 'قسم الديزاين (Design Studio)', x: 440, y: 510, w: 300, h: 390, color: 0x1b2d28 },
    { id: 'marketing', name: 'قسم الماركتنج والميزانية', x: 780, y: 510, w: 280, h: 390, color: 0x2a1f18 },
    { id: 'buffet', name: 'البوفيه والقهوة (Cafeteria)', x: 1090, y: 510, w: 260, h: 390, color: 0x23201d }
  ],

  // Interactive Task Stations
  taskStations: [
    // --- Short Tasks ---
    { id: 'card_swipe', name: 'كارت الدخول والبصمة', room: 'reception', x: 140, y: 150, icon: '🪪', radius: 45 },
    { id: 'hr_stamp', name: 'أختام وتوقيعات HR', room: 'ceo', x: 1180, y: 180, icon: '📑', radius: 45 },
    { id: 'trash_empty', name: 'تفريغ مفرمة الورق', room: 'hallway', x: 520, y: 390, icon: '🗑️', radius: 45 },
    { id: 'router', name: 'تاسك الراوتر', room: 'servers', x: 120, y: 580, icon: '🔌', radius: 45 },
    { id: 'water_cooler', name: 'كولدير المية', room: 'buffet', x: 1280, y: 580, icon: '💧', radius: 45 },
    { id: 'air_conditioner', name: 'ريموت التكييف', room: 'hallway', x: 880, y: 390, icon: '❄️', radius: 45 },
    { id: 'sanitize_hands', name: 'تعقيم اليدين', room: 'reception', x: 200, y: 240, icon: '🧴', radius: 45 },
    { id: 'light_switch', name: 'مفاتيح النجفة', room: 'hallway', x: 350, y: 390, icon: '💡', radius: 45 },

    // --- Medium Tasks ---
    { id: 'wires', name: 'توصيل كابلات السويتش', room: 'servers', x: 260, y: 640, icon: '🔀', radius: 45 },
    { id: 'printer_jam', name: 'تسليك ورق البرنتر', room: 'reception', x: 300, y: 180, icon: '🖨️', radius: 45 },
    { id: 'budget', name: 'تاسك الميزانية', room: 'marketing', x: 920, y: 720, icon: '💵', radius: 45 },
    { id: 'bugs', name: 'صيد بجات الكود', room: 'servers', x: 320, y: 840, icon: '🐛', radius: 45 },
    { id: 'coffee', name: 'تاسك القهوة والكنكة', room: 'buffet', x: 1220, y: 680, icon: '☕', radius: 45 },
    { id: 'stapler', name: 'تدبيس العقود', room: 'ceo', x: 1090, y: 140, icon: '📎', radius: 45 },
    { id: 'sticky_notes', name: 'لوحة ستيكي نوتس', room: 'design', x: 620, y: 570, icon: '📌', radius: 45 },
    { id: 'shred_secrets', name: 'فرم المستندات السرية', room: 'ceo', x: 1280, y: 240, icon: '📄', radius: 45 },

    // --- Long Multi-Stage Tasks ---
    { id: 'backup_download', name: 'تحميل باك-أب السيرفر (1/2)', room: 'servers', x: 150, y: 690, icon: '💾', radius: 55 },
    { id: 'data_upload', name: 'رفع الداتا للعميل (2/2)', room: 'meeting', x: 880, y: 180, icon: '💻', radius: 45 },
    { id: 'tea_buffet', name: 'صب شاي الاجتماع (1/2)', room: 'buffet', x: 1140, y: 760, icon: '🫖', radius: 45 },
    { id: 'deliver_tea', name: 'تقديم صينية الشاي (2/2)', room: 'meeting', x: 500, y: 220, icon: '🍵', radius: 45 },
    { id: 'invoice_start', name: 'استخراج الفاتورة (1/2)', room: 'marketing', x: 820, y: 800, icon: '🧾', radius: 45 },
    { id: 'invoice_ceo', name: 'اعتماد الشيك من المدير (2/2)', room: 'ceo', x: 1240, y: 120, icon: '✍️', radius: 45 },
    { id: 'projector_cable', name: 'كابل البروجيكتور (1/2)', room: 'servers', x: 250, y: 790, icon: '🔌', radius: 45 },
    { id: 'projector_screen', name: 'تشغيل البروجيكتور (2/2)', room: 'meeting', x: 680, y: 110, icon: '📽️', radius: 45 },
    { id: 'koshary_pickup', name: 'استلام الكشري (1/2)', room: 'reception', x: 80, y: 220, icon: '🍲', radius: 45 },
    { id: 'koshary_distribute', name: 'توزيع الكشري (2/2)', room: 'buffet', x: 1160, y: 840, icon: '😋', radius: 45 },

    // --- Dual-Key Synchronized Tasks (تاسكات جماعية متزامنة) ---
    { id: 'dual_breaker_a', name: 'قاطع الطوارئ أ (مشترك)', room: 'servers', x: 310, y: 710, icon: '⚡', radius: 45 },
    { id: 'dual_breaker_b', name: 'قاطع الطوارئ ب (مشترك)', room: 'reception', x: 120, y: 90, icon: '⚡', radius: 45 },

    // --- Character Specific Stations ---
    { id: 'special_bashmohandes', name: 'سيرفر البشمهندس', room: 'servers', x: 260, y: 550, icon: '💻', radius: 45 },
    { id: 'special_pablo', name: 'بوستر بابلو 1080', room: 'design', x: 500, y: 620, icon: '🎨', radius: 45 },
    { id: 'special_samaool', name: 'بن تول سمعول', room: 'design', x: 650, y: 750, icon: '✒️', radius: 45 },
    { id: 'special_musa', name: 'حملة موسى الإعلانية', room: 'marketing', x: 840, y: 600, icon: '📢', radius: 45 },
    { id: 'special_abdelmonem', name: 'تصدير أيقونات منعم', room: 'design', x: 580, y: 820, icon: '⚡', radius: 45 },
    { id: 'special_shatlawi', name: 'رندر الشطلاوي 4K', room: 'servers', x: 130, y: 850, icon: '🎬', radius: 45 }
  ],

  // Sabotage Repair Consoles
  sabotageConsoles: [
    { type: 'lights', name: 'لوحة الكهربا الرئيسية', x: 700, y: 410, icon: '⚡' },
    { type: 'server', name: 'سيرفر الطوارئ', x: 230, y: 850, icon: '🖥️' },
    { type: 'ac', name: 'مفتاح التكييف المركزي', x: 1200, y: 410, icon: '❄️' }
  ],

  // Emergency Button Table (In Meeting Room)
  emergencyButton: {
    x: 700,
    y: 210,
    radius: 40,
    icon: '🚨'
  },

  // Saboteur Secret Vents (فتحات التهوية للتنقل السريع)
  vents: [
    { id: 'vent_meeting', x: 470, y: 90, connectsTo: ['vent_servers', 'vent_buffet'] },
    { id: 'vent_servers', x: 90, y: 550, connectsTo: ['vent_meeting', 'vent_ceo'] },
    { id: 'vent_ceo', x: 1290, y: 90, connectsTo: ['vent_servers', 'vent_buffet'] },
    { id: 'vent_buffet', x: 1300, y: 840, connectsTo: ['vent_meeting', 'vent_ceo'] }
  ],

  // Static Office Obstacles / Collision Boundaries
  obstacles: [
    // Outer Border Walls
    { x: 30, y: 30, w: 1340, h: 20 },
    { x: 30, y: 900, w: 1340, h: 20 },
    { x: 30, y: 30, w: 20, h: 890 },
    { x: 1350, y: 30, w: 20, h: 890 },

    // Meeting Room Large Board Table
    { x: 570, y: 150, w: 260, h: 120, label: 'طاولة الاجتماعات الكبرى' },

    // Server Racks (Repositioned to top-left and bottom-left to leave open hallway & walkway)
    { x: 75, y: 580, w: 110, h: 36, label: 'سيرفرات الشركة' },
    { x: 75, y: 790, w: 110, h: 36, label: 'سيرفرات إضافية' },

    // Design Desks
    { x: 480, y: 560, w: 220, h: 45, label: 'مكاتب الديزاينرز' },
    { x: 480, y: 680, w: 220, h: 45, label: 'مكاتب رسم' },

    // Marketing Desks
    { x: 810, y: 640, w: 200, h: 45, label: 'مكاتب الماركتنج' },

    // Buffet Counters
    { x: 1120, y: 560, w: 200, h: 50, label: 'كونتر البوفيه وماكينة الإسبريسو' },

    // CEO Desk
    { x: 1080, y: 110, w: 180, h: 60, label: 'مكتب المدير الفاخر' }
  ]
};
