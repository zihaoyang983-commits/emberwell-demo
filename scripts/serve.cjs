const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const port=Number(process.env.PORT||4173);
http.createServer((request,response)=>{
  let pathname;try{pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);}catch{response.writeHead(400);response.end('Bad request');return;}
  const target=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  const relative=path.relative(root,target);
  if(relative.startsWith('..')||path.isAbsolute(relative)||relative.split(path.sep).some(p=>p.startsWith('.'))){response.writeHead(403);response.end('Forbidden');return;}
  const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.json':'application/json'};
  fs.readFile(target,(error,body)=>{response.writeHead(error?404:200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});response.end(error?'Not found':body);});
}).listen(port,'127.0.0.1',()=>console.log(`Emberwell: http://127.0.0.1:${port}`));
