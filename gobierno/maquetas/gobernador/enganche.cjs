// MN3: prueba de enganche del gobernador con el juego real (modelo de ayuda y hacer para CDe4). Uso: node gobierno/maquetas/gobernador/enganche.cjs
const R=require('path').join(__dirname,'..','..','..','js')+'/'; const D=require(R+'data.js'), G=require(R+'game.js'), GOB=require(R+'gobernador.js'), MIN=require(R+'ministros.js'), CI=require(R+'ciudad.js');
const s=G.newGame('T','mediterraneo',{}); G.onEvent=null; const cid=G.capital();
const ayuda={ barrios:c=>{const E=G.ciudadE(c); if(!E) return []; return E.barrios.map((b,i)=>{const x=G.necBarrio(c,i); return x?{i,nombre:b.nombre,casas:E.parcelas.filter(l=>l.casa&&!l.casa.ruina&&!l.fuera&&l.barrio===i).length,cob:x.cob,mem:x.mem}:null}).filter(Boolean)},
 huecosLibres:c=>G.huecosLibres(s.cities[c]), prod:()=>G.prod(), obras:c=>s.cities[c].obras.map(o=>o.pieza||o.b), disponible:r=>G.disponible(r)};
const hacer={ calmar:(c,i,r)=>G.calmarRevuelta(c,i,r),
 obra:(c,t)=>{ if(CI.EDIF[t]){const E=G.ciudadE(c); const p=CI.mejorSitio(E,t); return p?G.colocar(c,t,p[0],p[1]):{ok:false,motivo:'No hay sitio'};} return {ok:!!G.upgrade(c,t),motivo:G.ultimoMotivo||'Faltan recursos'}; },
 encargar:(mid,e)=>MIN.encargar(s,mid,e)};
GOB.migrar(s); GOB.poner(s,cid,true);
for(let k=0;k<4;k++){ for(let j=0;j<12;j++) G.tick(0.25); const mes=Math.floor(s.t); const v=GOB.vista(s,cid,ayuda); console.log('barrios',v.barrios.length,'huecos',v.huecos,'grano',v.grano&&Math.round(v.grano)); console.log(GOB.estacion(s,cid,mes,ayuda,hacer).lineas.map(l=>l.texto).join(' | ')); }
