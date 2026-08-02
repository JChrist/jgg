import Phaser from 'phaser'
import Player from './Player.js'
import './style.css'

const WORLD_WIDTH = 1600
const WORLD_HEIGHT = 1200

class GameScene extends Phaser.Scene {
  constructor() {
    super('game')
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

    const g = this.make.graphics({ add: false })
    g.fillStyle(0xfff2c9, 1)
    g.fillCircle(3, 3, 3)
    g.generateTexture('bullet', 6, 6)
    g.destroy()

    this.bullets = this.physics.add.group()
    this.player = new Player(this, WORLD_WIDTH / 2, WORLD_HEIGHT / 2)
    this.cursors = this.input.keyboard.addKeys('W,A,S,D')
    this.shootKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.reloadKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R)

    this.cameras.main.setBackgroundColor('#14141c')
    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08)
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

    this.ammoText = this.add.text(16, 16, '', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffd',
    }).setScrollFactor(0).setDepth(100)
  }

  update() {
    const dx = (this.cursors.D.isDown ? 1 : 0) - (this.cursors.A.isDown ? 1 : 0)
    const dy = (this.cursors.S.isDown ? 1 : 0) - (this.cursors.W.isDown ? 1 : 0)
    this.player.move(dx, dy)

    const shootHeld = this.shootKey.isDown
    const reloadPressed = Phaser.Input.Keyboard.JustDown(this.reloadKey)
    this.player.aimAndShoot(this.bullets, shootHeld, reloadPressed)

    const ammoLabel = this.player.reloading ? 'reloading' : `ammo ${this.player.ammo}`
    this.ammoText.setText(ammoLabel)
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  backgroundColor: '#14141c',
  scene: [GameScene],
}

new Phaser.Game(config)
