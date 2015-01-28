;(function() {
  var Game = function() {
    var screen = document.getElementById("screen").getContext('2d');
    this.size = { x: screen.canvas.width, y: screen.canvas.height };
    this.bodies = createInvaders(this).concat(new Player(this));
    this.tickFrame = 0;
    this.animationSpeed=1000;
    this.animationTime = new Date().getTime();
    this.bulletDelay=500;       // ms between player bullets
    this.updateFrame = function() { 
        var nd = new Date().getTime();
        return (nd - this.animationTime) > this.animationSpeed  ;
    };
    this.shootSound = document.getElementById('shoot-sound');

    var self = this;
    var tick = function() {
      self.update();
      self.draw(screen);
      requestAnimationFrame(tick);
    };

    tick();
  };

  Game.prototype = {
    update: function() {
      reportCollisions(this.bodies);
      var check = this.updateFrame();
      if(check) {
          this.tickFrame +=1 % 1000;
          this.animationTime = new Date().getTime();
      }

      for (var i = 0; i < this.bodies.length; i++) {
        if (this.bodies[i].update !== undefined) {
          this.bodies[i].update();
        }
      }
    },

    draw: function(screen) {
      screen.clearRect(0, 0, this.size.x, this.size.y);
      for (var i = 0; i < this.bodies.length; i++) {
        if (this.bodies[i].draw !== undefined) {
          this.bodies[i].draw(screen);
        }
      }
    },

    invadersBelow: function(invader) {
      return this.bodies.filter(function(b) {
        return b instanceof Invader &&
          Math.abs(invader.center.x - b.center.x) < b.size.x &&
          b.center.y > invader.center.y;
      }).length > 0;
    },

    addBody: function(body) {
      this.bodies.push(body);
    },

    removeBody: function(body) {
      var bodyIndex = this.bodies.indexOf(body);
      if (bodyIndex !== -1) {
        this.bodies.splice(bodyIndex, 1);
      }
    }
  };

  function getRandom(min,max) {
      return Math.floor(Math.random() * (max-min +1)) + min;
  }
  var Invader = function(game, center) {
    var srcs=['invader.a.1.png', 'invader.a.2.png'];

    this.animations = [];
    for (var i =0; i < srcs.length; i++){
        this.animations.push(new Image());
        this.animations[i].onload = function() {
            console.log('loaded'); 
        }
        this.animations[i].src=srcs[i];

    };
    this.game = game;
    this.frame = this.game.tickFrame % this.animations.length;
    this.center = center;
    this.size = { x: 15, y: 15 };
    this.patrolX = 0;
    this.speedX = 0.3;
  };

  Invader.prototype = {
    update: function() {
      if (this.patrolX < 0 || this.patrolX > 30) {
        this.speedX = -this.speedX;
      }

      if (Math.random() > 0.995 &&
          !this.game.invadersBelow(this)) {
        var bullet = new Bullet(this.game,
                                { x: this.center.x, y: this.center.y + this.size.y / 2 },
                                { x: Math.random() - 0.5, y: 2 });
        this.game.addBody(bullet);
      }
      this.center.x += this.speedX;
      this.patrolX += this.speedX;
    },

    draw: function(screen) {
      this.frame = this.game.tickFrame % this.animations.length;
      screen.drawImage(this.animations[this.frame],this.center.x - this.size.x/2, this.center.y - this.size.y/2);
//      drawRect(screen, this);
    },

    collision: function() {
      this.game.removeBody(this);
    }
  };
  Invader.prototype.score = function() {
      return 10;
  }

  var createInvaders = function(game) {
    var invaders = [];
    for (var i = 0; i < 24; i++) {
      var x = 35 + (i % 8) * 30;
      var y = 35 + (i % 3) * 30;
      invaders.push(new Invader(game, { x: x, y: y}));
    }

    return invaders;
  };

  var Player = function(game) {
    this.game = game;
    this.size = { x: 15, y: 15 };
    this.center = { x: this.game.size.x / 2, y: this.game.size.y - 35 };
    this.keyboarder = new Keyboarder();
    this.image = new Image();
    this.image.src="ship.png";
    this.image.onload = function() {console.log('ship loaded')};
    this.lastBullet = 0;
  };

  Player.prototype = {
    update: function() {
      if (this.keyboarder.isDown(this.keyboarder.KEYS.LEFT)) {
        this.center.x -= 2;
      } else if (this.keyboarder.isDown(this.keyboarder.KEYS.RIGHT)) {
        this.center.x += 2;
      }
      var d =  (new Date().getTime() - this.lastBullet) 
      if ( this.keyboarder.isDown(this.keyboarder.KEYS.SPACE) && d > (this.game.bulletDelay)) {
        this.lastBullet = new Date().getTime();
        var bullet = new Bullet(this.game,
                                { x: this.center.x, y: this.center.y - this.size.y - 10 },
                                { x: 0, y: -7 });
        this.game.addBody(bullet);
        this.game.shootSound.load();
        this.game.shootSound.play();
      }
    },

    draw: function(screen) {
      screen.drawImage(this.image, this.center.x - this.size.x/2,this.center.y - this.size.y)
//      drawRect(screen, this);
    },

    collision: function() {
      this.game.removeBody(this);
    }
  };

  var Bullet = function(game, center, velocity) {
    this.game = game;
    this.center = center;
    this.size = { x: 3, y: 3 };
    this.velocity = velocity;
  };

  Bullet.prototype = {
    update: function() {
      this.center.x += this.velocity.x;
      this.center.y += this.velocity.y;

      var screenRect = {
        center: { x: this.game.size.x / 2, y: this.game.size.y / 2 },
        size: this.game.size
      };

      if (!isColliding(this, screenRect)) {
        this.game.removeBody(this);
      }
    },

    draw: function(screen) {
      drawRect(screen, this);
    },

    collision: function() {
      this.game.removeBody(this);
    }
  };

  var Keyboarder = function() {
    var keyState = {};
    window.addEventListener('keydown', function(e) {
      keyState[e.keyCode] = true;
    });

    window.addEventListener('keyup', function(e) {
      keyState[e.keyCode] = false;
    });

    this.isDown = function(keyCode) {
      return keyState[keyCode] === true;
    };

    this.KEYS = { LEFT: 37, RIGHT: 39, SPACE: 32 };
  };

  var drawRect = function(screen, body) {
    screen.fillRect(body.center.x - body.size.x / 2,
                    body.center.y - body.size.y / 2,
                    body.size.x,
                    body.size.y);
  };

  var isColliding = function(b1, b2) {
    return !(
      b1 === b2 ||
        b1.center.x + b1.size.x / 2 <= b2.center.x - b2.size.x / 2 ||
        b1.center.y + b1.size.y / 2 <= b2.center.y - b2.size.y / 2 ||
        b1.center.x - b1.size.x / 2 >= b2.center.x + b2.size.x / 2 ||
        b1.center.y - b1.size.y / 2 >= b2.center.y + b2.size.y / 2
    );
  };

  var reportCollisions = function(bodies) {
    var bodyPairs = [];
    for (var i = 0; i < bodies.length; i++) {
      for (var j = i + 1; j < bodies.length; j++) {
        if (isColliding(bodies[i], bodies[j])) {
          bodyPairs.push([bodies[i], bodies[j]]);
        }
      }
    }

    for (var i = 0; i < bodyPairs.length; i++) {
      if (bodyPairs[i][0].collision !== undefined) {
        bodyPairs[i][0].collision(bodyPairs[i][1]);
      }

      if (bodyPairs[i][1].collision !== undefined) {
        bodyPairs[i][1].collision(bodyPairs[i][0]);
      }
    }
  };

  window.addEventListener('load', function() {
    new Game();
  });
})();
