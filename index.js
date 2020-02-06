var Simple1DNoise = function() {
  var MAX_VERTICES = 256;
  var MAX_VERTICES_MASK = MAX_VERTICES -1;
  var amplitude = 1;
  var scale = 1;
  
  var r = [];
  
  for ( var i = 0; i < MAX_VERTICES; ++i ) {
    r.push(Math.random());
  }
  
  var getVal = function(x) {
    var scaledX = x * scale;
    var xFloor = Math.floor(scaledX);
    var t = scaledX - xFloor;
    var tRemapSmoothstep = t * t * ( 3 - 2 * t );
    
    var xMin = xFloor & MAX_VERTICES_MASK;
    var xMax = ( xMin + 1 ) & MAX_VERTICES_MASK;
    
    var y = lerp( r[ xMin ], r[ xMax ], tRemapSmoothstep );
    
    return y * amplitude;
  };
  
  /**
  * Linear interpolation function.
  * @param a The lower integer value
  * @param b The upper integer value
  * @param t The value between the two
  * @returns {number}
  */
  var lerp = function(a, b, t ) {
    return a * ( 1 - t ) + b * t;
  };
  
  // return the API
  return {
    getVal: getVal,
    setAmplitude: function(newAmplitude) {
      amplitude = newAmplitude;
    },
    setScale: function(newScale) {
      scale = newScale;
    }
  };
};

class Mine {
  constructor(x, yOff, gap) {
    this.x = x
    this.y = Math.random() * (gap - 150) + yOff + 75
    this.bbox = {x: this.x + 5, y: this.y + 5, w: 90, h: 90}
  }

  draw(ctx) {
    ctx.drawImage(Mine.img, this.x, this.y)
    // ctx.strokeStyle = 'white'
    // ctx.strokeRect(this.bbox.x, this.bbox.y, this.bbox.w, this.bbox.h)
  }
}
Mine.img = new Image()
Mine.img.src = "mine.png"

class Player {
  constructor() {
    this.x = 180
    this.y = 300
    this.w = 50
    this.h = 30
    this.vy = 0
    this.ay = 0
    this.img = new Image()
    this.img.src = 'submarine.png'
    this.goDown()
  }
  
  draw(ctx) {
    ctx.drawImage(this.img, this.x, this.y)
    // ctx.strokeStyle = 'white'
    // ctx.strokeRect(this.x, this.y, this.w, this.h)
  }

  goUp() {
    this.ay = -Player.ay
  }

  goDown() {
    this.ay = Player.ay
  }
}
Player.ay = 1.1e3

function loop(env) {
  const ctx = env.canvas.getContext('2d')
  const dt = (Date.now() - env.time) / 1000
  env.time = Date.now()
  
  ctx.fillStyle = '#101099'
  ctx.fillRect(0, 0, env.canvas.width, env.canvas.height)
  env.player.draw(ctx)

  // Draw border walls
  ctx.fillStyle = '#500a0a'
  const topY = env.noise.getVal(env.time) * (env.canvas.height - env.gap)
  const bottomY = topY + env.gap
  env.border.push({x: env.canvas.width, width: Math.ceil(env.speed * dt) + 1, topY, bottomY})
  for (b of env.border) {
    ctx.fillRect(b.x, 0, b.width, b.topY)
    ctx.fillRect(b.x, b.bottomY, b.width, env.canvas.height)
    b.x -= env.speed * dt
    if (b.x < 0) {
      setTimeout(() => env.border.shift(), 10)
    }
    const p = env.player
    if (b.x >= p.x && b.x <= p.x + p.w) {
      if (p.y < b.topY || p.y + p.h > b.bottomY) {
        env.gameover()
      }
    }
  }

  // Add mines
  if (Date.now() - env.lastMine >= 2000) {
    env.lastMine = Date.now()
    let border = env.border.pop()
    env.mines.push(new Mine(env.canvas.width, border.topY, env.gap))
    env.border.push(border)
  }
  for (mine of env.mines) {
    mine.draw(ctx)
    mine.x -= env.speed * dt
    mine.bbox.x -= env.speed * dt
    if (mine.x < 0) {
      setTimeout(() => env.mines.shift(), 10)
    }
    const p = env.player
    if (mine.bbox.x <= p.x + p.w && mine.bbox.x + mine.bbox.w >= p.x) {
      console.log('x good')
      if (mine.bbox.y <= p.y + p.h && mine.bbox.y + mine.bbox.h >= p.y) {
        console.log('game should end')
        env.gameover()
      }
    }
  }

  // Draw score
  ctx.fillStyle = 'white'
  ctx.font = '20pt sans serif'
  ctx.fillText(`${Date.now() - env.startTime} points`, 20, 40)

  // Shrink gap
  if ((env.time - env.lastShrink) >= 1000/3) {
    env.lastShrink = Date.now()
    env.gap -= 1
    env.gap = Math.max(env.minGap, env.gap)
  }

  // Move player
  env.player.vy += env.player.ay * dt
  env.player.y += env.player.vy * dt
}

window.addEventListener('DOMContentLoaded', event => {
  function gameover() {
    console.log('gameover')
    clearInterval(loopInterval)
  }

  const canvas = document.getElementById('game')
  const player = new Player()
  canvas.addEventListener('keydown', event => {
    if (event.key === ' ') {
      player.goUp()
    }
  })
  canvas.addEventListener('keyup', event => {
    if (event.key === ' ') {
      player.goDown()
    }
  })

  const noise = Simple1DNoise()
  noise.setAmplitude(0.8)
  noise.setScale(0.004)

  const ctx = canvas.getContext('2d')
  ctx.font = '32pt sans serif'
  ctx.fillText('Click window to start game', 20, 60)

  var loopInterval, env
  canvas.addEventListener('focus', event => {
    env = {
      canvas,
      player,
      speed: 500,
      gap: 500,
      time: Date.now(),
      startTime: Date.now(),
      lastShrink: Date.now(),
      lastMine: Date.now(),
      border: [],
      mines: [],
      noise,
      minGap: 300,
      gameover
    }
    loopInterval = setInterval(loop, 1000/60, env)
  })
})