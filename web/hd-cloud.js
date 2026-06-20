/* 观己·人类图 云端客户端 —— Pocketbase 鉴权 + 命盘记录云同步（离线优先）。
   纯 fetch、无外部依赖。鉴权用 Authorization 头（非 cookie），跨域安全。
   后端：自有子域 cloud-hd.zaiyuxingzhe.com（CNAME→guanji-humandesign-cloud.fly.dev，Pocketbase v0.39）。 */
(function(){
  var BASE = 'https://cloud-hd.zaiyuxingzhe.com'; // 人类图后端(自有子域，已通)
  var AUTH_KEY = 'gc_auth';   // {token, user:{id,email,verified,tier,name}}
  var st = null;
  try { st = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); } catch(e){}

  function persist(){ try{ st ? localStorage.setItem(AUTH_KEY, JSON.stringify(st)) : localStorage.removeItem(AUTH_KEY); }catch(e){} }
  function token(){ return st && st.token; }
  function user(){ return st && st.user; }
  function slim(rec){ return rec ? {id:rec.id, email:rec.email, verified:!!rec.verified, tier:rec.tier||'free', name:rec.name||'', nickname:rec.nickname||'', lang:rec.lang||'', created:rec.created||'', emailOptOut:!!rec.emailOptOut, activeFrom:rec.activeFrom||'', activeTo:rec.activeTo||''} : null; }
  /* 诗意默认昵称：按邮箱确定性哈希取一个雅号(同一邮箱永远同一个、跨设备一致)。
     lang==='en' 取英文雅号池 NICKPOOL_EN，否则中文 NICKPOOL；未加载则返回空、回退邮箱前缀。 */
  function poeticNick(em, lang){ try{ var P=(lang==='en' && window.NICKPOOL_EN && window.NICKPOOL_EN.length) ? window.NICKPOOL_EN : window.NICKPOOL; if(!P||!P.length||!em) return ''; var h=0; for(var i=0;i<em.length;i++){ h=(h*31+em.charCodeAt(i))|0; } return P[Math.abs(h)%P.length]; }catch(e){ return ''; } }
  function setAuth(res){ st = {token:res.token, user:slim(res.record)}; persist(); return st.user; }

  async function req(method, path, body, noAuth){
    var h = {'Content-Type':'application/json'};
    if(!noAuth && token()) h['Authorization'] = token();
    var r;
    try { r = await fetch(BASE + path, {method:method, headers:h, body: body!=null ? JSON.stringify(body) : undefined}); }
    catch(e){ var ne = new Error('网络不可达，请检查网络后重试'); ne.offline = true; throw ne; }
    var j = null; try { j = await r.json(); } catch(e){}
    if(!r.ok){
      var dmsg = j && j.data && Object.keys(j.data).length ? (j.data[Object.keys(j.data)[0]].message) : '';
      var msg = (j && (j.message || dmsg)) || ('HTTP ' + r.status);
      var err = new Error(msg); err.status = r.status; err.data = j; throw err;
    }
    return j;
  }

  var GC = {
    base: BASE,
    loggedIn: function(){ return !!token(); },
    user: user,
    token: token,
    tier: function(){ return (user() && user().tier) || 'free'; },
    verified: function(){ return !!(user() && user().verified); },
    /* 会员有效期：返回 {tier,activeFrom,activeTo,expired,daysLeft}。免费版或未设有效期时 daysLeft=null。
       过期判定与后端 charts_cap 一致（按日期，到期日当天仍有效）；过期后后端按免费档计上限。 */
    membership: function(){
      var u=user()||{}, tier=u.tier||'free', at=u.activeTo||'';
      var r={tier:tier, activeFrom:u.activeFrom||'', activeTo:at, expired:false, daysLeft:null};
      if(tier!=='free' && at){
        try{
          var endStr=String(at).slice(0,10);
          var today=new Date(); var todayStr=today.toISOString().slice(0,10);
          var end=new Date(endStr+'T23:59:59');
          r.daysLeft=Math.ceil((end.getTime()-Date.now())/86400000);
          r.expired=(endStr<todayStr);
        }catch(e){}
      }
      return r;
    },
    /* 生效档位：会员过期则回落 free（与后端 charts_cap 判定一致）。前端显示/解锁一律用它，别直接用 tier()。 */
    effectiveTier: function(){ var m=this.membership(); return m.expired ? 'free' : m.tier; },
    /* 昵称：默认邮箱前缀，可改。存本地(即时) + 尽力同步到后端 users.nickname(字段存在则持久、跨设备) */
    nick: function(){
      var u=user(), em=(u&&u.email)||'', pre=em.split('@')[0]||'';
      var ls=''; try{ ls=localStorage.getItem('gc_nick')||''; }catch(e){}
      return (u&&u.nickname) || ls || poeticNick(em, this.defaultLang()) || pre || (this.defaultLang()==='en'?'Friend':'朋友');
    },
    /* 用户默认语言（昵称语种 + 系统/祝福邮件语言）：本地 gc_lang，尽力同步后端 users.lang。
       未设时取界面语言(EN→en)，再回退中文(zh)。 */
    defaultLang: function(){
      try{ var v=localStorage.getItem('gc_lang'); if(v==='en'||v==='zh') return v; }catch(e){}
      var u=user(); if(u&&u.lang) return u.lang==='en'?'en':'zh';
      try{ if(window.HDI18N && window.HDI18N.lang==='en') return 'en'; }catch(e){}
      return 'zh';
    },
    async setDefaultLang(l){
      l = (l==='en') ? 'en' : 'zh';
      try{ localStorage.setItem('gc_lang', l); }catch(e){}
      if(st&&st.user){ st.user.lang=l; persist(); }
      if(token()&&user()&&user().id){ try{ await req('PATCH','/api/collections/users/records/'+user().id, {lang:l}); }catch(e){} }
      return l;
    },
    async setNickname(n){
      n=String(n||'').trim().slice(0,30);
      try{ localStorage.setItem('gc_nick', n); }catch(e){}
      if(st&&st.user){ st.user.nickname=n; persist(); }
      if(token()&&user()&&user().id){ try{ await req('PATCH','/api/collections/users/records/'+user().id, {nickname:n}); }catch(e){} }
      return n;
    },
    /* 注册至今的天数（账号 created）；未登录或无 created 返回 0 */
    joinDays: function(){
      var u=user(); if(!u||!u.created) return 0;
      try{ var d=new Date(String(u.created).replace(' ','T')); var n=Math.floor((Date.now()-d.getTime())/86400000); return n>=0?n:0; }catch(e){ return 0; }
    },
    /* 系统邮件通知偏好：emailOn()=是否接收(默认 true)；setEmailOn(on) 写后端 emailOptOut=!on */
    emailOn: function(){ var u=user(); return u ? !u.emailOptOut : true; },
    async setEmailOn(on){
      var optOut = !on;
      if(st&&st.user){ st.user.emailOptOut=optOut; persist(); }
      if(token()&&user()&&user().id){ try{ await req('PATCH','/api/collections/users/records/'+user().id, {emailOptOut:optOut}); }catch(e){} }
      return on;
    },

    /* —— 鉴权 —— */
    async register(email, pass, name){
      await req('POST', '/api/collections/users/records',
        {email:email, password:pass, passwordConfirm:pass, name:(name||''), tier:'free', emailVisibility:false}, true);
      this.requestVerify(email);               // 异步发验证邮件，不阻塞登录
      return this.login(email, pass);          // 默认未验证也可登录，验证用于解锁/提示
    },
    async login(email, pass){
      var res = await req('POST', '/api/collections/users/auth-with-password', {identity:email, password:pass}, true);
      return setAuth(res);
    },
    async requestVerify(email){
      try { await req('POST', '/api/collections/users/request-verification', {email:email}, true); } catch(e){}
    },
    /* 邮箱验证码登录（魔法/无密码）：requestOTP → 用户填码 → loginOTP */
    async requestOTP(email){
      var r = await req('POST', '/api/collections/users/request-otp', {email:email}, true);
      return r.otpId;
    },
    async loginOTP(otpId, code){
      var res = await req('POST', '/api/collections/users/auth-with-otp', {otpId:otpId, password:code}, true);
      return setAuth(res);
    },
    async refresh(){      // 刷新 token / 拉取最新 tier·verified
      if(!token()) return null;
      try { var res = await req('POST', '/api/collections/users/auth-refresh', {}); return setAuth(res); }
      catch(e){ if(e.status===401){ this.logout(); } return null; }
    },
    logout(){ st = null; persist(); },

    /* —— 云同步开关（自愿开启）—— */
    syncOn: function(){ try{ return localStorage.getItem('gc_sync')==='1' && this.loggedIn(); }catch(e){ return false; } },
    setSync: function(on){ try{ localStorage.setItem('gc_sync', on?'1':'0'); }catch(e){} },
    FREE_CAP: 2000, _plans: null,
    /* 拉后端档位表 plans(公开只读)：把免费档上限同步到前端显示/软提示，后端改了即时反映、无需发版 */
    async loadPlans(){
      try{
        var r = await req('GET','/api/collections/plans/records?perPage=20', null, true);
        this._plans = r.items || [];
        var free = this._plans.filter(function(p){ return p.tier==='free'; })[0];
        if(free && typeof free.chartCap==='number' && free.chartCap>0) this.FREE_CAP = free.chartCap;
      }catch(e){}
    },

    /* —— 单条上传（按 cid upsert）/ 软删除 —— */
    async _findId(cid){
      var r = await req('GET','/api/collections/charts/records?perPage=1&filter='+encodeURIComponent('cid="'+cid+'"'));
      return r.items && r.items[0] ? r.items[0].id : null;
    },
    async pushChart(rec){
      if(!this.syncOn() || !rec || !rec.id) return;
      var id = await this._findId(rec.id);
      var body = {owner:this.user().id, cid:rec.id, data:rec, cupd:rec.updatedAt||Date.now(), deleted:false};
      if(id) await req('PATCH','/api/collections/charts/records/'+id, body);
      else await req('POST','/api/collections/charts/records', body);
    },
    async softDelete(cid){
      if(!this.syncOn() || !cid) return;
      var id = await this._findId(cid);
      if(id) await req('PATCH','/api/collections/charts/records/'+id, {deleted:true, cupd:Date.now()});
    },
    async cloudCount(){
      if(!this.loggedIn()) return 0;
      var r = await req('GET','/api/collections/charts/records?perPage=1&filter='+encodeURIComponent('owner="'+this.user().id+'" && deleted=false'));
      return r.totalItems||0;
    },
    async pullAll(){
      if(!this.loggedIn()) return [];
      var page=1, out=[], guard=0;
      while(guard++<60){
        var r = await req('GET','/api/collections/charts/records?perPage=200&sort=cupd&page='+page+'&filter='+encodeURIComponent('owner="'+this.user().id+'"'));
        out = out.concat(r.items||[]);
        if(!r.items || r.items.length<200) break; page++;
      }
      return out; // [{cid,data,cupd,deleted}]
    },
    /* 全量对账：拉云端→与本地合并(按时间取新、软删生效)→把本地更新者上传。返回 {merged, pushed, downloaded, removed} */
    async fullSync(localArr){
      if(!this.syncOn()) return null;
      var server={}, srv=await this.pullAll();
      srv.forEach(function(s){ server[s.cid]=s; });
      var localMap={}; (localArr||[]).forEach(function(r){ localMap[r.id]=r; });
      var cids={}; Object.keys(server).forEach(function(c){cids[c]=1;}); (localArr||[]).forEach(function(r){cids[r.id]=1;});
      var merged=[], toPush=[], downloaded=0, removed=0;
      Object.keys(cids).forEach(function(cid){
        var L=localMap[cid], S=server[cid];
        var lt=L?(L.updatedAt||0):-1, stime=S?(S.cupd||0):-1;
        if(S && S.deleted && stime>=lt){ if(L) removed++; return; }      // 云端删除生效
        if(S && (!L || stime>lt)){ var d=S.data||{}; d.id=cid; d.updatedAt=stime; merged.push(d); downloaded++; } // 下载较新
        else if(L){ merged.push(L); if(!S || lt>stime) toPush.push(L); }  // 保留本地；仅本地较新才待上传（人类图无五行式 denormalize 回填）
      });
      return {merged:merged, toPush:toPush, downloaded:downloaded, removed:removed};
    },

    _req: req
  };

  window.GC = GC;
  try{ GC.loadPlans(); }catch(e){}
})();
