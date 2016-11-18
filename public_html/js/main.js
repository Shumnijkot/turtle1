const game = new Phaser.Game(640, 480, Phaser.AUTO);

class AnimatedObject {
    constructor(gameState){
        this.gameState = gameState;
        this.game = gameState.game;
        this.cursors = gameState.cursors;
        this.fireButton = gameState.fireButton;
        this.map = gameState.map;
        this.layer = gameState.layer;
        
        // Jump and flying props:
        this.jumpTimer = 0;
        this.jumpTimes = 0;
        // enable doubleJump:
        this.jumpMaxTimes = 1;
     
        this.health = 100;
        
        this.facing = 'left';
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
        
        this.theTurtle = this.game.add.sprite(gameCenterX, this.turtleInitialY, 'turtle');
        this.theTurtle.anchor.setTo(0.5);
        
        this.animLeft = this.theTurtle.animations.add('left', [0,1], 10, true);
        this.animRight = this.theTurtle.animations.add('right', [8,7], 10, true);
        this.animUpLeft = this.theTurtle.animations.add('up-left', [3,2], 10, true);
        this.animUpRight = this.theTurtle.animations.add('up-right', [5,6], 10, true);
        
        this.game.physics.enable(this.theTurtle);
        this.theTurtle.body.collideWorldBounds = true;
        this.theTurtle.body.gravity.y=0.01;
        
        this.game.camera.follow(this.theTurtle, Phaser.Camera.FOLLOW_LOCKON, 0.1, 0.1);
        
        this.chargeLaser();
        return this;
        
    }
    
    chargeLaser(){
        this.gameState.lasorLine = new Phaser.Line();
        console.log('Mah lasors are charged!');
    }

    fireLaser(direction){
        let angle = direction === 'right' ? 0.785398 : 2.35619;
        this.gameState.lasorLine.fromAngle(this.theTurtle.x, this.theTurtle.y, angle, 500);
        console.log('Lasor casted to bring death!');
    }
    
    laserOff(){
        this.gameState.lasorLine = null;
        console.log('Lasor charged and ready again!');
        this.chargeLaser();
    }
    
    holdYourFire(){
        this.weaponFiring = false;
        this.laserOff();
        console.log('No pew-pew!');
    }
    
    fireWeapon(){
        this.weaponFiring = true;
        console.log('Pew-Pew!!');
        this.fireLaser(this.facing);
        setTimeout(this.holdYourFire.bind(this), 500);    
    }
    
    onFireButtonPressed(){
        if(!this.weaponFiring){
            this.fireWeapon();
        }
        else return;
    }
    
    static preload(gameState){
        gameState.load.spritesheet('turtle', 'assets/img/turtle.png',68,68);
    }
    
    update(){
        game.physics.arcade.collide(this.theTurtle, this.layer);
        
        this.theTurtle.body.velocity.x = 0;
        this.theTurtle.body.acceleration.y = 0;
        
        // constant flying (no animation needed):
        if(this.theTurtle.body.y > this.turtleInitialY+30){
            this.theTurtle.body.acceleration.y = 1;
            this.theTurtle.body.velocity.y = -400;
        }
        
        // Left-Right handling:
        if(this.cursors.left.isDown){
            this.theTurtle.body.velocity.x = -350;
            if(this.facing !== 'left'){
                this.facing = 'left';
            }
            this.theTurtle.play('left');
        }
        else if(this.cursors.right.isDown){
            this.theTurtle.body.velocity.x = 350;
            if(this.facing !== 'right'){
                this.facing = 'right';
            }
            this.theTurtle.play('right');
        }

        if (this.cursors.up.isDown){
            if(game.time.now > this.jumpTimer && this.jumpTimes < this.jumpMaxTimes){
                this.theTurtle.body.velocity.y = -650;
                this.jumpTimer = game.time.now + 750;
                this.jumpTimes +=1;
            }
            else {
                this.jumpTimes = 0;
            }            
        }

        // Flying animation:
        if(this.theTurtle.body.y < this.turtleInitialY-30){
            if(this.facing ==='right'){
                this.theTurtle.play('up-right');
            }
            else if(this.facing === 'left'){
                this.theTurtle.play('up-left');
            }
        }
        
        if(!this.cursors.left.isDown && !this.cursors.right.isDown && !this.cursors.up.isDown){
            this.theTurtle.animations.stop();
            this.theTurtle.frame = 4;
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
        
        this.theRabbit = this.game.add.sprite(invokeX, invokeY, 'rabbit');
        this.theRabbit.anchor.setTo(0.5);
        this.game.physics.enable(this.theRabbit, Phaser.Physics.ARCADE);
        
        this.theRabbit.body.bounce.set(0.6);
        this.theRabbit.body.tilePadding.set(32);
        this.theRabbitTween = this.game.add.tween(this.theRabbit).from({x:invokeX-200}).to({x: invokeX+200}, movementSpeed, 'Linear', true, delay, -1, true);
        
        this.theRabbit.body.collideWorldBounds = true;
        
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
                this.theRabbit.destroy();
                this.killSelf();
            }
        }
    }
    update(){
        let isHitByLaser = Phaser.Line.intersectsRectangle(this.gameState.lasorLine, this.theRabbit);
        if(isHitByLaser){
            this.getDamage(3);
        }
        this.game.physics.arcade.collide(this.theRabbit, this.layer);
    }
}

class GameState {
    preload(){
        // Make turtle preload to add sprite to the scene:
        Turtle.preload(this);
        Rabbit.preload(this);
        
        this.load.image('background1', 'assets/img/background2.jpg');
//        this.load.image('rabbit', 'assets/img/rabbit.png');
        
        this.load.image('turtleSprite', 'assets/img/turtle-sprite.png');
        
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
        this.turtle.update();
        for(let i in this.enemies){
            this.enemies[i].update();
        }
//        this.rabbit.update();

        // this.turtleSprite.tilePosition.x += 6;
    }
}
game.state.add('GameState', GameState);
game.state.start('GameState');