const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
fs.writeFileSync(path.join(root,'developer.js'),[read('forge.js'),read('chronicles.js'),read('developer-core.js'),read('inheritance.js'),read('latebosses.js'),read('mirrorlake.js'),read('settings.js')].join('\n;\n'));
console.log('Bundled chapter expansion, developer tools and control settings.');
