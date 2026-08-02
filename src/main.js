import Phaser from 'phaser'
import './style.css'

class BootScene extends Phaser.Scene {
  constructor() {
    super('boot')
  }

  create() {
    this.add.text(480, 270, 'jgg boots', {
      fontSize: '32px',
      fontFamily: 'monospace',
    }).setOrigin(0.5)
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  backgroundColor: '#1a1a2e',
  scene: [BootScene],
}

new Phaser.Game(config)
