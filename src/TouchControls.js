const JOY_RADIUS = 60
const DEAD_ZONE = 12
const HALF_W = 480

function inCircle(px, py, centerX, centerY, radius) {
  return Math.hypot(px - centerX, py - centerY) <= radius
}

export default class TouchControls {
  constructor(scene) {
    this.scene = scene
    this.moveX = 0
    this.moveY = 0
    this.shoot = false
    this.reload = false
    this.joystickPointer = null
    this.joystickBase = { x: 0, y: 0 }

    this.baseGfx = scene.add.circle(0, 0, JOY_RADIUS, 0xffffff, 0.12)
      .setScrollFactor(0).setDepth(300).setVisible(false)
    this.knobGfx = scene.add.circle(0, 0, 30, 0xffffff, 0.35)
      .setScrollFactor(0).setDepth(301).setVisible(false)

    this.fireBtn = scene.add.circle(810, 380, 70, 0xff5566, 0.25)
      .setScrollFactor(0).setDepth(300)
    this.reloadBtn = scene.add.circle(880, 110, 40, 0xffd, 0.2)
      .setScrollFactor(0).setDepth(300)

    scene.add.text(810, 380, 'FIRE', {
      fontFamily: 'monospace', fontSize: '20px', color: '#fff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(301)
    scene.add.text(880, 110, 'R', {
      fontFamily: 'monospace', fontSize: '20px', color: '#fff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(301)

    scene.input.on('pointerdown', (p) => this.onDown(p))
    scene.input.on('pointermove', (p) => this.onMove(p))
    scene.input.on('pointerup', (p) => this.onUp(p))
    scene.input.on('pointerupoutside', (p) => this.onUp(p))
  }

  onDown(p) {
    if (p.x < HALF_W) {
      if (this.joystickPointer === null) {
        this.joystickPointer = p
        this.joystickBase = { x: p.x, y: p.y }
        this.baseGfx.setPosition(p.x, p.y).setVisible(true)
        this.knobGfx.setPosition(p.x, p.y).setVisible(true)
      }
      return
    }
    if (inCircle(p.x, p.y, this.reloadBtn.x, this.reloadBtn.y, this.reloadBtn.radius)) {
      this.reload = true
      return
    }
    this.shoot = true
  }

  onMove(p) {
    if (p !== this.joystickPointer) return
    const dx = p.x - this.joystickBase.x
    const dy = p.y - this.joystickBase.y
    const len = Math.hypot(dx, dy)
    if (len < DEAD_ZONE) {
      this.moveX = 0
      this.moveY = 0
      this.knobGfx.setPosition(this.joystickBase.x, this.joystickBase.y)
      return
    }
    const clamped = Math.min(len, JOY_RADIUS)
    this.moveX = (dx / len) * (clamped / JOY_RADIUS)
    this.moveY = (dy / len) * (clamped / JOY_RADIUS)
    this.knobGfx.setPosition(this.joystickBase.x + (dx / len) * clamped,
      this.joystickBase.y + (dy / len) * clamped)
  }

  onUp(p) {
    if (p === this.joystickPointer) {
      this.joystickPointer = null
      this.moveX = 0
      this.moveY = 0
      this.baseGfx.setVisible(false)
      this.knobGfx.setVisible(false)
      return
    }
    if (p.x >= HALF_W && !inCircle(p.x, p.y, this.reloadBtn.x, this.reloadBtn.y, this.reloadBtn.radius)) {
      this.shoot = false
    }
  }
}
