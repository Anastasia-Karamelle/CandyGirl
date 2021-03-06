import * as PIXI from 'pixi.js'; 
import {hitRectangle} from '../../util/ContactOfTwoRectangles.js';
import {randomInteger} from '../../util/Random';  
import  * as Music from '../../music/Music'; 
import removeAll from '../../util/removeAll'; 
import  * as Pause from '../../Pause'; 

const ticker = new PIXI.ticker.Ticker();
let Sprite = PIXI.Sprite; 
let Texture =  PIXI.Texture;
let Loader = PIXI.loader;
let Extras = PIXI.extras;
let TilingSprite = PIXI.extras.TilingSprite;
let app, Animals, FreeCandy;
let girl, GirlTextureAtlas, CandyTextureAtlas, GirlAnimation = [];
let vy, _x,currentX, Candy = [], countCandy = 2, c = 0, Health, Boss, Dialog;
let check = true, notDead = false, shot = 0;

// в прыжке сейчас?
let jump = false;
// может ли прыгнуть?
let canJump = true;
// стоит на земле
let standOnGround = true;
// скорость
let velocity = { x: 0, y: 0 };
// гравитация
let gravity = { x: 0, y: -2 };


const AnimateGirl = (x) => {
    if (x!== undefined) { 
        if (x != 0) {
            _x = x;
            app.stage.removeChild(girl);
            GirlAnimation = [];
            let oldY = girl.y;
            girl = null;
 
            let texture = Texture.fromFrame('girlRun (' + (1 + (c++) % 20) + ').png');
            GirlAnimation.push(texture);
            girl = new Extras.AnimatedSprite(GirlAnimation);
             
            girl.gotoAndPlay(0);
            
            girl.scale.set(0.5, 0.5);
            if(x * girl.scale.x < 0)girl.scale.x *= -1;  
            girl.anchor.set(0.5, 0.5);
            girl.x = currentX;
            girl.y = oldY;// vy;  
            
        } else {
            app.stage.removeChild(girl);
            GirlAnimation = [];
            let oldY = girl.y;
            girl = null;
            girl = new Sprite(GirlTextureAtlas['girlIdle (1).png']);
            girl.scale.set(0.5, 0.5);    
            girl.anchor.set(0.5, 0.5);
            girl.y = oldY;//vy;    
            girl.x = currentX; 
        }
        app.stage.addChild(girl);
    }
}


function girlJump(delta, y){
    if(girl.y >= vy) { 
        app.ticker.stop();
    }
    girl.y += y;
}


const InitGirl = (_app, _Animals, _FreeCandy, _Boss, _Dialog) => { 
    app = _app;
    Animals = _Animals; 
    FreeCandy = _FreeCandy;
    Boss = _Boss;
    Dialog = _Dialog;
    GirlTextureAtlas = app.GirlTextureAtlas; 
    girl = new Sprite(GirlTextureAtlas["girlIdle (1).png"]);
    girl.scale.set(0.5, 0.5);    
    girl.anchor.set(0.5, 0.5);
    vy = window.innerHeight - app.FloorHeight - (girl.height/2) + 10;
    girl.x = girl.width;
    currentX = girl.x;
    girl.y = vy;    
    app.stage.addChild(girl); 
}


function GirlAttack(){
    if(app.countCandy > 0){
        CandyTextureAtlas = app.CandyTextureAtlas;
        let candy = new Sprite(CandyTextureAtlas[randomInteger(1, 5)+".png"]);
        candy.x = WidthGirl();
        candy.y = vy;
        candy.width = WidthGirl() - WidthGirl()/1.5;
        candy.height = WidthGirl() - WidthGirl()/1.5;
        app.stage.addChild(candy);
        Candy.push(candy); 
        countCandy -= 1;
    }
}

const updateGirl = (delta) => {
    if (!girl) return; 
    velocity.x += gravity.x;
    velocity.y += gravity.y;

    standOnGround = girl.y >= vy;

    // если прыжок активирован и мы можем прыгнуть
    if (jump && canJump) {
        velocity.y -= 1;

        // отключаем возможность прыжка
        canJump = standOnGround = false;
    } else if (standOnGround) {
        jump = false;
        velocity.y = 0;
        canJump = true;
        girl.y = vy;
    }

    if (girl.y < vy - 100) {
        velocity.y = 20;
    }

    girl.x += velocity.x * delta;
    girl.y += velocity.y * delta;

    if(hitRectangle(girl, Boss)){ 
    	app.Health -= 2;
    	Music.Audio_Start_Stop(7);
    }
 
/*   ATTACK   */
let i = 0;
let j, t;
    for(let candy of Candy){
            if(candy.y > window.innerHeight - app.FloorHeight){//онфета "ушла" в пол
                Candy.splice(i, 1);
                app.stage.removeChild(candy);
                i--;
            }
            j = 0; 
            for(let animal of Animals){//кормление мобов
                if(hitRectangle(candy, animal)){
                    Animals.splice(j, 1);
                    Candy.splice(i, 1);
                    app.stage.removeChild(animal);
                    app.stage.removeChild(candy);
                    j--; i--;
                    Music.Audio_Start_Stop(6);
                }
                j++;
            }
            if(!app.BossDead && hitRectangle(candy, Boss)){
                console.log(2121)
                Candy.splice(i, 1);
                app.stage.removeChild(candy);
                Music.Audio_Start_Stop(6);
                i--;
                shot += 1;
                if(shot === 2){
                    app.BossDead = true;
                    app.stage.removeChild(Boss);
                    app.stage.removeChild(Dialog); 
                }
            }
            candy.x += 8;
            candy.y *= 1.001;
            i++;
    }


 



/*   MOBS   */
    j = 0;
    for(let animal of Animals){ 
        if(Animals.length === 0){
            WinGirl();
        } 
        if(hitRectangle(girl, animal)){  
            app.Health -= 2;
            j--;
            Music.Audio_Start_Stop(7);
        }
        j++;
    }



/*  FREE_CANDY   */
    t = 0;
    for(let FreeC of FreeCandy){
        if(hitRectangle(girl, FreeC)){ 
            FreeCandy.splice(t, 1);
            app.stage.removeChild(FreeC); 
            countCandy += 1;
            Music.Audio_Start_Stop(8);
            t--;
        }
        t++;
    }


/*   DEATH   */
    if(app.Health < 0 && check){
        j = 0;
        for(let animal of Animals){
            if(hitRectangle(girl, animal)){   
                j--;
                Music.Stop_One_Of_Audio(1);
                Music.Audio_Start_Stop(9);
            }
            j++;
        } 
 
        app.stage.removeChild(girl);
        GirlAnimation = [];
        let oldY = girl.y;
        girl = null;

        for(let i = 0; i < 30; i++){ 
            let texture = Texture.fromFrame('girlDead (' + (i+1) + ').png');
            GirlAnimation.push(texture);
        } 
            girl = new Extras.AnimatedSprite(GirlAnimation);
            girl.gotoAndPlay(0); 
            girl.scale.set(0.5, 0.5);
            if(_x * girl.scale.x < 0)girl.scale.x *= -1;  
            girl.anchor.set(0.5, 0.5);
            girl.x = currentX + 100; 
            girl.y = oldY;// vy + (girl.height/2);   
            app.stage.addChild(girl); 
            DeathGirl();    
        }



    	app.countCandy = countCandy;    
}

function DeathGirl(){
    check = false; 
    notDead = true; 
    app.stage.removeChild(girl);
    girl = new Sprite(GirlTextureAtlas['girlDead (30).png']);
    girl.scale.set(0.5, 0.5);    
    girl.anchor.set(0.5, 0.5);
    girl.y = vy + (girl.height/2); 
    girl.x = currentX;
    app.stage.addChild(girl); 
    Pause.ShowEnd(app, 0);
}

function WinGirl(){
    notDead = true;    
//    if(app.Health === 171.58333333333334){
        Pause.ShowEnd(app, 3);        
/*    }
    if(app.Health < 100){
        Pause.ShowEnd(app, 2);        
    }
    if(app.Health < 50){
        Pause.ShowEnd(app, 1);        
    }
    */
}

const setJump = (value) => {
    jump = value;
}
const PositionGirlByX = () => {
    return girl.x;
}
const PositionGirlByY = () => {
    return girl.x;
}
const WidthGirl = () => {
    return girl.width;
}
const HeightGirl = () => {
    return girl.height;
} 
const SetXVelocity = (x) => {
    velocity.x = x
}

module.exports = {
    InitGirl, 
    AnimateGirl,
    PositionGirlByX,
    PositionGirlByY,
    WidthGirl,
    HeightGirl,
    updateGirl,
    setJump, 
    GirlAttack,
    SetXVelocity
}