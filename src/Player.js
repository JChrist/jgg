const SPEED = 240
const MAG_SIZE = 12
const FIRE_RATE = 180
const RELOAD_TIME = 800
const BULLET_SPEED = 560

export default class Player {
  constructor(scene, x, y) {
    this.scene = scene

    const g = scene.make.graphics({ add: false })
    g.fillStyle(0x44ddff, 1)
    g.fillCircle(12, 12, 12)
    g.generateTexture('player', 24, 24)
    g.destroy()

    this.sprite = scene.physics.add.sprite(x, y, 'player')
    this.sprite.setCollideWorldBounds(true)

    const gunG = scene.make.graphics({ add: false })
    gunG.fillStyle(0x99eebb, 1)
    gunG.fillRect(0, 1, 16, 5)
    gunG.generateTexture('gun', 16, 8)
    gunG.destroy()

    this.gun = scene.add.image(x, y, 'gun')
    this.gun.setDepth(10)

    this.facing = { x: 0, y: -1 }
    this.ammo = MAG_SIZE
    this.reloading = false
    this.lastFireTime = 0
    this.hp = 3
    this.invulnerableUntil = 0
    this.dead = false
  }

  move(dx, dy) {
    if (this.dead) return
    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy)
      const nx = dx / len
      const ny = dy / len
      this.sprite.setVelocity(nx * SPEED, ny * SPEED)
      this.facing = { x: nx, y: ny }
    } else {
      this.sprite.setVelocity(0, 0)
    }
    this.gun.setPosition(this.sprite.x + this.facing.x * 16, this.sprite.y + this.facing.y * 16)
    this.gun.setRotation(Math.atan2(this.facing.y, this.facing.x))
  }

  aimAndShoot(bullets, shootHeld, reloadPressed) {
    if (this.reloading) {
      if (this.scene.time.now >= this.reloadDoneAt) {
        this.reloading = false
        this.ammo = MAG_SIZE
      }
      return
    }

    if (reloadPressed) {
      this.startReload()
      return
    }

    if (shootHeld && this.ammo > 0 && this.scene.time.now - this.lastFireTime >= FIRE_RATE) {
      this.lastFireTime = this.scene.time.now
      this.ammo -= 1
      const b = this.scene.bullets.create(
        this.sprite.x + this.facing.x * 20,
        this.sprite.y + this.facing.y * 20,
        'bullet',
      )
      b.setVelocity(this.facing.x * BULLET_SPEED, this.facing.y * BULLET_SPEED)
      b.setDepth(5)
      b.setLifespan(900)
    } else if (shootHeld && this.ammo === 0) {
      this.startReload()
    }
  }

  startReload() {
    this.reloading = true
    this.reloadDoneAt = this.scene.time.now + RELOAD_TIME
  }

  hurt() {
    const now = this.scene.time.now
    if (now < this.invulnerableUntil || this.dead) return
    this.hp -= 1
    if (this.hp <= 0) {
      this.hp = 0
      this.dead = true
      this.sprite.setAlpha(0.3)
      this.sprite.setVelocity(0, 0)
      return
    }
    this.invulnerableUntil = now + 700
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.35,
      duration: 60,
      yoyo: true,
      repeat: 6,
    })
  }
}
