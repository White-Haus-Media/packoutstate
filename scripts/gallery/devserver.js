// Local preview of the site with the gallery working: static files plus
// /api/gallery-file, keys read from .env.local. Run: node scripts/gallery/devserver.js
const http=require('http'),fs=require('fs'),path=require('path'),url=require('url');
const ROOT=require('path').resolve(__dirname,'../..');
for (const l of fs.readFileSync(ROOT+'/.env.local','utf8').split('\n')){const m=/^(R2_[A-Z_]+)=(.*)$/.exec(l);if(m)process.env[m[1]]=m[2];}
const fn=require(ROOT+'/api/gallery-file.js');
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.ico':'image/x-icon','.mp4':'video/mp4'};
http.createServer((req,res)=>{const u=url.parse(req.url,true);
 if(u.pathname==='/api/gallery-file'){req.query=u.query;res.status=(c)=>{res.statusCode=c;return res};return fn(req,res);}
 let p=path.join(ROOT,decodeURIComponent(u.pathname));if(fs.existsSync(p)&&fs.statSync(p).isDirectory())p=path.join(p,'index.html');
 if(!p.startsWith(ROOT)||!fs.existsSync(p)){res.statusCode=404;return res.end('nf');}
 res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(res);
}).listen(4174,()=>console.log('ready 4174'));
