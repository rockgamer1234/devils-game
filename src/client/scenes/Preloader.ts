import Phaser from "phaser";

export class Preloader extends Phaser.Scene {
  private loadingBar!: Phaser.GameObjects.Graphics;
  private loadingBox!: Phaser.GameObjects.Graphics;
  private titleText!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;

  constructor() {
    super("Preloader");
  }

  preload() {
    this.cameras.main.setBackgroundColor("#050102");
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.subtitleText = this.add.text(width / 2, height / 2 - 100, "SACRED PRECISION DESCENT PLATFORM", {
      fontFamily: "Courier New, monospace",
      fontSize: "12px",
      color: "#ef4444",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.titleText = this.add.text(width / 2, height / 2 - 50, "DEVIL'S RUN", {
      fontFamily: "Impact, Arial Black, sans-serif",
      fontSize: "44px",
      color: "#ffffff",
      stroke: "#7f1d1d",
      strokeThickness: 5
    }).setOrigin(0.5);

    this.loadingBox = this.add.graphics();
    this.loadingBox.fillStyle(0x0c0408, 0.85);
    this.loadingBox.fillRect(width / 2 - 140, height / 2 + 20, 280, 20);

    this.loadingBar = this.add.graphics();
    this.load.on("progress", (value: number) => {
      this.loadingBar.clear();
      this.loadingBar.fillStyle(0xef4444, 1);
      this.loadingBar.fillRect(width / 2 - 138, height / 2 + 22, 276 * value, 16);
    });

    this.load.on("complete", () => {
      this.loadingBox.destroy();
      this.loadingBar.destroy();
      this.scene.start("MainMenu");
    });

    this.load.spritesheet("player_idle", "hero_idle.png", { frameWidth: 160, frameHeight: 90 });
    this.load.spritesheet("player_jump", "hero_jump.png", { frameWidth: 160, frameHeight: 90 });
    this.load.spritesheet("player_run_sheet", "hero_run_sheet.png", { frameWidth: 160, frameHeight: 90 });

    this.load.image("prop_well", "well_sprite.png"); 
    this.load.image("prop_column", "column_sprite.png"); 
    this.load.image("prop_altar", "altar_sprite.png"); 
    this.load.image("hammer", "hammer.png");
    this.load.image("sawblade", "sawblade.png");
    this.load.image("trampoline", "trampoline.png");
    this.load.image("town_silhouette", "l2_town.png"); 
    this.load.image("fire_ball", "fire_ball.png");
    this.load.image("wizard", "wizard.png");
    this.load.image("door", "door.png");

    this.load.image("coin_tile", "coin_tile.png");
    this.load.image("spring_tile", "spring_tile.png");
    this.load.image("powerup_speed", "speed_tile.png");
    this.load.image("powerup_shield", "shield_tile.png");
    this.load.image("mimic", "mimic.png");
    this.load.image("cracked_stone", "cracked_stone.png");

    this.load.image("l1_tiles", "l1_tiles.png");
    this.load.image("l1_spike", "l1_spike.png");
    this.load.image("l1_sky", "l1_sky.png");
    this.load.image("l1_mountain", "l1_mountain.png");
    this.load.image("l1_hills", "l1_hills.png");

    this.load.image("l2_tiles", "l2_tiles.png");
    this.load.image("l2_spike", "l2_spike.png");
    this.load.image("l2_sky", "l2_sky.png");
    this.load.image("l2_mountain", "l2_mountain.png");
    this.load.image("l2_hills", "l2_hills.png");

    this.load.image("l3_tiles", "l3_tiles.png");
    this.load.image("l3_spike", "l3_spike.png");
    this.load.image("l3_sky", "l3_sky.png");
    this.load.image("l3_mountain", "l3_mountain.png");
    this.load.image("l3_hills", "l3_hills.png");

    this.load.image("l4_tiles", "l4_tiles.png");
    this.load.image("l4_spike", "l4_spike.png");
    this.load.image("l4_sky", "l4_sky.png");
    this.load.image("l4_mountain", "l4_mountain.png");
    this.load.image("l4_hills", "l4_hills.png");
  }

  create() {
    this.anims.create({ key: "player_idle_anim", frames: this.anims.generateFrameNumbers("player_idle", {}), frameRate: 8, repeat: -1 });
    this.anims.create({ key: "player_run_sheet_anim", frames: this.anims.generateFrameNumbers("player_run_sheet", {}), frameRate: 12, repeat: -1 });
    this.anims.create({ key: "player_jump_anim", frames: this.anims.generateFrameNumbers("player_jump", {}), frameRate: 8, repeat: 0 });

    const sliceExplicit = (key: string, cols: number, rows: number, frameRate: number) => {
      const tex = this.textures.get(key);
      if (!tex || tex.key === '__MISSING') return;
      const img = tex.getSourceImage();
      if (!img) return;

      const fw = Math.floor(img.width / cols);
      const fh = Math.floor(img.height / rows);

      for (let i = 0; i < cols; i++) {
        if (!tex.has(i.toString())) tex.add(i.toString(), 0, i * fw, 0, fw, fh);
      }

      if (!this.anims.exists(`${key}_anim`)) {
        this.anims.create({
          key: `${key}_anim`,
          frames: Array.from({length: cols}, (_, i) => ({ key: key, frame: i.toString() })),
          frameRate: frameRate,
          repeat: -1
        });
      }
    };

    sliceExplicit("wizard", 10, 2, 8);
    sliceExplicit("fire_ball", 3, 1, 12);
  }
}