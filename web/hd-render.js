/* hd-render.js — 共享渲染器（window.HDRender）。实时页/报告页/嵌入复用一套。
   布局严格对标 HumanDesignApp 标准 Bodygraph：先画直线通道，再把能量中心盖在上层，
   线从中心边缘穿出；闸门=中心内编号槽位；红=设计(潜意识)、黑=个性(意识)、红黑相间=两者皆有。 */
(function () {
  // 画布 460×665（参考截图 1:2 量取）。中心形状
  const CENTERS = {
    Head:{shape:'poly',pts:'230,37 196,110 264,110',zh:'头脑'},
    Ajna:{shape:'poly',pts:'198,128 262,128 230,195',zh:'逻辑'},
    Throat:{shape:'rect',x:199,y:215,w:62,h:62,zh:'喉咙'},
    G:{shape:'poly',pts:'230,317 268,357 230,397 192,357',zh:'G'},
    Heart:{shape:'poly',pts:'307,386 350,427 265,427',zh:'意志'},
    Spleen:{shape:'poly',pts:'56,445 120,487 56,530',zh:'直觉'},
    SolarPlexus:{shape:'poly',pts:'404,445 404,530 340,487',zh:'情绪'},
    Sacral:{shape:'rect',x:199,y:492,w:62,h:62,zh:'荐骨'},
    Root:{shape:'rect',x:199,y:581,w:62,h:62,zh:'根'},
  };
  // 已定义中心填色（对标参考图配色族：黄=喉、金=头/G、红=意志/荐骨、琥珀=其余）
  const CFILL = {Head:'#E9C46A',Ajna:'#C9803A',Throat:'#EFD75C',G:'#E9C46A',Heart:'#C03B2D',
    Spleen:'#C9803A',SolarPlexus:'#C9803A',Sacral:'#C03B2D',Root:'#C9803A'};
  const CDARK = {Head:1,Throat:1,G:1};           // 浅底中心：未激活闸门用深字
  // 闸门槽位（与参考图逐门对位；竖直通道两端 x 对齐）
  const GXY = {
    64:[215,104],61:[229,104],63:[243,104],
    47:[215,133],24:[229,133],4:[243,133],17:[215,149],11:[243,149],43:[229,181],
    62:[215,222],23:[229,222],56:[243,222],16:[204,235],35:[256,235],20:[204,257],12:[256,257],
    31:[215,272],8:[229,272],33:[243,272],45:[256,271],
    1:[229,325],7:[215,342],13:[243,342],10:[198,357],25:[262,357],15:[215,374],46:[243,374],2:[229,389],
    21:[306,395],51:[291,410],26:[279,421],40:[322,421],
    48:[66,457],57:[78,466],44:[94,476],50:[107,487],32:[92,497],28:[78,506],18:[66,516],
    36:[394,457],22:[382,466],37:[366,476],6:[352,487],49:[368,497],55:[382,506],30:[394,515],
    5:[215,498],14:[229,498],29:[243,498],34:[204,512],27:[204,528],59:[255,530],42:[215,548],3:[229,548],9:[243,548],
    53:[215,588],60:[229,588],52:[243,588],54:[204,602],19:[255,602],38:[204,621],39:[255,621],58:[204,638],41:[255,638],
  };
  const CH = [[1,8],[2,14],[3,60],[4,63],[5,15],[6,59],[7,31],[9,52],[10,20],[10,34],[10,57],[11,56],[12,22],[13,33],[16,48],[17,62],[18,58],[19,49],[20,34],[20,57],[21,45],[23,43],[24,61],[25,51],[26,44],[27,50],[28,38],[29,46],[30,41],[32,54],[34,57],[35,36],[37,40],[39,55],[42,53],[47,64]];
  const SIGNS = ['白羊','金牛','双子','巨蟹','狮子','处女','天秤','天蝎','射手','摩羯','水瓶','双鱼'];

  const SVGNS = 'http://www.w3.org/2000/svg';
  const el = (n,a)=>{const e=document.createElementNS(SVGNS,n);for(const k in a)e.setAttribute(k,a[k]);return e;};
  const SIGNS_EN = ['Ari','Tau','Gem','Can','Leo','Vir','Lib','Sco','Sag','Cap','Aqu','Pis'];
  const isEN = ()=>window.HDI18N && window.HDI18N.lang==='en';
  const deg = l=>(isEN()?SIGNS_EN[Math.floor(l/30)]+' ':SIGNS[Math.floor(l/30)])+Math.floor(l%30)+'°';
  const INK='var(--inkline)', RED='var(--cinnabar)', BASE='#EFE7D8';

  function bodygraph(svg, c){
    svg.innerHTML='';
    svg.appendChild(el('image',{href:'/web/logo.svg',x:418,y:8,width:30,height:30,opacity:0.9}));   // 绝对路径：多语言前缀页(/cn/web/…)下相对 logo.svg 会解析到 /cn/web/ 而 404
    const pSet=new Set(c.personality.map(a=>a.gate));
    const dSet=new Set(c.design.map(a=>a.gate));
    const defined=new Set(c.definedCenters);
    const src=g=>{const p=pSet.has(g),d=dSet.has(g);return p&&d?'both':p?'per':d?'des':null;};
    // 整合区＝三通水路（对标 Jovian 经典图）：干线 20↔57 一根管，干线上两个三通——
    // teeA(141,361) 接 10、teeB(100,429) 接 34；六条逻辑通道(10/20/34/57 两两)都沿
    // 这棵树走线，彩色半段按各自路径长度取半，物理底带只画 干线+两支线 三段。
    const TEE_A=[141,361], TEE_B=[100,429];
    const ROUTES={
      '10-20':[GXY[10],TEE_A,GXY[20]],
      '10-34':[GXY[10],TEE_A,TEE_B,GXY[34]],
      '10-57':[GXY[10],TEE_A,GXY[57]],
      '20-34':[GXY[20],TEE_B,GXY[34]],
      '34-57':[GXY[34],TEE_B,GXY[57]],
    };
    const INTEG=new Set(['10-20','10-34','10-57','20-34','20-57','34-57']);
    const cpts=(a,b)=>ROUTES[a+'-'+b]||[GXY[a],GXY[b]];
    const plen=P=>{let L=0;for(let i=1;i<P.length;i++)L+=Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]);return L;};
    const cutAt=(P,len)=>{const out=[P[0]];let acc=0;for(let i=1;i<P.length;i++){const d=Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]);if(acc+d>=len){const t=(len-acc)/d;out.push([P[i-1][0]+(P[i][0]-P[i-1][0])*t,P[i-1][1]+(P[i][1]-P[i-1][1])*t]);return out;}acc+=d;out.push(P[i]);}return out;};
    const stroke=(P,color,w,dash,butt)=>{const a={d:'M'+P.map(p=>p[0]+' '+p[1]).join(' L'),fill:'none',stroke:color,'stroke-width':w,'stroke-linecap':butt?'butt':'round','stroke-linejoin':'round'};if(dash)a['stroke-dasharray']=dash;svg.appendChild(el('path',a));};

    // ① 通道底层：白带浮在底上（逐条 描边+白芯，交叉处后画的整带盖前带），
    //    再把彩色半段统一叠最上层（按走线长度取半，红黑相间=红实线+墨虚线叠加，平头端帽）
    for(const [a,b] of CH){ if(INTEG.has(a+'-'+b)) continue; const P=cpts(a,b); stroke(P,'#E0D4BE',9); stroke(P,'#FFFFFF',6.4); }
    // 整合树底带：物理只有三段＝干线 20↔57 + 三通支线→10 + 三通支线→34
    const TREE=[[GXY[20],GXY[57]],[TEE_A,GXY[10]],[TEE_B,GXY[34]]];
    for(const P of TREE) stroke(P,'#E0D4BE',9);
    for(const P of TREE) stroke(P,'#FFFFFF',6.4);
    for(const [a,b] of CH){
      const P=cpts(a,b), H=plen(P)/2;
      const half=(Q,s)=>{ if(!s)return;
        if(s==='per') stroke(Q,INK,6.4,null,1);
        else if(s==='des') stroke(Q,RED,6.4,null,1);
        else { stroke(Q,RED,6.4,null,1); stroke(Q,INK,6.4,'4 4',1); } };
      half(cutAt(P,H),src(a)); half(cutAt([...P].reverse(),H),src(b));
    }
    // ② 中心盖在通道之上（参考图画法：线被中心形状裁住，从边缘穿出）
    for(const [key,ct] of Object.entries(CENTERS)){
      const on=defined.has(key);
      const attr={fill:on?CFILL[key]:'#fff',stroke:on?'rgba(60,38,8,.25)':'#D8CFC0','stroke-width':1.4,class:'center-hit','data-center':key};
      svg.appendChild(ct.shape==='rect'?el('rect',{...attr,x:ct.x,y:ct.y,width:ct.w,height:ct.h,rx:6}):el('polygon',{...attr,points:ct.pts}));
    }
    // ③ 闸门编号：激活的画圆盘（墨=个性 / 朱=设计 / 墨盘朱环=两者），未激活仅编号
    const inCenter=(x,y)=>{for(const [k,ct] of Object.entries(CENTERS)){if(ct.shape==='rect'){if(x>=ct.x&&x<=ct.x+ct.w&&y>=ct.y&&y<=ct.y+ct.h)return k;}else{const p=ct.pts.split(' ').map(s=>s.split(',').map(Number));const [A,B,C]=p;const s1=(B[0]-A[0])*(y-A[1])-(B[1]-A[1])*(x-A[0]),s2=(C[0]-B[0])*(y-B[1])-(C[1]-B[1])*(x-B[0]),s3=(A[0]-C[0])*(y-C[1])-(A[1]-C[1])*(x-C[0]);if((s1>=0&&s2>=0&&s3>=0)||(s1<=0&&s2<=0&&s3<=0))return k;}}return null;};
    for(const g in GXY){
      const [x,y]=GXY[g],s=src(+g),ck=inCenter(x,y),on=ck&&defined.has(ck);
      if(s){
        svg.appendChild(el('circle',{cx:x,cy:y,r:5.8,fill:s==='des'?RED:INK,stroke:s==='both'?RED:'rgba(255,255,255,.9)','stroke-width':s==='both'?1.6:0.9}));
        const t=el('text',{x,y:y+0.5,'text-anchor':'middle','dominant-baseline':'middle','font-size':7.2,fill:'#fff','font-weight':700});t.textContent=g;svg.appendChild(t);
      }else{
        const fillc = on ? (CDARK[ck]?'#7A5A1E':'rgba(255,255,255,.92)') : '#A89C86';
        const t=el('text',{x,y:y+0.5,'text-anchor':'middle','dominant-baseline':'middle','font-size':7.8,fill:fillc,'font-weight':600});t.textContent=g;svg.appendChild(t);
      }
      // 透明命中区（盖在最上层，触控友好）：消费方监听 svg 委托点击 [data-gate] 弹解释
      svg.appendChild(el('circle',{cx:x,cy:y,r:11,fill:'transparent',class:'gate-hit','data-gate':g}));
    }
    // ④ PHS 四箭头（顶行=个性：心智/视角；底行=设计：消化/环境）——实心箭头，左右同形镜像
    if(c.phs){
      const arr=(x,y,o,key)=>{const s=o==='Left'?-1:1;
        const d=`M${x-s*9} ${y-2} L${x+s*1} ${y-2} L${x+s*1} ${y-5.5} L${x+s*9} ${y} L${x+s*1} ${y+5.5} L${x+s*1} ${y+2} L${x-s*9} ${y+2} Z`;
        svg.appendChild(el('path',{d,fill:'var(--li)'}));
        svg.appendChild(el('rect',{x:x-13,y:y-9,width:26,height:18,fill:'transparent',class:'phs-hit','data-phs':key}));};  // 透明命中区，点击弹 PHS 解释
      arr(202,18,c.phs.arrows.awareness,'awareness'); arr(258,18,c.phs.arrows.perspective,'perspective');
      arr(202,34,c.phs.arrows.digestion,'digestion'); arr(258,34,c.phs.arrows.environment,'environment');
    }
  }

  const TEMPLATE = `
    <div class="summary"></div>
    <div class="stage">
      <div class="graph">
        <svg class="bodygraph" viewBox="0 0 460 665" aria-label="bodygraph"></svg>
        <div class="legend">
          <span><span class="dot" style="background:var(--inkline)"></span>个性·墨(意识)</span>
          <span><span class="dot" style="background:var(--cinnabar)"></span>设计·朱(潜意识)</span>
          <span><span class="dot" style="background:repeating-linear-gradient(90deg,var(--inkline) 0 3px,var(--cinnabar) 3px 6px)"></span>两者皆有</span>
        </div>
      </div>
      <div class="cols">
        <div class="ctbbar"><button type="button" class="ctb-all"></button></div>
        <div class="pcol des"><h4>设计 ⊙</h4></div>
        <div class="pcol per"><h4>个性 ⊙</h4></div>
      </div>
    </div>
    <div class="sec"><h3>已定义通道</h3><div class="chips channels"></div></div>
    <div class="sec"><h3>Incarnation Cross</h3><div class="muted cross"></div></div>
    <div class="sec"><h3>Variables · PHS</h3><div class="vtable"></div></div>
    <div class="interp"></div>`;

  // 把完整结果渲染进 root；linkKB=true 时类型/权威等可点进知识库
  function fill(root, c, opts){
    opts = opts || {};
    root.innerHTML = TEMPLATE;
    const q = s=>root.querySelector(s);
    const S=q('.summary');
    const link=(cat,key,txt)=> opts.linkKB ? `<a class="kbl" href="learn.html#${cat}:${encodeURIComponent(key)}">${txt}</a>` : txt;
    const cards=[
      // EN 模式：主=英文术语、副=中文(豁免翻译)；中文模式：主=中文、副=英文
      // 六张卡全部深链知识库：策略/签名指到所属类型词条，权威/定义有独立词条
      ['类型', link('type',c.type, isEN()?c.type:c.typeZh), isEN()?'':c.type],
      ['策略',link('type',c.type,c.strategy),''],
      ['内在权威',link('authority',c.authority,c.authorityZh.split('（')[0]),''],
      ['人生角色',link('profile',c.profile.str,c.profile.str),c.profile.zh],
      ['定义',link('definition',c.definition,c.definitionZh),''],
      ['签名/非己',link('type',c.type,c.signature+' / '+c.notSelf),''],
    ];
    S.innerHTML = cards.map(([k,v,vs])=>`<div class="card"><div class="k">${k}</div><div class="v">${v}</div>${vs?`<div class="vs">${vs}</div>`:''}</div>`).join('');
    bodygraph(q('svg.bodygraph'), c);
    // 行星行可点击展开：完整 Rave 记法 Gate.Line.Color.Tone.Base（引擎逐层细分黄经计算，
    // 已经 Mumbai 案例 PHS 五项与商业工具交叉验证）；四大变量行附 PHS 语义
    const subLine=(a,layer)=>{
      let s=`${a.gate}.${a.line}.${a.color}.${a.tone}.${a.base} — Color ${a.color} · Tone ${a.tone} · Base ${a.base}`;
      const T=c.phs&&c.phs.types, P=c.phs;
      if(T&&P){
        const zh=t=>isEN()?'':' '+t.zh;
        const bz=t=>t.baseZh&&!isEN()?' '+t.baseZh:'';
        if(layer==='des'&&a.planet==='Sun') s+=`<br>Determination: ${P.determination}${bz(T.determination)} → <b>${T.determination.en}${zh(T.determination)}</b> · Cognition: ${P.cognition}`;
        if(layer==='per'&&a.planet==='Sun') s+=`<br>Motivation: ${P.motivation}${bz(T.motivation)} → <b>${T.motivation.en}${zh(T.motivation)}</b>`;
        if(layer==='des'&&a.planet==='NorthNode') s+=`<br>Environment: ${P.environment}${bz(T.environment)} → <b>${T.environment.en}${zh(T.environment)}</b>`;
        if(layer==='per'&&a.planet==='NorthNode') s+=`<br>View: ${P.view}${bz(T.view)} → <b>${T.view.en}${zh(T.view)}</b>`;
      }
      return s;
    };
    const rows=(arr,layer)=>arr.map(a=>`<div class="prow ${layer==='des'?'dz':'pz'}" style="cursor:pointer" title="Color/Tone/Base"><span class="g">${a.glyph}</span><span class="gl">${a.gate}.${a.line}</span><span class="deg">${deg(a.lon)}</span></div><div class="prow-sub" hidden data-noi18n>${subLine(a,layer)}</div>`).join('');
    q('.pcol.des').insertAdjacentHTML('beforeend', rows(c.design,'des'));
    q('.pcol.per').insertAdjacentHTML('beforeend', rows(c.personality,'per'));
    for(const col of [q('.pcol.des'),q('.pcol.per')]) col.addEventListener('click',e=>{
      const r=e.target.closest('.prow'); if(!r)return;
      const s=r.nextElementSibling; if(s&&s.classList.contains('prow-sub')) s.hidden=!s.hidden;
    });
    // 一键展开/收起所有行的 Color/Tone/Base（逐行点击仍可用）
    const allBtn=q('.ctb-all');
    const setAllLabel=open=>{allBtn.textContent=open?(isEN()?'▴ Hide all Color/Tone/Base':'▴ 收起全部 Color/Tone/Base'):(isEN()?'▾ Show all Color/Tone/Base':'▾ 展开全部 Color/Tone/Base');};
    setAllLabel(false);
    allBtn.onclick=()=>{const subs=[...root.querySelectorAll('.prow-sub')];const open=subs.some(s=>s.hidden);subs.forEach(s=>s.hidden=!open);allBtn.classList.toggle('on',open);setAllLabel(open);};
    // 实心箭头（与盘面同形，镜像统一）
    const ar = o => {const s=o==='Left'?-1:1,x=11,y=6;
      return `<svg width="22" height="12" viewBox="0 0 22 12" style="vertical-align:middle"><path d="M${x-s*9} ${y-2} L${x+s*1} ${y-2} L${x+s*1} ${y-5.5} L${x+s*9} ${y} L${x+s*1} ${y+5.5} L${x+s*1} ${y+2} L${x-s*9} ${y+2} Z" fill="currentColor"/></svg>`;};
    if (c.phs && c.variables) {
      const V = c.variables, P = c.phs, T = P.types || {};
      const ctb = v => `C${v.color} · T${v.tone} · B${v.base}`;
      const fmt = (t, base) => t ? (isEN() ? `<b>${t.en}</b> (${base})` : `<b>${t.en} ${t.zh}</b>（${base}${t.baseZh ? ' ' + t.baseZh : ''}）`) : base;
      const rows = [
        { sys: 'Digestion',   src: '设计 ☉', v: V.digestion,   main: 'Determination', val: fmt(T.determination, P.determination), sub: 'Cognition: ' + P.cognition },
        { sys: 'Awareness',   src: '个性 ☉', v: V.awareness,   main: 'Motivation',    val: fmt(T.motivation, P.motivation),       sub: T.motivation && T.motivation.side ? isEN() ? T.motivation.side.en : T.motivation.side.en + ' ' + T.motivation.side.zh : '' },
        { sys: 'Environment', src: '设计 ☊', v: V.environment, main: 'Environment',   val: fmt(T.environment, P.environment),     sub: '' },
        { sys: 'Perspective', src: '个性 ☊', v: V.perspective, main: 'View',          val: fmt(T.view, P.view),                   sub: T.view && T.view.side ? isEN() ? T.view.side.en : T.view.side.en + ' ' + T.view.side.zh : '' },
      ];
      q('.vtable').innerHTML = rows.map(r => `
        <div class="vrow">
          <div class="varrow ${r.v.orientation === 'Left' ? 'l' : 'r'}">${ar(r.v.orientation)}</div>
          <div class="vmain"><div class="vsys">${r.sys} <span class="vsrc">${r.src}</span></div>
            <div class="vval"><b>${r.main}:</b> ${r.val}${r.sub ? ` · ${r.sub}` : ''}</div></div>
          <div class="vctb">${ctb(r.v)}</div>
        </div>`).join('');
    }
    q('.chips.channels').innerHTML = c.definedChannels.length
      ? c.definedChannels.map(x=>`<span class="chip"><b>${x.key}</b> ${isEN()?(x.en||x.zh):x.zh}</span>`).join('')
      : `<span class="muted">${isEN()?'None (Reflector / fully open)':'无（反映者 / 全开放）'}</span>`;
    q('.cross').innerHTML = `<b>${c.incarnationCross.name || c.incarnationCross.notation}</b>${c.incarnationCross.zhName && !isEN() ? `<span data-noi18n> · ${c.incarnationCross.zhName}</span>` : ''}<br>${c.incarnationCross.gates[0]}/${c.incarnationCross.gates[1]} | ${c.incarnationCross.gates[2]}/${c.incarnationCross.gates[3]} · ${isEN()?(c.incarnationCross.angle||''):c.incarnationCross.angleZh}`;
  }

  window.HDRender = { CENTERS, GXY, CH, bodygraph, fill, deg };
})();
