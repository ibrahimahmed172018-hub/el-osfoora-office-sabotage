/**
 * ui.js — Egyptian Slang UI Orchestrator & Socket.io Event Handling
 * ربط واجهة المستخدم مع Phaser وسيرفر السوكيت
 */

// Global Egyptian Slang In-Game Toast & Notification System
window.showGameAlert = (message, type = 'warning', duration = 4500) => {
  const container = document.getElementById('game-toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `game-toast ${type}`;

  let icon = '⚠️';
  if (type === 'error' || type === 'danger') icon = '🚨';
  else if (type === 'success') icon = '✅';
  else if (type === 'info') icon = '💡';
  else if (type === 'ghost') icon = '👻';

  toast.innerHTML = `<span style="font-size:1.4rem;">${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  if (window.soundEngine) {
    if (type === 'error' || type === 'danger') window.soundEngine.playTone(200, 'sawtooth', 0.2, 0.3);
    else if (type === 'success') window.soundEngine.playTaskSuccess();
    else if (type === 'ghost') window.soundEngine.playTone(120, 'sawtooth', 0.6, 0.4);
    else window.soundEngine.playTone(450, 'sine', 0.1, 0.2);
  }

  const removeToast = () => {
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px) scale(0.9)';
    setTimeout(() => toast.remove(), 300);
  };

  toast.addEventListener('click', removeToast);
  setTimeout(removeToast, duration);
};

// Safe fallback for native alert
window.alert = (msg) => window.showGameAlert(msg, 'warning');

class GameUI {
  constructor() {
    this.socket = null;
    this.currentRoom = null;
    this.localPlayerId = null;
    this.selectedCharId = 'bashmohandes';
    this.isHost = false;
    this.isSaboteur = false;
    this.activeSabotage = null;
    this.killCooldown = 0;
    this.killCooldownTimer = null;

    // Virtual Joystick Vector for Mobile 8-Directional & Analog Movement
    this.joystickVector = { x: 0, y: 0 };

    this.initSocket();
    this.initDOM();
    this.initVirtualJoystick();
    this.initMobileFeatures();
    this.renderCharacterSelector();
  }

  initSocket() {
    this.socket = io();

    this.socket.on('connect', () => {
      this.localPlayerId = this.socket.id;
      console.log('Connected with socket ID:', this.localPlayerId);
    });

    // Room Created / Updated
    this.socket.on('room_created', (room) => this.handleRoomJoined(room, true));
    this.socket.on('room_updated', (room) => this.handleRoomUpdated(room));
    this.socket.on('error_message', (msg) => window.showGameAlert(msg, 'error'));

    // Game Started
    this.socket.on('game_started', (data) => this.handleGameStarted(data));

    // Player Moved
    this.socket.on('player_moved', (data) => {
      const roomPlayer = this.currentRoom?.players?.find(p => p.id === data.id);
      if (roomPlayer) Object.assign(roomPlayer, data);
      if (window.phaserGame) {
        const scene = window.phaserGame.scene.keys['OfficeScene'];
        if (scene) {
          const other = scene.otherPlayers.get(data.id);
          if (other) {
            other.targetX = data.x;
            other.targetY = data.y;
            other.dir = data.dir;
          }
        }
      }
    });

    // Player Killed
    this.socket.on('player_killed', (data) => this.handlePlayerKilled(data));

    // Sabotage Events
    this.socket.on('sabotage_triggered', (data) => this.handleSabotageTriggered(data));
    this.socket.on('sabotage_tick', (data) => this.handleSabotageTick(data));
    this.socket.on('sabotage_fixed', (data) => this.handleSabotageFixed(data));

    // Tasks Updated
    this.socket.on('tasks_updated', (data) => this.handleTasksUpdated(data));
    this.socket.on('task_stage_advanced', (data) => this.handleTaskStageAdvanced(data));

    // Room Settings Updated
    this.socket.on('room_settings_updated', (settings) => this.handleRoomSettingsUpdated(settings));

    // 10-Minute Project Deadline Game Timer
    this.socket.on('game_timer_tick', (data) => this.handleGameTimerTick(data));

    // Meeting Events
    this.socket.on('meeting_started', (data) => this.handleMeetingStarted(data));
    this.socket.on('meeting_tick', (data) => this.handleMeetingTick(data));
    this.socket.on('vote_cast', (data) => this.handleVoteCast(data));
    this.socket.on('chat_message', (data) => this.handleChatMessage(data));
    this.socket.on('meeting_concluded', (data) => this.handleMeetingConcluded(data));
    this.socket.on('round_resumed', (room) => this.handleRoundResumed(room));

    // Real-Time Visual Proof of Innocence (التاسكات البصرية في الخريطة)
    this.socket.on('visual_task_triggered', (data) => {
      const scene = window.phaserGame?.scene?.keys['OfficeScene'];
      if (scene) {
        scene.triggerMapVisualFX(data.taskType, data.x, data.y, data.playerName);
      }
    });

    // Dual-Key Synchronized Cooperative Task Events
    this.socket.on('dual_key_waiting', (data) => {
      window.showGameAlert(`⚡ ${data.playerName} رفع قاطع الطوارئ (${data.activeBreaker})! مطلوب موظف آخر لتفعيل القاطع الثاني فوراً (3.5s)!`, 'info', 3500);
      const isBreakerA = data.activeBreaker === 'A';
      const led = document.getElementById(isBreakerA ? 'led-breaker-a' : 'led-breaker-b');
      const ind = document.getElementById(isBreakerA ? 'ind-breaker-a' : 'ind-breaker-b');
      const name = document.getElementById(isBreakerA ? 'name-breaker-a' : 'name-breaker-b');
      if (led) led.className = 'ind-led active';
      if (ind) ind.className = 'breaker-slot-indicator active';
      if (name) name.innerText = `مفعّل: ${data.playerName}`;
    });

    this.socket.on('dual_key_success', (data) => {
      window.showGameAlert(`⚡⚡ إنجاز جماعي أسطوري! ${data.playerA} و ${data.playerB} فعّلا القاطع المزدوج بنجاح!`, 'success', 5000);
      const scene = window.phaserGame?.scene?.keys['OfficeScene'];
      if (scene) {
        scene.playDualLightningFX();
      }
      setTimeout(() => {
        document.getElementById('task-modal-dualbreaker')?.classList.add('hidden');
      }, 1200);
    });

    this.socket.on('dual_key_expired', (data) => {
      const btn = document.getElementById('btn-pull-dual-breaker');
      const badge = document.getElementById('dual-waiting-badge');
      if (btn) btn.disabled = false;
      if (badge) badge.classList.add('hidden');
      document.querySelectorAll('#task-modal-dualbreaker .ind-led').forEach(l => l.className = 'ind-led');
      document.querySelectorAll('#task-modal-dualbreaker .breaker-slot-indicator').forEach(i => i.className = 'breaker-slot-indicator');
      const nameA = document.getElementById('name-breaker-a');
      const nameB = document.getElementById('name-breaker-b');
      if (nameA) nameA.innerText = 'غير مفعّل';
      if (nameB) nameB.innerText = 'غير مفعّل';
    });

    // Game Over
    this.socket.on('game_over', (data) => this.handleGameOver(data));
  }

  initDOM() {
    // 1. Create Room
    document.getElementById('btn-create-room').addEventListener('click', () => {
      const name = document.getElementById('player-name-input').value.trim() || 'البشمهندس';
      this.socket.emit('create_room', { playerName: name, character: this.selectedCharId });
    });

    // Join Room
    document.getElementById('btn-join-room').addEventListener('click', () => {
      const code = document.getElementById('room-code-input').value.trim();
      const name = document.getElementById('player-name-input').value.trim() || 'موظف غلبان';
      if (!code) {
        window.showGameAlert('اكتب كود الروم الأول يا فنان!', 'warning');
        return;
      }
      this.socket.emit('join_room', { roomCode: code, playerName: name, character: this.selectedCharId });
    });

    // Add Bot
    document.getElementById('btn-add-bot').addEventListener('click', () => {
      this.socket.emit('add_bot');
    });

    // Start Game
    document.getElementById('btn-start-game').addEventListener('click', () => {
      this.socket.emit('start_game');
    });

    // Lobby Task Count Setting Options (Host Only)
    document.querySelectorAll('.btn-setting-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (!this.isHost) {
          window.showGameAlert('فقط صاحب الروم (Host) يستطيع تغيير إعدادات عدد التاسكات!', 'warning');
          return;
        }
        const tasksCount = parseInt(e.currentTarget.dataset.tasks, 10);
        this.socket.emit('update_room_settings', { tasksCount });
      });
    });

    // HUD Emergency Button
    document.getElementById('btn-hud-emergency').addEventListener('click', () => {
      this.socket.emit('emergency_meeting');
    });

    // HUD Report Button
    document.getElementById('btn-hud-report').addEventListener('click', () => {
      const scene = window.phaserGame.scene.keys['OfficeScene'];
      if (scene) scene.handleReportAction();
    });

    // HUD Use Button
    document.getElementById('btn-hud-use').addEventListener('click', () => {
      const scene = window.phaserGame.scene.keys['OfficeScene'];
      if (scene) scene.handleUseAction();
    });

    // HUD Sabotage Button
    document.getElementById('btn-hud-sabotage').addEventListener('click', () => {
      document.getElementById('sabotage-modal').classList.remove('hidden');
    });
    document.getElementById('btn-close-sabotage').addEventListener('click', () => {
      document.getElementById('sabotage-modal').classList.add('hidden');
    });

    // Close Sabotage Modal on backdrop click
    const sabModal = document.getElementById('sabotage-modal');
    if (sabModal) {
      sabModal.addEventListener('click', (e) => {
        if (e.target === sabModal) {
          sabModal.classList.add('hidden');
        }
      });
    }

    // Global ESC key listener to close any active modal or task popup
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (window.taskManager) window.taskManager.closeCurrentTask();
        const sm = document.getElementById('sabotage-modal');
        if (sm) sm.classList.add('hidden');
      }
    });

    // Sabotage Options Triggers
    document.querySelectorAll('.btn-sabotage-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.target.dataset.type;
        this.socket.emit('trigger_sabotage', { type });
        document.getElementById('sabotage-modal').classList.add('hidden');
      });
    });

    // HUD Kill Button
    document.getElementById('btn-hud-kill').addEventListener('click', () => {
      const scene = window.phaserGame.scene.keys['OfficeScene'];
      if (scene) scene.handleKillAction();
    });

    // Skip Vote
    document.getElementById('btn-vote-skip').addEventListener('click', () => {
      this.socket.emit('cast_vote', { targetId: 'SKIP' });
      document.getElementById('btn-vote-skip').classList.add('disabled');
    });

    // Quick Slang Chat Buttons
    document.querySelectorAll('.btn-slang').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const text = e.target.dataset.text;
        this.socket.emit('send_chat', { text });
      });
    });

    // Custom Chat Input
    document.getElementById('btn-send-meeting-chat').addEventListener('click', () => {
      this.sendCustomChat();
    });
    document.getElementById('meeting-custom-chat-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.sendCustomChat();
    });

    // Back to Lobby
    document.getElementById('btn-back-to-lobby').addEventListener('click', () => {
      location.reload();
    });
  }

  renderCharacterSelector() {
    const grid = document.getElementById('characters-selector-grid');
    grid.innerHTML = '';

    Object.values(CHARACTERS_DATA).forEach(char => {
      const card = document.createElement('div');
      card.className = `character-card ${char.id === this.selectedCharId ? 'selected' : ''}`;
      card.dataset.id = char.id;

      // Create Mini Canvas Avatar
      const canvas = document.createElement('canvas');
      canvas.className = 'char-avatar-canvas';
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      char.render(ctx, 32, 28, 0.7, false, 0, 'right');

      card.innerHTML = `
        <div class="char-name">${char.name}</div>
        <div class="char-role-tag">${char.title}</div>
        <div style="font-size:0.7rem; color:#f1c40f; margin-top:2px;">⚡ ${char.specialMove}</div>
      `;
      card.prepend(canvas);

      card.addEventListener('click', () => {
        document.querySelectorAll('.character-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedCharId = char.id;

        if (this.currentRoom && this.currentRoom.state === 'LOBBY') {
          this.socket.emit('select_character', { characterId: char.id });
        }
      });

      grid.appendChild(card);
    });
  }

  handleRoomJoined(room, isHost) {
    this.currentRoom = room;
    this.isHost = isHost;

    document.getElementById('lobby-screen').classList.add('hidden');
    document.getElementById('room-lobby-screen').classList.remove('hidden');

    document.getElementById('display-room-code').innerText = room.code;
    document.getElementById('hud-room-code').innerText = room.code;

    this.renderWaitingRoom(room);
  }

  handleRoomUpdated(room) {
    this.currentRoom = room;
    this.renderWaitingRoom(room);

    // If game is playing, update others in phaser
    if (room.state === 'PLAYING' && window.phaserGame) {
      const scene = window.phaserGame.scene.keys['OfficeScene'];
      if (scene) {
        scene.updateOtherPlayers(room.players);
        scene.updateDeadBodies(room.bodies);
      }
    }
  }

  renderWaitingRoom(room) {
    const countEl = document.getElementById('players-count');
    countEl.innerText = room.players.length;

    const grid = document.getElementById('lobby-players-grid');
    grid.innerHTML = '';

    const isMeHost = room.hostId === this.localPlayerId;
    this.isHost = isMeHost;

    const startBtn = document.getElementById('btn-start-game');
    const notice = document.getElementById('waiting-host-notice');

    if (isMeHost) {
      startBtn.classList.remove('hidden');
      notice.classList.add('hidden');
    } else {
      startBtn.classList.add('hidden');
      notice.classList.remove('hidden');
    }

    // Sync task count selector state
    const currentTasksCount = room.settings?.tasksCount || 7;
    document.querySelectorAll('.btn-setting-option').forEach(b => {
      const count = parseInt(b.dataset.tasks, 10);
      if (count === currentTasksCount) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
      if (isMeHost) {
        b.classList.remove('disabled-host');
      } else {
        b.classList.add('disabled-host');
      }
    });

    room.players.forEach(p => {
      const char = CHARACTERS_DATA[p.character] || CHARACTERS_DATA.bashmohandes;
      const pill = document.createElement('div');
      pill.className = `lobby-player-pill ${p.isHost ? 'is-host' : ''}`;
      pill.innerHTML = `
        <span style="font-size:1.4rem;">${char.id === 'pablo' ? '🚬' : char.id === 'samaool' ? '👃' : char.id === 'musa' ? '💪' : '💼'}</span>
        <div style="text-align:right;">
          <div style="font-weight:bold; color:#fff;">${p.name} ${p.isHost ? '<span class="host-crown">👑 (Host)</span>' : ''}</div>
          <div style="font-size:0.75rem; color:#94a3b8;">${char.name}</div>
        </div>
      `;
      grid.appendChild(pill);
    });
  }

  handleGameStarted(data) {
    this.isSaboteur = data.isSaboteur;
    this.assignedTasks = data.tasks || [];

    // Hide waiting screen
    document.getElementById('room-lobby-screen').classList.add('hidden');

    // Show Role Reveal Screen for 4.5 seconds
    const revealScreen = document.getElementById('role-reveal-screen');
    const cardInner = document.getElementById('role-card-inner');
    const titleEl = document.getElementById('role-title');
    const descEl = document.getElementById('role-description');
    const alliesEl = document.getElementById('role-saboteurs-list');

    revealScreen.classList.remove('hidden');

    if (this.isSaboteur) {
      cardInner.className = 'role-card-anim glass-panel saboteur-theme';
      titleEl.innerText = 'المخرّب / العميل 😈';
      descEl.innerText = 'مهمتك تبوّظ شغل الشركة، تقطع النور، توقّع السيرفر، وتشحّور الموظفين من غير ما حد يقفشك!';
      alliesEl.classList.remove('hidden');
      alliesEl.innerText = `زمايلك المخربين في الروم: ${data.saboteurs.join(', ')}`;
      document.getElementById('saboteur-dock').classList.remove('hidden');
      this.startKillCooldown(15);
    } else {
      cardInner.className = 'role-card-anim glass-panel employee-theme';
      titleEl.innerText = 'موظف غلبان 💼';
      descEl.innerText = 'مهمتك تخلص تاسكات الديدلاين في أقسام الشركة وتكشف المخرّب في اجتماعات الطوارئ!';
      alliesEl.classList.add('hidden');
      document.getElementById('saboteur-dock').classList.add('hidden');
    }

    // Populate Tasks List in HUD
    const tasksUl = document.getElementById('player-tasks-ul');
    tasksUl.innerHTML = '';
    data.tasks.forEach(t => {
      const li = document.createElement('li');
      li.id = `hud-task-${t.id}`;
      li.innerHTML = `<span>⏳</span> <span>${t.name}</span>`;
      tasksUl.appendChild(li);
    });

    // Reset and initialize 10-minute game deadline timer
    const timerEl = document.getElementById('hud-game-timer');
    const badgeEl = document.getElementById('game-deadline-timer');
    if (timerEl) timerEl.innerText = this.formatSeconds(data.gameTimer || 600);
    if (badgeEl) badgeEl.className = 'game-timer-badge';

    // Initialize Phaser 3 Game World
    window.initPhaserGame();

    setTimeout(() => {
      revealScreen.classList.add('hidden');
      document.getElementById('game-hud').classList.remove('hidden');

      // Spawn local player in scene
      const scene = window.phaserGame.scene.keys['OfficeScene'];
      if (scene) {
        const localPlayer = this.currentRoom?.players?.find(p => p.id === this.localPlayerId);
        scene.spawnLocalPlayer({
          id: this.localPlayerId,
          name: localPlayer?.name || document.getElementById('player-name-input').value.trim() || 'البشمهندس',
          character: localPlayer?.character || data.character,
          role: data.role,
          isAlive: localPlayer?.isAlive,
          x: localPlayer?.x ?? 700,
          y: localPlayer?.y ?? 260
        });
        scene.updateOtherPlayers(this.currentRoom?.players || []);
        scene.updateDeadBodies(this.currentRoom?.bodies || []);
      }
    }, 4500);
  }

  startKillCooldown(seconds) {
    this.killCooldown = seconds;
    const badge = document.getElementById('kill-cooldown-badge');
    const killBtn = document.getElementById('btn-hud-kill');

    if (this.killCooldownTimer) clearInterval(this.killCooldownTimer);

    killBtn.classList.add('disabled');
    badge.innerText = `${this.killCooldown}s`;

    this.killCooldownTimer = setInterval(() => {
      this.killCooldown--;
      if (this.killCooldown > 0) {
        badge.innerText = `${this.killCooldown}s`;
      } else {
        clearInterval(this.killCooldownTimer);
        badge.innerText = `READY`;
        killBtn.classList.remove('disabled');
      }
    }, 1000);
  }

  handlePlayerKilled(data) {
    if (this.currentRoom) {
      const victim = this.currentRoom.players?.find(p => p.id === data.victimId);
      if (victim) victim.isAlive = false;
      this.currentRoom.bodies = [...(this.currentRoom.bodies || []), data.deadBody];
    }

    // If local player was killed
    if (data.victimId === this.localPlayerId) {
      window.soundEngine.playTone(100, 'sawtooth', 0.8, 0.5);
      if (window.showGameAlert) {
        window.showGameAlert(`اتشحورت بواسطة: ${data.killerName} (${data.specialMove})! أنت الآن شبح وتستطيع إكمال تاسكاتك!`, 'ghost', 6000);
      } else {
        alert(`اتشحورت بواسطة: ${data.killerName} (${data.specialMove})! أنت الآن شبح وتستطيع إكمال تاسكاتك!`);
      }
      const scene = window.phaserGame.scene.keys['OfficeScene'];
      if (scene && scene.player) {
        scene.player.isAlive = false;
      }
    }

    if (window.phaserGame) {
      const scene = window.phaserGame.scene.keys['OfficeScene'];
      if (scene) {
        scene.playSpecialKillFX(data.killerCharacter, scene.player.container.x, scene.player.container.y, data.deadBody.x, data.deadBody.y);
        scene.deadBodies.set(data.deadBody.id, {
          id: data.deadBody.id,
          victimName: data.deadBody.victimName,
          x: data.deadBody.x,
          y: data.deadBody.y,
          sprite: scene.add.graphics(),
          skull: scene.add.text(data.deadBody.x, data.deadBody.y, '💀', { fontSize: '20px' }).setOrigin(0.5)
        });
      }
    }
  }

  handleSabotageTriggered(data) {
    this.activeSabotage = data.type;
    const banner = document.getElementById('sabotage-alert-banner');
    const textEl = document.getElementById('sabotage-alert-text');
    const timerEl = document.getElementById('sabotage-timer');

    banner.classList.remove('hidden');
    textEl.innerText = data.desc;

    if (data.type === 'server') {
      timerEl.style.display = 'inline-block';
      timerEl.innerText = `${data.timer}s`;
      window.soundEngine.playEmergencyAlarm();
    } else {
      timerEl.style.display = 'none';
      window.soundEngine.playTone(200, 'sawtooth', 0.4, 0.4);
    }
  }

  handleSabotageTick(data) {
    const timerEl = document.getElementById('sabotage-timer');
    if (timerEl) timerEl.innerText = `${data.timer}s`;
  }

  handleSabotageFixed(data) {
    this.activeSabotage = null;
    document.getElementById('sabotage-alert-banner').classList.add('hidden');
    window.soundEngine.playTaskSuccess();
  }

  handleTasksUpdated(data) {
    document.getElementById('task-progress-percent').innerText = `${data.progress}%`;
    document.getElementById('task-bar-fill').style.width = `${data.progress}%`;

    if (data.taskId) {
      if (this.assignedTasks) {
        const t = this.assignedTasks.find(task => task.id === data.taskId);
        if (t) t.completed = true;
      }
      const el = document.getElementById(`hud-task-${data.taskId}`);
      if (el) {
        el.className = 'completed';
        el.querySelector('span').innerText = '✅';
      }
    }
  }

  handleTaskStageAdvanced(data) {
    if (this.assignedTasks) {
      const t = this.assignedTasks.find(task => task.id === data.taskId);
      if (t) {
        t.stage = data.stage;
        t.stationId = data.stationId;
        t.room = data.room;
        t.name = data.name;
      }
    }

    const el = document.getElementById(`hud-task-${data.taskId}`);
    if (el) {
      el.innerHTML = `<span>🔄</span> <span>${data.name}</span>`;
      el.style.color = '#f1c40f';
      el.style.fontWeight = 'bold';
    }

    window.soundEngine?.playTone(600, 'sine', 0.1, 0.3);
    window.showGameAlert(`مرحلة تالية: ${data.name}`, 'info');
  }

  handleRoomSettingsUpdated(settings) {
    if (this.currentRoom) {
      this.currentRoom.settings = settings;
    }
    document.querySelectorAll('.btn-setting-option').forEach(b => {
      const count = parseInt(b.dataset.tasks, 10);
      if (count === settings.tasksCount) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
    window.soundEngine?.playTone(550, 'sine', 0.05, 0.15);
  }

  // ================= 10-MINUTE PROJECT DEADLINE GAME TIMER =================
  handleGameTimerTick(data) {
    const timerEl = document.getElementById('hud-game-timer');
    const badgeEl = document.getElementById('game-deadline-timer');

    if (timerEl) {
      timerEl.innerText = data.formatted || this.formatSeconds(data.timer);
    }

    if (badgeEl) {
      if (data.timer <= 60) {
        badgeEl.className = 'game-timer-badge danger';
      } else if (data.timer <= 120) {
        badgeEl.className = 'game-timer-badge warning';
      } else {
        badgeEl.className = 'game-timer-badge';
      }
    }

    // Egyptian audio alerts and floating toasts at key milestones
    if (data.timer === 300) {
      window.showGameAlert('⏳ باقي 5 دقائق على انتهاء ديدلاين المشروع!', 'info');
    } else if (data.timer === 120) {
      window.showGameAlert('⚠️ شد حيلك يا باشمهندس! باقي دقيقتين على الديدلاين!', 'warning');
    } else if (data.timer === 60) {
      window.showGameAlert('🚨 دقيقة واحدة باقية! العميل مستني تسليم الشغل!', 'danger');
      if (window.soundEngine) window.soundEngine.playEmergencyAlarm();
    } else if (data.timer <= 10 && data.timer > 0) {
      if (window.soundEngine) window.soundEngine.playTone(700, 'sine', 0.06, 0.15);
    }
  }

  formatSeconds(sec) {
    const m = Math.floor(Math.max(0, sec) / 60);
    const s = Math.max(0, sec) % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  // ================= EMERGENCY MEETING & VOTING =================
  handleMeetingStarted(data) {
    // Close tasks/modals
    if (window.taskManager) window.taskManager.closeCurrentTask();
    document.getElementById('sabotage-modal').classList.add('hidden');

    const screen = document.getElementById('meeting-screen');
    screen.classList.remove('hidden');

    document.getElementById('meeting-title-text').innerText = data.reason === 'REPORT' ? 'الحقوا ده في مصيبة هنا! (جثة في الشركة)' : 'اجتماع طوارئ مفاجئ!';
    document.getElementById('meeting-caller-name').innerText = data.caller;
    document.getElementById('meeting-timer-digits').innerText = data.timer;
    document.getElementById('btn-vote-skip').classList.remove('disabled');

    // Play Alarm
    if (data.reason === 'REPORT') window.soundEngine.playReportAlarm();
    else window.soundEngine.playEmergencyAlarm();

    // Render Players to Vote on
    const grid = document.getElementById('meeting-players-grid');
    grid.innerHTML = '';

    data.players.forEach(p => {
      const char = CHARACTERS_DATA[p.character] || CHARACTERS_DATA.bashmohandes;
      const card = document.createElement('div');
      card.className = `vote-player-card ${!p.isAlive ? 'is-dead' : ''}`;
      card.dataset.id = p.id;
      card.innerHTML = `
        <span style="font-size:1.6rem;">${p.isAlive ? '👤' : '💀'}</span>
        <div>
          <div style="font-weight:bold; color:#fff;">${p.name}</div>
          <div style="font-size:0.75rem; color:#94a3b8;">${char.name} ${!p.isAlive ? '(متشحور)' : ''}</div>
        </div>
      `;

      if (p.isAlive && p.id !== this.localPlayerId) {
        card.addEventListener('click', () => {
          this.socket.emit('cast_vote', { targetId: p.id });
          document.querySelectorAll('.vote-player-card').forEach(c => c.style.pointerEvents = 'none');
          document.getElementById('btn-vote-skip').classList.add('disabled');
          card.classList.add('has-voted-badge');
          window.soundEngine.playVoteCast();
        });
      }

      grid.appendChild(card);
    });

    // Clear Meeting Chat
    document.getElementById('meeting-chat-messages').innerHTML = '';
  }

  handleMeetingTick(data) {
    document.getElementById('meeting-timer-digits').innerText = data.timer;
  }

  handleVoteCast(data) {
    window.soundEngine.playVoteCast();
  }

  handleChatMessage(data) {
    const box = document.getElementById('meeting-chat-messages');
    const bubble = document.createElement('div');
    bubble.className = 'chat-msg-bubble';
    bubble.innerHTML = `<span class="sender">${data.senderName}:</span> <span>${data.text}</span>`;
    box.appendChild(bubble);
    box.scrollTop = box.scrollHeight;
  }

  sendCustomChat() {
    const input = document.getElementById('meeting-custom-chat-input');
    const text = input.value.trim();
    if (text) {
      this.socket.emit('send_chat', { text });
      input.value = '';
    }
  }

  handleMeetingConcluded(result) {
    document.getElementById('meeting-screen').classList.add('hidden');

    // Show Ejection Sequence
    const ejectScreen = document.getElementById('ejection-screen');
    const titleEl = document.getElementById('ejection-text-title');
    const subEl = document.getElementById('ejection-sub-quote');
    const figEl = document.getElementById('ejected-character-figure');

    ejectScreen.classList.remove('hidden');

    if (result.ejectedPlayer) {
      titleEl.innerText = `تم رفد ${result.ejectedPlayer.name}...`;
      subEl.innerText = result.message;
      figEl.innerText = '🏃‍♂️💨';
      window.soundEngine.playEjectionSound(result.wasSaboteur);
    } else {
      titleEl.innerText = 'محدش اترَفَد!';
      subEl.innerText = result.message;
      figEl.innerText = '🤝🏢';
      window.soundEngine.playTone(400, 'sine', 0.3, 0.3);
    }

    setTimeout(() => {
      ejectScreen.classList.add('hidden');
    }, 5500);
  }

  handleRoundResumed(room) {
    this.currentRoom = room;
    const scene = window.phaserGame?.scene.keys['OfficeScene'];
    const localPlayer = room.players?.find(p => p.id === this.localPlayerId);
    if (scene && localPlayer) {
      scene.player.container.setPosition(localPlayer.x, localPlayer.y);
      scene.player.isAlive = localPlayer.isAlive;
      scene.updateOtherPlayers(room.players);
      scene.updateDeadBodies(room.bodies || []);
    }
    if (this.isSaboteur) {
      this.startKillCooldown(25);
    }
  }

  handleGameOver(data) {
    document.getElementById('meeting-screen').classList.add('hidden');
    document.getElementById('ejection-screen').classList.add('hidden');
    document.getElementById('game-hud').classList.add('hidden');

    const screen = document.getElementById('gameover-screen');
    const banner = document.getElementById('gameover-banner-wrap');
    const title = document.getElementById('gameover-winner-title');
    const desc = document.getElementById('gameover-desc-text');
    const grid = document.getElementById('gameover-summary-grid');

    screen.classList.remove('hidden');

    if (data.winner === 'EMPLOYEES') {
      banner.className = 'gameover-banner';
      title.innerText = 'الشركة سلمت البروجكت والعميل دفع! 🎉💼';
      desc.innerText = data.message;
      window.soundEngine.playVictory();
    } else {
      banner.className = 'gameover-banner saboteur-win';
      title.innerText = 'الشركة فلست والمخرّب ضحك عليكم! 😈🔥';
      desc.innerText = data.message;
      window.soundEngine.playDefeat();
    }

    grid.innerHTML = '';
    data.players.forEach(p => {
      const char = CHARACTERS_DATA[p.character] || CHARACTERS_DATA.bashmohandes;
      const card = document.createElement('div');
      card.className = `summary-player-card ${p.role === 'SABOTEUR' ? 'sab' : ''}`;
      card.innerHTML = `
        <div style="font-weight:bold;">${p.name} (${char.name})</div>
        <div>الدور: ${p.role === 'SABOTEUR' ? 'المخرّب / العميل 😈' : 'موظف غلبان 💼'}</div>
      `;
      grid.appendChild(card);
    });
  }

  updateHUDButtons(states) {
    const useBtn = document.getElementById('btn-hud-use');
    const reportBtn = document.getElementById('btn-hud-report');
    const killBtn = document.getElementById('btn-hud-kill');
    const emergencyBtn = document.getElementById('btn-hud-emergency');

    if (states.canUseTask) useBtn.classList.remove('disabled');
    else useBtn.classList.add('disabled');

    if (states.canReport) reportBtn.classList.remove('disabled');
    else reportBtn.classList.add('disabled');

    if (this.isSaboteur) {
      if (states.canKill && this.killCooldown <= 0) killBtn.classList.remove('disabled');
      else killBtn.classList.add('disabled');
    }

    if (states.canEmergency) emergencyBtn.classList.add('glow');
    else emergencyBtn.classList.remove('glow');
  }

  // ================= VIRTUAL JOYSTICK (8-Directional & Analog Mobile Controls) =================
  initVirtualJoystick() {
    const container = document.getElementById('virtual-joystick-container');
    const base = document.getElementById('joystick-base');
    const thumb = document.getElementById('joystick-thumb');
    if (!container || !base || !thumb) return;

    let activeTouchId = null;
    const maxRadius = 45; // Max thumb travel radius

    const handleJoystickStart = (clientX, clientY, touchId = null) => {
      activeTouchId = touchId;
      updateJoystickPosition(clientX, clientY);
      this.triggerHaptic(15);
    };

    const updateJoystickPosition = (clientX, clientY) => {
      const rect = base.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let dx = clientX - centerX;
      let dy = clientY - centerY;
      const distance = Math.hypot(dx, dy);

      // Deadzone check
      if (distance < 6) {
        this.joystickVector = { x: 0, y: 0 };
        thumb.style.transform = 'translate(0px, 0px)';
        return;
      }

      // Clamp to max radius
      if (distance > maxRadius) {
        dx = (dx / distance) * maxRadius;
        dy = (dy / distance) * maxRadius;
      }

      thumb.style.transform = `translate(${dx}px, ${dy}px)`;

      // Normalized vector (-1.0 to 1.0)
      const nx = dx / maxRadius;
      const ny = dy / maxRadius;
      this.joystickVector = { x: nx, y: ny };
    };

    const handleJoystickEnd = () => {
      activeTouchId = null;
      this.joystickVector = { x: 0, y: 0 };
      thumb.style.transform = 'translate(0px, 0px)';
    };

    // Touch Event Listeners (Multi-touch support)
    container.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      handleJoystickStart(touch.clientX, touch.clientY, touch.identifier);
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (activeTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === activeTouchId) {
          updateJoystickPosition(touch.clientX, touch.clientY);
          break;
        }
      }
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
      if (activeTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === activeTouchId) {
          handleJoystickEnd();
          break;
        }
      }
    });

    window.addEventListener('touchcancel', () => handleJoystickEnd());

    // Mouse / Pointer fallback for desktop testing
    let isMouseDown = false;
    container.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      handleJoystickStart(e.clientX, e.clientY);
    });
    window.addEventListener('mousemove', (e) => {
      if (isMouseDown) updateJoystickPosition(e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', () => {
      if (isMouseDown) {
        isMouseDown = false;
        handleJoystickEnd();
      }
    });
  }

  // ================= MOBILE RESPONSIVE ADAPTATIONS =================
  initMobileFeatures() {
    // 1. Mobile Tasks Panel Toggle
    const toggleBtn = document.getElementById('btn-toggle-tasks-mobile');
    const tasksPanel = document.getElementById('hud-tasks-panel');
    if (toggleBtn && tasksPanel) {
      toggleBtn.addEventListener('click', () => {
        tasksPanel.classList.toggle('mobile-hidden');
        this.triggerHaptic(20);
      });
    }

    // 2. Mobile Orientation Check
    const hint = document.getElementById('portrait-orient-hint');
    const dismissBtn = document.getElementById('btn-dismiss-orient');
    
    const checkOrientation = () => {
      const isMobile = window.innerWidth <= 900;
      const isPortrait = window.innerHeight > window.innerWidth;
      if (isMobile && isPortrait) {
        hint?.classList.remove('hidden');
      } else {
        hint?.classList.add('hidden');
      }
    };

    dismissBtn?.addEventListener('click', () => {
      hint?.classList.add('hidden');
      this.triggerHaptic(15);
    });

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    checkOrientation();

    // 3. Attach Haptic Feedback to Action Buttons
    const actionButtons = [
      'btn-hud-emergency',
      'btn-hud-report',
      'btn-hud-use',
      'btn-hud-sabotage',
      'btn-hud-kill',
      'btn-vote-skip'
    ];
    actionButtons.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', () => this.triggerHaptic(30));
        btn.addEventListener('touchstart', () => this.triggerHaptic(20), { passive: true });
      }
    });
  }

  triggerHaptic(duration = 20) {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(duration);
      } catch (e) {
        // Ignore if blocked
      }
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.gameUI = new GameUI();
});
