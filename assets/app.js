/* El Padré Tlemcen — rendu, carte à onglets, galerie, statut, commande (confirmée par téléphone). */
(function(){'use strict';
var C=window.EP_CONFIG||{},$=function(s,r){return(r||document).querySelector(s)},$$=function(s,r){return[].slice.call((r||document).querySelectorAll(s))};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function n(p){p=String(p==null?'':p).replace(/\s/g,'').replace(',','.');return p&&!isNaN(+p)?+p:null}
function da(v){return v==null?'Prix à confirmer':String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g,'\u202f')+'\u00a0DA'}
var D={},TAB=0,KEY='elpadre_cart_v1',cart=[];try{cart=JSON.parse(localStorage.getItem(KEY))||[]}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(cart))}catch(e){}}
function cats(){return(D.menu||[]).filter(function(c){return(c.items||[]).some(function(i){return i.hidden!==true})})}
function on(){return(D.order_options||{}).enabled!==false}
function menu(){
  var cs=cats();if(TAB>=cs.length)TAB=0;
  $('#tabs').innerHTML=cs.map(function(c,i){return'<button type="button" role="tab" aria-selected="'+(i===TAB)+'" class="'+(i===TAB?'on':'')+'" data-t="'+i+'">'+esc(c.name)+'</button>'}).join('');
  var c=cs[TAB],ci=(D.menu||[]).indexOf(c);if(!c){$('#cat').innerHTML='';return}
  $('#cat').classList.remove('sw');void $('#cat').offsetWidth;$('#cat').classList.add('sw');$('#cat').innerHTML='<div class="cat-h"><h3>'+esc(c.name)+'</h3>'+(c.note?'<small>'+esc(c.note)+'</small>':'')+'</div><ul class="items">'+c.items.map(function(it,ii){if(it.hidden===true)return'';
    var pr=it.sizes&&it.sizes.length?it.sizes.map(function(s){return esc(s.name)+' '+da(n(s.price))}).join(' · '):'';
    return'<li class="item" style="--d:'+(ii*60)+'ms"><div class="it-h"><b>'+esc(it.name)+'</b><span class="dots"></span><span class="pr">'+da(n(it.price))+'</span></div>'+(pr?'<div class="sz">'+pr+'</div>':'')+(it.desc?'<p>'+esc(it.desc)+'</p>':'')+(on()?'<button class="od-plus" type="button" data-ci="'+ci+'" data-ii="'+ii+'">+ Ajouter</button>':'')+'</li>'}).join('')+'</ul>'+
    ((c.extras||[]).length?'<div class="xt"><b>Suppléments</b><br>'+c.extras.map(function(e){return'<span>'+esc(e.name)+' · '+da(n(e.price))+'</span>'}).join('')+'</div>':'');
  $$('#tabs button').forEach(function(b){b.onclick=function(){TAB=+b.dataset.t;menu();var t=$('#tabs');t.scrollTo({left:b.offsetLeft-20,behavior:'smooth'})}});
  $$('.od-plus').forEach(function(b){b.onclick=function(){openItem(+b.dataset.ci,+b.dataset.ii)}});
}
var G=[];
function gal(sel,list){var el=$(sel);if(!el||!list)return;el.innerHTML=list.map(function(g){var k=G.push(g)-1;return'<button type="button" data-g="'+k+'" aria-label="Agrandir : '+esc(g.alt)+'"><img src="'+esc(g.src)+'" alt="'+esc(g.alt)+'" loading="lazy"></button>'}).join('')}
var LI=0;function lb(k){LI=(k+G.length)%G.length;$('#lb img').src=G[LI].src;$('#lb img').alt=G[LI].alt;$('#lb p').textContent=G[LI].alt;$('#lb').hidden=false}
document.addEventListener('click',function(e){var b=e.target.closest('[data-g]');if(b)lb(+b.dataset.g)});
function hours(){var names=['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  $('#hours').innerHTML='<table class="hours">'+(D.hours||[]).map(function(h){var s=String(h.slots||'').trim();return'<tr data-day="'+esc(h.day)+'"><th>'+esc(h.day)+'</th><td>'+(s?s.split(',').map(function(x){return esc(x.trim().replace(/:/g,'h').replace('-',' – '))}).join('<br>'):'Fermé')+'</td></tr>'}).join('')+'</table>';status()}
function now(){return new Date(new Date().toLocaleString('en-US',{timeZone:'Africa/Algiers'}))}
function todaySlots(){var t=now(),names=['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],r=(D.hours||[]).filter(function(h){return h.day===names[t.getDay()]})[0];
  return String(r&&r.slots||'').split(',').map(function(s){var p=s.trim().match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);return p?[+p[1]*60+ +p[2],+p[3]*60+ +p[4]]:null}).filter(Boolean)}
function status(){var t=now(),m=t.getHours()*60+t.getMinutes(),o=false,nx='',names=['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  todaySlots().forEach(function(s){if(m>=s[0]&&m<s[1]){o=true;nx='jusqu’à '+hm(s[1])}else if(!o&&!nx&&m<s[0])nx='ouvre à '+hm(s[0])});
  if((D.info||{}).open===false){o=false;nx='fermeture exceptionnelle'}
  $$('.live-status').forEach(function(e){e.className='pill live-status '+(o?'is-open':'is-closed');e.textContent=(o?'Ouvert maintenant':'Fermé')+(nx?' · '+nx:'')});
  $$('.hours tr').forEach(function(tr){tr.classList.toggle('today',tr.dataset.day===names[t.getDay()])})}
function hm(x){return Math.floor(x/60)+'h'+('0'+x%60).slice(-2)}
function apply(d){D=d||{};var i=D.info||{};
  $$('[data-k]').forEach(function(e){var v=i[e.dataset.k];if(v!=null&&v!=='')e.textContent=v});
  $$('a[data-tel]').forEach(function(a){a.href='tel:'+String(i.phone||'').replace(/[^0-9+]/g,'')});
  var nt=$('#notice');nt.hidden=!i.notice;nt.textContent=i.notice||'';
  [['facebook','#s-fb'],['instagram','#s-ig'],['whatsapp','#s-wa']].forEach(function(p){var a=$(p[1]),v=String(i[p[0]]||'').trim();if(!a)return;a.hidden=!v;if(v)a.href=p[0]==='whatsapp'?'https://wa.me/'+v.replace(/[^0-9]/g,''):v});
  G=[];gal('#gal',D.gallery);
  $('#revs').innerHTML=(D.reviews||[]).map(function(r){return'<blockquote class="rev"><p>« '+esc(r.text)+' »</p><footer><b>'+esc(r.author)+'</b> · '+esc(r.date||'')+' · Avis Google</footer></blockquote>'}).join('');
  menu();hours();bar()}
/* ---------- commande ---------- */
function item(ci,ii){var c=(D.menu||[])[ci];return c&&c.items[ii]?{c:c,it:c.items[ii]}:null}
function find(l){var r=null;(D.menu||[]).forEach(function(c,ci){if(c.name!==l.cat)return;c.items.forEach(function(it,ii){if(!r&&it.name===l.name&&it.hidden!==true)r={c:c,it:it,ci:ci,ii:ii}})});return r}
function unit(l){var x=find(l);if(!x)return null;var p=n(x.it.price);if(l.size&&x.it.sizes){var s=x.it.sizes.filter(function(s){return s.name===l.size})[0];if(s)p=n(s.price)}if(p==null)return null;
  (l.extras||[]).forEach(function(e){var z=(x.c.extras||[]).filter(function(y){return y.name===e})[0];if(z&&n(z.price))p+=n(z.price)});return p}
function total(){var t=0,u=false;cart.forEach(function(l){var p=unit(l);if(p==null)u=true;else t+=p*l.qty});return{t:t,u:u}}
function desc(l){var d=[];if(l.size)d.push(l.size);if(l.extras&&l.extras.length)d.push('+ '+l.extras.join(', '));if(l.note)d.push('« '+l.note+' »');return d}
function sheet(h){var s=$('#od-sheet');s.innerHTML='<button class="od-x" type="button" aria-label="Fermer">×</button>'+h;s.hidden=false;$('#od-ov').hidden=false;document.body.classList.add('lock');$('.od-x',s).onclick=close;return s}
function close(){$('#od-sheet').hidden=true;$('#od-ov').hidden=true;document.body.classList.remove('lock')}
function bar(){var q=cart.reduce(function(a,l){return a+l.qty},0),b=$('#od-bar');b.hidden=!q||!on();$('#od-count').textContent=q;var t=total();$('#od-tot').textContent=da(t.t)+(t.u?' +':'')}
function openItem(ci,ii,edit){var x=item(ci,ii);if(!x)return;var l=edit!=null?cart[edit]:{cat:x.c.name,name:x.it.name,qty:1,extras:[],size:x.it.sizes&&x.it.sizes[0]?x.it.sizes[0].name:''},q=l.qty;
  var h='<p class="kicker">'+esc(x.c.name)+'</p><h3>'+esc(x.it.name)+'</h3><p class="mut">'+esc(x.it.desc||'')+'</p>';
  if(x.it.sizes&&x.it.sizes.length)h+='<fieldset><legend>Taille</legend><div class="chips">'+x.it.sizes.map(function(s){return'<label><input type="radio" name="sz" value="'+esc(s.name)+'"'+(l.size===s.name?' checked':'')+'><span>'+esc(s.name)+' · '+da(n(s.price))+'</span></label>'}).join('')+'</div></fieldset>';
  if((x.c.extras||[]).length)h+='<fieldset><legend>Suppléments</legend><div class="chips">'+x.c.extras.map(function(e){return'<label><input type="checkbox" name="ex" value="'+esc(e.name)+'"'+(l.extras.indexOf(e.name)>-1?' checked':'')+'><span>'+esc(e.name)+' +'+da(n(e.price))+'</span></label>'}).join('')+'</div></fieldset>';
  h+='<fieldset><legend>Remarque <small class="mut">facultatif</small></legend><input type="text" name="nt" maxlength="120" placeholder="Ex. : sans oignon, sauce au choix : algérienne…" value="'+esc(l.note||'')+'"></fieldset>'+
   '<div class="od-foot"><div class="qty"><button type="button" data-q="-1" aria-label="Moins">−</button><output id="q">'+q+'</output><button type="button" data-q="1" aria-label="Plus">+</button></div><button class="btn btn-o" id="add" type="button"></button></div>';
  var s=sheet(h);function cur(){return{cat:l.cat,name:l.name,qty:q,size:(($('input[name=sz]:checked',s)||{}).value)||'',extras:$$('input[name=ex]:checked',s).map(function(i){return i.value}),note:$('input[name=nt]',s).value.trim()}}
  function sum(){var c=cur(),u=unit(c);$('#q').textContent=q;$('#add').textContent=(edit!=null?'Mettre à jour':'Ajouter')+' · '+da(u==null?null:u*q)}
  $$('[data-q]',s).forEach(function(b){b.onclick=function(){q=Math.max(1,Math.min(20,q+ +b.dataset.q));sum()}});$$('input',s).forEach(function(i){i.onchange=sum});sum();
  $('#add').onclick=function(){var c=cur();if(edit!=null)cart[edit]=c;else cart.push(c);save();bar();close()}}
function slots(){var out=['Dès que possible'],t=now(),m=t.getHours()*60+t.getMinutes();todaySlots().forEach(function(s){for(var x=Math.ceil((Math.max(m+30,s[0]+15))/15)*15;x<=s[1]-15;x+=15)out.push('Vers '+hm(x))});
  return out}
function openCart(){var t=total(),me={};try{me=JSON.parse(localStorage.getItem(KEY+'_me'))||{}}catch(e){}
  if(!cart.length){sheet('<h3>Ma commande</h3><p class="mut">Panier vide : touchez « + Ajouter » sur un plat.</p>');return}
  var s=sheet('<h3>Ma commande</h3><ul class="lines">'+cart.map(function(l,i){var u=unit(l);return'<li><div><b>'+l.qty+' × '+esc(l.name)+'</b><small>'+esc(l.cat)+'</small>'+desc(l).map(function(d){return'<small>'+esc(d)+'</small>'}).join('')+'<button type="button" class="od-plus" data-e="'+i+'">Modifier</button> <button type="button" class="od-plus" data-r="'+i+'">Retirer</button></div><b>'+da(u==null?null:u*l.qty)+'</b></li>'}).join('')+'</ul>'+
   '<p class="tot"><span>Total estimé</span><span>'+da(t.t)+'</span></p>'+
   '<form id="of" novalidate><fieldset><legend>Retrait ou livraison</legend><div class="chips"><label><input type="radio" name="mode" value="emporter" checked><span>🥡 À emporter</span></label><label><input type="radio" name="mode" value="livraison"><span>🛵 Livraison</span></label></div></fieldset>'+
   '<label class="od-f" id="ad" hidden>Adresse de livraison<input name="address" maxlength="300" value="'+esc(me.address||'')+'" placeholder="Quartier, rue, repère — Tlemcen"><small class="mut">Zone et frais de livraison confirmés au téléphone.</small></label>'+
   '<label class="od-f">Créneau<select name="slot">'+slots().map(function(x){return'<option>'+esc(x)+'</option>'}).join('')+'</select></label>'+
   '<label class="od-f">Prénom et nom<input name="name" maxlength="80" autocomplete="name" value="'+esc(me.name||'')+'"></label>'+
   '<label class="od-f">Téléphone<input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="05 / 06 / 07 …" value="'+esc(me.phone||'')+'"></label>'+
   '<label class="od-f">Remarque <small class="mut">facultatif</small><textarea name="note" rows="2" maxlength="500"></textarea></label>'+
   '<div class="callnote">📞 <b>El Padré vous appelle pour confirmer votre commande avant de la préparer.</b><br><small>Rien n’est payé en ligne : vous réglez au retrait ou à la livraison.</small></div>'+
   '<p class="err" id="oe" hidden></p><button class="btn btn-o" style="width:100%" type="submit">Envoyer ma commande · '+da(t.t)+'</button></form>');
  $$('[data-r]',s).forEach(function(b){b.onclick=function(){cart.splice(+b.dataset.r,1);save();bar();openCart()}});
  $$('[data-e]',s).forEach(function(b){b.onclick=function(){var i=+b.dataset.e,x=find(cart[i]);if(x)openItem(x.ci,x.ii,i)}});
  var f=$('#of');$$('input[name=mode]',f).forEach(function(r){r.onchange=function(){$('#ad').hidden=f.mode.value!=='livraison'}});f.onsubmit=function(e){e.preventDefault();send(f)}}
function phone(v){v=String(v).replace(/[^0-9+]/g,'');if(v.indexOf('+213')===0)v='0'+v.slice(4);else if(v.indexOf('00213')===0)v='0'+v.slice(5);return/^0[2-7][0-9]{7,8}$/.test(v)?v:null}
function send(f){var e=$('#oe');e.hidden=true;function bad(m,x){e.textContent=m;e.hidden=false;if(x)x.focus()}
  var ph=phone(f.phone.value),nm=f.name.value.trim(),mode=f.mode.value,ad=f.address.value.trim();
  if(mode==='livraison'&&ad.length<5)return bad('Indiquez votre adresse de livraison.',f.address);
  if(nm.length<2)return bad('Indiquez votre nom.',f.name);if(!ph)return bad('Numéro invalide (ex. 0770 12 34 56).',f.phone);
  try{localStorage.setItem(KEY+'_me',JSON.stringify({name:nm,phone:ph,address:ad}))}catch(x){}
  var a='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',ref='';for(var i=0;i<5;i++)ref+=a[Math.floor(Math.random()*a.length)];
  var o={ref:ref,customer_name:nm,phone:ph,fulfillment:mode,address:mode==='livraison'?ad:null,slot:f.slot.value,note:f.note.value.trim()||null,items:cart.map(function(l){return{cat:l.cat,name:l.name,qty:l.qty,size:l.size||null,extras:l.extras||[],note:l.note||null}})};
  var b=$('button[type=submit]',f);b.disabled=true;b.textContent='Envoi…';var tt=total().t,tel=(D.info||{}).phone_display||'';
  fetch(C.SUPABASE_URL+'/rest/v1/orders',{method:'POST',headers:{apikey:C.SUPABASE_ANON_KEY,'Content-Profile':C.SCHEMA,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(o)})
  .then(function(r){if(!r.ok)return r.json().then(function(j){throw new Error(j&&j.code==='P0001'?j.message:'')});
    cart=[];save();bar();window.__lastOrder=ref;
    sheet('<h3>Commande envoyée ✅</h3><div class="callnote">📞 <b>El Padré vous appelle au '+esc(ph)+' pour confirmer avant de préparer.</b></div><p>Commande n° <b>'+ref+'</b> · '+esc(o.slot)+' · '+(mode==='livraison'?'livraison':'à emporter')+' · total estimé '+da(tt)+'</p><p class="mut sm">Pas d’appel d’ici 10 minutes ? Appelez le <a data-tel href="tel:'+esc((D.info||{}).phone||'')+'">'+esc(tel)+'</a>.</p>')})
  .catch(function(x){b.disabled=false;b.textContent='Réessayer';bad((x.message||'Envoi impossible.')+' Vous pouvez aussi commander par téléphone au '+tel+'.')})}
/* ---------- init ---------- */
document.addEventListener('DOMContentLoaded',function(){
  $('#od-bar').onclick=openCart;$('#od-ov').onclick=close;$$('.cta-order').forEach(function(a){a.onclick=function(e){if(cart.length){e.preventDefault();openCart()}}});
  $('#lb .x').onclick=function(){$('#lb').hidden=true};$('#lb .pv').onclick=function(){lb(LI-1)};$('#lb .nx').onclick=function(){lb(LI+1)};
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){close();$('#lb').hidden=true}if(!$('#lb').hidden){if(e.key==='ArrowLeft')lb(LI-1);if(e.key==='ArrowRight')lb(LI+1)}});
  try{apply(JSON.parse($('#seed').textContent))}catch(e){}
  if(C.SUPABASE_URL)fetch(C.SUPABASE_URL+'/rest/v1/site_content?select=data&id=eq.1',{headers:{apikey:C.SUPABASE_ANON_KEY,'Accept-Profile':C.SCHEMA}}).then(function(r){return r.ok?r.json():null}).then(function(j){if(j&&j[0]&&j[0].data)apply(j[0].data)}).catch(function(){});
  setInterval(status,60000);
  var io='IntersectionObserver'in window&&new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.1});
  $$('.reveal').forEach(function(e){io?io.observe(e):e.classList.add('in')});
});
})();
