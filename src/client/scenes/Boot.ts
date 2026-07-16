import Phaser from "phaser";

export class Boot extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  init() {
    this.scale.setZoom(1);
  }

  create() {
    this.scene.start("Preloader");
  }
}
