/**
 * game.js — Phaser 3 Game World Engine & Multiplayer Controller
 * محرك اللعبة، العالم التفاعلي، الإضاءة الديناميكية، وحركات اللاعبين
 */

class OfficeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'OfficeScene' });
    this.player = null;
    this.otherPlayers = new Map();
    this.deadBodies = new Map();
    this.cursors = null;
    this.wasd = null;
    this.tick = 0;

    this.nearbyTask = null;
    this.nearbyBody = null;
    this.nearbyVictim = null;
    this.nearbyVent = null;
    this.nearbySabotage = null;
    this.nearbyEmergency = false;

    this.lightsDarkness = null;
    this.flashlightMask = null;
  }

  preload() {
    // Generate base assets if needed
  }

  create() {
    // Physics bounds
    this.physics.world.setBounds(0, 0, OFFICE_MAP_DATA.width, OFFICE_MAP_DATA.height);

    // Draw Map Zones & Floor
    this.drawOfficeMap();

    // Setup Obstacle Physics Colliders
    this.obstaclesGroup = this.physics.add.staticGroup();
    OFFICE_MAP_DATA.obstacles.forEach(obs => {
      const rect = this.add.rectangle(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.w, obs.h, 0x000000, 0);
      this.physics.add.existing(rect, true);
      this.obstaclesGroup.add(rect);
    });

    // Setup Keyboard Controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      use: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      kill: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      report: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R)
    };

    // Darkness & Flashlight Overlay for Lights Sabotage
    this.darknessOverlay = this.add.graphics();
    this.darknessOverlay.setDepth(50);
    this.darknessOverlay.setVisible(false);

    // Dynamic Camera Settings & Responsive Zoom
    this.cameras.main.setBounds(0, 0, OFFICE_MAP_DATA.width, OFFICE_MAP_DATA.height);
    this.updateCameraViewport();

    // Listen for screen resize and orientation change
    this.scale.on('resize', () => this.updateCameraViewport());
    window.addEventListener('resize', () => this.updateCameraViewport());

    // Key press listeners
    this.wasd.use.on('down', () => this.handleUseAction());
    this.wasd.kill.on('down', () => this.handleKillAction());
    this.wasd.report.on('down', () => this.handleReportAction());

    console.log('Office Scene Initialized with Dynamic Responsive Scaling');
  }

  calculateOptimalZoom() {
    const w = window.innerWidth || this.scale.width;
    const h = window.innerHeight || this.scale.height;
    const minDim = Math.min(w, h);
    
    // Dynamic responsive zoom based on device screen size and aspect ratio
    if (minDim < 500) {
      return 1.45; // Small mobile phones (portrait/landscape) -> zoom close for crystal clear view!
    } else if (minDim < 768) {
      return 1.35; // Large phones / Phablets
    } else if (minDim < 1050) {
      return 1.25; // Tablets / Small Laptops
    } else if (w > 2000) {
      return 1.10; // 4K & Ultra-wide displays
    } else {
      return 1.20; // Standard 1080p Desktop / Laptops
    }
  }

  updateCameraViewport() {
    if (!this.cameras || !this.cameras.main) return;
    const zoom = this.calculateOptimalZoom();
    this.cameras.main.setZoom(zoom);
  }

  drawOfficeMap() {
    const g = this.add.graphics();

    // Background base
    g.fillStyle(0x0a0e17, 1);
    g.fillRect(0, 0, OFFICE_MAP_DATA.width, OFFICE_MAP_DATA.height);

    // Rooms
    OFFICE_MAP_DATA.rooms.forEach(r => {
      g.fillStyle(r.color, 1);
      g.fillRoundedRect(r.x, r.y, r.w, r.h, 12);
      g.lineStyle(2, 0x334155, 0.8);
      g.strokeRoundedRect(r.x, r.y, r.w, r.h, 12);

      // Room Name Text - Crisp, Large & Readable
      this.add.text(r.x + 18, r.y + 14, r.name, {
        fontFamily: 'Tajawal, Cairo',
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#e2e8f0',
        stroke: '#0f172a',
        strokeThickness: 4
      }).setDepth(2);
    });

    // Obstacles & Desks
    OFFICE_MAP_DATA.obstacles.forEach(obs => {
      if (obs.label) {
        g.fillStyle(0x1e293b, 1);
        g.fillRoundedRect(obs.x, obs.y, obs.w, obs.h, 8);
        g.lineStyle(2, 0x475569, 1);
        g.strokeRoundedRect(obs.x, obs.y, obs.w, obs.h, 8);

        this.add.text(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.label, {
          fontFamily: 'Cairo, Tajawal',
          fontSize: '13px',
          fontWeight: 'bold',
          color: '#94a3b8',
          stroke: '#0f172a',
          strokeThickness: 3
        }).setOrigin(0.5).setDepth(2);
      }
    });

    // Emergency Meeting Button Table (Center of Meeting Room)
    const em = OFFICE_MAP_DATA.emergencyButton;
    g.fillStyle(0xd97706, 0.3);
    g.fillCircle(em.x, em.y, em.radius + 10);
    g.fillStyle(0xef4444, 1);
    g.fillCircle(em.x, em.y, em.radius - 8);
    g.lineStyle(4, 0xffffff, 1);
    g.strokeCircle(em.x, em.y, em.radius - 8);

    this.add.text(em.x, em.y, '🚨', { fontSize: '32px' }).setOrigin(0.5).setDepth(3);

    // Draw Task Stations - Highly Visible & Vibrant
    OFFICE_MAP_DATA.taskStations.forEach(ts => {
      const marker = this.add.graphics();
      marker.fillStyle(0x22c55e, 0.25);
      marker.fillCircle(ts.x, ts.y, 28);
      marker.lineStyle(3, 0x22c55e, 0.9);
      marker.strokeCircle(ts.x, ts.y, 28);

      this.add.text(ts.x, ts.y - 6, ts.icon, { fontSize: '26px' }).setOrigin(0.5).setDepth(3);
      this.add.text(ts.x, ts.y + 22, ts.name, {
        fontFamily: 'Cairo, Tajawal',
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#86efac',
        stroke: '#052e16',
        strokeThickness: 3.5
      }).setOrigin(0.5).setDepth(3);
    });

    // Draw Vents (فتحات التهوية للمخربين)
    OFFICE_MAP_DATA.vents.forEach(v => {
      const ventBox = this.add.graphics();
      ventBox.fillStyle(0x475569, 1);
      ventBox.fillRoundedRect(v.x - 18, v.y - 18, 36, 36, 6);
      ventBox.lineStyle(2, 0x94a3b8, 1);
      ventBox.strokeRoundedRect(v.x - 18, v.y - 18, 36, 36, 6);

      // Vent Grill Lines
      ventBox.lineStyle(2, 0x0f172a, 1);
      for (let i = -10; i <= 10; i += 6) {
        ventBox.lineBetween(v.x - 12, v.y + i, v.x + 12, v.y + i);
      }
    });

    // Sabotage Consoles
    OFFICE_MAP_DATA.sabotageConsoles.forEach(sc => {
      this.add.text(sc.x, sc.y - 4, sc.icon, { fontSize: '28px' }).setOrigin(0.5).setDepth(3);
      this.add.text(sc.x, sc.y + 24, sc.name, {
        fontFamily: 'Cairo, Tajawal',
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#fca5a5',
        stroke: '#450a0a',
        strokeThickness: 3.5
      }).setOrigin(0.5).setDepth(3);
    });
  }

  spawnLocalPlayer(playerData) {
    if (this.player) {
      this.player.container.destroy();
    }

    const charDef = CHARACTERS_DATA[playerData.character] || CHARACTERS_DATA.bashmohandes;

    // Create Container for local player
    const container = this.add.container(playerData.x, playerData.y);
    container.setSize(36, 54);
    this.physics.world.enable(container);
    container.body.setCollideWorldBounds(true);
    this.playerCollider = this.physics.add.collider(container, this.obstaclesGroup);

    // Canvas Graphics Object for Custom Character Render
    const charCanvas = this.add.graphics();
    container.add(charCanvas);

    // Player Name Tag - Clear, Bold & Outline
    const nameTag = this.add.text(0, -42, playerData.name, {
      fontFamily: 'Tajawal, Cairo',
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3.5,
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      padding: { x: 8, y: 3 }
    }).setOrigin(0.5);
    container.add(nameTag);

    container.setDepth(20);

    this.player = {
      id: playerData.id,
      name: playerData.name,
      character: playerData.character,
      charDef: charDef,
      role: playerData.role,
      isAlive: playerData.isAlive !== false,
      container: container,
      graphics: charCanvas,
      nameTag: nameTag,
      dir: 'right',
      baseSpeed: charDef.speed
    };

    // If spawned dead as ghost, disable wall collider immediately
    if (!this.player.isAlive && this.playerCollider) {
      this.playerCollider.active = false;
    }

    // Camera follow
    this.cameras.main.startFollow(container, true, 0.1, 0.1);
  }

  updateOtherPlayers(playersList) {
    if (!this.player) return;

    const currentIds = new Set(playersList.map(p => p.id));

    // Remove disconnected
    this.otherPlayers.forEach((other, id) => {
      if (!currentIds.has(id)) {
        other.container.destroy();
        this.otherPlayers.delete(id);
      }
    });

    // Update / Create others
    playersList.forEach(p => {
      if (p.id === this.player.id) return; // Skip self

      let other = this.otherPlayers.get(p.id);
      const charDef = CHARACTERS_DATA[p.character] || CHARACTERS_DATA.bashmohandes;

      if (!other) {
        const container = this.add.container(p.x, p.y);
        container.setSize(36, 54);
        container.setDepth(19);

        const charCanvas = this.add.graphics();
        container.add(charCanvas);

        const nameTag = this.add.text(0, -42, p.name, {
          fontFamily: 'Tajawal, Cairo',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 3.5,
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          padding: { x: 8, y: 3 }
        }).setOrigin(0.5);
        container.add(nameTag);

        other = {
          id: p.id,
          name: p.name,
          character: p.character,
          charDef: charDef,
          isAlive: p.isAlive,
          container: container,
          graphics: charCanvas,
          targetX: p.x,
          targetY: p.y,
          dir: p.dir || 'right',
          isWalking: false
        };
        this.otherPlayers.set(p.id, other);
      } else {
        other.targetX = p.x;
        other.targetY = p.y;
        other.isAlive = p.isAlive;
        other.dir = p.dir || other.dir;
      }
    });
  }

  updateDeadBodies(bodiesList) {
    // Clear old
    this.deadBodies.forEach(b => {
      b.sprite.destroy();
      b.skull?.destroy();
    });
    this.deadBodies.clear();

    bodiesList.forEach(body => {
      const bGraphics = this.add.graphics();
      bGraphics.setDepth(15);
      bGraphics.setPosition(body.x, body.y);

      // Dead Body Representation (Tombstone / Fallen employee)
      bGraphics.fillStyle(0xef4444, 0.4);
      bGraphics.fillCircle(0, 0, 22);
      bGraphics.fillStyle(0x1e293b, 1);
      bGraphics.fillRoundedRect(-14, -14, 28, 28, 6);

      const skull = this.add.text(body.x, body.y, '💀', { fontSize: '20px' }).setOrigin(0.5).setDepth(16);

      this.deadBodies.set(body.id, {
        id: body.id,
        victimName: body.victimName,
        x: body.x,
        y: body.y,
        sprite: bGraphics,
        skull: skull
      });
    });
  }

  update(time, delta) {
    this.tick++;

    if (!this.player || !this.player.container) return;

    if (!window.gameUI || window.gameUI.currentRoom?.state !== 'PLAYING') {
      this.player.container.body.setVelocity(0, 0);
      this.updateDarknessLighting();
      return;
    }

    // Movement calculation
    let vx = 0;
    let vy = 0;
    let speed = this.player.baseSpeed;

    // Ghost mechanics: No-clip through walls & faster floating movement
    if (!this.player.isAlive) {
      if (this.playerCollider && this.playerCollider.active) {
        this.playerCollider.active = false;
      }
      speed *= 1.25; // Ghosts float 25% faster!
    }

    // Sabotage AC slow effect
    if (window.gameUI && window.gameUI.activeSabotage === 'ac' && this.player.isAlive) {
      speed *= 0.6; // Slowdown in heat!
    }

    // Keyboard movement
    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      vx = -speed;
      this.player.dir = 'left';
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
      vx = speed;
      this.player.dir = 'right';
    }

    if (this.cursors.up.isDown || this.wasd.up.isDown) {
      vy = -speed;
    } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
      vy = speed;
    }

    // Normalize keyboard diagonal
    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    // Virtual Joystick 8-Directional & Analog Movement
    if (window.gameUI && window.gameUI.joystickVector) {
      const jv = window.gameUI.joystickVector;
      if (jv.x !== 0 || jv.y !== 0) {
        vx = jv.x * speed;
        vy = jv.y * speed;
        if (Math.abs(jv.x) > 0.15) {
          this.player.dir = jv.x > 0 ? 'right' : 'left';
        }
      }
    }

    this.player.container.body.setVelocity(vx, vy);
    const isWalking = vx !== 0 || vy !== 0;

    // Re-render local character sprite with custom physics & walk cycle
    this.renderCharacterOnGraphics(
      this.player.graphics,
      this.player.charDef,
      isWalking,
      this.tick,
      this.player.dir,
      !this.player.isAlive
    );

    // Send position updates to server
    if (isWalking || this.tick % 30 === 0) {
      if (window.gameUI && window.gameUI.socket) {
        window.gameUI.socket.emit('player_move', {
          x: Math.round(this.player.container.x),
          y: Math.round(this.player.container.y),
          vx: Math.round(vx),
          vy: Math.round(vy),
          dir: this.player.dir
        });
      }
    }

    // Interpolate other players
    this.otherPlayers.forEach(other => {
      const dx = other.targetX - other.container.x;
      const dy = other.targetY - other.container.y;
      other.container.x += dx * 0.2;
      other.container.y += dy * 0.2;
      const otherWalking = Math.hypot(dx, dy) > 2;

      this.renderCharacterOnGraphics(
        other.graphics,
        other.charDef,
        otherWalking,
        this.tick,
        other.dir,
        !other.isAlive
      );
    });

    // Darkness & Flashlight overlay
    this.updateDarknessLighting();

    // Proximity checks
    this.checkProximities();
  }

  renderCharacterOnGraphics(graphics, charDef, isWalking, tick, dir, isGhost = false) {
    graphics.clear();
    const ctx = graphics;

    if (isGhost) {
      // Floating cute comical Egyptian ghost with animation
      const ghostFloat = Math.sin(tick * 0.15) * 4;
      graphics.fillStyle(0x38bdf8, 0.45);
      graphics.fillCircle(0, -14 + ghostFloat, 16);
      graphics.fillRoundedRect(-14, -14 + ghostFloat, 28, 26, 8);
      // Ghost cute glowing eyes
      graphics.fillStyle(0xffffff, 0.85);
      graphics.fillCircle(-4, -16 + ghostFloat, 3);
      graphics.fillCircle(4, -16 + ghostFloat, 3);
      graphics.fillStyle(0x0f172a, 1);
      graphics.fillCircle(-4, -16 + ghostFloat, 1.5);
      graphics.fillCircle(4, -16 + ghostFloat, 1.5);
      return;
    }

    // Use character canvas rendering function
    // Create an offscreen canvas or vector drawing on graphics
    const scale = 1;
    const walkBob = isWalking ? Math.sin(tick * 0.25) * 3 : 0;
    const flip = dir === 'left' ? -1 : 1;

    // Body
    graphics.fillStyle(Phaser.Display.Color.HexStringToColor(charDef.color).color, 1);
    graphics.fillRoundedRect(-12 * flip, -10 + walkBob, 24, 24, 4);

    // Head
    graphics.fillStyle(0xe0a96d, 1);
    graphics.fillCircle(0, -22 + walkBob, 11);

    // Character Signature Feature
    if (charDef.id === 'bashmohandes') {
      // Orange shorts & short beard
      graphics.fillStyle(0xff6600, 1);
      graphics.fillRect(-10 * flip, 12 + walkBob, 20, 10);
      graphics.fillStyle(0x1a1a1a, 1);
      graphics.fillCircle(0, -26 + walkBob, 11);
    } else if (charDef.id === 'pablo') {
      // Stylish Designer Outfit with Paint Splatters & Paintbrush
      graphics.fillStyle(0xf8fafc, 1);
      graphics.fillRoundedRect(-14 * flip, -10 + walkBob, 28, 22, 6);
      graphics.fillStyle(0x3b82f6, 1);
      graphics.fillRect(-4 * flip, -4 + walkBob, 4, 4); // Cyan splash
      graphics.fillStyle(0xef4444, 1);
      graphics.fillRect(4 * flip, 2 + walkBob, 4, 4); // Red splash
      graphics.fillStyle(0x06b6d4, 1);
      graphics.fillCircle(14 * flip, -4 + walkBob, 3); // Glowing brush tip
    } else if (charDef.id === 'samaool') {
      // Giant Comical Nose & SAMA'OOL FC
      graphics.fillStyle(0x1abc9c, 1);
      graphics.fillRoundedRect(-12 * flip, -10 + walkBob, 24, 22, 4);
      graphics.fillStyle(0xd48a58, 1);
      graphics.fillCircle(12 * flip, -20 + walkBob, 8); // Huge Nose Hitbox!
    } else if (charDef.id === 'musa') {
      // Muscle V-Shape & Orange
      graphics.fillStyle(0xe67e22, 1);
      graphics.fillRoundedRect(-16 * flip, -12 + walkBob, 32, 26, 6);
      graphics.fillStyle(0xf1c40f, 1);
      graphics.fillRect(14 * flip, -8 + walkBob, 8, 16); // Ad Sign
    } else if (charDef.id === 'abdelmonem') {
      // Cap backward & Backpack
      graphics.fillStyle(0x9b59b6, 1);
      graphics.fillRoundedRect(-10 * flip, -10 + walkBob, 20, 20, 4);
      graphics.fillStyle(0x1e293b, 1);
      graphics.fillRect(-14 * flip, -28 + walkBob, 10, 4); // Backward Cap
    } else if (charDef.id === 'shatlawi') {
      // Round Glasses & Video controller
      graphics.fillStyle(0x4b5563, 1);
      graphics.fillCircle(0, 0 + walkBob, 14); // Small Krish
      graphics.lineStyle(2, 0x000000, 1);
      graphics.strokeCircle(4 * flip, -22 + walkBob, 4); // Glasses
    }

    // Legs
    graphics.fillStyle(0x1e293b, 1);
    graphics.fillRect(-10 * flip, 14 + walkBob, 8, 10);
    graphics.fillRect(2 * flip, 14 + walkBob, 8, 10);
  }

  updateDarknessLighting() {
    const isLightsOut = window.gameUI && window.gameUI.activeSabotage === 'lights' && this.player && this.player.isAlive;
    this.darknessOverlay.setVisible(isLightsOut);

    if (isLightsOut && this.player) {
      this.darknessOverlay.clear();
      this.darknessOverlay.fillStyle(0x000000, 0.94);
      this.darknessOverlay.fillRect(0, 0, OFFICE_MAP_DATA.width, OFFICE_MAP_DATA.height);

      // Flashlight cutout circle
      this.darknessOverlay.fillStyle(0xffffff, 1);
      // Cutout beam
      const px = this.player.container.x;
      const py = this.player.container.y;
      this.darknessOverlay.fillCircle(px, py, 110);
    }
  }

  checkProximities() {
    const px = this.player.container.x;
    const py = this.player.container.y;

    // 1. Task Station Proximity
    this.nearbyTask = null;
    if (this.player.isAlive || (window.gameUI && !window.gameUI.isSaboteur)) {
      for (const ts of OFFICE_MAP_DATA.taskStations) {
        if (Math.hypot(px - ts.x, py - ts.y) < (ts.radius || 45) + 35) {
          this.nearbyTask = ts;
          break;
        }
      }
    }

    // 2. Dead Body Proximity
    this.nearbyBody = null;
    if (this.player.isAlive) {
      this.deadBodies.forEach(b => {
        if (Math.hypot(px - b.x, py - b.y) < 70) {
          this.nearbyBody = b;
        }
      });
    }

    // 3. Emergency Button Proximity
    const em = OFFICE_MAP_DATA.emergencyButton;
    this.nearbyEmergency = (Math.hypot(px - em.x, py - em.y) < em.radius + 20);

    // 4. Saboteur Victim Proximity (Killable players)
    this.nearbyVictim = null;
    if (this.player.isAlive && window.gameUI && window.gameUI.isSaboteur) {
      this.otherPlayers.forEach(other => {
        if (other.isAlive) {
          const dist = Math.hypot(px - other.container.x, py - other.container.y);
          if (dist < 80) {
            this.nearbyVictim = other;
          }
        }
      });
    }

    // 5. Vent Proximity (For Saboteurs)
    this.nearbyVent = null;
    if (this.player.isAlive && window.gameUI && window.gameUI.isSaboteur) {
      for (const v of OFFICE_MAP_DATA.vents) {
        if (Math.hypot(px - v.x, py - v.y) < 45) {
          this.nearbyVent = v;
          break;
        }
      }
    }

    // 6. Sabotage Console Proximity
    this.nearbySabotage = null;
    if (this.player.isAlive && window.gameUI && window.gameUI.activeSabotage) {
      for (const sc of OFFICE_MAP_DATA.sabotageConsoles) {
        if (sc.type === window.gameUI.activeSabotage && Math.hypot(px - sc.x, py - sc.y) < 55) {
          this.nearbySabotage = sc;
          break;
        }
      }
    }

    // Update HUD Buttons state
    if (window.gameUI) {
      window.gameUI.updateHUDButtons({
        canUseTask: !!this.nearbyTask || !!this.nearbySabotage,
        canReport: !!this.nearbyBody,
        canKill: !!this.nearbyVictim,
        canEmergency: this.nearbyEmergency,
        canVent: !!this.nearbyVent
      });
    }
  }

  handleUseAction() {
    if (!this.player.isAlive && window.gameUI && window.gameUI.isSaboteur) return;
    if (this.nearbySabotage) {
      // Fix Sabotage!
      if (window.gameUI && window.gameUI.socket) {
        window.gameUI.socket.emit('fix_sabotage');
      }
    } else if (this.nearbyTask) {
      // Open Task Mini-game!
      if (window.taskManager) {
        window.taskManager.openTask(this.nearbyTask.id, this.player.character);
      }
    } else if (this.nearbyVent && window.gameUI && window.gameUI.isSaboteur) {
      // Teleport through Vent!
      const targetVentId = this.nearbyVent.connectsTo[0];
      const targetVent = OFFICE_MAP_DATA.vents.find(v => v.id === targetVentId);
      if (targetVent) {
        this.player.container.x = targetVent.x;
        this.player.container.y = targetVent.y;
        window.gameUI.socket?.emit('use_vent', {
          fromVentId: this.nearbyVent.id,
          toVentId: targetVent.id
        });
        window.soundEngine.playTone(180, 'sawtooth', 0.15, 0.3);
      }
    }
  }

  handleKillAction() {
    if (this.nearbyVictim && window.gameUI && window.gameUI.isSaboteur) {
      if (window.gameUI.socket) {
        window.gameUI.socket.emit('kill_player', { targetId: this.nearbyVictim.id });
        this.playSpecialKillFX(this.player.charDef.id, this.player.container.x, this.player.container.y, this.nearbyVictim.container.x, this.nearbyVictim.container.y);
      }
    }
  }

  handleReportAction() {
    if (this.nearbyBody) {
      if (window.gameUI && window.gameUI.socket) {
        window.gameUI.socket.emit('report_body', { bodyId: this.nearbyBody.id });
      }
    }
  }

  playSpecialKillFX(charId, x1, y1, x2, y2) {
    window.soundEngine.playKillSound(charId);

    // Visual FX line/particles
    const fx = this.add.graphics();
    fx.setDepth(30);

    if (charId === 'bashmohandes') {
      // Debug Beam Laser
      fx.lineStyle(6, 0x00e5ff, 1);
      fx.lineBetween(x1, y1, x2, y2);
      this.time.delayedCall(250, () => fx.destroy());
    } else if (charId === 'pablo') {
      // Paint Splash & Photoshop Color Burst
      const colors = [0x00d2ff, 0xff007f, 0xffea00, 0x7928ca, 0xffffff];
      for (let i = 0; i < 14; i++) {
        const angle = (i / 14) * Math.PI * 2;
        const rad = 15 + Math.random() * 30;
        const px = x2 + Math.cos(angle) * rad;
        const py = y2 + Math.sin(angle) * rad;
        fx.fillStyle(colors[i % colors.length], 0.9);
        fx.fillCircle(px, py, 4 + Math.random() * 5);
      }
      fx.lineStyle(4, 0x00d2ff, 0.8);
      fx.strokeCircle(x2, y2, 35);
      this.time.delayedCall(350, () => fx.destroy());
    } else if (charId === 'samaool') {
      // Football Shot
      fx.fillStyle(0x2ecc71, 1);
      fx.fillCircle(x2, y2, 20);
      this.time.delayedCall(200, () => fx.destroy());
    } else if (charId === 'musa') {
      // 2x Massive Knockback Blitz
      this.cameras.main.shake(400, 0.03);
      fx.fillStyle(0xe67e22, 0.8);
      fx.fillRect(x2 - 30, y2 - 30, 60, 60);
      this.time.delayedCall(300, () => fx.destroy());
    } else if (charId === 'abdelmonem') {
      // Pixel Dash
      fx.fillStyle(0x9b59b6, 1);
      for (let i = 0; i < 8; i++) {
        fx.fillRect(x2 + (Math.random() - 0.5) * 50, y2 + (Math.random() - 0.5) * 50, 8, 8);
      }
      this.time.delayedCall(250, () => fx.destroy());
    } else if (charId === 'shatlawi') {
      // Timeline Slice
      fx.lineStyle(4, 0x10b981, 1);
      fx.lineBetween(x2 - 30, y2 - 30, x2 + 30, y2 + 30);
      fx.lineBetween(x2 + 30, y2 - 30, x2 - 30, y2 + 30);
      this.time.delayedCall(250, () => fx.destroy());
    }
  }

  // Real-time Map Visual Proof of Innocence Effects (التاسكات البصرية في الخريطة)
  triggerMapVisualFX(taskType, x, y, playerName = 'موظف') {
    // 1. Floating Innocent Proof Badge above the station
    const proofTag = this.add.text(x, y - 45, `✨ [تاسك بصري معتمد: ${playerName} موظف بريء!]`, {
      fontFamily: 'Tajawal, Cairo',
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#38bdf8',
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setDepth(45);

    this.tweens.add({
      targets: proofTag,
      y: y - 75,
      alpha: 0,
      duration: 3500,
      ease: 'Power1',
      onComplete: () => proofTag.destroy()
    });

    // 2. Specific Graphic Animations based on taskType
    if (taskType === 'coffee_steam') {
      // Spawn 8 rising steam particles from buffet coffee pot
      for (let i = 0; i < 8; i++) {
        this.time.delayedCall(i * 180, () => {
          const steam = this.add.graphics();
          steam.setDepth(25);
          steam.fillStyle(0xffffff, 0.5);
          const offsetX = (Math.random() - 0.5) * 24;
          steam.fillCircle(x + offsetX, y - 10, 10 + Math.random() * 6);
          this.tweens.add({
            targets: steam,
            y: y - 70 - Math.random() * 35,
            x: x + offsetX + (Math.random() - 0.5) * 35,
            alpha: 0,
            scaleX: 2.2,
            scaleY: 2.2,
            duration: 2000,
            onComplete: () => steam.destroy()
          });
        });
      }
    } else if (taskType === 'server_glow') {
      // Pulsing Green Matrix Neon Aura over servers
      const aura = this.add.graphics();
      aura.setDepth(5);
      aura.fillStyle(0x22c55e, 0.35);
      aura.fillCircle(x, y, 90);
      aura.lineStyle(3, 0x86efac, 0.9);
      aura.strokeCircle(x, y, 90);

      this.tweens.add({
        targets: aura,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0,
        duration: 3000,
        ease: 'Sine.easeOut',
        onComplete: () => aura.destroy()
      });
    } else if (taskType === 'laser_scan') {
      // Sweeping Laser Beam across scanner
      const laser = this.add.graphics();
      laser.setDepth(30);
      laser.lineStyle(4, 0x22c55e, 1);
      laser.lineBetween(x - 30, y - 20, x + 30, y - 20);

      this.tweens.add({
        targets: laser,
        y: y + 35,
        alpha: 0.2,
        yoyo: true,
        repeat: 3,
        duration: 350,
        onComplete: () => laser.destroy()
      });
    } else if (taskType === 'printer_sheet') {
      // Animated Paper Sheet popping out
      const paper = this.add.graphics();
      paper.setDepth(30);
      paper.fillStyle(0xffffff, 1);
      paper.fillRect(x - 12, y - 16, 24, 32);
      paper.lineStyle(1, 0x94a3b8, 1);
      paper.strokeRect(x - 12, y - 16, 24, 32);

      this.tweens.add({
        targets: paper,
        y: y + 25,
        alpha: 0,
        duration: 2200,
        onComplete: () => paper.destroy()
      });
    } else if (taskType === 'shredder_confetti') {
      // Colorful Confetti Particles bursting
      const colors = [0xf59e0b, 0xef4444, 0x3b82f6, 0x10b981, 0xec4899];
      for (let i = 0; i < 14; i++) {
        const confetti = this.add.graphics();
        confetti.setDepth(30);
        confetti.fillStyle(colors[i % colors.length], 1);
        confetti.fillRect(x, y, 6, 6);

        const targetAngle = Math.random() * Math.PI * 2;
        const targetDist = 25 + Math.random() * 45;
        this.tweens.add({
          targets: confetti,
          x: x + Math.cos(targetAngle) * targetDist,
          y: y + Math.sin(targetAngle) * targetDist,
          alpha: 0,
          angle: 360,
          duration: 1500,
          onComplete: () => confetti.destroy()
        });
      }
    } else if (taskType === 'water_flow') {
      // Water ripples
      const ripple = this.add.graphics();
      ripple.setDepth(20);
      ripple.lineStyle(3, 0x38bdf8, 1);
      ripple.strokeCircle(x, y, 15);
      this.tweens.add({
        targets: ripple,
        scaleX: 3,
        scaleY: 3,
        alpha: 0,
        duration: 1800,
        onComplete: () => ripple.destroy()
      });
    }
  }

  // Dual-Key Synchronized Lightning Arc FX
  playDualLightningFX() {
    this.cameras.main.shake(450, 0.025);
    window.soundEngine?.playDualKeySyncSound();

    const bolt = this.add.graphics();
    bolt.setDepth(60);
    bolt.lineStyle(6, 0xfacc15, 1);
    
    // Draw zig-zag lightning arc between servers (310, 760) and reception (120, 90)
    let curX = 310, curY = 760;
    const destX = 120, destY = 90;
    const steps = 12;

    for (let i = 1; i <= steps; i++) {
      const nextX = curX + (destX - curX) * (i / steps) + (Math.random() - 0.5) * 50;
      const nextY = curY + (destY - curY) * (i / steps) + (Math.random() - 0.5) * 50;
      bolt.lineBetween(curX, curY, nextX, nextY);
      curX = nextX;
      curY = nextY;
    }
    bolt.lineBetween(curX, curY, destX, destY);

    this.time.delayedCall(400, () => {
      bolt.clear();
      bolt.lineStyle(4, 0x38bdf8, 1);
      bolt.strokeCircle(destX, destY, 80);
      bolt.strokeCircle(310, 760, 80);
      this.tweens.add({
        targets: bolt,
        alpha: 0,
        duration: 600,
        onComplete: () => bolt.destroy()
      });
    });
  }
}

const phaserConfig = {
  type: Phaser.AUTO,
  parent: 'phaser-container',
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: '100%',
    height: '100%'
  },
  backgroundColor: '#0a0e17',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [OfficeScene],
  input: {
    activePointers: 3
  }
};

window.initPhaserGame = () => {
  if (!window.phaserGame) {
    window.phaserGame = new Phaser.Game(phaserConfig);
  }
};
