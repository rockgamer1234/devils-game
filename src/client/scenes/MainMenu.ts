import Phaser from "phaser";

export class MainMenu extends Phaser.Scene {
  constructor() {
    super("MainMenu");
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    window.dispatchEvent(new CustomEvent("game-start"));
    this.add.rectangle(0, 0, width, height, 0x050102).setOrigin(0);

    const getScale = (key: string) => {
      const img = this.textures.get(key).getSourceImage() as HTMLImageElement;
      if (!img) return 2.0;
      return Math.max(width / img.width, height / img.height);
    };

    this.add.image(width / 2, height / 2, "l1_sky").setScale(getScale("l1_sky")).setAlpha(0.35);
    this.add.image(width / 2, height / 2, "l1_mountain").setScale(getScale("l1_mountain")).setAlpha(0.45);
    this.add.image(width / 2, height / 2, "l1_hills").setScale(getScale("l1_hills")).setAlpha(0.65);

    const embersGroup = this.add.group();
    const emberColors = [0x7f1d1d, 0xb91c1c, 0xfca5a5];
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.Between(1.5, 3.5);
      const color = Phaser.Utils.Array.GetRandom(emberColors);
      const ember = this.add.rectangle(x, y, size, size, color);
      ember.setAlpha(Phaser.Math.FloatBetween(0.15, 0.75));
      embersGroup.add(ember);
    }

    embersGroup.getChildren().forEach((ember: any) => {
      this.tweens.add({
        targets: ember,
        y: ember.y - Phaser.Math.Between(50, 110),
        alpha: { start: ember.alpha, to: 0 },
        duration: Phaser.Math.Between(2000, 5000),
        repeat: -1,
        onRepeat: () => {
          ember.y = height + Phaser.Math.Between(0, 20);
          ember.x = Phaser.Math.Between(0, width);
        }
      });
    });

    const leftX = width / 2;

    const titleText = this.add.text(leftX, 85, "DEVIL'S RUN", {
      fontFamily: "Georgia, serif",
      fontSize: "44px",
      color: "#ffffff",
      stroke: "#7f1d1d",
      strokeThickness: 6,
      align: "center"
    }).setOrigin(0.5);
    titleText.setShadow(0, 0, '#7f1d1d', 20, true, true);

    this.tweens.add({
      targets: titleText,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    this.add.text(leftX, 138, "[ THE SACRED RUN ESCALATION ]", {
      fontFamily: "Courier New, monospace",
      fontSize: "10px",
      fontStyle: "bold",
      color: "#b91c1c"
    }).setOrigin(0.5);

   const bestScore = localStorage.getItem("devilsrun_best_score") || "0";
    
    // 1. BEST SCORE
    this.add.rectangle(leftX, 190, 320, 28, 0x0c0408, 0.95)
      .setStrokeStyle(1.5, 0x7f1d1d, 0.8);
    this.add.text(leftX, 190, `ALL-TIME SACRED BEST: ${bestScore} METERS`, {
      fontFamily: "Courier New, monospace",
      fontSize: "10px",
      fontStyle: "bold",
      color: "#fca5a5"
    }).setOrigin(0.5);

    // 2. WALLET DISPLAY (Pushed down to 240)
    const walletBg = this.add.rectangle(leftX, 240, 320, 28, 0x0c0408, 0.95).setStrokeStyle(1.5, 0x581c87, 0.8);
    let localWallet = Number(localStorage.getItem("devilsrun_wallet") || "0");
    const walletText = this.add.text(leftX, 240, `SACRED RELIQUES WALLET: ${localWallet} COINS`, {
      fontFamily: "Courier New, monospace",
      fontSize: "10px",
      fontStyle: "bold",
      color: "#d8b4fe"
    }).setOrigin(0.5);

    // 3. DAILY REWARD BUTTON & TIMER (Pushed down to 290)
    const claimBtnBg = this.add.rectangle(leftX, 290, 320, 28, 0x18181b)
      .setStrokeStyle(1.5, 0x10b981, 0.8)
      .setInteractive({ useHandCursor: true });

    const getClaimStatus = () => {
      const last = localStorage.getItem("devilsrun_last_claim_date");
      const today = new Date().toDateString();
      if (last === today) return "claimed";
      if (!last && localWallet === 0) return "welcome";
      return "daily";
    };

    let claimStatus = getClaimStatus();

    const claimText = this.add.text(leftX, 290, "", {
      fontFamily: "Courier New, monospace",
      fontSize: "10px",
      fontStyle: "bold",
      color: claimStatus === "claimed" ? "#52525b" : "#10b981"
    }).setOrigin(0.5);

    if (claimStatus === "claimed") {
      claimBtnBg.setStrokeStyle(1.5, 0x52525b, 0.8);
    } else {
      claimText.setText(claimStatus === "welcome" ? "🎁 CLAIM YOUR WELCOME PRIZE (+200 🪙)" : "🎁 CLAIM DAILY PRIZE (+200 🪙)");
      
      claimBtnBg.on("pointerover", () => claimBtnBg.setFillStyle(0x10b981, 0.2));
      claimBtnBg.on("pointerout", () => claimBtnBg.setFillStyle(0x18181b, 1));
      
      claimBtnBg.on("pointerdown", () => {
        if (getClaimStatus() !== "claimed") {
          localWallet += 200;
          localStorage.setItem("devilsrun_wallet", localWallet.toString());
          localStorage.setItem("devilsrun_last_claim_date", new Date().toDateString());
          
          walletText.setText(`SACRED RELIQUES WALLET: ${localWallet} COINS`);
          claimBtnBg.setStrokeStyle(1.5, 0x52525b, 0.8);
          claimBtnBg.setFillStyle(0x18181b, 1);
          claimText.setColor("#52525b");
          claimStatus = "claimed";
          
          this.cameras.main.flash(300, 16, 185, 129);
        }
      });
    }

    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (getClaimStatus() === "claimed") {
          const now = new Date();
          const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          const diff = tomorrow.getTime() - now.getTime();
          
          const h = Math.floor((diff / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
          const m = Math.floor((diff / 1000 / 60) % 60).toString().padStart(2, '0');
          const s = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
          
          claimText.setText(`NEXT PRIZE IN: ${h}H ${m}M ${s}S`);
        }
      }
    });

    // 4. LEVEL BUTTONS 
    const createLevelButton = (x: number, y: number, title: string, sub: string, strokeColorHex: string, activeColorInt: number, params: any) => {
      const bg = this.add.rectangle(x, y, 160, 50, 0x0c0408)
        .setStrokeStyle(2, activeColorInt, 0.75)
        .setInteractive({ useHandCursor: true });
      
      const tText = this.add.text(x, y - 9, title, {
        fontFamily: "Georgia, serif",
        fontSize: "12px",
        color: "#ffffff",
        letterSpacing: 1
      }).setOrigin(0.5);

      const sText = this.add.text(x, y + 10, sub, {
        fontFamily: "Courier New, monospace",
        fontSize: "8px",
        fontStyle: "bold",
        color: strokeColorHex
      }).setOrigin(0.5);

      bg.on("pointerover", () => {
        bg.setFillStyle(activeColorInt, 0.15);
        bg.setStrokeStyle(2.5, activeColorInt, 1);
        this.tweens.add({ targets: [bg, tText, sText], scale: 1.05, duration: 100 });
      });

      bg.on("pointerout", () => {
        bg.setFillStyle(0x0c0408, 1);
        bg.setStrokeStyle(2, activeColorInt, 0.75);
        this.tweens.add({ targets: [bg, tText, sText], scale: 1.0, duration: 100 });
      });

      bg.on("pointerdown", () => {
        this.cameras.main.fade(300, 9, 9, 11);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          window.dispatchEvent(new CustomEvent("game-start"));
          this.scene.start("Game", params);
        });
      });
    };

  
    createLevelButton(leftX - 85, 380, "ZONE I", "CEMETERY", "#ef4444", 0x7f1d1d, { levelNum: 1 });
    createLevelButton(leftX + 85, 380, "ZONE II", "SACRED CHURCH", "#fca5a5", 0x581c87, { levelNum: 2 });
    createLevelButton(leftX - 85, 450, "ZONE III", "OLD TOWN", "#f59e0b", 0x78350f, { levelNum: 3 });
    createLevelButton(leftX + 85, 450, "ZONE IV", "JUNK WASTELAND", "#38bdf8", 0x0369a1, { levelNum: 4 });

    const promptText = this.add.text(leftX, 530, ">> COMMENCE DEPLOYMENT DESCENT <<", { 
      fontFamily: "Courier New, monospace",
      fontSize: "9.5px",
      fontStyle: "bold",
      color: "#ef4444"
    }).setOrigin(0.5);

    this.tweens.add({ targets: promptText, alpha: 0.35, duration: 1100, yoyo: true, repeat: -1 });
  }
}
