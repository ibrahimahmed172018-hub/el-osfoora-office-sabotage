/**
 * tasks.js — Egyptian Slang Mini-games System
 * تشغيل وبرمجة جميع الألعاب المصغرة المصرية
 */

class TaskManager {
  constructor() {
    this.currentTaskId = null;
    this.currentStationId = null;
    this.activeTaskModal = null;

    // Router State
    this.routerUnplugged = false;
    this.routerTimer = null;
    this.routerSecondsLeft = 5;

    // Bugs State
    this.bugsSquashed = 0;
    this.bugsRequired = 5;
    this.bugInterval = null;

    // Budget State
    this.targetBudget = 0;
    this.currentBudget = 0;

    // Coffee State
    this.coffeeReq = { coffee: 2, sugar: 2 };
    this.coffeeCurrent = { coffee: 0, sugar: 0, stirred: false };

    // General Interval tracker for safe cleanup
    this.activeIntervals = [];

    this.initDOM();
  }

  initDOM() {
    // Close task buttons
    document.querySelectorAll('.btn-close-task').forEach(btn => {
      btn.addEventListener('click', () => this.closeCurrentTask());
    });

    // Close task on overlay backdrop click
    document.querySelectorAll('.task-modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.closeCurrentTask();
        }
      });
    });

    // 1. Router Plug Events
    const plug = document.getElementById('power-plug');
    if (plug) {
      plug.addEventListener('click', () => this.handleRouterPlugToggle());
    }

    // 3. Budget Currency Buttons
    document.querySelectorAll('.currency-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const val = parseInt(e.target.dataset.val, 10);
        this.addBudgetMoney(val);
      });
    });

    const resetBudgetBtn = document.getElementById('btn-reset-budget');
    if (resetBudgetBtn) {
      resetBudgetBtn.addEventListener('click', () => this.resetBudget());
    }

    const submitBudgetBtn = document.getElementById('btn-submit-budget');
    if (submitBudgetBtn) {
      submitBudgetBtn.addEventListener('click', () => this.submitBudget());
    }

    // 4. Coffee Events
    const addCoffeeBtn = document.getElementById('btn-add-coffee-powder');
    if (addCoffeeBtn) {
      addCoffeeBtn.addEventListener('click', () => {
        this.coffeeCurrent.coffee++;
        document.getElementById('curr-coffee-spoons').innerText = this.coffeeCurrent.coffee;
        window.soundEngine?.playTone(400, 'sine', 0.05, 0.2);
        this.updateCoffeeLiquid();
      });
    }

    const addSugarBtn = document.getElementById('btn-add-sugar-powder');
    if (addSugarBtn) {
      addSugarBtn.addEventListener('click', () => {
        this.coffeeCurrent.sugar++;
        document.getElementById('curr-sugar-spoons').innerText = this.coffeeCurrent.sugar;
        window.soundEngine?.playTone(600, 'sine', 0.05, 0.2);
        this.updateCoffeeLiquid();
      });
    }

    const stirBtn = document.getElementById('btn-stir-coffee');
    if (stirBtn) {
      stirBtn.addEventListener('click', () => {
        this.coffeeCurrent.stirred = true;
        window.soundEngine?.playTone(300, 'sawtooth', 0.2, 0.3);
        const stick = document.getElementById('stir-stick');
        if (stick) {
          stick.style.transform = 'rotate(20deg)';
          setTimeout(() => stick.style.transform = 'rotate(-20deg)', 150);
          setTimeout(() => stick.style.transform = 'rotate(0deg)', 300);
        }
        document.getElementById('btn-brew-coffee')?.classList.remove('disabled');
      });
    }

    const brewBtn = document.getElementById('btn-brew-coffee');
    if (brewBtn) {
      brewBtn.addEventListener('click', () => this.submitCoffee());
    }
  }

  getAssignedTaskForStation(stationId) {
    if (!window.gameUI || !window.gameUI.assignedTasks) return null;
    return window.gameUI.assignedTasks.find(t =>
      (t.id === stationId || t.stationId === stationId) && !t.completed
    );
  }

  openTask(stationId, characterId = 'bashmohandes') {
    this.currentStationId = stationId;

    // Find parent task id if multi-stage or mapped
    let parentTask = this.getAssignedTaskForStation(stationId);
    if (!parentTask && window.gameUI && window.gameUI.isSaboteur) {
      // Fake tasks for saboteur
      parentTask = { id: stationId, stationId: stationId };
    }
    this.currentTaskId = parentTask ? parentTask.id : stationId;

    // Reset previous task modals
    document.querySelectorAll('.task-modal-overlay').forEach(m => m.classList.add('hidden'));

    if (stationId === 'router') {
      this.startRouterTask();
    } else if (stationId === 'bugs') {
      this.startBugsTask();
    } else if (stationId === 'budget') {
      this.startBudgetTask();
    } else if (stationId === 'coffee') {
      this.startCoffeeTask();
    } else if (stationId === 'card_swipe') {
      this.startCardSwipeTask();
    } else if (stationId === 'hr_stamp') {
      this.startHRStampTask();
    } else if (stationId === 'trash_empty') {
      this.startTrashEmptyTask();
    } else if (stationId === 'wires') {
      this.startWiresTask();
    } else if (stationId === 'printer_jam') {
      this.startPrinterJamTask();
    } else if (stationId === 'water_cooler') {
      this.startWaterCoolerTask();
    } else if (stationId === 'air_conditioner') {
      this.startACTask();
    } else if (stationId === 'sanitize_hands') {
      this.startSanitizeTask();
    } else if (stationId === 'light_switch') {
      this.startLightSwitchTask();
    } else if (stationId === 'stapler') {
      this.startStaplerTask();
    } else if (stationId === 'sticky_notes') {
      this.startStickyNotesTask();
    } else if (stationId === 'shred_secrets') {
      this.startShredSecretsTask();
    } else if (stationId === 'backup_download') {
      this.startDataTransferTask('download');
    } else if (stationId === 'data_upload') {
      this.startDataTransferTask('upload');
    } else if (stationId === 'tea_buffet') {
      this.startTeaDeliveryTask(1);
    } else if (stationId === 'deliver_tea') {
      this.startTeaDeliveryTask(2);
    } else if (stationId === 'invoice_start') {
      this.startInvoiceTask(1);
    } else if (stationId === 'invoice_ceo') {
      this.startInvoiceTask(2);
    } else if (stationId === 'projector_cable') {
      this.startProjectorTask(1);
    } else if (stationId === 'projector_screen') {
      this.startProjectorTask(2);
    } else if (stationId === 'koshary_pickup') {
      this.startKosharyTask(1);
    } else if (stationId === 'koshary_distribute') {
      this.startKosharyTask(2);
    } else if (stationId === 'dual_breaker_a' || stationId === 'dual_breaker_b') {
      this.startDualBreakerTask(stationId);
    } else if (stationId.startsWith('special_')) {
      this.startSpecialTask(stationId.replace('special_', ''));
    }
  }

  closeCurrentTask() {
    if (this.routerTimer) clearInterval(this.routerTimer);
    if (this.bugInterval) clearInterval(this.bugInterval);
    this.activeIntervals.forEach(i => clearInterval(i));
    this.activeIntervals = [];

    document.querySelectorAll('.task-modal-overlay').forEach(m => {
      m.classList.add('hidden');
      const penalty = m.querySelector('.task-penalty-overlay');
      if (penalty) penalty.classList.add('hidden');
      m.classList.remove('penalty-shake');
    });
    this.currentTaskId = null;
    this.currentStationId = null;
  }

  // Fail Penalties & Cooldown System (غرامات الخطأ وتجميد التاسك لمنع التخمين)
  applyTaskPenalty(modalElement, seconds = 3, reason = 'خطأ في التنفيذ! تم تجميد التاسك ⛔', onFinish = null) {
    if (!modalElement) return;
    window.soundEngine?.playPenaltySound();

    modalElement.classList.remove('penalty-shake');
    void modalElement.offsetWidth; // Trigger browser reflow
    modalElement.classList.add('penalty-shake');

    let overlay = modalElement.querySelector('.task-penalty-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'task-penalty-overlay';
      modalElement.appendChild(overlay);
    }

    let left = seconds;
    const updateUI = () => {
      overlay.innerHTML = `
        <div class="penalty-lock-icon">🔒</div>
        <h3 style="color:#ef4444; margin-bottom:5px;">${reason}</h3>
        <div class="penalty-timer-ring">${left}s</div>
        <p class="penalty-reason-text">تم تجميد التاسك مؤقتاً لخصم وقت ومنع النقر العشوائي!</p>
      `;
    };
    updateUI();
    overlay.classList.remove('hidden');

    const penaltyInterval = setInterval(() => {
      left--;
      if (left <= 0) {
        clearInterval(penaltyInterval);
        overlay.classList.add('hidden');
        modalElement.classList.remove('penalty-shake');
        if (onFinish) onFinish();
      } else {
        updateUI();
      }
    }, 1000);
    this.activeIntervals.push(penaltyInterval);
  }

  completeCurrentTask(overrideTaskId) {
    window.soundEngine?.playTaskSuccess();
    const taskIdToSend = overrideTaskId || this.currentTaskId;
    const stationId = this.currentStationId;
    this.closeCurrentTask();

    if (window.gameUI && window.gameUI.socket) {
      // Broadcast real-time visual proof of innocence to all players in the map
      if (taskIdToSend === 'coffee') {
        window.gameUI.socket.emit('trigger_visual_task', { taskType: 'coffee_steam', stationId: 'coffee', x: 1220, y: 680 });
      } else if (taskIdToSend === 'water_cooler') {
        window.gameUI.socket.emit('trigger_visual_task', { taskType: 'water_flow', stationId: 'water_cooler', x: 1280, y: 580 });
      } else if (['router', 'wires', 'bugs', 'backup_data'].includes(taskIdToSend)) {
        window.gameUI.socket.emit('trigger_visual_task', { taskType: 'server_glow', stationId: stationId || 'wires', x: 260, y: 640 });
      } else if (taskIdToSend === 'card_swipe') {
        window.gameUI.socket.emit('trigger_visual_task', { taskType: 'laser_scan', stationId: 'card_swipe', x: 140, y: 150 });
      } else if (taskIdToSend === 'printer_jam') {
        window.gameUI.socket.emit('trigger_visual_task', { taskType: 'printer_sheet', stationId: 'printer_jam', x: 300, y: 180 });
      } else if (taskIdToSend === 'trash_empty') {
        window.gameUI.socket.emit('trigger_visual_task', { taskType: 'shredder_confetti', stationId: 'trash_empty', x: 520, y: 390 });
      }

      window.gameUI.socket.emit('task_completed', { taskId: taskIdToSend });
    }
  }

  // ================= 1. ROUTER TASK =================
  startRouterTask() {
    const modal = document.getElementById('task-modal-router');
    modal.classList.remove('hidden');

    this.routerUnplugged = false;
    // Fully randomized countdown between 4 and 8 seconds
    this.routerDuration = [4, 5, 6, 7, 8][Math.floor(Math.random() * 5)];
    this.routerSecondsLeft = this.routerDuration;
    if (this.routerTimer) clearInterval(this.routerTimer);

    const plug = document.getElementById('power-plug');
    plug.classList.remove('unplugged');
    plug.classList.add('plugged');
    plug.querySelector('.plug-body').innerText = 'اسحب الفيشة';

    document.querySelectorAll('.r-light').forEach(l => l.classList.add('active'));
    document.getElementById('router-countdown').innerText = 'الفيشة متوصلة — اسحبها الأول!';
  }

  handleRouterPlugToggle() {
    const plug = document.getElementById('power-plug');
    window.soundEngine.playPlugSound();

    if (!this.routerUnplugged) {
      // Unplug!
      this.routerUnplugged = true;
      plug.classList.remove('plugged');
      plug.classList.add('unplugged');
      plug.querySelector('.plug-body').innerText = 'الفيشة مفصولة';

      document.querySelectorAll('.r-light').forEach(l => l.classList.remove('active'));

      this.routerSecondsLeft = this.routerDuration || 5;
      const countEl = document.getElementById('router-countdown');
      countEl.innerText = `استنى الراوتر يفصل شحنة (${this.routerSecondsLeft} ثواني)...`;

      this.routerTimer = setInterval(() => {
        this.routerSecondsLeft--;
        if (this.routerSecondsLeft > 0) {
          countEl.innerText = `استنى الراوتر يفصل شحنة (${this.routerSecondsLeft} ثواني)...`;
          window.soundEngine.playTone(500, 'sine', 0.05, 0.1);
        } else {
          clearInterval(this.routerTimer);
          countEl.innerText = '✅ تمام! حط الفيشة تاني في الحيطة!';
          plug.querySelector('.plug-body').innerText = 'ركّب الفيشة الآن!';
        }
      }, 1000);
      this.activeIntervals.push(this.routerTimer);

    } else if (this.routerSecondsLeft <= 0) {
      // Plug back in!
      this.routerUnplugged = false;
      plug.classList.remove('unplugged');
      plug.classList.add('plugged');
      plug.querySelector('.plug-body').innerText = 'الفيشة متوصلة';
      document.querySelectorAll('.r-light').forEach(l => l.classList.add('active'));
      document.getElementById('router-countdown').innerText = 'النت رجع سريع زي الصاروخ! 🚀';

      setTimeout(() => this.completeCurrentTask('router'), 700);
    } else {
      // Premature plug in
      document.getElementById('router-countdown').innerText = `⚠️ استعجلت! استنى العداد يخلص الـ ${this.routerDuration} ثواني!`;
      this.applyTaskPenalty(document.getElementById('task-modal-router'), 3, 'استعجلت وركبت الفيشة قبل ما الراوتر يفصل شحنة ⛔');
    }
  }

  // ================= 2. BUGS TASK =================
  startBugsTask() {
    const modal = document.getElementById('task-modal-bugs');
    modal.classList.remove('hidden');

    this.bugsSquashed = 0;
    // Random required bugs between 4 and 7
    this.bugsRequired = [4, 5, 6, 7][Math.floor(Math.random() * 4)];
    document.getElementById('bugs-remaining-count').innerText = this.bugsRequired - this.bugsSquashed;

    const grid = document.getElementById('bugs-grid');
    grid.innerHTML = '';

    for (let i = 0; i < 9; i++) {
      const slot = document.createElement('div');
      slot.className = 'bug-slot';
      slot.dataset.index = i;
      slot.addEventListener('click', () => this.squashBug(slot));
      grid.appendChild(slot);
    }

    if (this.bugInterval) clearInterval(this.bugInterval);
    this.spawnRandomBug();
    const spawnSpeed = 650 + Math.floor(Math.random() * 300); // 650-950ms dynamic speed
    this.bugInterval = setInterval(() => this.spawnRandomBug(), spawnSpeed);
    this.activeIntervals.push(this.bugInterval);
  }

  spawnRandomBug() {
    const slots = document.querySelectorAll('.bug-slot');
    slots.forEach(s => {
      s.innerHTML = '';
      s.classList.remove('has-bug');
    });

    const randSlot = slots[Math.floor(Math.random() * slots.length)];
    const bugEmojis = ['🐛', '🐞', '🕷️', '🪲', '🐜', '🦟', '🦂'];
    randSlot.innerHTML = bugEmojis[Math.floor(Math.random() * bugEmojis.length)];
    randSlot.classList.add('has-bug');
  }

  squashBug(slot) {
    if (slot.classList.contains('has-bug')) {
      slot.classList.remove('has-bug');
      slot.innerHTML = '💥';
      window.soundEngine.playTone(800, 'sawtooth', 0.08, 0.25);

      this.bugsSquashed++;
      const remain = Math.max(0, this.bugsRequired - this.bugsSquashed);
      document.getElementById('bugs-remaining-count').innerText = remain;

      if (this.bugsSquashed >= this.bugsRequired) {
        if (this.bugInterval) clearInterval(this.bugInterval);
        setTimeout(() => this.completeCurrentTask('bugs'), 600);
      }
    }
  }

  // ================= 3. BUDGET TASK =================
  startBudgetTask() {
    const modal = document.getElementById('task-modal-budget');
    modal.classList.remove('hidden');

    // Fully randomized dynamic target budget every time (250 to 1250 EGP in 50s/10s increments)
    const baseAmount = (Math.floor(Math.random() * 20) + 5) * 50; // 250, 300, ..., 1250
    const extraSmall = [0, 20, 30, 40, 70, 80][Math.floor(Math.random() * 6)];
    this.targetBudget = baseAmount + extraSmall;
    this.currentBudget = 0;

    document.getElementById('target-budget-amount').innerText = this.targetBudget;
    document.getElementById('current-budget-sum').innerText = this.currentBudget;

    // Randomize the order of the currency buttons in the grid
    const grid = modal.querySelector('.currency-grid');
    if (grid) {
      const buttons = Array.from(grid.children);
      buttons.sort(() => Math.random() - 0.5);
      buttons.forEach(btn => grid.appendChild(btn));
    }
  }

  addBudgetMoney(val) {
    this.currentBudget += val;
    document.getElementById('current-budget-sum').innerText = this.currentBudget;
    window.soundEngine.playCoinClink();
  }

  resetBudget() {
    this.currentBudget = 0;
    document.getElementById('current-budget-sum').innerText = this.currentBudget;
    window.soundEngine.playTone(200, 'sine', 0.1, 0.2);
  }

  submitBudget() {
    if (this.currentBudget === this.targetBudget) {
      this.completeCurrentTask('budget');
    } else {
      const modal = document.getElementById('task-modal-budget');
      this.applyTaskPenalty(modal, 3, `الحساب غلط! المطلوب ${this.targetBudget} ج.م وأنت حسبت ${this.currentBudget} ج.م ⛔`, () => {
        this.resetBudget();
      });
    }
  }

  // ================= 4. COFFEE TASK =================
  startCoffeeTask() {
    const modal = document.getElementById('task-modal-coffee');
    modal.classList.remove('hidden');

    // Dynamic Coffee Recipe Order generator
    const recipes = [
      { name: 'قهوة سادة', coffee: 2, sugar: 0, desc: '2 معلقة بن + 0 سكر (سادة)' },
      { name: 'قهوة ع الريحة', coffee: 2, sugar: 1, desc: '2 معلقة بن + 1 معلقة سكر (ع الريحة)' },
      { name: 'قهوة مظبوطة', coffee: 2, sugar: 2, desc: '2 معلقة بن + 2 معلقة سكر (مظبوطة)' },
      { name: 'قهوة زيادة', coffee: 2, sugar: 3, desc: '2 معلقة بن + 3 معالق سكر (زيادة)' },
      { name: 'قهوة مانو تقيلة', coffee: 3, sugar: 2, desc: '3 معالق بن + 2 معلقة سكر (مانو)' },
      { name: 'قهوة كراميل خفيفة', coffee: 1, sugar: 3, desc: '1 معلقة بن + 3 معالق سكر (خفيفة)' }
    ];
    this.coffeeReq = recipes[Math.floor(Math.random() * recipes.length)];

    const guideEl = modal.querySelector('.coffee-recipe-guide');
    if (guideEl) {
      guideEl.innerHTML = `المطلوب لطلب العميل: <strong>${this.coffeeReq.name}</strong> (<span id="coffee-req-coffee">${this.coffeeReq.coffee}</span> معلقة بن + <span id="coffee-req-sugar">${this.coffeeReq.sugar}</span> معلقة سكر) ثم تقليب وغليان`;
    }

    this.coffeeCurrent = { coffee: 0, sugar: 0, stirred: false };
    document.getElementById('curr-coffee-spoons').innerText = 0;
    document.getElementById('curr-sugar-spoons').innerText = 0;
    document.getElementById('btn-brew-coffee')?.classList.add('disabled');
    this.updateCoffeeLiquid();
  }

  updateCoffeeLiquid() {
    const liquid = document.getElementById('kanaka-liquid');
    const total = this.coffeeCurrent.coffee + this.coffeeCurrent.sugar;
    if (liquid) {
      liquid.style.height = `${20 + total * 15}%`;
    }
  }

  submitCoffee() {
    if (
      this.coffeeCurrent.coffee === this.coffeeReq.coffee &&
      this.coffeeCurrent.sugar === this.coffeeReq.sugar &&
      this.coffeeCurrent.stirred
    ) {
      window.soundEngine?.playSteamSound();
      window.soundEngine.playTone(150, 'sawtooth', 0.8, 0.3); // Boiling sound
      setTimeout(() => this.completeCurrentTask('coffee'), 900);
    } else {
      const modal = document.getElementById('task-modal-coffee');
      this.applyTaskPenalty(modal, 3, `القهوة باظت! مطلوب (${this.coffeeReq.desc}) وأنت حطيت (${this.coffeeCurrent.coffee} بن + ${this.coffeeCurrent.sugar} سكر) ⛔`, () => {
        this.startCoffeeTask();
      });
    }
  }

  // ================= 6. CARD SWIPE TASK =================
  startCardSwipeTask() {
    const modal = document.getElementById('task-modal-cardswipe');
    modal.classList.remove('hidden');

    const card = document.getElementById('draggable-id-card');
    const light = document.getElementById('card-scanner-light');
    const status = document.getElementById('card-scanner-status');

    // Randomize Employee Badge Data
    const fakeEmployees = [
      { name: 'م/ إبراهيم أحمد', id: '#2026-DEV', photo: '👨‍💻' },
      { name: 'أ/ مصطفى بابلو', id: '#1098-DES', photo: '🎨' },
      { name: 'كابتن سمعان', id: '#4401-PRD', photo: '⚽' },
      { name: 'د/ موسى طارق', id: '#9932-MKT', photo: '📢' },
      { name: 'م/ عبدالمنعم', id: '#7714-SYS', photo: '⚡' },
      { name: 'أ/ الشطلاوي', id: '#3308-VID', photo: '🎬' }
    ];
    const randEmp = fakeEmployees[Math.floor(Math.random() * fakeEmployees.length)];
    const cardText = card.querySelector('.card-text');
    const cardPhoto = card.querySelector('.card-photo');
    if (cardText) {
      cardText.innerHTML = `<strong>${randEmp.name}</strong><span>ID: ${randEmp.id}</span>`;
    }
    if (cardPhoto) {
      cardPhoto.innerText = randEmp.photo;
    }

    light.className = 'scanner-light';
    status.innerText = 'برجاء تمرير كارت الشركة من اليمين للشمال';
    card.style.transform = 'translateX(0px)';
    card.style.transition = 'none';

    let startX = 0;
    let startTime = 0;
    let isDragging = false;
    let hasCompleted = false;

    const onPointerDown = (e) => {
      if (hasCompleted) return;
      isDragging = true;
      startX = e.clientX || (e.touches && e.touches[0].clientX);
      startTime = Date.now();
      card.style.transition = 'none';
      window.soundEngine?.playTone(400, 'sine', 0.05, 0.2);
    };

    const onPointerMove = (e) => {
      if (!isDragging || hasCompleted) return;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const deltaX = clientX - startX;
      if (deltaX < 0) {
        const move = Math.max(-280, deltaX);
        card.style.transform = `translateX(${move}px)`;
      }
    };

    const onPointerUp = (e) => {
      if (!isDragging || hasCompleted) return;
      isDragging = false;
      const endTime = Date.now();
      const elapsed = endTime - startTime;
      const clientX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX);
      const totalMoved = Math.abs(clientX - startX);

      if (totalMoved >= 200) {
        if (elapsed < 160) {
          light.className = 'scanner-light';
          status.innerText = '⚠️ سحب سريع أوي! تم قفل ماكينة البصمة مؤقتاً';
          card.style.transition = 'transform 0.3s ease';
          card.style.transform = 'translateX(0px)';
          this.applyTaskPenalty(modal, 3, 'سحب سريع جداً (< 160ms)! اسحب على مهلك ⛔');
        } else if (elapsed > 1500) {
          light.className = 'scanner-light';
          status.innerText = '⚠️ سحب بطيء أوي! تم قفل ماكينة البصمة مؤقتاً';
          card.style.transition = 'transform 0.3s ease';
          card.style.transform = 'translateX(0px)';
          this.applyTaskPenalty(modal, 3, 'سحب بطيء جداً (> 1.5s)! اسحبه بحركة واحدة ⛔');
        } else {
          hasCompleted = true;
          light.className = 'scanner-light ready';
          status.innerText = `✅ تم تسجيل حضور ${randEmp.name} في الموعد!`;
          window.soundEngine?.playLaserSound();
          setTimeout(() => this.completeCurrentTask('card_swipe'), 700);
        }
      } else {
        card.style.transition = 'transform 0.3s ease';
        card.style.transform = 'translateX(0px)';
      }
    };

    card.onmousedown = onPointerDown;
    window.onmousemove = onPointerMove;
    window.onmouseup = onPointerUp;
    card.ontouchstart = onPointerDown;
    window.ontouchmove = onPointerMove;
    window.ontouchend = onPointerUp;
  }

  // ================= 7. HR STAMPS TASK =================
  startHRStampTask() {
    const modal = document.getElementById('task-modal-hrstamp');
    modal.classList.remove('hidden');

    // Dynamic HR Documents pool
    const docs = [
      { header: '📄 استمارة طلب إجازة سنوية — شؤون العاملين', desc: 'بموجب هذا الطلب، يُرجى اعتماد استمارة الإجازة وتوقيع الأختام الرسمية للشركة.', s1: '🔴 معتمد - المدير العام', s2: '🔴 ختم النسر - HR' },
      { header: '🧾 طلب سلفة على المرتب — الإدارة المالية', desc: 'طلب صرف سلفة عاجلة بضمان رصيد الإجازات السنوية وموافقة الإدارة.', s1: '🔴 موافقة الحسابات', s2: '🔴 اعتماد المدير المالي' },
      { header: '📑 إذن انصراف مبكر ومأمورية خارجية', desc: 'إذن مغادرة مقر الشركة لأداء مهمة عمل عاجلة لدى العميل.', s1: '🔴 موافقة مدير القسم', s2: '🔴 إذن أمن البوابة' },
      { header: '⚖️ تظلم خصم تأخير البصمة — لجنة الموظفين', desc: 'مذكرة تظلم بشأن عطل جهاز البصمة الصباحي لإلغاء الخصم المالي.', s1: '🔴 قبول التظلم', s2: '🔴 إلغاء الخصم - HR' }
    ];
    const doc = docs[Math.floor(Math.random() * docs.length)];

    const headerEl = modal.querySelector('.doc-header');
    const descEl = modal.querySelector('.doc-body');
    if (headerEl) headerEl.innerText = doc.header;
    if (descEl) descEl.innerText = doc.desc;

    const slot1 = document.getElementById('stamp-slot-1');
    const slot2 = document.getElementById('stamp-slot-2');
    const submitBtn = document.getElementById('btn-submit-stamp');

    slot1.className = 'stamp-slot';
    slot2.className = 'stamp-slot';
    slot1.innerHTML = `<span>[ ${doc.s1.replace('🔴 ', '')} ]</span>`;
    slot2.innerHTML = `<span>[ ${doc.s2.replace('🔴 ', '')} ]</span>`;
    submitBtn.className = 'btn btn-primary disabled';

    let stamped1 = false;
    let stamped2 = false;

    const checkBothStamped = () => {
      if (stamped1 && stamped2) {
        submitBtn.classList.remove('disabled');
      }
    };

    slot1.onclick = () => {
      if (stamped1) return;
      stamped1 = true;
      slot1.classList.add('stamped');
      slot1.innerHTML = doc.s1;
      window.soundEngine?.playTone(200, 'square', 0.15, 0.5);
      checkBothStamped();
    };

    slot2.onclick = () => {
      if (stamped2) return;
      stamped2 = true;
      slot2.classList.add('stamped');
      slot2.innerHTML = doc.s2;
      window.soundEngine?.playTone(240, 'square', 0.15, 0.5);
      checkBothStamped();
    };

    document.getElementById('btn-apply-stamp').onclick = () => {
      if (!stamped1) slot1.onclick();
      else if (!stamped2) slot2.onclick();
    };

    submitBtn.onclick = () => {
      if (stamped1 && stamped2) {
        this.completeCurrentTask('hr_stamp');
      }
    };
  }

  // ================= 8. TRASH SHREDDER TASK =================
  startTrashEmptyTask() {
    const modal = document.getElementById('task-modal-trashempty');
    modal.classList.remove('hidden');

    const handle = document.getElementById('shredder-handle');
    const fill = document.getElementById('trash-progress-fill');
    const papers = document.getElementById('shredder-papers');
    const info = document.getElementById('trash-instruction-text');

    fill.style.width = '0%';
    handle.style.top = '5px';
    papers.style.opacity = '1';
    info.innerText = 'اضغط مع الاستمرار على اليد واسحبها للأسفل حتى يكتمل التفريغ!';

    let progress = 0;
    let shredInterval = null;
    let isHolding = false;

    const startHolding = () => {
      isHolding = true;
      handle.style.top = '65px';
      window.soundEngine?.playTone(280, 'sawtooth', 0.1, 0.3);

      shredInterval = setInterval(() => {
        if (!isHolding) return;
        progress += 10;
        fill.style.width = `${progress}%`;
        papers.style.opacity = `${1 - progress / 100}`;
        window.soundEngine?.playTone(300 + progress * 4, 'sawtooth', 0.05, 0.2);

        if (progress >= 100) {
          clearInterval(shredInterval);
          info.innerText = '✅ تم تفريغ المفرمة والورق بالكامل!';
          window.soundEngine?.playTaskSuccess();
          setTimeout(() => this.completeCurrentTask('trash_empty'), 500);
        }
      }, 100);
      this.activeIntervals.push(shredInterval);
    };

    const stopHolding = () => {
      isHolding = false;
      if (shredInterval) clearInterval(shredInterval);
      if (progress < 100) {
        progress = 0;
        fill.style.width = '0%';
        handle.style.top = '5px';
        papers.style.opacity = '1';
      }
    };

    handle.onmousedown = startHolding;
    window.onmouseup = stopHolding;
    handle.ontouchstart = startHolding;
    window.ontouchend = stopHolding;
  }

  // ================= 9. NETWORK WIRES TASK =================
  startWiresTask() {
    const modal = document.getElementById('task-modal-wires');
    modal.classList.remove('hidden');

    const leftCol = document.getElementById('wire-left-ports');
    const rightCol = document.getElementById('wire-right-ports');
    const svg = document.getElementById('wires-svg');

    leftCol.innerHTML = '';
    rightCol.innerHTML = '';
    svg.innerHTML = '';

    // Expanded pool of 8 vibrant wire colors
    const allColors = [
      { id: 'red', name: 'أحمر', hex: '#ef4444' },
      { id: 'blue', name: 'أزرق', hex: '#3b82f6' },
      { id: 'yellow', name: 'أصفر', hex: '#eab308' },
      { id: 'green', name: 'أخضر', hex: '#22c55e' },
      { id: 'purple', name: 'بنفسجي', hex: '#a855f7' },
      { id: 'orange', name: 'برتقالي', hex: '#f97316' },
      { id: 'cyan', name: 'سماوي', hex: '#06b6d4' },
      { id: 'pink', name: 'وردي', hex: '#ec4899' }
    ];

    // Pick 4 RANDOM colors from pool of 8
    const chosenColors = [...allColors].sort(() => Math.random() - 0.5).slice(0, 4);

    // Shuffle BOTH left and right independently for pure dynamic puzzle
    const leftOrder = [...chosenColors].sort(() => Math.random() - 0.5);
    const rightOrder = [...chosenColors].sort(() => Math.random() - 0.5);

    let selectedLeft = null;
    let connectedCount = 0;

    leftOrder.forEach((c) => {
      const node = document.createElement('div');
      node.className = `wire-node wire-${c.id} left`;
      node.dataset.color = c.id;
      node.innerText = '🔌';
      node.onclick = () => {
        if (node.classList.contains('connected')) return;
        document.querySelectorAll('.wire-node.left').forEach(n => n.classList.remove('selected'));
        node.classList.add('selected');
        selectedLeft = c;
        window.soundEngine?.playTone(500, 'sine', 0.05, 0.2);
      };
      leftCol.appendChild(node);
    });

    rightOrder.forEach((c) => {
      const node = document.createElement('div');
      node.className = `wire-node wire-${c.id} right`;
      node.dataset.color = c.id;
      node.innerText = '⚡';
      node.onclick = () => {
        if (node.classList.contains('connected')) return;
        if (!selectedLeft) return;

        if (selectedLeft.id === c.id) {
          const leftNode = document.querySelector(`.wire-node.left[data-color="${c.id}"]`);
          leftNode.classList.remove('selected');
          leftNode.classList.add('connected');
          node.classList.add('connected');

          this.drawWireSVG(leftNode, node, c.hex);
          window.soundEngine?.playPlugSound();
          selectedLeft = null;
          connectedCount++;

          if (connectedCount >= 4) {
            setTimeout(() => this.completeCurrentTask('wires'), 600);
          }
        } else {
          this.applyTaskPenalty(modal, 3, 'شورت كهربائي! السلك مش واصل في لونه المظبوط ⚡');
        }
      };
      rightCol.appendChild(node);
    });
  }

  drawWireSVG(nodeA, nodeB, hex) {
    const svg = document.getElementById('wires-svg');
    const panel = document.getElementById('patch-panel');
    const pRect = panel.getBoundingClientRect();
    const aRect = nodeA.getBoundingClientRect();
    const bRect = nodeB.getBoundingClientRect();

    const x1 = (aRect.left + aRect.width / 2) - pRect.left;
    const y1 = (aRect.top + aRect.height / 2) - pRect.top;
    const x2 = (bRect.left + bRect.width / 2) - pRect.left;
    const y2 = (bRect.top + bRect.height / 2) - pRect.top;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', hex);
    line.setAttribute('stroke-width', '6');
    line.setAttribute('stroke-linecap', 'round');
    svg.appendChild(line);
  }

  // ================= 10. PRINTER JAM TASK =================
  startPrinterJamTask() {
    const modal = document.getElementById('task-modal-printerjam');
    modal.classList.remove('hidden');

    const paper = document.getElementById('jammed-paper');
    const screen = document.getElementById('printer-status-screen');

    paper.style.bottom = '5px';
    paper.style.transition = 'none';
    screen.innerText = '⚠️ تنبيه: ورق محشور في التغذية!';
    screen.style.color = '#f87171';

    let startY = 0;
    let isDragging = false;
    let isDone = false;

    const onStart = (e) => {
      if (isDone) return;
      isDragging = true;
      startY = e.clientY || (e.touches && e.touches[0].clientY);
    };

    const onMove = (e) => {
      if (!isDragging || isDone) return;
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      const deltaY = startY - clientY;
      if (deltaY > 0) {
        const pull = Math.min(95, deltaY);
        paper.style.bottom = `${5 + pull}px`;

        if (pull >= 75) {
          isDone = true;
          isDragging = false;
          screen.innerText = '✅ تم تسليك الورقة والرول سليم 100%!';
          screen.style.color = '#22c55e';
          window.soundEngine?.playTone(750, 'sine', 0.1, 0.3);
          setTimeout(() => this.completeCurrentTask('printer_jam'), 600);
        }
      }
    };

    const onEnd = () => {
      if (!isDone) {
        isDragging = false;
        paper.style.transition = 'bottom 0.2s ease';
        paper.style.bottom = '5px';
      }
    };

    paper.onmousedown = onStart;
    window.onmousemove = onMove;
    window.onmouseup = onEnd;
    paper.ontouchstart = onStart;
    window.ontouchmove = onMove;
    window.ontouchend = onEnd;
  }

  // ================= 11. DATA TRANSFER TASK (BACKUP MULTI-STAGE) =================
  startDataTransferTask(direction = 'download') {
    const modal = document.getElementById('task-modal-datatransfer');
    modal.classList.remove('hidden');

    const title = document.getElementById('transfer-task-title');
    const screenTitle = document.getElementById('transfer-screen-title');
    const icon = document.getElementById('transfer-icon');
    const fill = document.getElementById('transfer-progress-fill');
    const stats = document.getElementById('transfer-stats');
    const startBtn = document.getElementById('btn-start-transfer');

    // Randomized backup file size & name
    const filePool = [
      { name: 'backup_database_prod_2026.sql', size: 680 },
      { name: 'company_finance_records.enc', size: 450 },
      { name: 'clients_crm_full_dump.tar.gz', size: 1200 },
      { name: 'git_repository_archive.bundle', size: 850 },
      { name: 'server_system_snapshot.iso', size: 2400 }
    ];
    this.currentTransferFile = filePool[Math.floor(Math.random() * filePool.length)];

    fill.style.width = '0%';
    startBtn.disabled = false;
    startBtn.className = 'btn btn-primary btn-large';

    if (direction === 'download') {
      title.innerText = `💾 تاسك الباك-أب: تحميل داتا السيرفر (${this.currentTransferFile.name})`;
      screenTitle.innerText = `جاهز لتحميل (${this.currentTransferFile.name}) — الحجم: ${this.currentTransferFile.size} MB`;
      icon.innerText = '🖥️ ➡️ 💾';
      startBtn.innerText = '🚀 ابدأ التحميل من السيرفر';
    } else {
      title.innerText = `💻 تاسك الباك-أب: رفع الداتا على لابتوب العميل (${this.currentTransferFile.name})`;
      screenTitle.innerText = `جاهز لرفع النسخة الاحتياطية (${this.currentTransferFile.name}) على لابتوب العميل`;
      icon.innerText = '💾 ➡️ 💻';
      startBtn.innerText = '☁️ ابدأ رفع الداتا للعميل';
    }

    startBtn.onclick = () => {
      startBtn.disabled = true;
      startBtn.className = 'btn btn-secondary btn-large disabled';

      let p = 0;
      const interval = setInterval(() => {
        p += 5;
        fill.style.width = `${p}%`;
        const mb = Math.round((p / 100) * this.currentTransferFile.size);
        stats.innerText = `${mb} MB / ${this.currentTransferFile.size} MB (${p}%)`;
        window.soundEngine?.playTone(400 + p * 6, 'sine', 0.03, 0.1);

        if (p >= 100) {
          clearInterval(interval);
          if (direction === 'download') {
            screenTitle.innerText = '✅ تم التحميل! توجه لقاعة الاجتماعات لرفع الملفات للعميل!';
            window.showGameAlert(`💾 تم تحميل (${this.currentTransferFile.name})! توجه لقاعة الاجتماعات لرفعه!`, 'info');
          } else {
            screenTitle.innerText = '✅ تم تسليم الداتا للعميل بنجاح!';
            window.showGameAlert('💻 تم تسليم الداتا للعميل بنجاح!', 'success');
          }
          window.soundEngine?.playTaskSuccess();
          setTimeout(() => this.completeCurrentTask('backup_data'), 700);
        }
      }, 80);
      this.activeIntervals.push(interval);
    };
  }

  // ================= 12. TEA DELIVERY MULTI-STAGE =================
  startTeaDeliveryTask(stage = 1) {
    const modal = document.getElementById('task-modal-teadelivery');
    modal.classList.remove('hidden');

    const teaTypes = ['شاي بالنعناع مظبوط ☕🌿', 'شاي كشري تقيل ع الريحة ☕', 'شاي أخضر بالليمون 🍵🍋', 'شاي بلبن سكر خفيف 🫖'];
    this.currentTeaOrder = teaTypes[Math.floor(Math.random() * teaTypes.length)];

    const s1 = document.getElementById('tea-stage-1-box');
    const s2 = document.getElementById('tea-stage-2-box');

    if (stage === 1) {
      s1.classList.remove('hidden');
      s2.classList.add('hidden');

      document.getElementById('btn-pour-tea').onclick = () => {
        window.soundEngine?.playTone(500, 'sine', 0.2, 0.3);
        window.showGameAlert(`☕ تم صب [${this.currentTeaOrder}]! توجه لقاعة الاجتماعات لتقديمه!`, 'info');
        this.completeCurrentTask('tea_delivery');
      };
    } else {
      s1.classList.add('hidden');
      s2.classList.remove('hidden');

      document.getElementById('btn-place-tray').onclick = () => {
        window.soundEngine?.playTaskSuccess();
        window.showGameAlert(`🍵 اتفضل يا باشا! تم تقديم ضيافة الاجتماع [${this.currentTeaOrder}] بنجاح!`, 'success');
        this.completeCurrentTask('tea_delivery');
      };
    }
  }

  // ================= 13. INVOICE & CHECK MULTI-STAGE =================
  startInvoiceTask(stage = 1) {
    const modal = document.getElementById('task-modal-invoice');
    modal.classList.remove('hidden');

    const clients = [
      { name: 'شركة النيل للتقنية', amount: '85,000 ج.م' },
      { name: 'مجموعة الأهرام الرقمية', amount: '150,000 ج.م' },
      { name: 'ستارت-اب كايرو فنتشرز', amount: '220,000 ج.م' },
      { name: 'وكالة الدلتا للدعاية والإعلان', amount: '65,000 ج.م' }
    ];
    this.currentInvoice = clients[Math.floor(Math.random() * clients.length)];

    const s1 = document.getElementById('invoice-stage-1-box');
    const s2 = document.getElementById('invoice-stage-2-box');

    if (stage === 1) {
      s1.classList.remove('hidden');
      s2.classList.add('hidden');

      document.getElementById('btn-print-invoice').onclick = () => {
        window.soundEngine?.playTone(350, 'sawtooth', 0.3, 0.3);
        window.showGameAlert(`🧾 طبعت فاتورة عميل [${this.currentInvoice.name}] بمبلغ ${this.currentInvoice.amount}! توجه لمكتب المدير للاعتماد!`, 'info');
        this.completeCurrentTask('invoice_approval');
      };
    } else {
      s1.classList.add('hidden');
      s2.classList.remove('hidden');

      document.getElementById('btn-sign-check').onclick = () => {
        window.soundEngine?.playTaskSuccess();
        window.showGameAlert(`✍️ تم توقيع واعتماد شيك [${this.currentInvoice.name}] بنجاح!`, 'success');
        this.completeCurrentTask('invoice_approval');
      };
    }
  }

  // ================= 14. WATER COOLER TASK =================
  startWaterCoolerTask() {
    const modal = document.getElementById('task-modal-watercooler');
    modal.classList.remove('hidden');

    const fill = document.getElementById('cup-water-fill');
    const pourBtn = document.getElementById('btn-pour-water');
    fill.style.height = '0%';
    pourBtn.disabled = false;

    let p = 0;
    pourBtn.onclick = () => {
      pourBtn.disabled = true;
      const interval = setInterval(() => {
        p += 10;
        fill.style.height = `${p}%`;
        window.soundEngine?.playTone(300 + p * 5, 'sine', 0.05, 0.15);

        if (p >= 100) {
          clearInterval(interval);
          window.soundEngine?.playTaskSuccess();
          setTimeout(() => this.completeCurrentTask('water_cooler'), 500);
        }
      }, 90);
      this.activeIntervals.push(interval);
    };
  }

  // ================= 15. AIR CONDITIONER TASK =================
  startACTask() {
    const modal = document.getElementById('task-modal-airconditioner');
    modal.classList.remove('hidden');

    // Dynamic Target Temperature (20 to 26°C)
    const targets = [20, 21, 22, 23, 24, 25, 26];
    this.targetTemp = targets[Math.floor(Math.random() * targets.length)];

    // Dynamic Start Temp (ensure it's different from target)
    let currentTemp = 16 + Math.floor(Math.random() * 14); // 16 to 30
    if (currentTemp === this.targetTemp) {
      currentTemp = this.targetTemp > 22 ? this.targetTemp - 4 : this.targetTemp + 4;
    }

    const tempDisplay = document.getElementById('ac-temp-display');
    tempDisplay.innerText = `${currentTemp}°C`;

    const instructionEl = modal.querySelector('.task-instruction');
    if (instructionEl) {
      instructionEl.innerHTML = `⚠️ تعليمات إدارة الشركة: اضبط درجة حرارة التكييف على <strong>${this.targetTemp}°C</strong> بالضبط!`;
    }

    document.getElementById('btn-ac-temp-up').onclick = () => {
      if (currentTemp < 30) currentTemp++;
      tempDisplay.innerText = `${currentTemp}°C`;
      window.soundEngine?.playTone(700, 'sine', 0.04, 0.15);
    };

    document.getElementById('btn-ac-temp-down').onclick = () => {
      if (currentTemp > 16) currentTemp--;
      tempDisplay.innerText = `${currentTemp}°C`;
      window.soundEngine?.playTone(600, 'sine', 0.04, 0.15);
    };

    document.getElementById('btn-confirm-ac').onclick = () => {
      if (currentTemp === this.targetTemp) {
        window.soundEngine?.playTaskSuccess();
        setTimeout(() => this.completeCurrentTask('air_conditioner'), 500);
      } else {
        this.applyTaskPenalty(modal, 3, `درجة الحرارة غلط (${currentTemp}°C)! المطلوب ${this.targetTemp}°C بالضبط ❄️`);
      }
    };
  }

  // ================= 16. HAND SANITIZER TASK =================
  startSanitizeTask() {
    const modal = document.getElementById('task-modal-sanitize');
    modal.classList.remove('hidden');

    // Dynamic required pumps (2 to 5 pumps)
    this.sanitizeRequired = [2, 3, 4, 5][Math.floor(Math.random() * 4)];
    let count = 0;

    const instructionEl = modal.querySelector('.task-instruction');
    if (instructionEl) {
      instructionEl.innerText = `اضغط على مضخة التعقيم ${this.sanitizeRequired} مرات لتطهير اليدين بالكامل!`;
    }

    const counterText = document.getElementById('sanitize-counter-text');
    counterText.innerText = `عدد الضغطات: 0 / ${this.sanitizeRequired}`;

    document.getElementById('sanitizer-pump').onclick = () => {
      count++;
      counterText.innerText = `عدد الضغطات: ${count} / ${this.sanitizeRequired}`;
      window.soundEngine?.playTone(450 + count * 80, 'sine', 0.06, 0.2);

      if (count >= this.sanitizeRequired) {
        window.soundEngine?.playTaskSuccess();
        setTimeout(() => this.completeCurrentTask('sanitize_hands'), 500);
      }
    };
  }

  // ================= 17. LIGHT SWITCH TASK =================
  startLightSwitchTask() {
    const modal = document.getElementById('task-modal-lightswitch');
    modal.classList.remove('hidden');

    const switches = modal.querySelectorAll('.wall-switch');
    // Randomize starting configuration (some already on)
    switches.forEach((sw, idx) => {
      const startsOn = Math.random() > 0.65;
      sw.className = startsOn ? 'wall-switch active-on' : 'wall-switch';
      sw.innerText = startsOn ? 'ON' : 'OFF';

      sw.onclick = () => {
        const isOn = sw.classList.contains('active-on');
        if (isOn) {
          sw.classList.remove('active-on');
          sw.innerText = 'OFF';
          window.soundEngine?.playTone(600, 'square', 0.05, 0.2);
        } else {
          sw.classList.add('active-on');
          sw.innerText = 'ON';
          window.soundEngine?.playTone(800, 'square', 0.05, 0.2);
        }

        const allOn = Array.from(switches).every(s => s.classList.contains('active-on'));
        if (allOn) {
          window.soundEngine?.playTaskSuccess();
          setTimeout(() => this.completeCurrentTask('light_switch'), 500);
        }
      };
    });
  }

  // ================= 18. PAPER STAPLER TASK =================
  startStaplerTask() {
    const modal = document.getElementById('task-modal-stapler');
    modal.classList.remove('hidden');

    const slots = modal.querySelectorAll('.staple-slot');
    // Randomize required slots
    slots.forEach(slot => {
      slot.className = 'staple-slot';
      slot.innerText = '📎 اضغط للتدبيس';
      slot.onclick = () => {
        if (slot.classList.contains('stapled')) return;
        slot.classList.add('stapled');
        slot.innerText = '📎 تم التدبيس ✅';
        window.soundEngine?.playTone(250, 'square', 0.1, 0.3);

        const allStapled = Array.from(slots).every(s => s.classList.contains('stapled'));
        if (allStapled) {
          window.soundEngine?.playTaskSuccess();
          setTimeout(() => this.completeCurrentTask('stapler'), 500);
        }
      };
    });
  }

  // ================= 19. STICKY NOTES KANBAN TASK =================
  startStickyNotesTask() {
    const modal = document.getElementById('task-modal-stickynotes');
    modal.classList.remove('hidden');

    const stickyList = document.getElementById('sticky-list');
    const doneList = document.getElementById('done-list');

    // Rich pool of 12 Egyptian agency tasks
    const notesPool = [
      { text: '🎨 تسليم تصميم اللوجو للعميل', color: 'yellow' },
      { text: '🎬 تعديل ألوان الفيديو 60FPS', color: 'green' },
      { text: '📊 مراجعة ديدلاين الحملة', color: 'pink' },
      { text: '☕ طلب فطار الشركة (فول وطعمية)', color: 'yellow' },
      { text: '💻 رفع آخر كود على السيرفر', color: 'green' },
      { text: '📩 الرد على إيميلات العملاء', color: 'pink' },
      { text: '🔌 تصليح فيشة طابعة الـ HR', color: 'yellow' },
      { text: '🧹 مسح الكاش والكوكيز المتراكمة', color: 'green' },
      { text: '📑 اعتماد فواتير الحسابات', color: 'pink' },
      { text: '📱 تجهيز ستوري الإنستجرام', color: 'yellow' },
      { text: '🐛 حل مشكلة كراش الأبلكيشن', color: 'green' },
      { text: '📈 تحديث إحصائيات المبيعات', color: 'pink' }
    ];

    // Pick 3 random unique notes
    const selectedNotes = [...notesPool].sort(() => Math.random() - 0.5).slice(0, 3);
    stickyList.innerHTML = selectedNotes.map((n, i) => `
      <div class="sticky-note ${n.color}" data-note="${i}">${n.text}</div>
    `).join('');
    doneList.innerHTML = '';

    const notes = stickyList.querySelectorAll('.sticky-note');
    notes.forEach(n => {
      n.onclick = () => {
        doneList.appendChild(n);
        n.style.cursor = 'default';
        window.soundEngine?.playTone(650, 'sine', 0.05, 0.2);

        if (stickyList.children.length === 0) {
          window.soundEngine?.playTaskSuccess();
          setTimeout(() => this.completeCurrentTask('sticky_notes'), 500);
        }
      };
    });
  }

  // ================= 20. SHRED SECRETS TASK =================
  startShredSecretsTask() {
    const modal = document.getElementById('task-modal-shredsecrets');
    modal.classList.remove('hidden');

    const secretDocs = [
      '📄 محضر تسريب باسوردات السيرفر الرئيسي',
      '📑 كشف بدلات السفر والعمولات السرية',
      '📄 مسودة زيادة مرتبات الموظفين 2026',
      '📑 شكاوى وبلاغات قسم الـ HR ضد الإدارة',
      '📄 العقد السري لدمج الشركة مع المنافس'
    ];
    const docTitle = secretDocs[Math.floor(Math.random() * secretDocs.length)];

    const docTitleEl = modal.querySelector('.secret-doc-title') || modal.querySelector('p');
    if (docTitleEl) docTitleEl.innerText = `مستند عالي السرية: [${docTitle}]`;

    const btn = document.getElementById('btn-shred-secret-doc');
    btn.disabled = false;
    btn.onclick = () => {
      btn.disabled = true;
      window.soundEngine?.playTone(220, 'sawtooth', 0.4, 0.4);
      window.showGameAlert(`🔥 تم إتلاف [${docTitle}] بنجاح!`, 'success');
      setTimeout(() => this.completeCurrentTask('shred_secrets'), 600);
    };
  }

  // ================= 21. FIX PROJECTOR MULTI-STAGE =================
  startProjectorTask(stage = 1) {
    const modal = document.getElementById('task-modal-projector');
    modal.classList.remove('hidden');

    const s1 = document.getElementById('projector-stage-1-box');
    const s2 = document.getElementById('projector-stage-2-box');

    if (stage === 1) {
      s1.classList.remove('hidden');
      s2.classList.add('hidden');

      document.getElementById('btn-grab-hdmi').onclick = () => {
        window.soundEngine?.playTone(500, 'sine', 0.15, 0.3);
        window.showGameAlert('🔌 استلمت كابل HDMI الأصلي 4K! توجه لقاعة الاجتماعات لتشغيل البروجيكتور!', 'info');
        this.completeCurrentTask('fix_projector');
      };
    } else {
      s1.classList.add('hidden');
      s2.classList.remove('hidden');

      document.getElementById('btn-start-projector').onclick = () => {
        window.soundEngine?.playTaskSuccess();
        window.showGameAlert('📽️ البروجيكتور شغال والشاشة جاهزة لعرض الباوربوينت!', 'success');
        this.completeCurrentTask('fix_projector');
      };
    }
  }

  // ================= 22. ORDER KOSHARY MULTI-STAGE =================
  startKosharyTask(stage = 1) {
    const modal = document.getElementById('task-modal-koshary');
    modal.classList.remove('hidden');

    const s1 = document.getElementById('koshary-stage-1-box');
    const s2 = document.getElementById('koshary-stage-2-box');

    if (stage === 1) {
      s1.classList.remove('hidden');
      s2.classList.add('hidden');

      document.getElementById('btn-pickup-koshary').onclick = () => {
        window.soundEngine?.playTone(450, 'sine', 0.15, 0.3);
        window.showGameAlert('🍲 استلمت علب الكشري والشطة والصلصة من الدليفري! ادخل بيه على البوفيه!', 'info');
        this.completeCurrentTask('order_koshary');
      };
    } else {
      s1.classList.add('hidden');
      s2.classList.remove('hidden');

      document.getElementById('btn-distribute-koshary').onclick = () => {
        window.soundEngine?.playTaskSuccess();
        window.showGameAlert('😋 تم توزيع أطباق الكشري وبالهنا والشفا لكل تيم الشركة!', 'success');
        this.completeCurrentTask('order_koshary');
      };
    }
  }

  // ================= 23. DUAL-KEY BREAKER TASK (تاسك جماعي متزامن) =================
  startDualBreakerTask(stationKey = 'dual_breaker_a') {
    const modal = document.getElementById('task-modal-dualbreaker');
    modal.classList.remove('hidden');

    const cleanBreaker = stationKey.includes('b') ? 'B' : 'A';
    const isA = cleanBreaker === 'A';

    document.getElementById('dualbreaker-task-title').innerText = isA 
      ? '⚡ قاطع السيرفرات (أ) — مهمة جماعية' 
      : '⚡ قاطع الاستقبال (ب) — مهمة جماعية';

    const btn = document.getElementById('btn-pull-dual-breaker');
    const waitingBadge = document.getElementById('dual-waiting-badge');
    const waitingText = document.getElementById('dual-waiting-text');
    const ledA = document.getElementById('led-breaker-a');
    const ledB = document.getElementById('led-breaker-b');
    const indA = document.getElementById('ind-breaker-a');
    const indB = document.getElementById('ind-breaker-b');

    // Reset indicator states
    ledA.className = 'ind-led';
    ledB.className = 'ind-led';
    indA.className = 'breaker-slot-indicator';
    indB.className = 'breaker-slot-indicator';
    waitingBadge.classList.add('hidden');
    btn.disabled = false;
    btn.innerText = `⚡ رفع وتثبيت قاطع (${isA ? 'أ' : 'ب'}) الآن`;

    btn.onclick = () => {
      btn.disabled = true;
      window.soundEngine?.playPlugSound();
      
      if (window.gameUI?.socket) {
        window.gameUI.socket.emit('dual_key_press', { breakerId: cleanBreaker });
      }

      if (isA) {
        ledA.className = 'ind-led active';
        indA.className = 'breaker-slot-indicator active';
      } else {
        ledB.className = 'ind-led active';
        indB.className = 'breaker-slot-indicator active';
      }

      waitingBadge.classList.remove('hidden');
      waitingText.innerText = '⚡ القاطع مرفوع! في انتظار الموظف الآخر ⏳ 3.5s';
      window.soundEngine?.playTone(400, 'sawtooth', 0.2, 0.3);
    };
  }

  // ================= 5. SPECIAL CHARACTER TASKS =================
  startSpecialTask(charId) {
    const modal = document.getElementById('task-modal-special');
    modal.classList.remove('hidden');

    const char = CHARACTERS_DATA[charId] || CHARACTERS_DATA.bashmohandes;
    document.getElementById('special-task-title').innerText = `🎯 ${char.taskSpecial}`;

    const body = document.getElementById('special-task-body');
    body.innerHTML = '';

    if (charId === 'bashmohandes') {
      // Dynamic Code Bug Patches
      const bugSnippets = [
        { bug: 'memory_leak = check_ram()', fix: 'memory_leak.clear()', label: 'BUG_ERROR: Memory Leak in RAM Pool' },
        { bug: 'db_pool.connect_all()', fix: 'db_pool.close_idle()', label: 'FATAL_DB: Max 1000 Connections Exceeded' },
        { bug: 'while infinite_loop:', fix: 'time.sleep(0.01)', label: 'CPU_SPIKE: 100% Core Lockup' },
        { bug: 'token = request.headers', fix: 'jwt.verify_signature(token)', label: 'AUTH_FAIL: Unverified API Key' }
      ];
      const selectedBug = bugSnippets[Math.floor(Math.random() * bugSnippets.length)];

      body.innerHTML = `
        <div style="background:#0f172a; padding:15px; border-radius:8px; font-family:monospace; color:#38bdf8; text-align:right;">
          <p>def fix_production_server():</p>
          <p>&nbsp;&nbsp;${selectedBug.bug}</p>
          <p>&nbsp;&nbsp;<span style="color:#f43f5e">${selectedBug.label}</span></p>
        </div>
        <div style="margin-top:15px; display:flex; gap:10px;">
          <button class="btn btn-primary" id="btn-fix-patch" style="width:100%;">🚀 اكتب Patch: ${selectedBug.fix}</button>
        </div>
      `;
      document.getElementById('btn-fix-patch').onclick = () => this.completeCurrentTask(`special_${charId}`);

    } else if (charId === 'pablo') {
      // Dynamic Banner Dimension Slider (e.g. 800, 1080, 1200, 1350, 1920)
      const targetSizes = [800, 1080, 1200, 1350, 1920];
      const pabloTarget = targetSizes[Math.floor(Math.random() * targetSizes.length)];
      const startVal = pabloTarget === 1080 ? 950 : 1080;

      body.innerHTML = `
        <p style="margin-bottom:10px;">العميل طلب بوستر بمقاس <strong>${pabloTarget}px</strong>: اضبط السلايدر بدقة:</p>
        <input type="range" id="pablo-resizer" min="600" max="2100" step="10" value="${startVal}" style="width:100%;">
        <h4 style="margin:15px 0;" id="pablo-res-val">المقاس الحالي: ${startVal} x ${startVal}</h4>
        <button class="btn btn-primary" id="btn-pablo-export" style="width:100%;">حفظ البوستر بالمقاس المطلوب ✅</button>
      `;
      const slider = document.getElementById('pablo-resizer');
      const valEl = document.getElementById('pablo-res-val');
      slider.oninput = (e) => {
        valEl.innerText = `المقاس الحالي: ${e.target.value} x ${e.target.value}`;
      };
      document.getElementById('btn-pablo-export').onclick = () => {
        if (parseInt(slider.value, 10) === pabloTarget) {
          this.completeCurrentTask(`special_${charId}`);
        } else {
          this.applyTaskPenalty(modal, 3, `المقاس مش ${pabloTarget} (${slider.value}px)! اضبطه بالملي يا بابلو ⛔`);
        }
      };

    } else if (charId === 'samaool') {
      // Pen Tool Background Clipping with dynamic anchor points
      body.innerHTML = `
        <p style="margin-bottom:10px;">اضغط على الـ 4 نقاط عشان تفرّغ خلفية اللوجو بالـ Pen Tool:</p>
        <div style="position:relative; width:260px; height:180px; margin:0 auto; background:#1e293b; border:2px dashed #2ecc71; border-radius:10px;" id="samaool-canvas-box">
          <div class="pen-anchor" style="position:absolute; top:20px; left:20px; width:24px; height:24px; background:#2ecc71; border-radius:50%; cursor:pointer;"></div>
          <div class="pen-anchor" style="position:absolute; top:20px; right:20px; width:24px; height:24px; background:#2ecc71; border-radius:50%; cursor:pointer;"></div>
          <div class="pen-anchor" style="position:absolute; bottom:20px; right:20px; width:24px; height:24px; background:#2ecc71; border-radius:50%; cursor:pointer;"></div>
          <div class="pen-anchor" style="position:absolute; bottom:20px; left:20px; width:24px; height:24px; background:#2ecc71; border-radius:50%; cursor:pointer;"></div>
        </div>
      `;
      let clicked = 0;
      body.querySelectorAll('.pen-anchor').forEach(pt => {
        pt.onclick = () => {
          pt.style.background = '#f1c40f';
          pt.style.pointerEvents = 'none';
          clicked++;
          window.soundEngine?.playTone(700, 'sine', 0.08, 0.2);
          if (clicked >= 4) {
            setTimeout(() => this.completeCurrentTask(`special_${charId}`), 400);
          }
        };
      });

    } else if (charId === 'musa') {
      // Dynamic Facebook Ads Campaigns
      const campaigns = [
        { audience: '🎯 الجمهور: مهندسين وديزاينرز في القاهرة', budget: '50,000 وصول' },
        { audience: '🎯 الجمهور: أصحاب الشركات ورواد الأعمال', budget: '120,000 وصول' },
        { audience: '🎯 الجمهور: عملاء B2B في دول الخليج', budget: '200,000 وصول' },
        { audience: '🎯 الجمهور: شباب المهتمين بالـ E-Commerce', budget: '80,000 وصول' }
      ];
      const camp = campaigns[Math.floor(Math.random() * campaigns.length)];

      body.innerHTML = `
        <p style="margin-bottom:10px;">حملة فيسبوك أدز: اختر الجمهور وحدد ميزانية <strong>${camp.budget}</strong>:</p>
        <div style="display:flex; flex-direction:column; gap:10px;">
          <button class="btn btn-secondary" id="musa-audience">${camp.audience}</button>
          <button class="btn btn-primary" id="musa-launch" style="width:100%;">🚀 إطلاق الحملة وتأكيد الوصول (${camp.budget})!</button>
        </div>
      `;
      document.getElementById('musa-launch').onclick = () => this.completeCurrentTask(`special_${charId}`);

    } else if (charId === 'abdelmonem') {
      // Shuffled Fast Icon Export Formats
      const allFormats = ['SVG', 'PNG', 'WEBP', 'ICO', 'PDF', 'EPS'].sort(() => Math.random() - 0.5).slice(0, 4);
      body.innerHTML = `
        <p style="margin-bottom:10px;">اضغط على صيغ الـ Export الـ 4 بأسرع ما عندك:</p>
        <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:10px;" id="monem-btn-grid">
          ${allFormats.map(fmt => `<button class="btn btn-secondary monem-fmt">${fmt}</button>`).join('')}
        </div>
      `;
      let count = 0;
      body.querySelectorAll('.monem-fmt').forEach(b => {
        b.onclick = () => {
          b.classList.add('btn-primary');
          b.style.pointerEvents = 'none';
          count++;
          window.soundEngine?.playTone(900 + count * 150, 'square', 0.05, 0.2);
          if (count >= 4) {
            setTimeout(() => this.completeCurrentTask(`special_${charId}`), 400);
          }
        };
      });

    } else if (charId === 'shatlawi') {
      // Dynamic 4K Video Render Project
      const projects = [
        '🎬 رندر إعلان رمضان 4K (60FPS)',
        '🎬 مونتاج برومو الشركة السنوي',
        '🎬 تصدير ريلز الإنستجرام بدقة فائقة',
        '🎬 رندر تتر البودكاست مع مؤثرات بصرية'
      ];
      const proj = projects[Math.floor(Math.random() * projects.length)];

      body.innerHTML = `
        <p style="margin-bottom:10px;">مشروع [${proj}]: اضغط على زر الرندر لما المؤشر يوصل 100%:</p>
        <div style="width:100%; height:20px; background:#0f172a; border-radius:10px; overflow:hidden; border:1px solid #334155;">
          <div id="shatlawi-bar" style="width:10%; height:100%; background:#10b981; transition:width 1.2s ease-in-out;"></div>
        </div>
        <button class="btn btn-primary" style="margin-top:15px; width:100%;" id="btn-shatlawi-render">🎬 رندر الآن بدون كراش!</button>
      `;
      const bar = document.getElementById('shatlawi-bar');
      setTimeout(() => { if (bar) bar.style.width = '100%'; }, 200);
      document.getElementById('btn-shatlawi-render').onclick = () => {
        this.completeCurrentTask(`special_${charId}`);
      };
    }
  }
}

window.taskManager = new TaskManager();
