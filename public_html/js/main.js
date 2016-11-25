const game = new Phaser.Game(640, 480, Phaser.AUTO);

class Weapon {
    constructor(gameState){
        this.gameState = gameState;
        this.game = gameState.game;
        this.map = gameState.map;
        this.layer = gameState.layer;
        
        this.group = null;
        this.projectile = null;
        
        // Weapon specific properties:
        this.isFiring = false;
        
        this.damage = {
            type: null,
            points: 1
        };
        
        this.bulletTime = 0;
        this.props = {fireAngle : 0};
    }
}

class WeaponLaser extends Weapon{
    constructor(gameState){
        super(gameState);
        
        this.props.fireAngle = 45;
        this.speed = 10;
        
        this.group = this.game.add.group();
        this.group.physicsBodyType = Phaser.Physics.ARCADE;
        this.group.createMultiple(100, 'lazer');
        this.group.KILL_WORLD_BOUNDS = true;
        this.group.setAll('checkWorldBounds', true);
        
        this.projectile = null;
        
        this.damage.points = 30;
        
        console.log('The lasors are charged!');
        
        return this;
    }
    static preload(gameState){
        gameState.load.atlas('lazer', 'assets/img/laser.png', 'assets/laser.json');
    }
    
    inflictDamage(laser, target){
        target.getDamage(30);
    }
    
    charge(owner){
        if(owner && owner.flesh){
            this.owner = owner;
        }
    }
    
    fire(direction){
        let fireAngle = direction === 'right' ? this.props.fireAngle : 135;
        
        if (game.time.now > this.bulletTime)
        {
            //  Grab the first bullet we can from the pool
            this.projectile = this.group.getFirstDead(true, this.owner.flesh.x, this.owner.flesh.y, 'lazer');

            this.projectile.angle = fireAngle;
            
            this.projectile.animations.add('fire', frames, 60);
            this.projectile.animations.frameName = 'frame02';
            this.projectile.direction = direction;
            this.projectile.scale.x = this.owner.flesh.scale.x;
            
            // Lazers start out with a width of 96 and expand over time
            // lazer.crop(new Phaser.Rectangle(244-96, 0, 96, 2), true);
            this.bulletTime = this.game.time.now + 250;
        }
        
        console.log('Lasor casted to bring death!');
    }
    
    killProjectile(){
        this.projectile.kill();
    }
    
    updateProjectile(projectile){
        if(!projectile) return;
        
        let angleForX = this.props.fireAngle;
        let angleForY = this.props.fireAngle; // 90-45;
        let sinAngle = Math.sin(angleForX);
        
        projectile.x += (projectile.direction === 'right' ? 1 : -1) * this.speed*sinAngle;
        projectile.y += this.speed*sinAngle; 
        
        projectile.animations.next();
    }
    
    update(){
          this.group.forEachAlive(this.updateProjectile, this);

//        let killTheLazer = this.lazer.overlap(this.layer);
//        if(killTheLazer){
//            this.lazer.kill();
//            return;
//        }

        
    }
}

class AnimatedObject {
    constructor(gameState){
        this.gameState = gameState;
        this.game = gameState.game;
        this.cursors = gameState.cursors;
        this.fireButton = gameState.fireButton;
        this.map = gameState.map;
        this.layer = gameState.layer;
        
        // The sprite of the object:
        this.flesh = null;
        
        // Jump and flying props:
        this.jumpTimer = 0;
        this.jumpTimes = 0;
        // enable doubleJump:
        this.jumpMaxTimes = 1;
     
        this.health = 100;
        
        this.facing = 'left';
        
        this.bulletTime = 0;
        this.prevCamX = 0;
    }
}

class Turtle extends AnimatedObject {
    constructor(gameState){
        super(gameState);
        
        this.turtleInitialY = gameState.groundLevel - 50;
        
        this.gameState = gameState;
        this.game = gameState.game;
        this.cursors = gameState.cursors;
        
        let gameCenterX = this.game.world.centerX;
        let gameCenterY = this.game.world.centerY;
        
        this.flesh = this.game.add.sprite(gameCenterX, this.turtleInitialY, 'turtle');
        this.flesh.anchor.setTo(0.5);
        
        // set animations:
        this.animLeft = this.flesh.animations.add('left', [0,1], 10, true);
        this.animRight = this.flesh.animations.add('right', [8,7], 10, true);
        this.animUpLeft = this.flesh.animations.add('up-left', [3,2], 10, true);
        this.animUpRight = this.flesh.animations.add('up-right', [5,6], 10, true);
        
        
        this.game.physics.enable(this.flesh);
        this.flesh.body.collideWorldBounds = true;
        this.flesh.body.gravity.y=0.01;
        
        this.game.camera.follow(this.flesh, Phaser.Camera.FOLLOW_LOCKON, 0.1, 0.1);
        this.loadMahGuns();
        
        return this;
    }
        
    loadMahGuns(){
        this.laser = this.gameState.laser;
        this.laser.charge(this,{fireAngle: 45});
    }    
    
    onFireButtonPressed(){
        console.log('Pew-Pew!!');
        this.laser.fire(this.facing);
    }
    
    static preload(gameState){
        gameState.load.spritesheet('turtle', 'assets/img/turtle.png',68,68);
                
        console.log('Setting laser');
    }
    
    update(){
        game.physics.arcade.collide(this.flesh, this.layer);
             
        this.flesh.body.velocity.x = 0;
        this.flesh.body.acceleration.y = 0;
        
        // constant flying (no animation needed):
        if(this.flesh.body.y > this.turtleInitialY+30){
            this.flesh.body.acceleration.y = 1;
            this.flesh.body.velocity.y = -400;
        }
        
        // Left-Right handling:
        if(this.cursors.left.isDown){
            this.flesh.body.velocity.x = -350;
            if(this.facing !== 'left'){
                this.facing = 'left';
            }
            this.flesh.play('left');
        }
        else if(this.cursors.right.isDown){
            this.flesh.body.velocity.x = 350;
            if(this.facing !== 'right'){
                this.facing = 'right';
            }
            this.flesh.play('right');
        }

        if (this.cursors.up.isDown){
            if(game.time.now > this.jumpTimer && this.jumpTimes < this.jumpMaxTimes){
                this.flesh.body.velocity.y = -650;
                this.jumpTimer = game.time.now + 750;
                this.jumpTimes +=1;
            }
            else {
                this.jumpTimes = 0;
            }            
        }

        // Flying animation:
        if(this.flesh.body.y < this.turtleInitialY-30){
            if(this.facing ==='right'){
                this.flesh.play('up-right');
            }
            else if(this.facing === 'left'){
                this.flesh.play('up-left');
            }
        }
        
        if(!this.cursors.left.isDown && !this.cursors.right.isDown && !this.cursors.up.isDown){
            this.flesh.animations.stop();
            this.flesh.frame = 4;
        }
        
        if(this.fireButton.isDown){
            this.onFireButtonPressed();
        }
    }
}

class Rabbit extends AnimatedObject {
    constructor(gameState, index, invokeX, invokeY, delay){
        super(gameState);        
        
        invokeX = invokeX || this.game.world.randomX;
        invokeY = invokeY || this.game.world.centerY;
        delay = delay || 0;
        let movementSpeed = 1000 + Math.abs(((index%2)+1)*1500 - index%3*1000);
        
        this.flesh = this.game.add.sprite(invokeX, invokeY, 'rabbit');
        this.flesh.anchor.setTo(0.5);
        this.game.physics.enable(this.flesh, Phaser.Physics.ARCADE);
//        this.flesh.body.tilePadding = new Phaser.Point(68,68);
                
        this.flesh.body.bounce.set(0.6);
        this.theRabbitTween = this.game.add.tween(this.flesh).from({x:invokeX-200}).to({x: invokeX+200}, movementSpeed, 'Linear', true, delay, -1, true);
        
        this.flesh.body.collideWorldBounds = true;
        
        return this;
    }
    static preload(gameState){
        gameState.load.image('rabbit', 'assets/img/rabbit.png');
    }
    getDamage(points){
        if(points > 0){
            this.health -= points;
            console.log('Auch! '+this.health);
            if(this.health <= 0){
                this.flesh.destroy();
                this.killSelf();
            }
        }
    }
    update(){
//        let isHitByLaser = Phaser.Line.intersectsRectangle(this.gameState.lasorLine, this.flesh);
//        if(isHitByLaser){
//            this.getDamage(3);
//        }
        
        this.game.physics.arcade.collide(this.flesh, this.layer);
    }
}

class GameState {
    preload(){
        // Make necessary preloads to add sprites to the scene:
        Turtle.preload(this);
        Rabbit.preload(this);
        WeaponLaser.preload(this);
        
        this.load.image('background1', 'assets/img/background2.jpg');

        this.load.tilemap('map', 'assets/maps/level1-type2.csv', null, Phaser.Tilemap.TILED_CSV);
        this.load.image('ground_1x1', 'assets/img/ground1x1.png');
    }
    
    create(){
        let gameCenterX = this.game.world.centerX;
        let gameCenterY = this.game.world.centerY;
        let background = this.background = this.game.add.tileSprite(0,-40, 1900, 480, 'background1');
        this.game.world.setBounds(0, 0, 1900, 480);
        
        this.map = game.add.tilemap('map',64,64);
        this.map.addTilesetImage('ground_1x1');
        this.layer = this.map.createLayer(0);
        this.layer.resizeWorld();
        this.map.setCollisionBetween(0, 0);
        
        
        this.groundLevel = gameCenterY;
        
        // MUST be preloaded before instantiating turtle. 
        // Or we're fucked=))
        this.cursors = this.game.input.keyboard.createCursorKeys();
        this.fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        this.game.physics.startSystem(Phaser.Physics.P2JS);
        this.game.physics.arcade.gravity.y = 1400;
        
        this.laser = new WeaponLaser(this);
        
        // instantiate our turtle.
        // With "theTurtle" property as a Phaser object to manipulate:
        this.turtle = new Turtle(this);
        
        
        // Create badies:
        this.enemies = [];
        this.enemiesTotal = 10;
        this.enemiesAlive = 10;
        
        for(let i=0; i < this.enemiesTotal; i++){
            let withDelay = i%2 === 0;
            this.enemies[i] = new Rabbit(this, i, this.game.world.randomX, this.groundLevel, withDelay ? 100 : 0);
            this.enemies[i].killSelf = ()=> { this.enemies[i] = null; delete this.enemies[i]; };
        }
        
        
        // obsolete shit:
        // 
//        this.rabbit = this.game.add.sprite(gameCenterX+40, gameCenterY+100, 'rabbit');
//        this.rabbit.anchor.setTo(0.5);
                
//        this.turtleSprite = this.game.add.tileSprite(0,0,36,36,'turtleSprite');
    }
    
    update(){
        // firing turtle update method:
        this.laser.update();
        this.turtle.update();
        for(let i in this.enemies){
            this.enemies[i].update();
            let overlaped = this.game.physics.arcade.overlap(this.laser.projectile, this.enemies[i].flesh, this.laser.inflictDamage, null, this)
            if(overlaped){
                console.log('we did');
            }
        
        }
//        this.rabbit.update();

        // this.turtleSprite.tilePosition.x += 6;
    }
}
game.state.add('GameState', GameState);
game.state.start('GameState');