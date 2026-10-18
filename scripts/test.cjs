const {spawnSync}=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'..');let count=0;
for(const file of ["game.test.cjs","campaign.test.cjs","combat.test.cjs","variety.test.cjs","lifecycle.test.cjs","atelier.test.cjs","route.test.cjs","thorn.test.cjs","developer.test.cjs","chronicles.test.cjs","forge.test.cjs","inheritance.test.cjs","latebosses.test.cjs","mirrorlake.test.cjs"]){const r=spawnSync(process.execPath,[path.join(root,'tests',file)],{cwd:root,encoding:'utf8'});if(r.status!==0){process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');process.exit(r.status||1);}const n=(r.stdout.match(/^PASS /gm)||[]).length;count+=n;console.log(file+': '+n+' checks passed');}
console.log('Total: '+count+' checks passed');
