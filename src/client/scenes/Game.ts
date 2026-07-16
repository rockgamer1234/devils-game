import Phaser from "phaser";
import { TrapFactory } from "../classes/TrapFactory.ts";
import { CAMPAIGN_LEVELS, LEVEL_1 } from "./levels.ts";

class GameAudioSynth {
  private ctx: AudioContext | null = null;
  private init() {
    if (this.ctx && this.ctx.state !== "closed") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    } catch (e) {}
  }
  private resume() {
    this.init();
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
  }
  playJump() {
    this.resume();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(680, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {}
  }
  playCoin() {
    this.resume();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, this.ctx.currentTime); 
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime + 0.08); 
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {}
  }
  playTrapTriggered() {
    this.resume();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {}
  }
  playSpring() {
    this.resume();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(280, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(850, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {}
  }
  playHazardCollision() {
    this.resume();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(90, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(15, this.ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.45);
    } catch (e) {}
  }
  playLevelUp() {
    this.resume();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [220, 277, 329, 440]; 
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.08, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.2);
      });
    } catch (e) {}
  }
}

export class Game extends Phaser.Scene {
  private synth = new GameAudioSynth();
  private playerNameText!: Phaser.GameObjects.Text;
  private player!: Phaser.GameObjects.Sprite & { body: Phaser.Physics.Arcade.Body };
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private coinGroup!: Phaser.Physics.Arcade.Group;
  private hazardGroup!: Phaser.Physics.Arcade.Group;
  private springGroup!: Phaser.Physics.Arcade.Group;
  private powerupGroup!: Phaser.Physics.Arcade.Group;
  private trapFactory!: TrapFactory;

  private playerScale = 1.6; 
  private customLevel: any = null;
  private currentLevelNum = 1;
  private isHandcrafted = false;
  private isInvincible = false;
  private isSpeedBoosted = false;
  private isInvertedControls = false; 
  private invincibilityTimer: Phaser.Time.TimerEvent | null = null;
  private speedBoostTimer: Phaser.Time.TimerEvent | null = null;

  private dustEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private parallaxLayers: { images: Phaser.GameObjects.Image[], factor: number }[] = [];
  private lastCleanupTime = 0;
  private lastGeneratedX = 0;
  private score = 0;
  private coinsCount = 0;
  private currentSpeed = 280;
  private isGameOver = false;
  private currentLevel = 1;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key; };

  private leftTouchActive = false;
  private rightTouchActive = false;
  private jumpTouchActive = false;
  private jumpsAvailable = 2; 
  private activeWindStrength = 0;
  private needsRestart = false;
  private lastGroundedTime = 0;
  private jumpBufferTime = 0;
  private wasTouchJumpDown = false;

  private terrainKey: string = "grass_tile";
  private spikeKey: string = "spike_tile";
  private skyBgKey: string = "clouds";
  private mountainBgKey: string = "mountains_back";
  private hillsBgKey: string = "mountains_front";

  constructor() {
    super("Game");
  }

  init(data?: { customLevel?: any, levelNum?: number, endless?: boolean }) {
    this.customLevel = data?.customLevel || null;
    this.currentLevelNum = data?.levelNum || 1;
    this.isHandcrafted = data?.customLevel ? true : false;    
    const win = window as any;
    win.reactLeftActive = false;
    win.reactRightActive = false;
    win.reactJumpActive = false;
    this.leftTouchActive = false;
    this.rightTouchActive = false;
    this.jumpTouchActive = false;
    this.isInvertedControls = false;

    if (this.currentLevelNum === 1) {
      this.terrainKey = "l1_tiles";
      this.spikeKey = "l1_spike";
      this.skyBgKey = "l1_sky";
      this.mountainBgKey = "l1_mountain";
      this.hillsBgKey = "l1_hills";
    } else if (this.currentLevelNum === 2) {
      this.terrainKey = "l2_tiles";
      this.spikeKey = "l2_spike";
      this.skyBgKey = "l2_sky";
      this.mountainBgKey = "l2_mountain";
      this.hillsBgKey = "l2_hills";
    } else if (this.currentLevelNum === 3) {
      this.terrainKey = "l3_tiles";
      this.spikeKey = "l3_spike";
      this.skyBgKey = "l3_sky";
      this.mountainBgKey = "l3_mountain";
      this.hillsBgKey = "l3_hills";
    } else {
      this.terrainKey = "l4_tiles";
      this.spikeKey = "l4_spike";
      this.skyBgKey = "l4_sky";
      this.mountainBgKey = "l4_mountain";
      this.hillsBgKey = "l4_hills";
    }
  }

  create() {
    Phaser.Math.RND.init([Date.now().toString()]);
    
    this.isGameOver = false;
    this.score = 0;
    this.coinsCount = 0;
    this.currentSpeed = 280; 
    this.currentLevel = 1;
    this.lastGeneratedX = 0;
    this.jumpsAvailable = 2;
    this.activeWindStrength = 0;
    this.isInvincible = false;
    this.isSpeedBoosted = false;
    this.isInvertedControls = false;
    this.parallaxLayers = []; 

    if (this.invincibilityTimer) this.invincibilityTimer.destroy();
    if (this.speedBoostTimer) this.speedBoostTimer.destroy();

    this.cameras.main.setBackgroundColor("#050102");
    this.setupParallaxBackground();

    this.physics.world.setBounds(0, 40, 999999, 1200);

    this.platforms = this.physics.add.staticGroup();
    this.coinGroup = this.physics.add.group();
    this.hazardGroup = this.physics.add.group();
    this.springGroup = this.physics.add.group();
    this.powerupGroup = this.physics.add.group();

    this.setupParticles();
    
    this.setupPlayer(); 

    this.playerNameText = this.add.text(this.player.x, this.player.y - 60, "Loading...", {
  fontFamily: "Courier New, monospace",
  fontSize: "14px", 
  color: "#ffffff", 
  backgroundColor: "rgba(0,0,0,0.5)",
  padding: { x: 4, y: 2 },
  stroke: "#7f1d1d",
  strokeThickness: 4
}).setOrigin(0.5).setDepth(100);


fetch("/api/me?t=" + Date.now())
  .then(res => res.json())
  .then(data => {
    if (data && data.name && this.playerNameText?.active) {
      
      const cleanName = data.name.replace("u/", "").replace("t2_", "");
      this.playerNameText.setText(cleanName);
    }
  })
  
  .catch(() => {
    if (this.playerNameText?.active) this.playerNameText.setText("prince");
  });

    this.physics.add.collider(this.player, this.platforms, this.onPlayerGroundCollide, undefined, this);    
    this.physics.add.overlap(this.player, this.coinGroup, this.onCollectCoin, undefined, this);
    this.physics.add.overlap(this.player, this.powerupGroup, this.onCollectPowerup, undefined, this);
    this.physics.add.overlap(this.player, this.hazardGroup, this.onHazardHit, undefined, this);
    this.physics.add.collider(this.player, this.springGroup, this.onSpringHit, undefined, this);
    this.physics.add.collider(this.hazardGroup, this.platforms);

    this.trapFactory = new TrapFactory(
      this, 
      this.player as unknown as Phaser.Physics.Arcade.Sprite, 
      (reason?: string) => { if (!this.isGameOver) this.triggerDeath(reason); }, 
      () => { this.synth.playTrapTriggered(); },
      this.hazardGroup,
      this.terrainKey,
      this.spikeKey
    );

    this.events.on("control_inversion_start", () => { this.isInvertedControls = true; });
    this.events.on("control_inversion_end", () => { this.isInvertedControls = false; });
    this.events.on("play_spring", () => { this.synth.playSpring(); });

    if (this.isHandcrafted) {
      if (this.customLevel) {
        this.loadLevel(this.customLevel.elements);
        this.currentLevel = 1;
      } else {
        const campaign = CAMPAIGN_LEVELS[this.currentLevelNum - 1] || LEVEL_1;
        this.currentLevel = campaign.id;
        this.loadLevel(campaign.elements);
        this.lastGeneratedX = campaign.length; 

      }
    } else {
      this.generateInitialPlatform();
    }

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasdKeys = this.input.keyboard.addKeys("W,A,S,D") as any;
    }

    this.cameras.main.startFollow(this.player, true, 0.15, 0.15, -120, 40); 
    this.cameras.main.setZoom(0.9);
    this.cameras.main.setRoundPixels(true); 

    const restartHandler = () => { this.needsRestart = true; };
    window.addEventListener("trigger-restart", restartHandler);
    this.events.once("shutdown", () => {
      window.removeEventListener("trigger-restart", restartHandler);
      this.events.off("control_inversion_start");
      this.events.off("control_inversion_end");
      this.events.off("play_spring");
    });

    window.dispatchEvent(new CustomEvent("active-game-start", {
      detail: { level: this.currentLevelNum, custom: !!this.customLevel }
    }));
  }

  private setupParallaxBackground() {
    const width = this.scale.width;
    const height = this.scale.height;

    const createLayer = (key: string, factor: number) => {
      const imgSrc = this.textures.get(key)?.getSourceImage();
      if (!imgSrc) return;
      const scaleX = (width * 1.5) / imgSrc.width;
      const scaleY = (height * 1.5) / imgSrc.height;
      const scale = Math.max(scaleX, scaleY);
      
      const i1 = this.add.image(0, height / 2, key).setOrigin(0, 0.5).setScale(scale).setScrollFactor(0, 0);
      const i2 = this.add.image(imgSrc.width * scale, height / 2, key).setOrigin(0, 0.5).setScale(scale).setScrollFactor(0, 0);
      
      this.parallaxLayers.push({ images: [i1, i2], factor });
    };

    createLayer(this.skyBgKey, 0.15);
    createLayer(this.mountainBgKey, 0.25);
    createLayer(this.hillsBgKey, 0.45);
  }

  private setupPlayer() {
    this.player = this.add.sprite(100, 300, "player_idle") as any; 
    this.physics.add.existing(this.player, false);
    
    this.playerScale = 1.6;
    this.player.setScale(this.playerScale); 
    this.player.setDepth(20); 
    
    this.player.body.setSize(24, 44);
    this.player.body.setOffset(68, 46);
    
    this.player.body.setGravityY(1100); 
    this.player.body.setCollideWorldBounds(true);
    this.physics.world.setBoundsCollision(true, true, true, false); 
    this.player.body.setDragX(2000); 
    this.player.body.setMaxVelocityX(600); 
    this.player.body.setMaxVelocityY(1000);
  }

  private setPlayerState(state: "idle" | "run" | "jump") {
    if (!this.player || !this.player.active || !this.player.body) return;
    
    const animKey = state === "run" ? "player_run_sheet_anim" 
                  : state === "idle" ? "player_idle_anim" 
                  : "player_jump_anim";

    if (this.player.anims.currentAnim?.key === animKey) {
        return; 
    }

    if (this.anims.exists(animKey)) {
        this.player.play(animKey, true);
    } else {
        const texKey = state === "run" ? "player_run_sheet" : state === "idle" ? "player_idle" : "player_jump";
        this.player.setTexture(texKey);
        this.player.stop();
    }
  }

  private setupParticles() {
    this.dustEmitter = this.add.particles(0, 0, "dust_particle", {
      lifespan: 300,
      speed: { min: 20, max: 100 },
      angle: { min: 140, max: 220 },
      scale: { start: 1, end: 0 },
      alpha: { start: 0.8, end: 0 },
      quantity: 1,
      frequency: 80,
      emitting: false
    });
    this.dustEmitter.setDepth(25);
  }

  private createDecoration(x: number, y: number, key: string) {
    const prop = this.add.sprite(x, y, key);
    prop.setDisplaySize(96, 192);
    prop.setOrigin(0.5, 1);
    prop.y = y + 32;
    prop.setDepth(2);
    prop.setDepth(2); 
    prop.setScrollFactor(1.0); 
    prop.setAlpha(0.75); 
  }

  private generateInitialPlatform() {
    for (let x = 0; x < 350; x += 64) {
      this.createGroundBlock(x, 450);
      // start coin spawn
      if (x > 120 && Math.random() < 0.6) {
         this.createCoin(x, 390);
      }
    }
    this.lastGeneratedX = 350; 
  }

  private spawnSafeGround(length: number) {
    const startX = this.lastGeneratedX;
    let currentX = startX;
    while (currentX < startX + length) {
      this.createGroundBlock(currentX, 450);
      
      // 45% chance to spawn a coin on every single safe block
      if (Math.random() < 0.45) {
         this.createCoin(currentX, 390);
      }
      
      currentX += 64;
      if (Math.random() < 0.1) {
         const gapWidth = Phaser.Math.Between(150, 300); 
         this.lastGeneratedX = currentX;
         this.spawnGap(gapWidth, gapWidth);
         currentX = this.lastGeneratedX;
      }
    }
    this.lastGeneratedX = currentX;
  }


  private generateNextChunk() {
    //  Spawn 3 to 5 traps at once 
    const trapsPerChunk = Phaser.Math.Between(3, 5);

    // ALL 30 TRAPS 
    const allTraps = [
      this.spawnFallingBlockTrap, this.spawnPopUpSpikesPattern,
      this.spawnSinkingMudBlockPattern, this.spawnGhostSpikePattern,
      this.spawnTrampolinePattern, this.spawnRotatingHazardTrap, this.spawnFallingBridgePattern,
      this.spawnCeilingTrollPattern, this.spawnGhostSafetyBlock,this.spawnMimicTrap,
      this.spawnSawbladePattern, this.spawnProjectileLauncherTrap, this.spawnControlInversionTrap,
      this.spawnSpikeGrowPattern, this.spawnGiantRollingBoulderPattern,
      this.spawnGravityShiftPattern, this.spawnFallingArchitectureTrap,
      this.spawnFleeingPlatformPattern, this.spawnFakeWallSpikeTrap, this.spawnExpandingCeilingSpikes,
      this.spawnHorizontalSpearLaunch, this.spawnTrollRestartSkullCoin, this.spawnJumpDisablePattern,
      this.spawnDropAnvilPattern, this.spawnTripleCrumbleBridgePattern, this.spawnHeatSeekingFloatingSpike,
      this.spawnSkySpikeInvertedRainPattern, this.spawnFakeGoalTrollPattern
    ];

    for (let i = 0; i < trapsPerChunk; i++) {
      // 1. TINY safe distance between traps 
      const safeDistance = Phaser.Math.Between(256, 512); 
      this.spawnSafeGround(safeDistance);
      
      
      const selectedTrap = Phaser.Utils.Array.GetRandom(allTraps);
      selectedTrap.call(this);
      
      
      this.lastGeneratedX += Phaser.Math.Between(64, 128);
      
      // 4.  Coin Spawn
      if (Math.random() < 0.60) { 
        
        this.createCoin(this.lastGeneratedX - 32, 350); 
      }
    }

    // 5. 25% chance to spawn a powerup at the end of the chunk
    if (Math.random() < 0.25) { 
      const pType = Math.random() < 0.5 ? "speed" : "shield";
      this.createPowerup(this.lastGeneratedX, 390, pType);
    }
    
    // bg props
    if (Math.random() < 0.2) {
      const propKey = this.currentLevelNum === 2 ? "prop_column" : "prop_altar";
      this.createDecoration(this.lastGeneratedX, 402, propKey);
    }
  }

  private spawnGap(minWidth: number, maxWidth: number) {
    const jumpVel = 530; 
    const gravity = 1200; 
    const gapWidth = Phaser.Math.Between(minWidth, maxWidth);
    if (!this.trapFactory.isJumpPossible(gapWidth, gravity, jumpVel, this.currentSpeed)) {
        const timeInAir = (2 * jumpVel) / gravity;
        const maxDist = timeInAir * this.currentSpeed;
        this.lastGeneratedX += Math.floor(maxDist * 0.75);
    } else {
        this.lastGeneratedX += gapWidth;
    }
  }

  private spawnNormalRunPattern() {
    const len = Phaser.Math.Between(8, 15);
    const startX = this.lastGeneratedX;
    for (let i = 0; i < len; i++) {
      const blockX = startX + i * 64;
      this.createGroundBlock(blockX, 450);
      if (i > 3 && i < len - 3 && Math.random() < 0.45) {
        this.createCoin(blockX, 390);
      }
    }
    this.lastGeneratedX = startX + len * 64;
  }

  private spawnFallingBridgePattern() {
    const startX = this.lastGeneratedX;
    this.createGroundBlock(startX, 450);
    const bridgeSize = 4;
    for (let i = 0; i < bridgeSize; i++) {
      const blockX = startX + 64 + i * 64;
      
      const crumble = this.createGroundBlock(blockX, 450);
      crumble.setTexture("cracked_stone"); 
      crumble.setDisplaySize(64, 64);
      
      this.registerFallingPlatform(crumble, 150); 
    }
    this.createGroundBlock(startX + 64 + bridgeSize * 64, 450);
    this.lastGeneratedX = startX + 128 + bridgeSize * 64;
  }

  private spawnPopUpSpikesPattern() {
    const startX = this.lastGeneratedX;
    for (let i = 0; i < 3; i++) {
      this.createGroundBlock(startX + i * 64, 450);
    }
    const midPlatform = this.createGroundBlock(startX + 192, 450);
    this.registerSpikeTrapPlatform(midPlatform, startX + 192, 450);
    for (let i = 0; i < 3; i++) {
      this.createGroundBlock(startX + 256 + i * 64, 450);
    }
    this.lastGeneratedX = startX + 448;
  }

  private spawnTrollGapSpringPattern() {
    const startX = this.lastGeneratedX;
    this.createGroundBlock(startX, 450);
    this.createGroundBlock(startX + 64, 450);
    this.createSpring(startX + 64, 402);
    this.createSpike(startX + 128, 550);
    this.createSpike(startX + 192, 550);
    const spike = this.createSpike(startX + 160, 206);
    spike.setAngle(180);
    this.createGroundBlock(startX + 256, 450);
    this.createGroundBlock(startX + 320, 450);
    this.lastGeneratedX = startX + 384;
  }

  private spawnCeilingTrollPattern() {
    const startX = this.lastGeneratedX;
    for (let i = 0; i < 6; i++) {
      const blockX = startX + i * 64;
      this.createGroundBlock(blockX, 450);
      if (i >= 2 && i <= 4) {
        const ceil = this.createGroundBlock(blockX, 250);
        this.registerCrusherPlatform(ceil, 500); 
      }
    }
    this.lastGeneratedX = startX + 384;
  }

  private spawnStairwayToHellPattern() {
    const startX = this.lastGeneratedX;
    const stairs = 4;
    for (let i = 0; i < stairs; i++) {
      const blockX = startX + i * 64;
      const blockY = 450 - i * 32;
      const step = this.createGroundBlock(blockX, blockY);
      if (i > 0) this.registerSlippingPlatform(step); 
    }
    const finalX = startX + stairs * 64;
    for (let i = 0; i < 3; i++) {
      this.createGroundBlock(finalX + i * 64, 450 - (stairs - 1) * 32);
    }
    this.lastGeneratedX = finalX + 192;
  }

  private spawnTeleportingCoinTroll() {
    const startX = this.lastGeneratedX;
    for (let i = 0; i < 4; i++) {
      this.createGroundBlock(startX + i * 64, 450);
    }
    const runawayCoin = this.createCoin(startX + 64, 402);
    const triggerZone = this.add.zone(startX + 32, 400, 64, 150);
    this.physics.add.existing(triggerZone, true);
    this.physics.add.overlap(this.player, triggerZone, () => {
      if (runawayCoin.active) {
        this.tweens.add({
          targets: runawayCoin,
          x: startX + 192,
          y: 402,
          duration: 80,
          ease: "Power1",
          onComplete: () => {
            if (this.isGameOver) return;
            this.synth.playTrapTriggered();
            const popSpike = this.createSpike(startX + 192, 450);
            this.tweens.add({ targets: popSpike, y: 394, duration: 80 });
          }
        });
      }
      triggerZone.destroy();
    });
    this.lastGeneratedX = startX + 256;
  }

  private spawnVanishBridgePattern() {
    const startX = this.lastGeneratedX;
    this.createGroundBlock(startX, 450);
    const gapBlock = this.createGroundBlock(startX + 128, 450);
    const detector = this.add.zone(startX + 64, 400, 20, 200);
    this.physics.add.existing(detector, true);
    this.physics.add.overlap(this.player, detector, () => {
      if (gapBlock.active) {
        this.synth.playTrapTriggered();
        this.tweens.add({
          targets: gapBlock,
          alpha: 0,
          duration: 100,
          onComplete: () => {
            const body = gapBlock.body as Phaser.Physics.Arcade.Body;
            if (body) body.enable = false; 
          }
        });
      }
      detector.destroy();
    });
    this.createGroundBlock(startX + 256, 450);
    this.lastGeneratedX = startX + 320;
  }

  private spawnSpikeGrowPattern() {
    const startX = this.lastGeneratedX;
    this.createGroundBlock(startX, 450);
    const pitSpike = this.createSpike(startX + 64, 410); 
    const triggerZone = this.add.zone(startX + 32, 400, 40, 300);
    this.physics.add.existing(triggerZone, true);
    this.physics.add.overlap(this.player, triggerZone, () => {
      if (pitSpike.active) {
        this.synth.playTrapTriggered();
        this.tweens.add({
      targets: pitSpike,
      displayHeight: pitSpike.displayHeight * 3.5, 
      y: 365, 
      duration: 150,
      ease: "Bounce.easeOut"
    });
      }
      triggerZone.destroy();
    });
    this.createGroundBlock(startX + 128, 450);
    this.lastGeneratedX = startX + 192;
  }

  private spawnGiantRollingBoulderPattern() {
    const startX = this.lastGeneratedX;
    for (let i = 0; i < 8; i++) {
      this.createGroundBlock(startX + i * 64, 450);
    }
    const triggerZone = this.add.zone(startX + 64, 400, 20, 200);
    this.physics.add.existing(triggerZone, true);
    this.physics.add.overlap(this.player, triggerZone, () => {
      if (this.isGameOver) return;
      this.synth.playTrapTriggered();
      const boulder = this.add.sprite(startX + 400, 338, this.terrainKey);
     boulder.setDisplaySize(160, 160);
      boulder.setTint(0x7f1d1d);
      boulder.setDepth(15);
      this.hazardGroup.add(boulder);
      const bBody = boulder.body as Phaser.Physics.Arcade.Body;
      bBody.setAllowGravity(false);
      bBody.setVelocityX(-450);
      this.tweens.add({
        targets: boulder,
        angle: -360,
        duration: 800,
        repeat: -1
      });
      triggerZone.destroy();
    });
    this.lastGeneratedX = startX + 512;
  }

  private spawnWindTunnelPattern() {
    const startX = this.lastGeneratedX;
    for (let i = 0; i < 8; i++) {
      this.createGroundBlock(startX + i * 64, 450);
    }
    const triggerZone = this.add.zone(startX + 128, 400, 20, 150);
    this.physics.add.existing(triggerZone, true);
    this.physics.add.overlap(this.player, triggerZone, () => {
      if (this.isGameOver) return;
      this.synth.playTrapTriggered();
      this.activeWindStrength = -350;
      this.cameras.main.flash(200, 127, 29, 29);

      const windLabel = this.add.text(this.player.x + 80, 280, "::: GRACE GALE :::", {
        font: "black 14px monospace",
        color: "#b91c1c"
      });
      this.time.delayedCall(1500, () => {
        if (this.scene && this.scene.isActive()) {
          this.activeWindStrength = 0;
          if (windLabel && windLabel.active) windLabel.destroy();
        }
      });
      triggerZone.destroy();
    });
    this.lastGeneratedX = startX + 512;
  }

  private spawnJumpDisablePattern() {
    const startX = this.lastGeneratedX;
    this.createGroundBlock(startX, 450);
    for (let i = 0; i < 3; i++) {
      const mud = this.createGroundBlock(startX + 64 + i * 64, 450);
      mud.setTint(0x1e1b4b);
      mud.setData("trapType", "jump_eater");
    }
    this.createSpike(startX + 256, 394);
    this.createGroundBlock(startX + 320, 450);
    this.lastGeneratedX = startX + 384;
  }

  private spawnGravityShiftPattern = () => {
    const startX = this.lastGeneratedX;
    
    // 1. Safe ground before the flip
    this.createGroundBlock(startX, 450);
    this.createGroundBlock(startX + 64, 450);

    // 2. Trigger to flip UP 
    this.trapFactory.create("gravity_shift", { x: startX + 128, y: 450 });

    // 3. a MASSIVE ceiling (18 blocks long) 
    
    for (let i = 0; i < 18; i++) {
      this.createGroundBlock(startX + 128 + (i * 64), 150); 
    }

    // 4. Add some upside-down hazards
    this.createSpike(startX + 384, 150);
    this.createSpike(startX + 700, 150);
    
    // 5. Trigger to flip
    // We place this at the end of the ceiling (Y = 100)
    this.trapFactory.create("gravity_shift", { x: startX + 1000, y: 150 });

    // 6. Safe landing pad back on the normal ground
    for (let i = 0; i < 6; i++) {
      this.createGroundBlock(startX + 900 + (i * 64), 450);
    }

    // Move the generator forward past this massive set piece
    this.lastGeneratedX = startX + 1284;
  };

  private spawnFleeingPlatformPattern() {
    const startX = this.lastGeneratedX;
    this.createGroundBlock(startX, 450);
    const platform = this.createGroundBlock(startX + 128, 450);
    const triggerZone = this.add.zone(startX + 64, 400, 20, 200);
    this.physics.add.existing(triggerZone, true);
    this.physics.add.overlap(this.player, triggerZone, () => {
      if (platform.active) {
        this.synth.playTrapTriggered();
        this.tweens.add({
          targets: platform,
          x: platform.x + 80,
          duration: 150,
          ease: "Cubic.easeOut"
        });
      }
      triggerZone.destroy();
    });
    this.createGroundBlock(startX + 320, 450);
    this.lastGeneratedX = startX + 384;
  }

  private spawnVerticalRainingSpikes() {
    const startX = this.lastGeneratedX;
    for (let i = 0; i < 6; i++) {
      const blockX = startX + i * 64;
      const b = this.createGroundBlock(blockX, 450);
      if (i === 3) b.setData("trapType", "rain_trigger");
    }
    this.lastGeneratedX = startX + 384;
  }

  private spawnFakeWallSpikeTrap() {
    const startX = this.lastGeneratedX;
    for (let i = 0; i < 6; i++) {
      this.createGroundBlock(startX + i * 64, 450);
    }
    const fakeWall1 = this.add.sprite(startX + 192, 450, this.terrainKey);
    const fakeWall2 = this.add.sprite(startX + 192, 386, this.terrainKey);
    fakeWall1.setDisplaySize(64, 64);
    fakeWall2.setDisplaySize(64, 64);
    fakeWall1.setTint(0x4a5568);
    fakeWall2.setTint(0x4a5568);
    fakeWall1.setDepth(15); 
    fakeWall2.setDepth(15);
    const secretSpike = this.createSpike(startX + 192, 394);
    secretSpike.setDepth(5); 

    this.lastGeneratedX = startX + 384;
  }

  private spawnFakeSpringTrap() {
    const startX = this.lastGeneratedX;
    this.createGroundBlock(startX, 450);
    const spring = this.createSpring(startX + 64, 402);
    spring.setData("trapType", "fake_spring");
    for (let i = 0; i < 2; i++) {
      this.createSpike(startX + 128 + i * 64, 500); 
    }
    this.createGroundBlock(startX + 256, 450);
    this.lastGeneratedX = startX + 320;
  }

  private spawnBounceToSpikeCeiling() {
    const startX = this.lastGeneratedX;
    this.createGroundBlock(startX, 450);
    this.createSpring(startX + 64, 402);
    const ceilSpike = this.createSpike(startX + 64, 206);
    ceilSpike.setAngle(180);
    this.createGroundBlock(startX + 192, 450);
    this.lastGeneratedX = startX + 256;
  }

  private spawnFalseFloorPit() {
    const startX = this.lastGeneratedX;
    this.createGroundBlock(startX, 450);
    const t1 = this.createGroundBlock(startX + 64, 450);
    const t2 = this.createGroundBlock(startX + 128, 450);
    this.registerFallingPlatform(t1, 10); 
    this.registerFallingPlatform(t2, 10);
    this.createSpike(startX + 64, 550);
    this.createSpike(startX + 128, 550);
    this.createGroundBlock(startX + 192, 450);
    this.lastGeneratedX = startX + 256;
  }

  private spawnSlidingStaircasePattern() {
    const startX = this.lastGeneratedX;
    this.createGroundBlock(startX, 450);
    const step1 = this.createGroundBlock(startX + 64, 418);
    const step2 = this.createGroundBlock(startX + 128, 386);
    step1.setData("trapType", "sliding_stair");
    step2.setData("trapType", "sliding_stair");
    this.createGroundBlock(startX + 256, 386);
    this.lastGeneratedX = startX + 320;
  }

  private spawnSpeedBoostOvershootPattern() {
    const startX = this.lastGeneratedX;
    for (let i = 0; i < 6; i++) {
      const b = this.createGroundBlock(startX + i * 64, 450);
      if (i === 2) {
        b.setTint(0x78350f);
        const trigger = this.add.zone(startX + i * 64, 400, 32, 150);
        this.physics.add.existing(trigger, true);
        this.physics.add.overlap(this.player, trigger, () => {
          if (this.isGameOver) return;
          this.synth.playSpring();
          this.player.body.setVelocityX(1200);
          this.cameras.main.flash(150, 220, 38, 38);
        });
      }
    }
    this.createSpike(startX + 384, 394);
    this.createGroundBlock(startX + 448, 450);
    this.lastGeneratedX = startX + 512;
  }

  private spawnExpandingCeilingSpikes() {
    const startX = this.lastGeneratedX;
    for (let i = 0; i < 6; i++) {
      this.createGroundBlock(startX + i * 64, 450);
    }
    const ceilSpike = this.createSpike(startX + 128, 206);
    ceilSpike.setAngle(180);
    const trigger = this.add.zone(startX + 64, 380, 20, 200);
    this.physics.add.existing(trigger, true);
    this.physics.add.overlap(this.player, trigger, () => {
      if (ceilSpike.active) {
        this.synth.playTrapTriggered();
        this.tweens.add({
      targets: ceilSpike,
      y: 350,
      displayWidth: ceilSpike.displayWidth * 2.2, 
      displayHeight: ceilSpike.displayHeight * 2.2, 
      duration: 120
    });
      }
      trigger.destroy();
    });
    this.lastGeneratedX = startX + 384;
  }

  private spawnHorizontalSpearLaunch() {
    const startX = this.lastGeneratedX;
    for (let i = 0; i < 8; i++) {
      this.createGroundBlock(startX + i * 64, 450);
    }
    const trigger = this.add.zone(startX + 128, 400, 20, 150);
    this.physics.add.existing(trigger, true);
    this.physics.add.overlap(this.player, trigger, () => {
      if (this.isGameOver) return;
      this.synth.playTrapTriggered();
      const arrow = this.createSpike(startX + 400, 390);
      arrow.setAngle(-90); 
      arrow.setTint(0x7f1d1d);
      const aBody = arrow.body as Phaser.Physics.Arcade.Body;
      aBody.setAllowGravity(false);
      aBody.setVelocityX(-750);
      trigger.destroy();
    });
    this.lastGeneratedX = startX + 512;
  }

  private spawnGhostSafetyBlock() {
    const startX = this.lastGeneratedX;
    this.createGroundBlock(startX, 450);
    const ghost = this.add.sprite(startX + 64, 450, this.terrainKey);
    ghost.setDisplaySize(64, 64);
    ghost.setTint(0x3f3f46);
    ghost.setDepth(15); 
    this.createSpike(startX + 64, 550);
    this.createGroundBlock(startX + 128, 450);
    this.lastGeneratedX = startX + 192;
  }

  private spawnTrollRestartSkullCoin() {
    const startX = this.lastGeneratedX;
    for (let i = 0; i < 5; i++) {
      this.createGroundBlock(startX + i * 64, 450);
    }
    const trollCoin = this.createCoin(startX + 64, 402);
    trollCoin.setTint(0x7f1d1d); 
    const trigger = this.add.zone(startX + 64, 400, 32, 100);
    this.physics.add.existing(trigger, true);
    this.physics.add.overlap(this.player, trigger, () => {
      if (trollCoin.active) {
        trollCoin.destroy();
        this.synth.playTrapTriggered();
        this.cameras.main.shake(500, 0.04);
        this.cameras.main.flash(300, 0, 0, 0);

        const t = this.add.text(this.player.x - 100, 250, "[!] COVENANT MEMORY INTERRUPTED...", {
          font: "black 14px monospace",
          color: "#b91c1c"
        });
        this.time.delayedCall(1200, () => {
          if (this.scene && this.scene.isActive()) {
            if (t && t.active) t.destroy();
            if (this.isGameOver || !this.player || !this.player.active) return;
            this.createCoin(this.player.x + 60, 402);
            this.createCoin(this.player.x + 100, 402);
          }
        });
      }
      trigger.destroy();
    });
    this.lastGeneratedX = startX + 320;
  }

  private spawnFlickeringLightTrap() {
    const startX = this.lastGeneratedX;
    this.createGroundBlock(startX, 450);
    const b2 = this.createGroundBlock(startX + 128, 450);
    const trigger = this.add.zone(startX + 64, 400, 20, 150);
    this.physics.add.existing(trigger, true);
    this.physics.add.overlap(this.player, trigger, () => {
      if (this.isGameOver) return;
      this.synth.playTrapTriggered();
      this.cameras.main.flash(200, 9, 9, 11);
      this.tweens.add({
        targets: b2,
        x: b2.x + 64,
        duration: 1050,
        onComplete: () => {
          const body = b2.body as Phaser.Physics.Arcade.Body;
          if (body) body.updateFromGameObject();
        }
      });
      trigger.destroy();
    });
    this.lastGeneratedX = startX + 256;
  }

  private spawnHeatSeekingFloatingSpike() {
    const startX = this.lastGeneratedX;
    for (let i = 0; i < 6; i++) {
      this.createGroundBlock(startX + i * 64, 450);
    }
    const homingSpike = this.createSpike(startX + 192, 300);
    homingSpike.setTint(0x7f1d1d);
    const trigger = this.add.zone(startX + 64, 380, 20, 200);
    this.physics.add.existing(trigger, true);
    this.physics.add.overlap(this.player, trigger, () => {
      if (homingSpike.active && !this.isGameOver) {
        this.synth.playTrapTriggered();
        this.tweens.add({
          targets: homingSpike,
          y: this.player.y,
          x: this.player.x + 32,
          duration: 350,
          ease: "Sine.easeInOut"
        });
      }
      trigger.destroy();
    });
    this.lastGeneratedX = startX + 384;
  }

  private spawnSinkingMudBlockPattern() {
    const startX = this.lastGeneratedX;
    this.createGroundBlock(startX, 450);
    const mudBlock = this.createGroundBlock(startX + 64, 450);
    mudBlock.setTint(0x450a0a); 
    mudBlock.setData("trapType", "sinking_mud");
    this.createGroundBlock(startX + 128, 450);
    this.lastGeneratedX = startX + 192;
  }

  private spawnTripleCrumbleBridgePattern() {
    const startX = this.lastGeneratedX;
    this.createGroundBlock(startX, 450);
    for (let i = 0; i < 5; i++) {
      const blockX = startX + 64 + i * 64;
      const b = this.createGroundBlock(blockX, 450);
      if (i % 2 === 1) this.registerFallingPlatform(b, 50);
    }
    this.createGroundBlock(startX + 384, 450);
    this.lastGeneratedX = startX + 448;
  }

  private spawnFakeGoalTrollPattern() {
    const startX = this.lastGeneratedX;
    for (let i = 0; i < 6; i++) {
      this.createGroundBlock(startX + i * 64, 450);
    }
    const fakeGoal = this.add.sprite(startX + 192, 402, "powerup_shield");
    fakeGoal.setDisplaySize(32, 32);
    fakeGoal.setTint(0x7f1d1d);
    fakeGoal.setDepth(5);
    this.physics.add.existing(fakeGoal, true);
    
    this.physics.add.overlap(this.player, fakeGoal, () => {
      if (fakeGoal.active && !this.isGameOver) {
        fakeGoal.destroy();
        this.synth.playTrapTriggered();
        this.cameras.main.flash(150, 127, 29, 29);
        this.triggerDeath();
      }
    });
    this.lastGeneratedX = startX + 384;
  }

  private spawnSkySpikeInvertedRainPattern() {
    const startX = this.lastGeneratedX;
    this.createGroundBlock(startX, 450);
    const trigger = this.add.zone(startX + 64, 400, 20, 200);
    this.physics.add.existing(trigger, true);
    this.physics.add.overlap(this.player, trigger, () => {
      if (this.isGameOver) return;
      this.synth.playTrapTriggered();
      for (let i = 0; i < 3; i++) {
        const spike = this.createSpike(this.player.x + 80 + i * 64, 600);
        const body = spike.body as Phaser.Physics.Arcade.Body;
        body.setVelocityY(-600);
      }
      trigger.destroy();
    });
    this.createGroundBlock(startX + 256, 450);
    this.lastGeneratedX = startX + 320;
  }

  private spawnGhostSpikePattern = () => {
    const startX = this.lastGeneratedX;
    for (let i = 0; i < 4; i++) {
      this.createGroundBlock(startX + i * 64, 450);
    }
    const ghostSpike = this.createSpike(startX + 128, 394);
    ghostSpike.setAlpha(0); 
    const trigger = this.add.zone(startX + 64, 400, 20, 150);
    this.physics.add.existing(trigger, true);
    this.physics.add.overlap(this.player, trigger, () => {
      if (this.isGameOver) return;
      if (ghostSpike.alpha === 0) {
        this.synth.playTrapTriggered();
        this.tweens.add({
          targets: ghostSpike,
          alpha: 1,
          duration: 150,
          ease: "Power1"
        });
      }
    });
    this.lastGeneratedX = startX + 256;
  };

  private spawnDropAnvilPattern = () => {
    const startX = this.lastGeneratedX;
    for (let i = 0; i < 5; i++) {
      this.createGroundBlock(startX + i * 64, 450);
    }
    const trigger = this.add.zone(startX + 64, 400, 20, 150);
    this.physics.add.existing(trigger, true);
    this.physics.add.overlap(this.player, trigger, () => {
      if (this.isGameOver || !trigger.active) return;
      trigger.setActive(false);
      trigger.destroy();
      this.synth.playTrapTriggered();
      const anvil = this.add.sprite(startX + 192, 0, this.terrainKey);
      anvil.setTint(0x1e1b4b);
      anvil.setDisplaySize(64, 64);
      anvil.setDepth(15);
      this.physics.add.existing(anvil);
      const body = anvil.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(true);
      body.setGravityY(1500);
      body.setVelocityY(200);
      this.physics.add.overlap(this.player, anvil, () => {
        if (!this.isGameOver) this.triggerDeath();
      });
    });
    this.lastGeneratedX = startX + 320;
  };

  private spawnFallingBlockTrap = () => {
    const startX = this.lastGeneratedX;
    for (let i = 0; i < 4; i++) {
      this.createGroundBlock(startX + i * 64, 450);
    }
    this.trapFactory.create("falling_block", { x: startX + 128, y: 300 });
    this.lastGeneratedX = startX + 256;
  };

  private spawnRotatingHazardTrap = () => {
    const startX = this.lastGeneratedX;
    for (let i = 0; i < 5; i++) {
      this.createGroundBlock(startX + i * 64, 450);
    }
    this.trapFactory.create("rotating_hazard", { x: startX + 128, y: 400 });
    this.lastGeneratedX = startX + 320;
  };

  private spawnSawbladePattern = () => {
    const startX = this.lastGeneratedX;
    for (let i = 0; i < 8; i++) {
      this.createGroundBlock(startX + i * 64, 450);
    }
    this.trapFactory.create("sawblade", { x: startX + 128, y: 418 });
    this.lastGeneratedX = startX + 512;
  };

  private spawnTrampolinePattern = () => {
    const startX = this.lastGeneratedX;
    this.createGroundBlock(startX, 450);
    this.trapFactory.create("trampoline", { x: startX + 64, y: 434 });
    this.createGroundBlock(startX + 400, 200); 
    for (let i = 0; i < 4; i++) {
        this.createGroundBlock(startX + 400 + i * 64, 200);
    }
    this.lastGeneratedX = startX + 700;
  };

  private spawnUIFakeoutTrap = () => {
    const startX = this.lastGeneratedX;
    for (let i = 0; i < 5; i++) {
      this.createGroundBlock(startX + i * 64, 450);
    }
    this.trapFactory.create("ui_troll", { x: startX + 128, y: 400 });
    this.lastGeneratedX = startX + 320;
  };

  private spawnDeveloperDoorTrap = () => {
    const startX = this.lastGeneratedX;
    for (let i = 0; i < 7; i++) {
      this.createGroundBlock(startX + i * 64, 450);
    }
    this.trapFactory.create("developer_door", { x: startX + 256, y: 418 });
    this.lastGeneratedX = startX + 448;
  };

  private spawnProjectileLauncherTrap = () => {
    const startX = this.lastGeneratedX;
    for (let i = 0; i < 8; i++) {
      this.createGroundBlock(startX + i * 64, 450);
    }
    this.trapFactory.create("projectile_launcher", { x: startX + 384, y: 450 });
    this.lastGeneratedX = startX + 512;
  };

  private spawnFallingArchitectureTrap = () => {
    const startX = this.lastGeneratedX;
    this.trapFactory.create("falling_architecture", { x: startX, y: 450 });
    this.lastGeneratedX = startX + 320;
  };

  private spawnControlInversionTrap = () => {
    const startX = this.lastGeneratedX;
    for (let i = 0; i < 5; i++) {
      this.createGroundBlock(startX + i * 64, 450);
    }
    this.trapFactory.create("control_inversion", { x: startX + 128, y: 400 });
    this.lastGeneratedX = startX + 320;
  };

  private registerFallingPlatform(block: Phaser.GameObjects.Sprite, delay: number) {
    block.setData("trapType", "falling");
    block.setData("triggered", false);
    block.setData("delay", delay);
  }

  private registerSpikeTrapPlatform(block: Phaser.GameObjects.Sprite, x: number, y: number) {
    block.setData("trapType", "spike_pop");
    block.setData("triggered", false);
    block.setData("origX", x);
    block.setData("origY", y);
  }

  private registerCrusherPlatform(block: Phaser.GameObjects.Sprite, speed: number) {
    block.setData("trapType", "crusher");
    block.setData("triggered", false);
    block.setData("speed", speed);
  }

  private registerSlippingPlatform(block: Phaser.GameObjects.Sprite) {
    block.setData("trapType", "slipping");
    block.setData("triggered", false);
  }

  private makePlatformDynamic(platformObj: any) {
    if (platformObj.body && platformObj.body.isStatic) {
      this.platforms.remove(platformObj); 
      this.physics.world.disable(platformObj); 
      platformObj.body = null; 
      this.physics.add.existing(platformObj, false); 
      const pBody = platformObj.body as Phaser.Physics.Arcade.Body;
      pBody.setAllowGravity(false);
      pBody.setImmovable(true);
      
      this.physics.add.collider(this.player, platformObj);
      return pBody;
    }
    return platformObj.body as Phaser.Physics.Arcade.Body;
  }

  private onPlayerGroundCollide(playerObj: any, platformObj: any) {
    const isGravityInverted = this.player.body.gravity.y < 0;
    const body = this.player.body;

    const isGrounded = isGravityInverted
      ? (body.blocked.up || body.touching.up)
      : (body.blocked.down || body.touching.down);

    if (isGrounded) {
      this.jumpsAvailable = 2; 
    }

    const trapType = platformObj.getData("trapType");
    const triggered = platformObj.getData("triggered");
    if (trapType === "jump_eater") {
      this.jumpsAvailable = 0;
      this.player.setTint(0x71717a);
    } else {
      this.player.clearTint();
    }
    if (trapType && !triggered) {
      platformObj.setData("triggered", true);
      if (trapType === "falling") {
        const delay = platformObj.getData("delay") || 150;
        this.synth.playTrapTriggered();
        this.cameras.main.shake(120, 0.015);
        this.time.delayedCall(delay, () => {
          if (this.scene && this.scene.isActive()) {
            if (this.isGameOver || !platformObj || !platformObj.active) return;
            platformObj.setTint(0xef4444);
            const platformBody = this.makePlatformDynamic(platformObj);
            if (platformBody) {
              platformBody.setImmovable(false);
              platformBody.setAllowGravity(true);
              platformBody.setGravityY(1000);
              platformBody.setVelocityY(400);
            }
          }
        });
      } else if (trapType === "spike_pop") {
        this.synth.playTrapTriggered();
        const origX = platformObj.getData("origX");
        const origY = platformObj.getData("origY");
        this.cameras.main.shake(100, 0.02);
        
        const spikeLeft = this.createSpike(origX - 16, origY);
        const spikeRight = this.createSpike(origX + 16, origY);
        if (spikeLeft.body) (spikeLeft.body as Phaser.Physics.Arcade.Body).moves = false;
        if (spikeRight.body) (spikeRight.body as Phaser.Physics.Arcade.Body).moves = false;
        this.tweens.add({
          targets: [spikeLeft, spikeRight],
          y: 394, 
          duration: 80,
          ease: "Power2",
          onUpdate: () => {
            if (spikeLeft.body) (spikeLeft.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
            if (spikeRight.body) (spikeRight.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
          }
        });
      } else if (trapType === "slipping") {
        this.synth.playTrapTriggered();
        if (platformObj.body) (platformObj.body as Phaser.Physics.Arcade.Body).moves = false;
        this.tweens.add({
          targets: platformObj,
          y: platformObj.y + 120,
          duration: 250,
          ease: "Power2",
          onUpdate: () => {
            if (platformObj.body) (platformObj.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
          }
        });
      } else if (trapType === "sinking_mud") {
        this.synth.playTrapTriggered();
        const pBody = this.makePlatformDynamic(platformObj);
        if (pBody) {
          pBody.setImmovable(false);
          pBody.setAllowGravity(true);
          pBody.setGravityY(400);
          pBody.setVelocityY(60);
        }
      } else if (trapType === "sliding_stair") {
        this.synth.playTrapTriggered();
        if (platformObj.body) (platformObj.body as Phaser.Physics.Arcade.Body).moves = false;
        this.tweens.add({
          targets: platformObj,
          x: platformObj.x + (Phaser.Math.RND.between(0, 10) > 5 ? 64 : -64),
          duration: 300,
          ease: "Power2",
          onUpdate: () => {
            if (platformObj.body) (platformObj.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
          }
        });
      }
    }
  }

  private createGroundBlock(x: number, y: number, width?: number): Phaser.GameObjects.Sprite {
    if (!this.textures.exists(this.terrainKey)) this.terrainKey = "l1_tiles"; 
    const block = this.platforms.create(x, y, this.terrainKey);
    
    if (width) {
      const scaleRatio = 64 / 32;
      block.setDisplaySize(width * scaleRatio, 64);
    } else {
      block.setDisplaySize(64, 64); 
    }
    block.setDepth(1);
    block.refreshBody();
    
    const body = block.body as Phaser.Physics.Arcade.StaticBody;
    body.checkCollision.left = false;
    body.checkCollision.right = false;
    
    
    // inverted collision
    if (y < 350) {
        body.checkCollision.down = true;  
        body.checkCollision.up = false;   
    } else {
        body.checkCollision.down = false; 
        body.checkCollision.up = true;    
    }
    
    return block;
  }

  private createSpike(x: number, y: number): Phaser.GameObjects.Sprite {
    if (!this.textures.exists(this.spikeKey)) this.spikeKey = "l1_spike"; 
    const spike = this.add.sprite(x, y, this.spikeKey);
    spike.setDisplaySize(48, 48); 
    if (y < 350) spike.setAngle(180); // Invert spikes on ceilings! 
    spike.setDepth(5);
    this.physics.add.existing(spike, true); 
    this.hazardGroup.add(spike); 
    const body = spike.body as Phaser.Physics.Arcade.StaticBody;
    if (body) {
      body.setSize(36, 36);
      body.updateFromGameObject();
    }
    return spike;
  }

  private createCoin(x: number, y: number): Phaser.GameObjects.Sprite {
    const hasAnim = this.anims.exists("coin_tile_anim");
    const coin = this.add.sprite(x, y, "coin_tile", hasAnim ? "0" : undefined);
    if (hasAnim) coin.play("coin_tile_anim");

    const scale = 32 / (coin.width || 32);
    coin.setScale(scale); 
    coin.setDepth(5);

    this.physics.add.existing(coin, true);
    this.coinGroup.add(coin);
    this.tweens.add({
      targets: coin,
      y: y - 8,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
    return coin;
  }

  private createSpring(x: number, y: number): Phaser.GameObjects.Sprite {
    const spring = this.add.sprite(x, y, "spring_tile");
    spring.setDisplaySize(48, 32); 
    if (y < 350) { spring.setAngle(180); spring.y += 32; } // Invert springs on ceilings! 
    spring.setDepth(5);
    this.physics.add.existing(spring, true);
    this.springGroup.add(spring);
    return spring;
  }

  private createPowerup(x: number, y: number, type: "speed" | "shield"): Phaser.GameObjects.Sprite {
    const key = type === "speed" ? "powerup_speed" : "powerup_shield";
    const powerup = this.add.sprite(x, y, key);
    
    
    powerup.setDisplaySize(32, 32); 
    
    powerup.setData("type", type);
    powerup.setDepth(5);
    this.physics.add.existing(powerup, true);
    this.powerupGroup.add(powerup);
    this.tweens.add({
      targets: powerup,
      y: powerup.y - 8,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
    return powerup;
  }

  private loadLevel(elements: any[]) {
    this.platforms.clear(true, true);
    this.coinGroup.clear(true, true);
    this.hazardGroup.clear(true, true);
    this.springGroup.clear(true, true);
    this.powerupGroup.clear(true, true);

    elements.forEach((el) => {
      const x = el.x;
      const y = el.y;
      switch (el.type) {
        case "ground": this.createGroundBlock(x, y, 64); break;
        case "spike": this.createSpike(x, y); break;
        case "spring": this.createSpring(x, y); break;
        case "fake_spring": {
          const sp = this.createSpring(x, y);
          sp.setData("trapType", "fake_spring");
          break;
        }
        case "coin": this.createCoin(x, y); break;
        case "speed": this.createPowerup(x, y, "speed"); break;
        case "shield": this.createPowerup(x, y, "shield"); break;
       case "portal": {
          
          const portal = this.add.sprite(x, y - 32, "door"); 
          portal.setDisplaySize(64, 64); 
          portal.setDepth(5);
          this.physics.add.existing(portal, true);
          this.physics.add.overlap(this.player, portal, this.onReachPortal, undefined, this);
          
          this.tweens.add({ targets: portal, y: portal.y - 10, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
          break;
        }
        default:
          if (this.trapFactory) {
             this.trapFactory.create(el.type, { ...el, width: 64 });
          }
          break;
      }
    });
  }

  private onReachPortal() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.physics.pause();
    this.player.setTint(0xef4444);
    this.synth.playLevelUp();
    this.triggerLevelUpEffect(this.currentLevelNum, "DESCENT CLEARED!");
    this.time.delayedCall(1500, () => {
      this.cameras.main.fade(300, 9, 9, 11);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        if (this.customLevel) {
          this.scene.start("MainMenu");
          window.dispatchEvent(new CustomEvent("custom-level-beat", { detail: { name: this.customLevel.name } }));
        } else {
          const nextLevel = this.currentLevelNum + 1;
          if (nextLevel <= 3) {
            this.scene.start("Game", { levelNum: nextLevel });
          } else {
            this.scene.start("GameOver", { score: this.score + 500, coins: this.coinsCount });
            window.dispatchEvent(new CustomEvent("campaign-victory"));
          }
        }
      });
    });
  }

  private onCollectCoin(playerObj: any, coinObj: any) {
    coinObj.destroy();
    this.coinsCount++;
    this.synth.playCoin();
    this.triggerCoinParticles(coinObj.x, coinObj.y);
    
  
    const currentWallet = Number(localStorage.getItem("devilsrun_wallet") || "0");
    localStorage.setItem("devilsrun_wallet", (currentWallet + 1).toString());

    const fText = this.add.text(coinObj.x, coinObj.y - 20, "+1 REPLIC", {
      fontFamily: "Courier New, monospace", fontSize: "14px", fontStyle: "bold", color: "#fca5a5"
    }).setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: fText, y: fText.y - 45, alpha: 0, duration: 800, onComplete: () => fText.destroy() });

    window.dispatchEvent(new CustomEvent("game-score", { 
      detail: { score: this.score, coins: this.coinsCount, level: this.currentLevel, isInvincible: this.isInvincible, isSpeedBoosted: this.isSpeedBoosted } 
    }));
  }

  private onCollectPowerup(playerObj: any, powerupObj: any) {
    const type = powerupObj.getData("type");
    powerupObj.destroy();
    this.synth.playCoin(); 
    this.triggerCoinParticles(powerupObj.x, powerupObj.y); 
    if (type === "speed") this.activateSpeedBoost();
    else if (type === "shield") this.activateInvincibility();
  }

  private activateSpeedBoost() {
    this.isSpeedBoosted = true;
    if (this.speedBoostTimer) this.speedBoostTimer.destroy();
    this.player.setTint(0xf59e0b); 
    this.speedBoostTimer = this.time.delayedCall(5000, () => {
      this.isSpeedBoosted = false;
      if (!this.isInvincible) this.player.clearTint();
    });
  }

  private activateInvincibility() {
    this.isInvincible = true;
    if (this.invincibilityTimer) this.invincibilityTimer.destroy();
    this.player.setTint(0x8b5cf6); 
    this.invincibilityTimer = this.time.delayedCall(8000, () => {
      this.isInvincible = false;
      if (this.isSpeedBoosted) this.player.setTint(0xf59e0b);
      else this.player.clearTint();
    });
  }

  private onHazardHit() {
    if (this.isInvincible) return; 
    this.triggerDeath("Terminated by Hazard");
  }

  private onSpringHit(playerObj: any, springObj: any) {
    const isGravityInverted = this.player.body.gravity.y < 0;
    const body = this.player.body;
    const isCollidedSpring = isGravityInverted ? (body.touching.up || body.blocked.up) : (body.touching.down || body.blocked.down);

    if (isCollidedSpring) {
      if (springObj.getData("trapType") === "fake_spring") {
        this.synth.playTrapTriggered();
        this.triggerExplosionParticles(springObj.x, springObj.y);
        springObj.destroy();
        return;
      }
      this.synth.playSpring();
      const springLaunchVelocity = isGravityInverted ? 1150 : -1150;
      this.player.body.setVelocityY(springLaunchVelocity); 
      this.jumpsAvailable = 2; 

      const currentScaleX = springObj.scaleX;
      const currentScaleY = springObj.scaleY;
      this.tweens.add({ targets: springObj, scaleY: currentScaleY * 0.5, scaleX: currentScaleX * 1.2, duration: 100, yoyo: true, ease: "Back.easeOut" });
    }
  }

  private triggerLevelUpEffect(levelNum: number, levelName: string) {
    this.synth.playLevelUp();
    this.cameras.main.flash(400, 127, 29, 29, true); 
    const levelText = this.add.text(this.scale.width / 2, 180, "ASCENSION UP!", {
      fontFamily: "Georgia, serif", fontSize: "36px", color: "#ff6b6b"
    }).setOrigin(0.5).setScrollFactor(0, 0).setDepth(1000);

    const nameText = this.add.text(this.scale.width / 2, 235, `Level ${levelNum}: ${levelName}`, {
      fontFamily: "Courier New, monospace", fontSize: "14px", fontStyle: "bold", color: "#ffffff"
    }).setOrigin(0.5).setScrollFactor(0, 0).setDepth(1000);

    levelText.setScale(0); nameText.setScale(0);

    this.tweens.add({
      targets: [levelText, nameText],
      scale: 1, duration: 650, ease: "Back.easeOut",
      onComplete: () => {
        if (this.scene && this.scene.isActive()) {
          this.time.delayedCall(1200, () => {
            if (this.scene && this.scene.isActive()) {
              this.tweens.add({
                targets: [levelText, nameText], alpha: 0, y: "-=80", duration: 450,
                onComplete: () => {
                  if (levelText && levelText.active) levelText.destroy();
                  if (nameText && nameText.active) nameText.destroy();
                }
              });
            }
          });
        }
      }
    });
  }

  private triggerDeath(reason: string = "Terminated") {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.synth.playHazardCollision();
    this.physics.pause();
    this.player.setTint(0x3f3f46); 
    this.cameras.main.shake(250, 0.035);
    this.triggerExplosionParticles(this.player.x, this.player.y);
    
    // FIX: Show Death Reason for 2 seconds
    const deathText = this.add.text(this.player.x, this.player.y - 60, reason, {
      fontFamily: "Impact, sans-serif", fontSize: "20px", color: "#ff0000", stroke: "#000000", strokeThickness: 4
    }).setOrigin(0.5).setDepth(100);
    this.tweens.add({ targets: deathText, y: deathText.y - 30, alpha: 0, duration: 2000, ease: "Sine.easeIn" });

   fetch("/api/leaderboard", {
  method: "POST", 
  headers: { "Content-Type": "application/json" }, 
  // CHANGE the body payload to include coins:
  body: JSON.stringify({ score: this.score, coins: this.coinsCount })
}).catch(() => {});

    window.dispatchEvent(new CustomEvent("game-over", { detail: { score: this.score, coins: this.coinsCount } }));
    
    this.time.delayedCall(2000, () => {
      this.cameras.main.fade(400, 17, 9, 10);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("GameOver", { score: this.score, coins: this.coinsCount });
      });
    });
  }

  private triggerCoinParticles(x: number, y: number) {
    if (this.dustEmitter) {
      this.dustEmitter.setPosition(x, y);
      this.dustEmitter.setParticleTint(0xef4444);
      this.dustEmitter.explode(8);
    }
  }

  private triggerExplosionParticles(x: number, y: number) {
    if (this.dustEmitter) {
      this.dustEmitter.setPosition(x, y);
      this.dustEmitter.setParticleTint(0x7f1d1d);
      this.dustEmitter.explode(18);
    }
  }

  private spawnMimicTrap = () => {
    const startX = this.lastGeneratedX;
    
    // Build safe ground
    for (let i = 0; i < 5; i++) {
      this.createGroundBlock(startX + i * 64, 450);
    }

    // Spawn the Mimic
    const mimic = this.add.sprite(startX + 128, 410, "mimic"); 
    mimic.setDisplaySize(48, 48); 
    mimic.setDepth(5);
    this.physics.add.existing(mimic, false);
    const mBody = mimic.body as Phaser.Physics.Arcade.Body;
    mBody.setAllowGravity(true);
    mBody.setGravityY(1000);
    
    this.physics.add.collider(mimic, this.platforms);

    
    const trigger = this.add.zone(startX + 64, 400, 30, 200);
    this.physics.add.existing(trigger, true);
    this.physics.add.overlap(this.player, trigger, () => {
      if (this.isGameOver) return;
      trigger.destroy();
      
      this.synth.playTrapTriggered();
      mimic.setTint(0xff0000); 
      
    
      mBody.setVelocityY(-600);
      mBody.setVelocityX(-250); 
      
      this.physics.add.overlap(this.player, mimic, () => this.triggerDeath("Devoured by Mimic"));
    });

    this.lastGeneratedX = startX + 320;
  };

  update(time: number, delta: number) {
    if (this.isGameOver || !this.player || !this.player.active) return;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    if (this.playerNameText && this.playerNameText.active) {
    const isGravityInverted = body.gravity.y < 0;
    this.playerNameText.x = this.player.x;
    
    this.playerNameText.y = this.player.y + (isGravityInverted ? 60 : -60);
  }

    const win = window as any;
    const leftInput = (this.cursors?.left.isDown || this.wasdKeys?.A.isDown || win.reactLeftActive);
    const rightInput = (this.cursors?.right.isDown || this.wasdKeys?.D.isDown || win.reactRightActive);
    const jumpInput = (this.cursors?.up.isDown || this.cursors?.space.isDown || this.wasdKeys?.W.isDown || win.reactJumpActive);

    let moveDir = 0;
    if (leftInput) moveDir = -1;
    else if (rightInput) moveDir = 1;

    if (this.isInvertedControls) moveDir = -moveDir;

    const targetSpeed = this.isSpeedBoosted ? 500 : 350;

    if (moveDir !== 0) {
      body.setAccelerationX(moveDir * 4000); 
      this.player.setFlipX(moveDir < 0);
    } else {
      body.setAccelerationX(0);
      body.setDragX(4000); 
    }

    if (Math.abs(body.velocity.x) > targetSpeed) {
      body.setVelocityX(Math.sign(body.velocity.x) * targetSpeed);
    }

    if (this.activeWindStrength !== 0) {
      body.x += (this.activeWindStrength * delta) / 1000;
    }

    const isGravityInverted = body.gravity.y < 0;
    const isGrounded = isGravityInverted 
        ? (body.blocked.up || body.touching.up) 
        : (body.blocked.down || body.touching.down);

    if (isGrounded) {
      this.lastGroundedTime = time;
      this.jumpsAvailable = 2; 
    }

    const justPressedJump = jumpInput && !this.wasTouchJumpDown;
    if (justPressedJump) {
      this.jumpBufferTime = time;
    }
    this.wasTouchJumpDown = jumpInput;

    const canJump = (time - this.lastGroundedTime < 100) || this.jumpsAvailable > 0;
    
    if ((time - this.jumpBufferTime < 100) && canJump) {
      this.jumpBufferTime = 0; 
      if (time - this.lastGroundedTime >= 100) {
        this.jumpsAvailable--; 
      } else {
        this.lastGroundedTime = 0; 
      }
      
      const jumpVelocity = isGravityInverted ? 650 : -650;
      body.setVelocityY(jumpVelocity);
      this.synth.playJump();
      this.triggerCoinParticles(this.player.x, this.player.y + (isGravityInverted ? -20 : 20));
    }

    if (!isGrounded) {
      this.setPlayerState("jump");
    } else if (Math.abs(body.velocity.x) > 15) {
      this.setPlayerState("run");
    } else {
      this.setPlayerState("idle");
    }

    this.parallaxLayers.forEach((layer) => {
      const camX = this.cameras.main.scrollX * layer.factor;
      const imgWidth = Math.max(1, layer.images[0].displayWidth); // 5. Fix NaN crash
      const offset = -(camX % imgWidth);
      layer.images[0].x = offset;
      layer.images[1].x = offset + imgWidth;
    });

    if (!this.isHandcrafted && this.player.x > this.lastGeneratedX - 800) {
      this.generateNextChunk();
    }

    if (this.player.x > this.score) {
      this.score = Math.floor(this.player.x);
      this.currentLevel = Math.min(4, this.currentLevelNum + Math.floor(this.score / 1000));
      if (this.score % 5 === 0) {
        window.dispatchEvent(new CustomEvent("game-score", { 
          detail: { score: this.score, coins: this.coinsCount, level: this.currentLevel } 
        }));
      }
    }

    if (this.player.y > 800 || this.player.y < -500) {
      this.triggerDeath();
    }
  }

}