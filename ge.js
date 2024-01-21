// ----- LIBRARY ----- //

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const env = {
    w : 64,
    h : 64,
    /** @type {number} */
    s : 1,
    _s : null,
    /** @type {ImageData} the raw screen image data */
    screen : undefined,
    /**  @type {Uint32Array} the raw RGBA screen data view */
    sv : undefined,
    mx : -1,
    my : -1,
    k : {},
};

canvas.onmousemove =
    e => {
        env.mx = e.offsetX;
        env.my = e.offsetY;
    }
;

document.onkeydown =
    e => {
        env.k[e.key] = true;
    }
;

document.onkeyup =
    e => {
        delete env.k[e.key];
    }
;

{
    let w = -1;
    let h = -1;
    function update() {
        env.s = env._s;
        if (env._s == null)
            env.s = Math.min(window.innerHeight,window.innerWidth)/Math.max(env.w,env.h);
        if (w != env.w || h != env.h || !env.screen) {
            w = env.w;
            h = env.h;
            let ns = ctx.createImageData(env.w,env.h);
            if (env.screen) {
                for (let x = 0; x < ns.width && x < env.screen.width; x++) {
                    for (let y = 0; y < ns.height && y < env.screen.height; y++) {
                        let esi = (env.screen.width*y+x)*4;
                        let nsi = (ns.width*y+x)*4;
                        ns.data[nsi] = env.screen.data[esi];
                        ns.data[nsi+1] = env.screen.data[esi+1];
                        ns.data[nsi+2] = env.screen.data[esi+2];
                    }
                }
            }
            for (let i = 0; i < ns.width*ns.height; i++) ns.data[i*4+3] = 255;
            env.screen = ns;
            env.sv = new Uint32Array(env.screen.data.buffer);
        }
        canvas.width = env.w;
        canvas.height = env.h;
        canvas.style.width = `${env.w*env.s}px`;
        canvas.style.height = `${env.h*env.s}px`;
        ctx.putImageData(env.screen,0,0);
        requestAnimationFrame(update);
    }
    update();
    env.update = update;
}

class ColorValue {
    constructor (r,g,b) {
        this.r = r;
        this.g = g;
        this.b = b;
    }
    asRGB() {
        return this.r | (this.g << 8) | (this.b << 16)
    }
}

/** @class @returns {ColorValue} */ function Color(r,g,b) { return new ColorValue(r,g,b); } // small utility

const ALPHA = 0xff000000;

/**
 * Sets the size of the screen
 * @param {number?} w the new width of the screen
 * @param {number?} h the new height of the screen
 */
function screenSize( w, h ) {
    if (w != undefined && h != undefined) {
        env.w = w;
        env.h = h;
        env.update();
    }
    return [env.w,env.h];
}

/**
 * Sets the scale of the screen
 * `null` can also be passed to always get the biggest scale possible
 * @param {number|null} s the new scale of the screen
 */
function screenScale( s ) {
    env._s = s;
    env.update();
}

/**
 * Clears the screen
 * @param {ColorValue?} color the new color of the screen (defaults to black)
 */
function screenClear( color = Color(0,0,0) ) {
    env.sv.fill(ALPHA | color.asRGB());
}

/**
 * The color
 * @param {number} x 
 * @param {number} y 
 * @param {ColorValue} color 
 */
function screenSet( x, y, color ) {
    env.sv[Math.floor(y)*env.w+Math.floor(x)] = ALPHA | color.asRGB();
}

/**
 * Fills a rectangle with a given position and size
 * @param {number} x 
 * @param {number} y 
 * @param {number} w 
 * @param {number} h 
 * @param {ColorValue} color 
 */
function screenFill( x, y, w, h, color ) {
    for (let dx = x; dx < x+w; dx++) {
        for (let dy = y; dy < y+h; dy++) {
            if (dx >= 0 && dx < env.w && dy >= 0 && dy < env.h) {
                env.sv[Math.round(dy)*env.w+Math.round(dx)] = ALPHA | color.asRGB();
            }
        }
    }
}

/**
 * Draws a line between two points
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {Color} color
 */
function screenLine( x1, y1, x2, y2, color, fat=true ) {
    let x = x1;
    let y = y1;
    const l = ((x2-x1)**2+(y2-y1)**2)**.5;
    const k = fat ? Math.SQRT2 : 1;
    const dx = ((x2-x1)/l)/k;
    const dy = ((y2-y1)/l)/k;
    let t = 0;
    while (t <= l/k && x >= 0 && x < env.w-1 && y >= 0 && y < env.h-1) {
        env.sv[Math.round(y)*env.w+Math.round(x)] = ALPHA | color.asRGB();
        x += dx;
        y += dy;
        t++;
    }
}

/**
 * Retrieves the position of the mouse
 * @returns {[number,number]}
 */
function mousePos() {
    return [Math.max(0,Math.min(env.w-1,env.mx/env.s)),Math.max(0,Math.min(env.h-1,env.my/env.s))];
}
/**
 * Retrieves the position of the mouse as an integer
 * @returns {[number,number]}
 */
function mousePosI() {
    return [Math.floor(Math.max(0,Math.min(env.w-1,env.mx/env.s))),Math.floor(Math.max(0,Math.min(env.h-1,env.my/env.s)))];
}

function keyPressed( k ) {
    return !!env.k[k];
}

//------- PROGRAM BEGIN ----- //

screenSize(512,512);

let terrain = [];

for (let i = -4094; i < 4094; i ++) {
    terrain.push([i*8,Math.random()*10+(Math.random()<.05?Math.random()*500:0)]);
}

for (let j = 0; j < 10; j++) {
    for (let i = 1; i < terrain.length-1; i++) {
        terrain[i][1] = ((terrain[i+1][1] + terrain[i-1][1])/2)+Math.random();
    }
}

let ship = { 
    x: 0, vx: -5,
    y: 300, vy: 0,
    r: Math.PI/2, vr: 0,
};

let viewportOffset = () => [Math.log(Math.abs(ship.vx)+1)*(ship.vx<0?-1:1)*3,Math.log(Math.abs(ship.vy)+1)*(ship.vy<0?-1:1)*3];

function shipPieces() {
    return {
        tip : {
            x: Math.cos(ship.r + Math.PI ) * 5,
            y: Math.sin(ship.r + Math.PI ) * 5,
        },
        wingl: {
            x: Math.cos(ship.r + 0.5 ) * 5,
            y: Math.sin(ship.r + 0.5 ) * 5,
        },
        wingr:{
            x : Math.cos(ship.r - 0.5 ) * 5 ,
            y : Math.sin(ship.r - 0.5 ) * 5 ,
        },
    };
}

function terrainHeightAt( x ) {
    let i = terrain.findIndex( t => -t[0] <= x );
    if (i == -1 || i == terrain.length-1) return NaN;
    return terrain[i][1] + (x + terrain[i][0])/(terrain[i][0] - terrain[i+1][0]) * (terrain[i+1][1]-terrain[i][1]);
}

function drawShip() {
    const [w,h] = screenSize();
    const [ox,oy] = viewportOffset();
    const { tip, wingl, wingr } = shipPieces();
    screenFill( w/2,h/3, 1,1, Color(50,50,50) );
    screenLine( 
        Math.round(tip.x+w/2+ox),   Math.round(tip.y+h/3+oy), 
        Math.round(wingl.x+w/2+ox), Math.round(wingl.y+h/3+oy), 
        Color(255,255,255), false 
    );
    screenLine( 
        Math.round(tip.x+w/2+ox),   Math.round(tip.y+h/3+oy), 
        Math.round(wingr.x+w/2+ox), Math.round(wingr.y+h/3+oy), 
        Color(255,255,255), false 
    );
    screenLine( 
        Math.round(wingl.x+w/2+ox), Math.round(wingl.y+h/3+oy), 
        Math.round(wingr.x+w/2+ox), Math.round(wingr.y+h/3+oy), 
        Color(255,255,255), false
    );
}

function drawCompass() {
    const size = 20;
    let points = [];
    for (let i = 0; i < 8; i++)
        points.push([Math.cos(i/8*Math.PI*2)*(size-2)+size,Math.sin(i/8*Math.PI*2)*(size-2)+size]);
    for (let i = 0; i < 8; i++) {
        let j = (i+1)%8;
        screenLine(points[i][0],points[i][1], points[j][0],points[j][1], Color(255,255,255), false);
    }
    screenFill(size,size,1,1,Color(255,255,255));
    const vneedlex = Math.round( Math.tanh(-ship.vx)*(size*.4) );
    const vneedley = Math.round( Math.tanh(-ship.vy)*(size*.4) );
    const hneedlex = Math.round( Math.cos(ship.r)*(size*.4) );
    const hneedley = Math.round( Math.sin(ship.r)*(size*.4) );
    screenFill( 
        size + vneedlex,
        size + vneedley,
        1,1, (vneedlex==hneedlex&&vneedley==hneedley) ? Color(128,255,128) : Color(255,255,128)
    );
    screenFill( 
        size + hneedlex,
        size + hneedley,
        1,1, (vneedlex==hneedlex&&vneedley==hneedley) ? Color(128,255,128) : Color(255,128,128)
    );
}

function drawTerrain() {
    const [w,h] = screenSize();
    const [ox,oy] = viewportOffset();

    let seg = terrain
        .map(([x,h],i)=>[i,x,h])
        .map(
            ([i,x,h]) => [
                i,
                Math.floor( x + ship.x + ox + w/2 ),
                Math.floor( h + ship.y + oy + h/3 ),
            ]
        )
        .sort(
            ([ia,xa,ya],[ib,xb,yb]) => ia-ib
        )
    ;

    for (let [i,x,y] of seg) if (x >= 0 && x < w) {
        {
            let s = seg[i-1];
            if (s) screenLine(
                x, y,
                s[1], s[2],
                Color(100,100,128), false
            );
        }
        {
            let s = seg[i+1]
            if (s) screenLine(
                x, y,
                s[1], s[2],
                Color(100,100,128), false
            );
        }
    }
}

setInterval(()=>{
    screenClear();
    
    // Input
    ship.vr += (keyPressed('ArrowRight') - keyPressed('ArrowLeft')) * .005;
    ship.vx += Math.cos(ship.r) * keyPressed('ArrowUp') * .02;
    ship.vy += Math.sin(ship.r) * keyPressed('ArrowUp') * .02;
    
    // Gravity
    ship.vy -= .01;

    // Velocity
    ship.x += ship.vx;
    ship.y += ship.vy;
    ship.r += ship.vr;

    const { tip, wingl, wingr } = shipPieces();
    
    const [w,h] = screenSize();
    if (
        Math.min(
            terrainHeightAt(ship.x+tip.x)+ship.y+tip.y-h/3,
            terrainHeightAt(ship.x+wingl.x)+ship.y+wingl.y-h/3,
            terrainHeightAt(ship.x+wingr.x)+ship.y+wingr.y-h/3,
        ) < 0
    ) {
        ship.vy *= -.7;
        ship.vy += 1;
    }
    // console.log(ship.x)
    
    drawTerrain();
    drawShip();
    drawCompass();
},30);