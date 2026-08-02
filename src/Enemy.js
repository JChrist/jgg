const ENEMY_SPEED = 120
const ENEMY_HP = 3
const HIT_FLASH = 80

export default class Enemy {
  constructor(scene, x, y) {
    this.scene = scene
    this.hp = ENEMY_HP
    this.hitFlashUntil = 0
    this.flashing = false

    this.sprite = scene.physics.add.sprite(x, y, 'enemy')
    this.sprite.setDepth(3)
  }

  update(time) {
    const player = this.scene.player
    const dx = player.sprite.x - this.sprite.x
    const dy = player.sprite.y - this.sprite.y
    const len = Math.hypot(dx, dy)
    if (len > 0.001 && !player.dead) {
      this.sprite.setVelocity((dx / len) * ENEMY_SPEED, (dy / len) * ENEMY_SPEED)
    } else {
      this.sprite.setVelocity(0, 0)
    }

    if (this.flashing && time >= this.hitFlashUntil) {
      this.flashing = false
      this.sprite.clearTint()
    }
  }

  hurt() {
    this.hp -= 1
    this.sprite.setTint(0xffcccc)
    this.flashing = true
    this.hitFlashUntil = this.scene.time.now + HIT_FLASH
    if (this.hp <= 0) {
      this.sprite.destroy()
      return true
    }
    return false
  }
}
