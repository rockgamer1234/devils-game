import Phaser from "phaser";

export class GameOver extends Phaser.Scene {
  private finalScore: number = 0;
  private finalCoins: number = 0;
  private bestScoreText!: Phaser.GameObjects.Text;
  private rankText!: Phaser.GameObjects.Text;

  constructor() {
    super("GameOver");
  }

  init(data: { score?: number; coins?: number }) {
    this.finalScore = data.score || 0;
    this.finalCoins = data.coins || 0;
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;
    const midX = width / 2;

    this.add.rectangle(0, 0, width, height, 0x050102).setOrigin(0);

    
    const devilMoon = this.add.image(width / 2, 180, "l1_sky")
      .setScale(1.4)
      .setAlpha(0.2)
      .setDepth(0);

    this.tweens.add({
      targets: devilMoon,
      scaleX: 1.6,
      scaleY: 1.6,
      alpha: 0.35,
      duration: 3500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    const embersGroup = this.add.group();
    const emberColors = [0x7f1d1d, 0xb91c1c, 0xfca5a5];
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.Between(1, 2);
      const color = Phaser.Utils.Array.GetRandom(emberColors);
      const ember = this.add.rectangle(x, y, size, size, color);
      ember.setAlpha(Phaser.Math.FloatBetween(0.1, 0.5));
      embersGroup.add(ember);
    }

    embersGroup.getChildren().forEach((ember: any) => {
      this.tweens.add({
        targets: ember,
        y: ember.y - Phaser.Math.Between(40, 100),
        alpha: { start: ember.alpha, to: 0 },
        duration: Phaser.Math.Between(2500, 5000),
        repeat: -1,
        onRepeat: () => {
          ember.y = height + Phaser.Math.Between(0, 20);
          ember.x = Phaser.Math.Between(0, width);
        }
      });
    });

    const titleText = this.add.text(width / 2, 50, "SACRED TERMINATION", {
      fontFamily: "Georgia, serif",
      fontSize: "30px",
      color: "#ffffff",
      stroke: "#7f1d1d",
      strokeThickness: 5
    }).setOrigin(0.5);
    titleText.setShadow(0, 0, '#7f1d1d', 12, true, true);

    this.add.rectangle(midX, 145, 320, 85, 0x0c0408, 0.95)
      .setStrokeStyle(2, 0x7f1d1d, 0.6);

    this.add.text(midX - 130, 120, "DEPTH ARCHIVED:", {
      fontFamily: "Courier New, monospace",
      fontSize: "11px",
      fontStyle: "bold",
      color: "#71717a"
    });
    this.add.text(midX + 130, 120, `${this.finalScore} METERS`, {
      fontFamily: "Courier New, monospace",
      fontSize: "11.5px",
      fontStyle: "bold",
      color: "#ffffff"
    }).setOrigin(1, 0);

    this.add.text(midX - 130, 150, "RELIQUES RECOVERED:", {
      fontFamily: "Courier New, monospace",
      fontSize: "11px",
      fontStyle: "bold",
      color: "#71717a"
    });
    this.add.text(midX + 130, 150, `${this.finalCoins} COINS`, {
      fontFamily: "Courier New, monospace",
      fontSize: "11.5px",
      fontStyle: "bold",
      color: "#fca5a5"
    }).setOrigin(1, 0);

    const rerunBtnBg = this.add.rectangle(midX, 230, 320, 38, 0x7f1d1d)
      .setStrokeStyle(1.5, 0xffffff, 0.6)
      .setInteractive({ useHandCursor: true });

    const rerunText = this.add.text(midX, 230, "RE-DEPLOY SEQUENCE", {
      fontFamily: "Georgia, serif",
      fontSize: "12px",
      color: "#ffffff",
      letterSpacing: 1
    }).setOrigin(0.5);

    const menuBtnBg = this.add.rectangle(midX, 285, 320, 38, 0x18181b)
      .setStrokeStyle(1.5, 0x581c87, 0.6)
      .setInteractive({ useHandCursor: true });

    const menuText = this.add.text(midX, 285, "RETURN TO SANCTUM GATE", {
      fontFamily: "Georgia, serif",
      fontSize: "11px",
      color: "#fca5a5",
      letterSpacing: 1
    }).setOrigin(0.5);

    rerunBtnBg.on("pointerover", () => {
      rerunBtnBg.setFillStyle(0xb91c1c);
      this.tweens.add({ targets: [rerunBtnBg, rerunText], scale: 1.03, duration: 80 });
    });
    rerunBtnBg.on("pointerout", () => {
      rerunBtnBg.setFillStyle(0x7f1d1d);
      this.tweens.add({ targets: [rerunBtnBg, rerunText], scale: 1.0, duration: 80 });
    });

    menuBtnBg.on("pointerover", () => {
      menuBtnBg.setFillStyle(0x581c87, 0.15);
      this.tweens.add({ targets: [menuBtnBg, menuText], scale: 1.03, duration: 80 });
    });
    menuBtnBg.on("pointerout", () => {
      menuBtnBg.setFillStyle(0x18181b, 1);
      this.tweens.add({ targets: [menuBtnBg, menuText], scale: 1.0, duration: 80 });
    });

    rerunBtnBg.on("pointerdown", () => this.restartGame());
    menuBtnBg.on("pointerdown", () => this.goToMainMenu());

    const scorecardY = height - 75;
    this.add.rectangle(midX, scorecardY, 320, 68, 0x0c0408, 0.95)
      .setStrokeStyle(2, 0x7f1d1d, 0.7);

    const currentBest = Number(localStorage.getItem("devilsrun_best_score") || "0");
    if (this.finalScore > currentBest) {
      localStorage.setItem("devilsrun_best_score", this.finalScore.toString());
    }
    const updatedBest = Math.max(this.finalScore, currentBest);

    this.bestScoreText = this.add.text(midX, scorecardY - 10, `YOUR ALL-TIME COVENANT: ${updatedBest}M`, {
      fontFamily: "Courier New, monospace",
      fontSize: "11px",
      fontStyle: "bold",
      color: "#fca5a5"
    }).setOrigin(0.5);

    this.rankText = this.add.text(midX, scorecardY + 12, "SYNC COMPLETE • SANCTUM COVENANT ARCHIVE", {
      fontFamily: "Courier New, monospace",
      fontSize: "8.5px",
      color: "#71717a"
    }).setOrigin(0.5);
  }

  restartGame(): void {
    this.cameras.main.fade(200, 9, 9, 11);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      window.dispatchEvent(new CustomEvent("game-start"));
      this.scene.start("Game");
    });
  }

  goToMainMenu(): void {
    this.cameras.main.fade(200, 9, 9, 11);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      window.dispatchEvent(new CustomEvent("game-start"));
      this.scene.start("MainMenu");
    });
  }
}