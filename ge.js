const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const env = {
    w : 256,
    h : 256,
    s : 4,
    /** @type {ImageData} */
    screen : undefined // created afterwards
};

{
    let w = -1;
    let h = -1;
    (function update() {
        let s = env.s;
        if (s == null)
            s = Math.min(window.innerHeight,window.innerWidth)/Math.max(env.w,env.h);
        if (w != env.w || h != env.h || !env.screen) {
            w = env.w;
            h = env.h;
            let ns = ctx.createImageData(env.w,env.h);
            if (env.screen) {
                
            }
        }
        canvas.width = env.w;
        canvas.height = env.h;
        canvas.style.width = `${env.w*s}px`;
        canvas.style.height = `${env.h*s}px`;
        requestAnimationFrame(update);
    })();
}

/*{
//    ctx.font = `${Math.min(env.w,env.h)*env.s/10}pt mono`;
    ctx.font = '10pt sans-serif';
    ctx.fillStyle = 'rgb(255,0,0)';
    ctx.fillText(txt,0,100);
}*/

function windowSize( w, h ) {
    env.w = w;
    env.h = h;
}

function windowScale( s ) {
    env.s = s;
}

windowScale( null ); // biggest fit