import Phaser from 'phaser'
import Player from './Player.js'
import Enemy from './Enemy.js'
import TouchControls from './TouchControls.js'
import { CELL, generateLevel } from './Arena.js'
import './style.css'

const WORLD_WIDTH = 1600
const WORLD_HEIGHT = 1200
const MAX_ENEMIES = 5
const INITIAL_ENEMIES = 4

class GameScene extends Phaser.Scene {
  constructor() {
    super('game')
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.level = generateLevel(1, WORLD_WIDTH / CELL, WORLD_HEIGHT / CELL)

    const g = this.make.graphics({ add: false })
    g.fillStyle(0xfff2c9, 1)
    g.fillCircle(3, 3, 3)
    g.generateTexture('bullet', 6, 6)
    g.fillStyle(0xff5566, 1)
    g.fillCircle(12, 12, 12)
    g.generateTexture('enemy', 24, 24)
    g.fillStyle(0x2a2a3a, 1)
    g.fillRect(0, 0, CELL, CELL)
    g.lineStyle(2, 0x3a3a4e, 1)
    g.strokeRect(1, 1, CELL - 2, CELL - 2)
    g.generateTexture('wall', CELL, CELL)
    g.destroy()

    this.buildFloor()
    this.buildWalls()

    this.bullets = this.physics.add.group()
    const [sx, sy] = this.level.spawn
    this.player = new Player(this, sx * CELL + CELL / 2, sy * CELL + CELL / 2)
    this.touch = this.sys.game.device.input.touch ? new TouchControls(this) : null
    this.cursors = this.input.keyboard.addKeys('W,A,S,D')
    this.shootKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.reloadKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R)

    this.enemies = this.physics.add.group()
    this.enemyList = []
    for (let i = 0; i < INITIAL_ENEMIES; i++) {
      this.spawnEnemy()
    }
    this.time.addEvent({
      delay: 2500,
      loop: true,
      callback: () => {
        if (this.enemyList.length < MAX_ENEMIES && !this.player.dead) this.spawnEnemy()
      },
    })

    this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemySprite) => {
      bullet.destroy()
      const enemy = this.enemyBySprite(enemySprite)
      if (enemy && enemy.hurt()) {
        this.enemyList.splice(this.enemyList.indexOf(enemy), 1)
      }
    })

    this.physics.add.overlap(this.player.sprite, this.enemies, () => {
      this.player.hurt()
    })

    this.physics.add.collider(this.enemies, this.enemies)
    this.physics.add.collider(this.player.sprite, this.walls)
    this.physics.add.collider(this.enemies, this.walls)
    this.physics.add.collider(this.bullets, this.walls, (bullet) => bullet.destroy())

    this.cameras.main.setBackgroundColor('#14141c')
    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08)
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

    this.hudText = this.add.text(16, 16, '', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffd',
    }).setScrollFactor(0).setDepth(100)

    this.gameOver = false
    this.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
  }

  buildFloor() {
    const { grid, gridW, gridH } = this.level
    const floor = this.add.graphics().setDepth(-10)
    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        if (grid[y][x] !== 0) continue
        floor.fillStyle((x + y) % 2 === 0 ? 0x161622 : 0x14141c, 1)
        floor.fillRect(x * CELL, y * CELL, CELL, CELL)
      }
    }
  }

  buildWalls() {
    const { grid, gridW, gridH } = this.level
    this.walls = this.physics.add.staticGroup()
    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        if (grid[y][x] !== 1) continue
        this.walls.create(x * CELL + CELL / 2, y * CELL + CELL / 2, 'wall')
      }
    }
  }

  spawnEnemy() {
    const pool = this.level.enemySpawns
    const [gx, gy] = pool[Math.floor(Math.random() * pool.length)]
    const enemy = new Enemy(this, gx * CELL + CELL / 2, gy * CELL + CELL / 2)
    this.enemies.add(enemy.sprite)
    this.enemyList.push(enemy)
  }

  enemyBySprite(sprite) {
    return this.enemyList.find((e) => e.sprite === sprite)
  }

  update(time) {
    let dx = (this.cursors.D.isDown ? 1 : 0) - (this.cursors.A.isDown ? 1 : 0)
    let dy = (this.cursors.S.isDown ? 1 : 0) - (this.cursors.W.isDown ? 1 : 0)
    let shootHeld = this.shootKey.isDown
    let reloadPressed = Phaser.Input.Keyboard.JustDown(this.reloadKey)

    if (this.touch) {
      if (this.touch.moveX !== 0 || this.touch.moveY !== 0) {
        dx = this.touch.moveX
        dy = this.touch.moveY
      }
      shootHeld = shootHeld || this.touch.shoot
      reloadPressed = reloadPressed || this.touch.reload
      this.touch.reload = false
    }

    this.player.move(dx, dy)
    this.player.aimAndShoot(this.bullets, shootHeld, reloadPressed)

    for (const enemy of this.enemyList) {
      enemy.update(time)
    }

    if (this.player.dead && !this.gameOver) this.showGameOver()

    if (this.gameOver && Phaser.Input.Keyboard.JustDown(this.restartKey)) {
      this.scene.restart()
    }

    const hearts = '♥'.repeat(this.player.hp)
    const ammoLabel = this.player.reloading ? 'reloading…' : `ammo ${this.player.ammo}`
    this.hudText.setText(`${hearts}\n${ammoLabel}`)
  }

  showGameOver() {
    this.gameOver = true
    this.add.rectangle(480, 270, 960, 540, 0x000000, 0.65)
      .setScrollFactor(0)
      .setDepth(200)
    this.add.text(480, 240, 'GAME OVER', {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: '#ff5566',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201)
    this.add.text(480, 320, 'press Enter to restart', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffd',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201)
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#14141c',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540,
  },
  scene: [GameScene],
}

new Phaser.Game(config)
