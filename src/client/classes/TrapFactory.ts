import Phaser from "phaser";

export interface TrapConfig {
  x: number;
  y: number;
  width?: number;
  height?: number;
  [key: string]: any;
}

export class TrapFactory {
  private scene: Phaser.Scene;
  private player: Phaser.Physics.Arcade.Sprite;
  private onDeath: (reason?: string) => void;
  private onTriggered: () => void; 
  private spikeGroup: Phaser.Physics.Arcade.Group;
  private terrainKey: string;
  private spikeKey: string;

  constructor(
    scene: Phaser.Scene, 
    player: Phaser.Physics.Arcade.Sprite, 
    onDeath: (reason?: string) => void,
    onTriggered: () => void,
    spikeGroup: Phaser.Physics.Arcade.Group,
    terrainKey: string = "grass_tile",
    spikeKey: string = "spike_tile"
  ) {
    this.scene = scene;
    this.player = player;
    this.onDeath = onDeath;
    this.onTriggered = onTriggered;
    this.spikeGroup = spikeGroup;
    this.terrainKey = terrainKey;
    this.spikeKey = spikeKey;
  }

  public isJumpPossible(gapWidth: number, currentGravityY: number, jumpVelocity: number, currentSpeedX: number): boolean {
    const timeInAir = (2 * Math.abs(jumpVelocity)) / currentGravityY;
    const maxDistance = timeInAir * currentSpeedX;
    return gapWidth <= (maxDistance * 0.9); 
  }

  public create(trapType: string, config: TrapConfig): void {
    switch (trapType) {
      case "falling_block": this.createFallingBlock(config); break;
      case "rising_block": this.createRisingBlock(config); break;
      case "rotating_hazard": this.createRotatingHazard(config); break;
      case "conveyor_belt": this.createConveyorBelt(config); break;
      case "flickering_tile": this.createFlickeringTile(config); break;
      case "fake_wall": this.createFakeWall(config); break;
      case "control_inversion": this.createControlInversion(config); break;
      case "sawblade": this.createSawblade(config); break;
      case "trampoline": this.createTrampoline(config); break;
      case "ui_troll": this.createUITrap(config); break;
      case "developer_door": this.createDeveloperDoor(config); break;
      case "spike_spawner": this.createSpikeSpawner(config); break;
      case "projectile_launcher": this.createProjectileLauncher(config); break;
      case "falling_architecture": this.createFallingArchitecture(config); break;
      case "gravity_shift": this.createGravityShift(config); break;
    }
  }

  private createGravityShift(config: TrapConfig) {
    this.createTriggerZone(config.x, config.y - 500, 80, 1000, (trigger) => {
      trigger.destroy();
      this.onTriggered();
      this.scene.cameras.main.flash(250, 128, 0, 128);
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      if (body.gravity.y > 0) {
        body.setGravityY(-1100);
        this.player.setFlipY(true);
      } else {
        body.setGravityY(1100);
        this.player.setFlipY(false);
      }
    });
  }

  private telegraph(target: Phaser.GameObjects.GameObject, duration: number = 150, onComplete: () => void) {
    if ("setTint" in target) {
      (target as any).setTint(0xff5555);
      this.scene.tweens.add({
        targets: target,
        x: (target as any).x + (Math.random() > 0.5 ? 2 : -2),
        y: (target as any).y + (Math.random() > 0.5 ? 2 : -2),
        yoyo: true,
        repeat: Math.floor(duration / 30),
        duration: 30,
        onComplete: () => {
          if ("clearTint" in target) (target as any).clearTint();
          onComplete();
        }
      });
    } else {
      this.scene.time.delayedCall(duration, onComplete);
    }
  }

  private createTriggerZone(x: number, y: number, width: number, height: number, onTrigger: (trigger: Phaser.GameObjects.Zone) => void) {
    const trigger = this.scene.add.zone(x, y, width, height);
    this.scene.physics.add.existing(trigger, true);
    if (trigger.body) { (trigger.body as any).debugShowBody = false; }
    trigger.setVisible(false);
    this.scene.physics.add.overlap(this.player, trigger, () => {
      if (trigger.active) { onTrigger(trigger); }
    });
    return trigger;
  }

  private createFallingBlock(config: TrapConfig) {
    const block = this.scene.add.sprite(config.x, config.y, this.terrainKey);
    block.setDisplaySize(64, 64); 
    block.setDepth(1); 
    this.scene.physics.add.existing(block, false);
    const body = block.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setSize(56, 56);
    
    this.createTriggerZone(config.x, config.y + 120, config.width || 80, 300, (trigger) => {
      trigger.destroy();
      this.onTriggered();
      this.telegraph(block, 150, () => {
        body.setImmovable(false);
        body.setAllowGravity(true);
        body.setGravityY(1400); 
        this.scene.physics.add.overlap(this.player, block, () => this.onDeath("Terminated by Trap"));
      });
    });
  }

  private createRisingBlock(config: TrapConfig) {
    const block = this.scene.add.sprite(config.x, config.y, this.terrainKey);
    block.setDisplaySize(64, 64); 
    block.setDepth(1);
    this.scene.physics.add.existing(block, false);
    const body = block.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setSize(56, 56);
    
    this.createTriggerZone(config.x, config.y - 60, config.width || 80, 150, (trigger) => {
      trigger.destroy();
      this.onTriggered();
      this.telegraph(block, 150, () => {
        body.setImmovable(false);
        body.setVelocityY(-900);
        this.scene.physics.add.collider(this.player, block, () => {
           if ((this.player.body as Phaser.Physics.Arcade.Body).touching.down && (block.body as Phaser.Physics.Arcade.Body).touching.up) {} 
           else { this.onDeath(); }
        });
      });
    });
  }

  private createRotatingHazard(config: TrapConfig) {
    const radius = config.width || 120;
    const hammer = this.scene.add.sprite(config.x, config.y, "hammer");
    
    hammer.setOrigin(0.5, 0.5); 
    hammer.setDisplaySize(32, 64); 
    hammer.setDepth(5); 
    
    this.scene.physics.add.existing(hammer, false);
    const body = hammer.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setCircle(16, 0, 32); 
    
    this.scene.tweens.add({
      targets: hammer,
      angle: 360,
      duration: 800,
      repeat: -1
    });

    this.spikeGroup.add(hammer);

    this.scene.tweens.add({
      targets: hammer,
      duration: 2160, 
      repeat: -1,
      onUpdate: () => {
        if (!hammer || !hammer.body || !hammer.active) return;
        const time = this.scene.time.now;
        const orbitAngle = (time / 350) % (Math.PI * 2);
        
        const b = hammer.body as Phaser.Physics.Arcade.Body;
        b.x = config.x + Math.cos(orbitAngle) * radius - 16;
        b.y = config.y + Math.sin(orbitAngle) * radius - 16;
      }
    });

    this.scene.physics.add.overlap(this.player, hammer, () => this.onDeath("Terminated by Trap"));
  }

  private createProjectileLauncher(config: TrapConfig) {
    const hasWizardAnim = this.scene.anims.exists("wizard_anim");
    const launcher = this.scene.add.sprite(config.x, config.y, "wizard", hasWizardAnim ? "0" : undefined);
    if (hasWizardAnim) launcher.play("wizard_anim");
    
    // match scale    launcher.setScale(1.6);
    launcher.setOrigin(0.5, 1);
    launcher.y = config.y - 32; 
    launcher.setFlipX(true); 
    launcher.setDepth(5);
    
    this.scene.physics.add.existing(launcher, true);
    // hover    this.scene.tweens.add({ targets: launcher, y: launcher.y - 8, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // fix skip
    this.createTriggerZone(config.x - 200, config.y - 500, 400, 1000, (trigger) => {
      trigger.destroy();
      this.onTriggered();
      
      const timerEvent = this.scene.time.addEvent({
        delay: 2000, 
        loop: true,
        callback: () => {
            if (!launcher || !launcher.active) {
                timerEvent.remove();
                return;
            }
            
            this.telegraph(launcher, 400, () => {
              if (!launcher || !launcher.active) return;
              
              const hasFireTex = this.scene.textures.exists("fire_ball");
              const hasFireAnim = this.scene.anims.exists("fire_ball_anim");
              
              let projectile;
              if (hasFireTex) {
                  // Fire from staff height
                  projectile = this.scene.add.sprite(launcher.x - 30, launcher.y - 40, "fire_ball", hasFireAnim ? "0" : undefined);
                  if (hasFireAnim) projectile.play("fire_ball_anim");
              } else {
                  projectile = this.scene.add.sprite(launcher.x - 30, launcher.y - 40, "coin_tile");
                  projectile.setTint(0xff0000);
              }

              projectile.setScale(1.5);
              projectile.setDepth(6);
              
              this.scene.physics.add.existing(projectile);
              
              const body = projectile.body as Phaser.Physics.Arcade.Body;
              body.setAllowGravity(false);
              body.setCircle(12, 4, 4); 
              body.setVelocityX(-450); 
              this.scene.physics.add.overlap(this.player, projectile, () => this.onDeath("Terminated by Trap"));

              this.scene.time.delayedCall(4000, () => {
                  if (projectile && projectile.active) projectile.destroy();
              });
            });
        }
      });
    });
  }

  private createSawblade(config: TrapConfig) {
    this.createTriggerZone(config.x - 300, config.y, 100, 500, (trigger) => {
      trigger.destroy();
      this.onTriggered();
      
      const saw = this.scene.add.sprite(config.x + 400, config.y - 32, "sawblade");
      saw.setDisplaySize(64, 64);
      saw.setDepth(15);
      this.scene.physics.add.existing(saw, false);
      
      const body = saw.body as Phaser.Physics.Arcade.Body;
      body.setCircle(28, 4, 4);
      body.setAllowGravity(false);
      body.setVelocityX(-600); // speed adjustment
      
      this.scene.tweens.add({
        targets: saw,
        angle: -360,
        duration: 300,
        repeat: -1
      });
      
      this.scene.physics.add.overlap(this.player, saw, () => this.onDeath("Terminated by Trap"));
      
      this.scene.time.delayedCall(5000, () => {
          if (saw && saw.active) saw.destroy();
      });
    });
  }

  private createTrampoline(config: TrapConfig) {
    const tramp = this.scene.add.sprite(config.x, config.y - 16, "trampoline");
    tramp.setDisplaySize(64, 32);
    tramp.setDepth(5);
    this.scene.physics.add.existing(tramp, true);
    
    this.scene.physics.add.collider(this.player, tramp, () => {
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        if (body && body.touching.down) {
            this.scene.tweens.add({ targets: tramp, scaleY: 0.5, duration: 100, yoyo: true });
            body.setVelocityY(-1000); // Safely casted!
        }
    });
  }

  private createConveyorBelt(config: TrapConfig) {
    const belt = this.scene.add.sprite(config.x, config.y, this.terrainKey);
    belt.setDisplaySize(64, 64);
    belt.setTint(0x7c3aed);
    belt.setDepth(1);
    this.scene.physics.add.existing(belt, true);
    if (belt.body) {
      (belt.body as Phaser.Physics.Arcade.Body).setSize(64, 64);
    }
    this.scene.physics.add.collider(this.player, belt, () => {
      if ((this.player.body as Phaser.Physics.Arcade.Body).touching.down && (belt.body as Phaser.Physics.Arcade.Body).touching.up) {
        this.player.x += config.speed || -6;
      }
    });
  }

  private createFlickeringTile(config: TrapConfig) {
    const tile = this.scene.add.sprite(config.x, config.y, this.terrainKey);
    tile.setDisplaySize(64, 64);
    tile.setDepth(1);
    this.scene.physics.add.existing(tile, true);
    if (tile.body) {
      (tile.body as Phaser.Physics.Arcade.Body).setSize(64, 64);
    }
    this.createTriggerZone(config.x, config.y - 48, 80, 80, (trigger) => {
      trigger.destroy();
      this.onTriggered();
      this.telegraph(tile, 200, () => {
        tile.setVisible(false);
        (tile.body as Phaser.Physics.Arcade.Body).enable = false;
        this.scene.time.delayedCall(1500, () => {
          tile.setVisible(true);
          (tile.body as Phaser.Physics.Arcade.Body).enable = true;
        });
      });
    });
  }

  private createFakeWall(config: TrapConfig) {
    const wall = this.scene.add.sprite(config.x, config.y, this.terrainKey);
    wall.setDisplaySize(64, 64);
    wall.setTint(0x27272a);
    wall.setAlpha(0.65);
    wall.setDepth(25); // render order
  }

  private createControlInversion(config: TrapConfig) {
    this.createTriggerZone(config.x, config.y, 80, 300, (trigger) => {
      trigger.destroy();
      this.onTriggered();
      this.scene.cameras.main.flash(200, 127, 29, 29); 
      this.scene.events.emit("control_inversion_start");
      this.scene.time.delayedCall(3000, () => {
        this.scene.events.emit("control_inversion_end");
      });
    });
  }

  private createUITrap(config: TrapConfig) {
    this.createTriggerZone(config.x, config.y, 80, 300, (trigger) => {
      trigger.destroy();
      this.onTriggered();
      const fakeText = this.scene.add.text(this.scene.cameras.main.centerX, this.scene.cameras.main.centerY, "COVENANT TERMINATED", {
        fontSize: "32px",
        color: "#b91c1c",
        fontStyle: "bold",
        fontFamily: "Georgia, serif"
      }).setScrollFactor(0).setOrigin(0.5);
      
      this.scene.time.delayedCall(1500, () => {
        if (!fakeText || !fakeText.active) return;
        fakeText.setText("MIRACLE GRACE");
        fakeText.setColor("#eab308");
        this.scene.time.delayedCall(1000, () => {
            if (fakeText && fakeText.active) fakeText.destroy();
        });
      });
    });
  }

  private createDeveloperDoor(config: TrapConfig) {
    const door = this.scene.add.sprite(config.x, config.y - 16, "prop_altar");
    door.setScale(2.5); // Increase scale multiplier to match the visual size of the hero
    door.setOrigin(0.5, 1); // Anchors the bottom of the sprite to the ground
    door.y = config.y + 32; // Push it down flush with the ground tiles
    door.setDepth(5);
    this.scene.physics.add.existing(door, true);
    
    this.createTriggerZone(config.x - 150, config.y, 80, 300, (trigger) => {
      trigger.destroy();
      this.onTriggered();
      this.telegraph(door, 150, () => {
        this.scene.physics.world.disable(door);
        door.body = null as any;
        this.scene.physics.add.existing(door, false);
        const dynBody = door.body as Phaser.Physics.Arcade.Body;
        dynBody.setAllowGravity(false);
        dynBody.setVelocityX(450); 
        
        const legs = this.scene.add.text(door.x, door.y + 40, "CATCH ME!", {
          fontSize: "18px",
          fontFamily: "Courier New",
          color: "#b91c1c",
          fontStyle: "bold"
        }).setOrigin(0.5).setDepth(20);
        
        const updateLegs = () => {
          if (!door || !door.active || !legs || !legs.active) {
            this.scene.events.off("update", updateLegs); 
            return;
          }
          legs.x = door.x;
          legs.y = door.y + 40;
        };
        this.scene.events.on("update", updateLegs);
      });
    });
  }

  private createSpikeSpawner(config: TrapConfig) {
    const surface = this.scene.add.sprite(config.x, config.y, this.terrainKey);
    surface.setDisplaySize(64, 64);
    surface.setDepth(1);
    this.scene.physics.add.existing(surface, true);
    if (surface.body) {
      (surface.body as Phaser.Physics.Arcade.Body).setSize(64, 64);
    }
    
    this.createTriggerZone(config.x, config.y - 80, 128, 100, (trigger) => {
      trigger.destroy();
      this.onTriggered();
      this.telegraph(surface, 150, () => {
        const spike = this.scene.add.sprite(config.x, config.y - 12, this.spikeKey);
        spike.setDisplaySize(48, 48);
        spike.setDepth(5);
        this.spikeGroup.add(spike);
        this.scene.physics.add.existing(spike, true);
        (spike.body as Phaser.Physics.Arcade.Body).setSize(36, 36); 
        this.scene.physics.add.overlap(this.player, spike, () => this.onDeath("Terminated by Trap"));
      });
    });
  }

  private createFallingArchitecture(config: TrapConfig) {
    const blocks: Phaser.GameObjects.Sprite[] = [];
    for (let i = 0; i < 5; i++) {
        const block = this.scene.add.sprite(config.x + i * 64, config.y, this.terrainKey);
        block.setDisplaySize(64, 64);
        block.setDepth(1);
        this.scene.physics.add.existing(block, false);
        const body = block.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.setImmovable(true);
        body.setSize(64, 64);
        blocks.push(block);
    }
    
    this.createTriggerZone(config.x + 128, config.y - 48, 150, 150, (trigger) => {
      trigger.destroy();
      this.onTriggered();
      blocks.forEach((block, idx) => {
        this.telegraph(block, 150 + (idx * 40), () => {
            const body = block.body as Phaser.Physics.Arcade.Body;
            body.setImmovable(false);
            body.setAllowGravity(true);
            body.setGravityY(1400);
            this.scene.physics.add.overlap(this.player, block, () => this.onDeath("Terminated by Trap"));
        });
      });
    });
  }
}