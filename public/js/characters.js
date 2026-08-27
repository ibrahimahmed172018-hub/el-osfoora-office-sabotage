/**
 * characters.js — All 6 Egyptian Office Sabotage Characters
 * مواصفات وفيزياء ورسومات الشخصيات الستة المطابقة لصور الـ Reference
 */

const CHARACTERS_DATA = {
  bashmohandes: {
    id: 'bashmohandes',
    name: 'البشمهندس',
    username: 'EL-BASHMOHANDES',
    title: 'مهندس السوفت وير',
    color: '#ff6600',
    secondaryColor: '#1a1a1a',
    speed: 200,
    speedMod: 1.0,
    bounceParam: 0.2,
    knockbackPower: 1.0,
    noseHitbox: 0,
    specialMove: 'ديبريس الكود (Debug Beam)',
    specialDesc: 'ليزر كودي بيصلح السيرفر أو يفجر التارجت بشفرات الأخطاء',
    taskSpecial: 'حل البجات اللي السيرفر مطلعها',
    features: 'شورت برتقالي، تيشيرت أسود بنايكي، ذقن خفيفة، مشية متزنة',
    refImage: 'Gemini_Generated_Image_5rsf335rsf335rsf.jpg',
    render: (ctx, x, y, scale = 1, isWalking = false, tick = 0, dir = 'right') => {
      ctx.save();
      ctx.translate(x, y);
      if (dir === 'left') ctx.scale(-scale, scale);
      else ctx.scale(scale, scale);

      const walkBob = isWalking ? Math.sin(tick * 0.2) * 3 : 0;
      const legSwing = isWalking ? Math.sin(tick * 0.2) * 12 : 0;

      // Legs / Orange Shorts
      ctx.fillStyle = '#ff6600'; // Orange shorts
      ctx.fillRect(-12, 10 + walkBob, 10, 14);
      ctx.fillRect(2, 10 + walkBob, 10, 14);

      // Legs & Shoes
      ctx.fillStyle = '#e0a96d'; // Skin tone
      ctx.fillRect(-10, 24 + walkBob, 6, 8);
      ctx.fillRect(4, 24 + walkBob, 6, 8);
      ctx.fillStyle = '#ffffff'; // White socks
      ctx.fillRect(-10, 28 + walkBob, 6, 4);
      ctx.fillRect(4, 28 + walkBob, 6, 4);
      ctx.fillStyle = '#222222'; // Black sneakers
      ctx.fillRect(-12 - (legSwing * 0.3), 32 + walkBob, 10, 5);
      ctx.fillRect(2 + (legSwing * 0.3), 32 + walkBob, 10, 5);

      // Torso / Black Nike T-shirt
      ctx.fillStyle = '#1e1e1e';
      ctx.beginPath();
      ctx.roundRect(-14, -12 + walkBob, 28, 24, 4);
      ctx.fill();

      // White Swoosh Logo
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-4, -4 + walkBob);
      ctx.quadraticCurveTo(0, 0 + walkBob, 6, -6 + walkBob);
      ctx.stroke();

      // Head & Short Beard
      ctx.fillStyle = '#e0a96d'; // Skin tone
      ctx.beginPath();
      ctx.arc(0, -22 + walkBob, 11, 0, Math.PI * 2);
      ctx.fill();

      // Black Hair & Beard
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath(); // Hair
      ctx.arc(0, -25 + walkBob, 11, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.beginPath(); // Beard
      ctx.arc(0, -20 + walkBob, 9, 0.2, Math.PI - 0.2);
      ctx.lineTo(0, -16 + walkBob);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#000000';
      ctx.fillRect(2, -23 + walkBob, 2, 2);

      // Arms
      ctx.fillStyle = '#e0a96d';
      ctx.fillRect(10, -8 + walkBob, 5, 14);
      ctx.fillRect(-15, -8 + walkBob, 5, 14);

      ctx.restore();
    }
  },

  pablo: {
    id: 'pablo',
    name: 'بابلو',
    username: 'PABLO',
    title: 'جرافيك ديزاينر بريمو',
    color: '#3498db',
    secondaryColor: '#f1c40f',
    speed: 180,
    speedMod: 0.9,
    bounceParam: 0.85, // High Belly Bounce!
    knockbackPower: 1.8,
    noseHitbox: 0,
    specialMove: 'خبطة بالكرش',
    specialDesc: '',
    taskSpecial: 'عدل البوستر لمقاس 1080x1080',
    features: '',
    refImage: 'Gemini_Generated_Image_mpgqmompgqmompgq.jpg',
    render: (ctx, x, y, scale = 1, isWalking = false, tick = 0, dir = 'right') => {
      ctx.save();
      ctx.translate(x, y);
      if (dir === 'left') ctx.scale(-scale, scale);
      else ctx.scale(scale, scale);

      const walkBob = isWalking ? Math.sin(tick * 0.2) * 4 : 0;
      const bellyWobble = Math.sin(tick * 0.3) * (isWalking ? 6 : 2); // Big Belly wobble!

      // Legs / Cargo Shorts
      ctx.fillStyle = '#556b2f'; // Olive cargo shorts
      ctx.fillRect(-16, 12 + walkBob, 14, 14);
      ctx.fillRect(2, 12 + walkBob, 14, 14);

      // Shoes
      ctx.fillStyle = '#e0a96d';
      ctx.fillRect(-14, 26 + walkBob, 10, 6);
      ctx.fillRect(4, 26 + walkBob, 10, 6);
      ctx.fillStyle = '#3e2723'; // Brown sneakers
      ctx.fillRect(-16, 32 + walkBob, 14, 6);
      ctx.fillRect(2, 32 + walkBob, 14, 6);

      // Huge Belly / White Paint T-shirt
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(2 + bellyWobble, 0 + walkBob, 20, 22, 0, 0, Math.PI * 2);
      ctx.fill();

      // Paint Splatters on Shirt
      ctx.fillStyle = '#e74c3c'; ctx.fillRect(-4 + bellyWobble, -4 + walkBob, 4, 4);
      ctx.fillStyle = '#3498db'; ctx.fillRect(6 + bellyWobble, 2 + walkBob, 5, 4);
      ctx.fillStyle = '#f1c40f'; ctx.fillRect(0 + bellyWobble, 8 + walkBob, 4, 5);

      // Text on Shirt "PABLO"
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 6px sans-serif';
      ctx.fillText('PABLO', -6 + bellyWobble, -2 + walkBob);

      // Head & Curly Hair & Full Beard
      ctx.fillStyle = '#e0a96d';
      ctx.beginPath();
      ctx.arc(0, -22 + walkBob, 12, 0, Math.PI * 2);
      ctx.fill();

      // Curly Dark Hair
      ctx.fillStyle = '#2c1810';
      ctx.beginPath();
      ctx.arc(0, -25 + walkBob, 13, Math.PI * 0.9, Math.PI * 2.1);
      ctx.fill();

      // Beard
      ctx.beginPath();
      ctx.arc(0, -20 + walkBob, 11, 0.1, Math.PI - 0.1);
      ctx.fill();

      // Cigarette & Smoke Puff!
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(8, -18 + walkBob, 7, 2);
      ctx.fillStyle = '#ff3300'; // Glowing tip
      ctx.fillRect(14, -18 + walkBob, 2, 2);

      // Animated Smoke
      const smokePuff = (tick % 60) / 20;
      ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
      ctx.beginPath();
      ctx.arc(18 + (smokePuff * 4), -22 + walkBob - (smokePuff * 8), 3 + smokePuff, 0, Math.PI * 2);
      ctx.fill();

      // Graphic Tablet under arm
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-18, 0 + walkBob, 6, 16);

      ctx.restore();
    }
  },

  samaool: {
    id: 'samaool',
    name: 'سمعول',
    username: "SAMA'OOL",
    title: 'ديزاينر وكوير هجومي',
    color: '#2ecc71',
    secondaryColor: '#1abc9c',
    speed: 215,
    speedMod: 1.08,
    bounceParam: 0.3,
    knockbackPower: 1.1,
    noseHitbox: 20, // Distinct Huge Nose Hitbox!
    specialMove: 'شوطة الموزة (Design Kick)',
    specialDesc: 'شوطة كورة تلتف في وش المنافس مع Hitbox مناخير كبير جداً',
    taskSpecial: 'فرّغ الخلفية بـ Pen Tool',
    features: 'مناخير كوميدية ضخمة جداً، تيشرت أخضر SAMA\'OOL FC، سرعة كروية',
    refImage: 'Gemini_Generated_Image_7plijo7plijo7pli.jpg',
    render: (ctx, x, y, scale = 1, isWalking = false, tick = 0, dir = 'right') => {
      ctx.save();
      ctx.translate(x, y);
      if (dir === 'left') ctx.scale(-scale, scale);
      else ctx.scale(scale, scale);

      const walkBob = isWalking ? Math.sin(tick * 0.25) * 4 : 0;
      const legSwing = isWalking ? Math.sin(tick * 0.25) * 14 : 0;

      // Athletic Legs & Shorts
      ctx.fillStyle = '#1e293b'; // Black football shorts
      ctx.fillRect(-11, 10 + walkBob, 9, 12);
      ctx.fillRect(2, 10 + walkBob, 9, 12);

      // Football Socks & Cleats
      ctx.fillStyle = '#2ecc71'; // Green socks
      ctx.fillRect(-10, 22 + walkBob, 7, 10);
      ctx.fillRect(3, 22 + walkBob, 7, 10);
      ctx.fillStyle = '#ffffff'; // White cleats
      ctx.fillRect(-12 - (legSwing * 0.3), 32 + walkBob, 11, 5);
      ctx.fillRect(2 + (legSwing * 0.3), 32 + walkBob, 11, 5);

      // SAMA'OOL FC Jersey (Turquoise Green)
      ctx.fillStyle = '#1abc9c';
      ctx.beginPath();
      ctx.roundRect(-13, -12 + walkBob, 26, 23, 4);
      ctx.fill();

      // Jersey Crest / Text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 5px sans-serif';
      ctx.fillText('FC', -3, -2 + walkBob);

      // Head & COMICAL BIG NOSE
      ctx.fillStyle = '#e0a96d';
      ctx.beginPath();
      ctx.arc(0, -22 + walkBob, 11, 0, Math.PI * 2);
      ctx.fill();

      // The Legend: HUGE COMIC NOSE
      ctx.fillStyle = '#d48a58';
      ctx.beginPath();
      ctx.moveTo(4, -24 + walkBob);
      ctx.quadraticCurveTo(24, -20 + walkBob, 18, -14 + walkBob);
      ctx.quadraticCurveTo(8, -14 + walkBob, 4, -18 + walkBob);
      ctx.fill();
      ctx.stroke();

      // Curly Dark Hair & Beard
      ctx.fillStyle = '#2b1b17';
      ctx.beginPath();
      ctx.arc(-2, -26 + walkBob, 12, Math.PI * 0.9, Math.PI * 2.1);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-2, -20 + walkBob, 9, 0.4, Math.PI - 0.2);
      ctx.fill();

      // Eye
      ctx.fillStyle = '#000000';
      ctx.fillRect(3, -24 + walkBob, 2, 2);

      // Pen Tool in Hand
      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(12, -2 + walkBob, 4, 12);

      ctx.restore();
    }
  },

  musa: {
    id: 'musa',
    name: 'موسى',
    username: 'MUSA',
    title: 'ماركتنج ليد وبطل الجيم',
    color: '#e67e22',
    secondaryColor: '#d35400',
    speed: 195,
    speedMod: 1.0,
    bounceParam: 0.4,
    knockbackPower: 2.2, // 2x Heavy Knockback!
    noseHitbox: 0,
    specialMove: 'يافطة إعلانات في الوش (Advertising Blitz)',
    specialDesc: 'زقة غشيمة ويافطة إعلانات تطير المنافسين بقوة مضاعفة',
    taskSpecial: 'شغّل حملة فيسبوك أدز قبل ما الميزانية تضيع',
    features: 'جسم فورمة وعضلات، تيشيرت برتقالي ضيق، يافطة إعلانات مضيئة',
    refImage: 'Gemini_Generated_Image_ih63gtih63gtih63.jpg',
    render: (ctx, x, y, scale = 1, isWalking = false, tick = 0, dir = 'right') => {
      ctx.save();
      ctx.translate(x, y);
      if (dir === 'left') ctx.scale(-scale, scale);
      else ctx.scale(scale, scale);

      const walkBob = isWalking ? Math.sin(tick * 0.2) * 3 : 0;

      // Muscular Legs / Track Pants
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(-14, 10 + walkBob, 12, 15);
      ctx.fillRect(2, 10 + walkBob, 12, 15);
      // Trackside Stripe
      ctx.fillStyle = '#e67e22';
      ctx.fillRect(-14, 10 + walkBob, 2, 15);
      ctx.fillRect(12, 10 + walkBob, 2, 15);

      // Heavy Sneakers
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-16, 26 + walkBob, 14, 8);
      ctx.fillRect(2, 26 + walkBob, 14, 8);

      // Muscular Torso / Tight Orange V-Neck
      ctx.fillStyle = '#e67e22';
      ctx.beginPath();
      ctx.roundRect(-18, -14 + walkBob, 36, 26, 6);
      ctx.fill();

      // Chest Muscle Lines
      ctx.strokeStyle = '#d35400';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-10, -6 + walkBob); ctx.lineTo(-2, -2 + walkBob);
      ctx.moveTo(10, -6 + walkBob); ctx.lineTo(2, -2 + walkBob);
      ctx.stroke();

      // Huge Biceps / Arms
      ctx.fillStyle = '#d48a58';
      ctx.beginPath();
      ctx.ellipse(-18, -2 + walkBob, 6, 10, 0, 0, Math.PI * 2);
      ctx.ellipse(18, -2 + walkBob, 6, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head & Strong Jawline
      ctx.fillStyle = '#d48a58';
      ctx.beginPath();
      ctx.arc(0, -24 + walkBob, 11, 0, Math.PI * 2);
      ctx.fill();

      // Buzz Cut & Neat Beard
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(0, -27 + walkBob, 11, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -22 + walkBob, 10, 0.2, Math.PI - 0.2);
      ctx.fill();

      // Eye
      ctx.fillStyle = '#000000';
      ctx.fillRect(3, -25 + walkBob, 2, 2);

      // Glowing Ads Billboard in Hand
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(16, -10 + walkBob, 12, 18);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(18, -8 + walkBob, 8, 14);

      ctx.restore();
    }
  },

  abdelmonem: {
    id: 'abdelmonem',
    name: 'منعم',
    username: 'ABDELMONEM',
    title: 'أصغر ديزاينر في مصر',
    color: '#9b59b6',
    secondaryColor: '#8e44ad',
    speed: 250,
    speedMod: 1.25, // 1.25x Fastest Movement in map!
    bounceParam: 0.5,
    knockbackPower: 0.8,
    noseHitbox: 0,
    specialMove: 'جريت البكسلات (Pixel Dash)',
    specialDesc: 'سرعة البرق 1.25x مع وميض بكسلات يقطع النور ويجري بسرعة البرق',
    taskSpecial: 'اعمل Export للأيقونات بسرعة',
    features: 'كاب لورا، شنطة ضهر، خفيف وسريع جداً، أصغر واحد في التيم',
    refImage: 'Gemini_Generated_Image_4m1sja4m1sja4m1s.jpg',
    render: (ctx, x, y, scale = 1, isWalking = false, tick = 0, dir = 'right') => {
      ctx.save();
      ctx.translate(x, y);
      if (dir === 'left') ctx.scale(-scale, scale);
      else ctx.scale(scale, scale);

      const walkBob = isWalking ? Math.sin(tick * 0.35) * 5 : 0;
      const legSwing = isWalking ? Math.sin(tick * 0.35) * 16 : 0;

      // Slim Jeans
      ctx.fillStyle = '#2980b9'; // Blue jeans
      ctx.fillRect(-10, 8 + walkBob, 8, 14);
      ctx.fillRect(2, 8 + walkBob, 8, 14);

      // Modern Skater Shoes
      ctx.fillStyle = '#ecf0f1';
      ctx.fillRect(-12 - (legSwing * 0.4), 22 + walkBob, 10, 6);
      ctx.fillRect(2 + (legSwing * 0.4), 22 + walkBob, 10, 6);

      // Backpack on back
      ctx.fillStyle = '#7f8c8d';
      ctx.fillRect(-18, -12 + walkBob, 7, 18);

      // Black Tee
      ctx.fillStyle = '#2c3e50';
      ctx.beginPath();
      ctx.roundRect(-12, -12 + walkBob, 24, 22, 4);
      ctx.fill();

      // Tablet with Colorful Screen
      ctx.fillStyle = '#000000';
      ctx.fillRect(8, -4 + walkBob, 12, 14);
      ctx.fillStyle = '#e91e63';
      ctx.fillRect(10, -2 + walkBob, 8, 10);

      // Young Face
      ctx.fillStyle = '#f5cba7';
      ctx.beginPath();
      ctx.arc(0, -22 + walkBob, 10, 0, Math.PI * 2);
      ctx.fill();

      // Backward Cap
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, -24 + walkBob, 11, Math.PI, Math.PI * 2);
      ctx.fill();
      // Cap Brim pointing backwards
      ctx.fillRect(-16, -26 + walkBob, 8, 4);

      // Eye
      ctx.fillStyle = '#000000';
      ctx.fillRect(3, -23 + walkBob, 2, 2);

      // Pixel Dash Trail Effect when fast
      if (isWalking) {
        ctx.fillStyle = 'rgba(155, 89, 182, 0.4)';
        ctx.fillRect(-22, -10 + walkBob, 5, 5);
        ctx.fillRect(-28, -2 + walkBob, 4, 4);
      }

      ctx.restore();
    }
  },

  shatlawi: {
    id: 'shatlawi',
    name: 'الشطلاوي',
    username: 'SHATLAWI',
    title: 'مبرمج ومونتير 4K',
    color: '#1abc9c',
    secondaryColor: '#16a085',
    speed: 210,
    speedMod: 1.05,
    bounceParam: 0.4,
    knockbackPower: 1.2,
    noseHitbox: 0,
    specialMove: 'قص التايم لاين (Timeline Slice)',
    specialDesc: 'ضربة مقصية ورشاقة كروية مع تقطيع تايم لاين الفيديو',
    taskSpecial: 'رندر الفيديو على 4K من غير كراش',
    features: 'نضارة مدورة، كرش صغنون، لابتوب/كنترولر، رشاقة لاعب كورة حريف',
    refImage: 'Gemini_Generated_Image_dcuz5zdcuz5zdcuz.jpg',
    render: (ctx, x, y, scale = 1, isWalking = false, tick = 0, dir = 'right') => {
      ctx.save();
      ctx.translate(x, y);
      if (dir === 'left') ctx.scale(-scale, scale);
      else ctx.scale(scale, scale);

      const walkBob = isWalking ? Math.sin(tick * 0.22) * 3 : 0;
      const krishBounce = Math.sin(tick * 0.22) * 2; // Small krish bounce

      // Cargo Pants
      ctx.fillStyle = '#34495e';
      ctx.fillRect(-12, 10 + walkBob, 10, 14);
      ctx.fillRect(2, 10 + walkBob, 10, 14);

      // Sneakers
      ctx.fillStyle = '#bdc3c7';
      ctx.fillRect(-14, 24 + walkBob, 12, 6);
      ctx.fillRect(2, 24 + walkBob, 12, 6);

      // Dark Grey T-shirt with Small Krish
      ctx.fillStyle = '#4b5563';
      ctx.beginPath();
      ctx.ellipse(1 + krishBounce, -2 + walkBob, 15, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Video Timeline Graphic on shirt
      ctx.fillStyle = '#10b981';
      ctx.fillRect(-6, -4 + walkBob, 12, 3);

      // Head & Round Glasses
      ctx.fillStyle = '#e0a96d';
      ctx.beginPath();
      ctx.arc(0, -22 + walkBob, 11, 0, Math.PI * 2);
      ctx.fill();

      // Round Glasses
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(1, -25 + walkBob, 6, 6);
      ctx.strokeRect(-8, -25 + walkBob, 6, 6);
      ctx.beginPath();
      ctx.moveTo(-2, -22 + walkBob); ctx.lineTo(1, -22 + walkBob);
      ctx.stroke();

      // Neat Hair & Trimmed Beard
      ctx.fillStyle = '#1f2937';
      ctx.beginPath();
      ctx.arc(0, -25 + walkBob, 11, Math.PI * 0.8, Math.PI * 2.2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -20 + walkBob, 9, 0.2, Math.PI - 0.2);
      ctx.fill();

      // Video Game Controller / Mini Laptop in hand
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(10, 0 + walkBob, 8, 6);

      ctx.restore();
    }
  }
};
