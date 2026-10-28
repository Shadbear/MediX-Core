// MediX-Core · servidor sin dependencias (node server.js). Datos en memoria + respaldo en data.json (sustituye a la BD por ahora).
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const AG=require('./lib/agenda');
const PORT=process.env.PORT||3000,FILE=path.join(__dirname,'data.json'),PUB=path.join(__dirname,'public');
const uid=()=>crypto.randomBytes(4).toString('hex'),D=new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
const PROG=[['Dra. Marta Ríos','Obstetricia','Consultorio 105','08:00','12:00',15,'1,2,3,4,5'],['Dra. Ana Torres','Medicina General','Consultorio 101','08:00','12:00',15,'1,2,3,4,5'],['Dr. Carlos Vega','Cardiología','Consultorio 102','08:00','12:00',20,'1,3,5'],['Dra. Lucía Paz','Pediatría','Consultorio 103','14:00','18:00',20,'2,4'],['Dr. Jorge Soto','Cirugía','Consultorio 104','09:00','13:00',30,'1,2,3,4,5']].map(([medico,especialidad,consultorio,hi,hf,dur,dias])=>({id:uid(),medico,especialidad,consultorio,hi,hf,dur,dias}));
const seed=()=>({meta:{n:0,cuenta:1000},programacion:PROG,triajes:[],turnos:[],recetas:[{id:uid(),paciente:'Rosa Quispe',tel:'51999111222',medicamento:'Metformina',dosis:'850 mg',hora:'08:00'}],
citas:[{id:uid(),paciente:'Luis Ramos',medico:'Dra. Ana Torres',fecha:D,hora:'09:00',estado:'Programada'},{id:uid(),paciente:'Marta Díaz',medico:'Dr. Carlos Vega',fecha:D,hora:'10:30',estado:'Programada'}],
stock:[['Gasas estériles',120,50],['Jeringas 5 ml',30,60],['Guantes de látex (par)',400,150],['Alcohol 70% (L)',12,10]].map(([nombre,cantidad,minimo])=>({id:uid(),nombre,cantidad,minimo})),
equipos:[['Ecógrafo portátil','EQ-001','Emergencias'],['Monitor de signos vitales','EQ-002','UCI'],['Desfibrilador','EQ-003','Sin asignar']].map(([nombre,codigo,asignado])=>({id:uid(),nombre,codigo,asignado})),
camas:Array.from({length:12},(_,i)=>({id:uid(),num:String(101+i),estado:i%5==0?'Ocupada':i==7?'Mantenimiento':'Libre',paciente:i%5==0?'Paciente '+(i+1):''})),
visitas:[],asistencia:[],encuestas:[],reservas:[],
directorio:[['Dra. Ana Torres','Medicina General','101','a.torres@medix.pe','MD001'],['Dr. Carlos Vega','Cardiología','102','c.vega@medix.pe','MD002'],['Dra. Lucía Paz','Pediatría','103','l.paz@medix.pe','MD003'],['Dr. Jorge Soto','Cirugía','104','j.soto@medix.pe','MD004'],['Lic. Elena Ruiz','Enfermería','105','e.ruiz@medix.pe','EN001']].map(([nombre,especialidad,anexo,correo,codigo])=>({id:uid(),nombre,especialidad,anexo,correo,codigo}))});
let db;try{db=JSON.parse(fs.readFileSync(FILE))}catch{db=seed()}
db.meta=db.meta||{n:0};db.meta.cuenta=db.meta.cuenta??1000;if(!Array.isArray(db.programacion))db.programacion=PROG;
for(const k of['pacientes','signos','consultas','prescripciones'])if(!Array.isArray(db[k]))db[k]=[];db.meta.hc=db.meta.hc??0;
let tm;const save=()=>{clearTimeout(tm);tm=setTimeout(()=>fs.writeFile(FILE,JSON.stringify(db,null,1),()=>{}),300)};
const cuentaOk=o=>db.citas.some(x=>x.cuenta!=null&&String(x.cuenta)===String(o.cuenta));
const chk=(c,o,id)=>{
 if(c==='pacientes'){const dni=String(o.dni||'').trim().toUpperCase(),n=String(o.nombres||'').trim(),a=String(o.apellidos||'').trim();
  if(!/^[A-Z0-9]{8,12}$/.test(dni))return'El documento debe tener entre 8 y 12 letras o números';
  if(n.length<2||a.length<2)return'Ingresa nombres y apellidos';
  if(o.nacimiento&&(!AG.validDate(o.nacimiento)||o.nacimiento>AG.localNow().fecha))return'Fecha de nacimiento inválida';
  if(!['M','F'].includes(o.sexo))return'Selecciona el sexo';
  if(!AG.SEGUROS.includes(o.seguro))return'Selecciona el tipo de seguro';
  if(db.pacientes.some(x=>x.id!==id&&x.dni===dni))return'Ya existe un paciente con ese documento';
  o.dni=dni}
 if(c==='signos'){if(!cuentaOk(o))return'No existe la cuenta indicada';
  const rg=(v,lo,hi)=>v===undefined||v===''||(typeof v==='number'&&v>=lo&&v<=hi);
  if(!['pa','fc','fr','temp','spo2','peso','talla'].some(k=>o[k]!==undefined&&o[k]!==''))return'Registra al menos un signo vital';
  if(o.pa&&!/^\d{2,3}\/\d{2,3}$/.test(o.pa))return'Presión arterial con formato 120/80';
  if(!rg(o.fc,20,300)||!rg(o.fr,4,80)||!rg(o.temp,25,45)||!rg(o.spo2,0,100)||!rg(o.peso,0.3,500)||!rg(o.talla,20,260))return'Algún signo vital está fuera de rango'}
 if(c==='consultas'){if(!cuentaOk(o))return'No existe la cuenta indicada';
  if(db.consultas.some(x=>String(x.cuenta)===String(o.cuenta)))return'Esta cuenta ya tiene una atención registrada';
  if(String(o.motivo||'').trim().length<3)return'Ingresa el motivo de consulta';
  if(String(o.diagnostico||'').trim().length<3)return'Ingresa el diagnóstico';
  if(o.cie&&!/^[A-Za-z]\d{2}(\.\d{1,2})?$/.test(o.cie))return'Código CIE-10 inválido (ej. J00 u O80.0)'}
 if(c==='prescripciones'){if(!cuentaOk(o))return'No existe la cuenta indicada';
  if(String(o.medicamento||'').trim().length<2)return'Indica el medicamento';
  if(!Number.isInteger(o.dias)||o.dias<1||o.dias>365)return'Los días de tratamiento deben ser de 1 a 365';
  if(!Number.isInteger(o.cantidad)||o.cantidad<1||o.cantidad>1000)return'La cantidad debe ser de 1 a 1000'}
 if(c==='reservas'){if(o.fin<=o.inicio)return'La hora de fin debe ser posterior al inicio';if(db.reservas.some(r=>r.id!==id&&r.sala===o.sala&&r.fecha===o.fecha&&r.inicio<o.fin&&o.inicio<r.fin))return'La sala ya está reservada en ese horario'}
 if(c==='programacion')return AG.validarProgramacion(o);
 if(c==='citas'&&o.estado!=='Cancelada'){const e=AG.validarCita(db,o,id,undefined,{past:!id});if(e)return e}
 if(c==='citas'&&o.estado!=='Cancelada'&&db.citas.some(x=>x.id!==id&&x.estado!=='Cancelada'&&x.medico===o.medico&&x.fecha===o.fecha&&x.hora===o.hora))return'El médico ya tiene una cita en ese horario'};
const HOST=process.env.HOST||'127.0.0.1',PROXY=process.env.TRUST_PROXY==='1',SECURE=process.env.SECURE==='1';
const SEC={'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','Cross-Origin-Resource-Policy':'same-origin','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"};
const J=(r,s,o,h)=>{r.writeHead(s,{'Content-Type':'application/json','Cache-Control':'no-store',...SEC,...h});r.end(JSON.stringify(o))};
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'};
// ---- Seguridad: usuarios, roles, sesiones, límites ----
const W={admin:'*',medico:['citas','recetas','camas','reservas','stock','equipos','triajes','turnos','encuestas','pacientes','signos','consultas','prescripciones'],recepcion:['citas','turnos','visitas','triajes','encuestas','recetas','pacientes'],enfermeria:['citas','pacientes','signos','camas','stock'],seguridad:['visitas','asistencia']};
// Quién puede LEER los datos clínicos / de pacientes (el resto recibe listas vacías) y qué registros son de solo-añadir.
const RD={pacientes:['admin','medico','recepcion','enfermeria'],signos:['admin','medico','enfermeria'],consultas:['admin','medico'],prescripciones:['admin','medico','enfermeria']};
const APP=new Set(['signos','consultas','prescripciones']);
const view=r=>{const o={...db};for(const[k,v]of Object.entries(RD))if(!v.includes(r))o[k]=[];return o};
const UF=path.join(__dirname,'users.json');let users;try{users=JSON.parse(fs.readFileSync(UF))}catch{users=[]}
const saveU=()=>fs.writeFileSync(UF,JSON.stringify(users,null,1),{mode:0o600});
const hash=(p,s=crypto.randomBytes(16).toString('hex'))=>s+':'+crypto.scryptSync(p,s,64).toString('hex');
const verify=(p,h)=>{const[s,k]=h.split(':'),a=Buffer.from(k,'hex'),c=crypto.scryptSync(p,s,64);return a.length===c.length&&crypto.timingSafeEqual(a,c)};
const DUMMY=hash('dummy-password');
if(process.argv[2]==='adduser'){const[n,r,pw]=process.argv.slice(3);if(!/^[\w.-]{3,30}$/.test(n||'')||!W[r]){console.log('Uso: node server.js adduser <usuario> <admin|medico|enfermeria|recepcion|seguridad> [clave]');process.exit(1)}
 const p=pw||crypto.randomBytes(9).toString('base64url');if(p.length<10){console.log('La clave debe tener 10 o más caracteres');process.exit(1)}
 users=users.filter(x=>x.u!==n);users.push({u:n,role:r,h:hash(p)});saveU();console.log(`Usuario ${n} (${r}) listo. Clave: ${p}`);process.exit(0)}
let first=null;if(!users.length){first=crypto.randomBytes(9).toString('base64url');users.push({u:'admin',role:'admin',h:hash(first)});saveU()}
const ses=new Map(),hits=new Map();
const rl=(k,max,win,count=true)=>{const t=Date.now();let e=hits.get(k);if(!e||e.r<t){e={n:0,r:t+win};hits.set(k,e)}if(count)e.n++;return e.n<=max};
setInterval(()=>{const t=Date.now();for(const[k,e]of hits)if(e.r<t)hits.delete(k);for(const[k,s]of ses)if(s.exp<t)ses.delete(k)},6e4).unref();
const cookie=q=>Object.fromEntries((q.headers.cookie||'').split(';').map(c=>c.trim().split('=')).filter(a=>a[0]).map(([k,...v])=>[k,v.join('=')]));
const who=q=>{const s=ses.get(cookie(q).mx);return s&&s.exp>Date.now()?s:null};
const audit=(u,ip,a)=>fs.appendFile(path.join(__dirname,'audit.log'),`${new Date().toISOString()} ${u} ${ip} ${a}\n`,()=>{});
const clean=o=>{const r={};for(const[k,v]of Object.entries(o)){if(!/^[a-z_]{1,24}$/i.test(k)||['__proto__','constructor','prototype','id','ts'].includes(k))continue;
 if(typeof v==='string')r[k]=v.slice(0,/^(relato|examen|plan|indic|nota|obs)/.test(k)?2000:300);else if((typeof v==='number'&&isFinite(v))||typeof v==='boolean')r[k]=v}return r};
const server=http.createServer((req,res)=>{
 const ip=(PROXY&&(req.headers['x-forwarded-for']||'').split(',')[0].trim())||req.socket.remoteAddress;
 if(!rl('g'+ip,600,6e4))return J(res,429,{error:'Demasiadas solicitudes. Espera un momento.'},{'Retry-After':'60'});
 const u=new URL(req.url,'http://x'),p=u.pathname.split('/').filter(Boolean),M=req.method;
 if(p[0]!=='api'){if(M!=='GET'&&M!=='HEAD')return J(res,405,{error:'Método no permitido'});
  let f;try{f=path.join(PUB,u.pathname==='/'?'index.html':decodeURIComponent(u.pathname))}catch{return J(res,400,{error:'Ruta inválida'})}
  if(!f.startsWith(PUB+path.sep)||f.split(path.sep).some(s=>s.startsWith('.')))return J(res,403,{error:'No permitido'});
  return fs.readFile(f,(e,b)=>{if(e)return J(res,404,{error:'No encontrado'});res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream',...SEC});res.end(b)})}
 let body='';req.on('data',c=>{body+=c;if(body.length>1e5)req.destroy()});
 req.on('end',()=>{let b={};try{b=body?JSON.parse(body):{}}catch{return J(res,400,{error:'JSON inválido'})}
  if(!b||typeof b!=='object'||Array.isArray(b))b={};
  if(M!=='GET'){if(req.headers['x-requested-with']!=='medix')return J(res,403,{error:'Solicitud no permitida'});
   const o=req.headers.origin;if(o){try{if(new URL(o).host!==req.headers.host)throw 0}catch{return J(res,403,{error:'Origen no permitido'})}}}
  const[,col,id]=p;
  if(col==='auth'){
   if(id==='login'&&M==='POST'){const k='l'+ip;if(!rl(k,8,9e5,false))return J(res,429,{error:'Demasiados intentos fallidos. Espera 15 minutos.'});
    const name=String(b.u||'').trim().slice(0,30),us=users.find(x=>x.u===name),ok=verify(String(b.p||'').slice(0,200),us?us.h:DUMMY);
    if(!us||!ok){rl(k,8,9e5);audit('-',ip,'LOGIN_FALLIDO '+name);return J(res,401,{error:'Usuario o contraseña incorrectos'})}
    const t=crypto.randomBytes(32).toString('base64url');ses.set(t,{u:us.u,role:us.role,exp:Date.now()+288e5});audit(us.u,ip,'LOGIN');
    return J(res,200,{u:us.u,role:us.role},{'Set-Cookie':`mx=${t}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${SECURE?'; Secure':''}`})}
   if(id==='logout'&&M==='POST'){ses.delete(cookie(req).mx);return J(res,200,{ok:1},{'Set-Cookie':'mx=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict'})}
   if(id==='me'){const s=who(req);return s?J(res,200,{u:s.u,role:s.role}):J(res,401,{error:'Sin sesión'})}
   return J(res,404,{error:'No encontrado'})}
  const s=who(req);if(!s)return J(res,401,{error:'Inicia sesión',code:'AUTH'});
  if(M==='GET'&&!col)return J(res,200,view(s.role));
  if(col==='agenda'){
   const q=Object.fromEntries(u.searchParams),prog=db.programacion.find(x=>x.id===q.prog);
   if(M==='GET'&&id==='calendario'){if(!prog)return J(res,404,{error:'Programación no encontrada'});if(!AG.validMonth(q.mes))return J(res,400,{error:'Mes inválido (AAAA-MM)'});return J(res,200,{dias:AG.calendario(db,prog,q.mes)})}
   if(M==='GET'&&id==='franjas'){if(!prog)return J(res,404,{error:'Programación no encontrada'});if(!AG.validDate(q.fecha))return J(res,400,{error:'Fecha inválida'});return J(res,200,AG.franjas(db,prog,q.fecha))}
   if(M==='GET'&&id==='proximo'){const l=db.programacion.filter(x=>(!q.especialidad||x.especialidad===q.especialidad)&&(!q.prog||x.id===q.prog));return J(res,200,AG.proximo(db,l)||{})}
   if(M==='GET'&&id==='atenciones'){if(!RD.pacientes.includes(s.role))return J(res,403,{error:'Tu rol no tiene permiso para ver esto'});const t=v=>String(v||'').trim().toLowerCase(),r=db.citas.filter(c=>c.estado!=='Cancelada'&&(!q.cuenta||String(c.cuenta)===q.cuenta.trim())&&(!q.hc||String(c.hc)===q.hc.trim())&&(!q.dni||t(c.dni)===t(q.dni))&&(!q.apellido||t(c.paciente).includes(t(q.apellido)))&&(!q.fecha||c.fecha===q.fecha)&&(!q.servicio||c.especialidad===q.servicio));
    return J(res,200,r.sort((a,b)=>(a.fecha+a.hora).localeCompare(b.fecha+b.hora)).slice(0,200))}
   if(M==='POST'&&id==='asignar'){if(W[s.role]!=='*'&&!W[s.role].includes('citas'))return J(res,403,{error:'Tu rol no tiene permiso para modificar esto'});
    const r=AG.asignar(db,b,{id:uid()});if(r.error)return J(res,r.status,{error:r.error});audit(s.u,ip,`ASIGNAR cita ${r.cita.cuenta}`);save();return J(res,201,r.cita)}
   return J(res,404,{error:'No encontrado'})}
  if(!Array.isArray(db[col]))return J(res,404,{error:'Colección no encontrada'});
  if(M!=='GET'&&W[s.role]!=='*'&&!W[s.role].includes(col))return J(res,403,{error:'Tu rol no tiene permiso para modificar esto'});
  if(M!=='GET')audit(s.u,ip,`${M} ${u.pathname}`);
  if(col==='turnos'&&id==='next'&&M==='POST'){db.turnos.forEach(t=>t.estado==='llamado'&&(t.estado='atendido'));
   const n=db.turnos.find(t=>t.estado==='espera');if(n){n.estado='llamado';n.modulo=String(b.modulo||'1').slice(0,20);n.llamado=Date.now()}save();return J(res,200,db)}
  b=clean(b);
  if(M==='POST'){const o={...b,id:uid(),ts:Date.now()};
   if(col==='turnos'){o.num='A-'+String(++db.meta.n).padStart(3,'0');o.estado='espera'}
   const e=chk(col,o);if(e)return J(res,409,{error:e});
   if(col==='pacientes')o.hc=String(++db.meta.hc).padStart(6,'0');
   if(APP.has(col)){o.por=s.u;const c=db.citas.find(x=>String(x.cuenta)===String(o.cuenta));
    if(c&&col==='signos'&&['Programada','Admitida'].includes(c.estado))c.estado='Triada';
    if(c&&col==='consultas')c.estado='Atendida'}
   db[col].push(o);save();return J(res,201,o)}
  const i=db[col].findIndex(x=>x.id===id);if(i<0)return J(res,404,{error:'No existe'});
  if(APP.has(col)&&M!=='GET')return J(res,405,{error:'Los registros clínicos no se modifican ni se eliminan'});
  if(col==='pacientes'&&M==='DELETE')return J(res,405,{error:'Los pacientes no se eliminan'});
  if(M==='PUT'){const o={...db[col][i],...b,id};if(col==='pacientes')o.hc=db[col][i].hc;const e=chk(col,o,id);if(e)return J(res,409,{error:e});db[col][i]=o;save();return J(res,200,o)}
  if(M==='DELETE'&&col==='programacion'&&db.citas.some(c=>c.prog===id&&c.estado!=='Cancelada'))return J(res,409,{error:'El médico tiene citas asignadas; cancélalas primero'});
  if(M==='DELETE'){db[col].splice(i,1);save();return J(res,200,{ok:1})}
  J(res,405,{error:'Método no permitido'})})
});
server.requestTimeout=15e3;server.headersTimeout=10e3;server.maxConnections=300;
server.listen(PORT,HOST,()=>{console.log(`[MediX-Core] http://${HOST==='0.0.0.0'?'localhost':HOST}:${PORT}`);
 if(first)console.log(`\n=========== PRIMER INGRESO ===========\n Usuario: admin\n Clave:   ${first}\n (solo se muestra una vez)\n======================================\n`)});
