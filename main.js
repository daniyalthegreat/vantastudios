(function(){
  var reduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
 
  /* PRELOADER — short branded hold so the page never flashes in half-rendered */
  (function(){
    var loader = document.getElementById('preloader');
    var fill = document.getElementById('preloaderFill');
    if(!loader) return;
    if(reduced){ loader.remove(); return; }
    var pct = 0;
    var iv = setInterval(function(){
      pct += (100 - pct) * 0.12 + 1.2;
      if(pct > 92) pct = 92;
      fill.style.width = pct + '%';
    }, 90);
    function finish(){
      clearInterval(iv);
      fill.style.width = '100%';
      setTimeout(function(){
        loader.classList.add('hidden');
        setTimeout(function(){ loader.remove(); }, 750);
      }, 220);
    }
    var minTimer = setTimeout(finish, 900);
    window.addEventListener('load', function(){ /* let the min-timer own it unless load is later */ });
  })();
 
  var nav = document.getElementById('nav');
  var prog = document.getElementById('progress');
  var heroInner = document.querySelector('.hero-inner');
  var ambientEl = document.querySelector('.ambient');
  var ambientMouseX = 0, ambientMouseY = 0, ambientScrollY = 0;
  function applyAmbientTransform(){
    if(ambientEl) ambientEl.style.transform = 'translate(' + ambientMouseX + 'px,' + (ambientMouseY + ambientScrollY) + 'px)';
  }
  function updateScrollUI(){
    scrollTicking = false;
    nav.classList.toggle('scrolled', window.scrollY > 40);
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var sy = window.scrollY;
    prog.style.width = h > 0 ? (sy / h * 100) + '%' : '0%';
    if(heroInner && !reduced){
      var vh = window.innerHeight;
      var p = Math.min(sy / (vh*0.9), 1);
      heroInner.style.opacity = 1 - p*0.9;
      heroInner.style.transform = 'translateY(' + (p*50) + 'px)';
    }
    if(!reduced){
      ambientScrollY = sy * 0.035;
      applyAmbientTransform();
    }
  }
  var scrollTicking = false;
  function onScroll(){
    if(!scrollTicking){ requestAnimationFrame(updateScrollUI); scrollTicking = true; }
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  updateScrollUI();
 
  /* NAV SCROLL-SPY — slides a pill highlight under the section currently in view.
     Position-based rather than visible-ratio-based: #work and #testimonials are
     very tall pinned scroll-jack sections, so their visible fraction of their own
     height rarely crosses a ratio threshold even while you're fully inside them. */
  (function(){
    var navLinks = document.getElementById('navLinks');
    var pill = document.getElementById('navPill');
    if(!navLinks || !pill) return;
    var links = {};
    navLinks.querySelectorAll('a[data-nav-target]').forEach(function(a){
      links[a.getAttribute('data-nav-target')] = a;
    });
    var targets = Object.keys(links).map(function(id){ return document.getElementById(id); }).filter(Boolean);
    if(!targets.length) return;
 
    function movePill(link){
      if(!link || window.innerWidth <= 860){ pill.style.opacity = 0; return; }
      var lr = link.getBoundingClientRect();
      var cr = navLinks.getBoundingClientRect();
      pill.style.opacity = 1;
      pill.style.width = lr.width + 'px';
      pill.style.transform = 'translateX(' + (lr.left - cr.left) + 'px)';
    }
 
    var current = null;
    function computeActive(){
      var refY = window.innerHeight * 0.35;
      var activeId = null;
      for(var i=0;i<targets.length;i++){
        var r = targets[i].getBoundingClientRect();
        if(r.top <= refY && r.bottom > refY){ activeId = targets[i].id; break; }
      }
      if(!activeId){
        for(var j=targets.length-1;j>=0;j--){
          if(targets[j].getBoundingClientRect().top <= refY){ activeId = targets[j].id; break; }
        }
      }
      if(activeId && links[activeId] && activeId !== current){
        current = activeId;
        movePill(links[activeId]);
      }
    }
 
    var spyTicking = false;
    function onSpyScroll(){
      if(!spyTicking){ requestAnimationFrame(function(){ spyTicking = false; computeActive(); }); spyTicking = true; }
    }
    window.addEventListener('scroll', onSpyScroll, {passive:true});
    window.addEventListener('resize', function(){
      if(current && links[current]) movePill(links[current]); else computeActive();
    });
    computeActive();
  })();
 
  var ham = document.getElementById('hamburger');
  var menu = document.getElementById('mobileMenu');
  var closeX = document.getElementById('closeX');
  function closeMenu(){ menu.classList.remove('open'); ham.classList.remove('open'); }
  ham.addEventListener('click', function(){
    var isOpen = menu.classList.toggle('open');
    ham.classList.toggle('open', isOpen);
  });
  closeX.addEventListener('click', closeMenu);
  menu.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', closeMenu); });
 
  /* FAQ ACCORDION — one open at a time, smooth height transition */
  (function(){
    var items = document.querySelectorAll('.faq-item');
    if(!items.length) return;
    items.forEach(function(item){
      var q = item.querySelector('.faq-q');
      var a = item.querySelector('.faq-a');
      q.addEventListener('click', function(){
        var isOpen = item.classList.contains('open');
        items.forEach(function(other){
          other.classList.remove('open');
          other.querySelector('.faq-a').style.maxHeight = null;
        });
        if(!isOpen){
          item.classList.add('open');
          a.style.maxHeight = a.scrollHeight + 'px';
        }
      });
    });
    var resizeIv = null;
    window.addEventListener('resize', function(){
      clearTimeout(resizeIv);
      resizeIv = setTimeout(function(){
        var openItem = document.querySelector('.faq-item.open .faq-a');
        if(openItem) openItem.style.maxHeight = openItem.scrollHeight + 'px';
      }, 120);
    });
  })();
 
  /* KINETIC TEXT — split headings into masked words for a line-by-line reveal.
     Tag-safe: walks text nodes only, so nested elements (like <br> or an inline
     gradient <span>) are preserved instead of being torn apart by the word split. */
  document.querySelectorAll('.kinetic').forEach(function(el){
    function wrapWords(node){
      Array.prototype.slice.call(node.childNodes).forEach(function(child){
        if(child.nodeType === 3){
          var bits = child.textContent.split(/(\s+)/).filter(function(w){ return w.length; });
          var frag = document.createDocumentFragment();
          bits.forEach(function(w){
            if(/^\s+$/.test(w)){ frag.appendChild(document.createTextNode(w)); return; }
            var mask = document.createElement('span');
            mask.className = 'k-mask';
            var word = document.createElement('span');
            word.className = 'k-word';
            word.textContent = w;
            mask.appendChild(word);
            frag.appendChild(mask);
          });
          node.replaceChild(frag, child);
        } else if(child.nodeType === 1 && child.tagName !== 'BR'){
          wrapWords(child);
        }
      });
    }
    wrapWords(el);
    var words = el.querySelectorAll('.k-word');
    words.forEach(function(w, i){ w.style.transitionDelay = (i*0.05)+'s'; });
  });

  /* REVEAL + KINETIC — one shared observer per element so a heading that is both
     .reveal and .kinetic always gets 'visible' and 'k-visible' together, instead of
     depending on two separate observers with different thresholds firing in sync. */
  var revealEls = document.querySelectorAll('.reveal');
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        e.target.classList.add('visible');
        if(e.target.classList.contains('kinetic')) e.target.classList.add('k-visible');
        io.unobserve(e.target);
      }
    });
  }, {threshold: .12});
  revealEls.forEach(function(el){ io.observe(el); });

  var steps = document.querySelectorAll('.process-step');
  var pio = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        var pline = document.getElementById('processLine');
        if(pline) pline.classList.add('filled');
        steps.forEach(function(s,i){
          setTimeout(function(){ s.classList.add('visible'); }, 250 + i * 140);
        });
        pio.disconnect();
      }
    });
  }, {threshold: .2});
  var ps = document.getElementById('processSteps');
  if(ps) pio.observe(ps);

  /* kinetic headings that are NOT also .reveal (hero-adjacent ones) get their own observer */
  if(!reduced){
    var kio = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ e.target.classList.add('k-visible'); kio.unobserve(e.target); }
      });
    }, {threshold:.3});
    document.querySelectorAll('.kinetic:not(.reveal)').forEach(function(el){ kio.observe(el); });
  } else {
    document.querySelectorAll('.kinetic').forEach(function(el){ el.classList.add('k-visible'); });
  }
 
  /* FULL-PAGE STARFIELD — floating dust/stars drifting behind the whole site */
  (function(){
    var canvas = document.getElementById('starfield');
    if(!canvas) return;
    var ctx = canvas.getContext('2d', { alpha: true });
    var dpr = Math.min(window.devicePixelRatio||1, 1.5);
    var w, h, scrollY = window.scrollY;
    var isSmall = window.innerWidth < 700;
 
    var resizeRaf = null;
    function resize(){
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w*dpr; canvas.height = h*dpr;
      canvas.style.width = w+'px'; canvas.style.height = h+'px';
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    resize();
    window.addEventListener('resize', function(){
      if(resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(resize);
    });
    window.addEventListener('scroll', function(){ scrollY = window.scrollY; }, {passive:true});
 
    var COUNT = Math.round((window.innerWidth*window.innerHeight)/(isSmall?14000:9000));
    COUNT = Math.max(50, Math.min(COUNT, isSmall?90:200));
    var stars = [];
    for(var i=0;i<COUNT;i++){
      var warm = Math.random() < .12;
      var emerald = !warm && Math.random() < .28;
      stars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random()*1.6 + .4,
        depth: Math.random()*0.6 + 0.15,     // parallax factor vs scroll
        driftSpeed: Math.random()*0.05 + 0.01,
        driftPhase: Math.random()*Math.PI*2,
        twinkleSpeed: Math.random()*0.02 + 0.006,
        twinklePhase: Math.random()*Math.PI*2,
        col: warm ? '249,168,124' : (emerald ? '110,231,183' : (Math.random()<.5 ? '167,139,250' : '232,230,240'))
      });
    }
 
    var t = 0;
    var rafId = null;
    var reducedLocal = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
 
    function draw(){
      t += 1;
      ctx.clearRect(0,0,w,h);
      stars.forEach(function(s){
        var driftX = reducedLocal ? 0 : Math.sin(t*s.driftSpeed*0.05 + s.driftPhase)*10;
        var driftY = reducedLocal ? 0 : Math.cos(t*s.driftSpeed*0.04 + s.driftPhase)*8 - t*s.driftSpeed*0.03;
        var py = ((s.y*h + driftY - scrollY*s.depth*0.15) % (h+40) + (h+40)) % (h+40) - 20;
        var px = s.x*w + driftX;
        var twinkle = reducedLocal ? 0.7 : 0.45 + Math.sin(t*s.twinkleSpeed + s.twinklePhase)*0.4;
        ctx.beginPath();
        ctx.fillStyle = 'rgba('+s.col+','+Math.max(0.08,twinkle)+')';
        ctx.arc(px, py, s.size, 0, Math.PI*2);
        ctx.fill();
      });
      rafId = requestAnimationFrame(draw);
    }
    function startLoop(){ if(!rafId) rafId = requestAnimationFrame(draw); }
    function stopLoop(){ if(rafId){ cancelAnimationFrame(rafId); rafId = null; } }
    document.addEventListener('visibilitychange', function(){
      document.hidden ? stopLoop() : startLoop();
    });
    startLoop();
  })();
 
  /* HERO SIGNATURE VISUAL — rotating particle energy ring */
  (function(){
    var canvas = document.getElementById('heroCanvas');
    if(!canvas) return;
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio||1, 1.75);
 
    function resize(){
      var rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width*dpr;
      canvas.height = rect.height*dpr;
      canvas.style.width = rect.width+'px';
      canvas.style.height = rect.height+'px';
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    resize();
    window.addEventListener('resize', resize);
 
    var N = 160;
    var particles = [];
    for(var i=0;i<N;i++){
      particles.push({
        baseAngle: (i/N)*Math.PI*2,
        speed: .00035 + Math.random()*.0005,
        wobbleSeed: Math.random()*Math.PI*2,
        size: Math.random()*1.6 + .6,
        warm: Math.random() < .18,
        emerald: Math.random() < .35
      });
    }
 
    function drawFrame(tick){
      var w = canvas.clientWidth, h = canvas.clientHeight;
      ctx.clearRect(0,0,w,h);
      var cx = w/2, cy = h*0.44;
      var baseR = Math.min(w,h)*0.30;
 
      ctx.strokeStyle = 'rgba(167,139,250,0.10)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, baseR, baseR*0.6, 0, 0, Math.PI*2);
      ctx.stroke();
 
      particles.forEach(function(p){
        var angle = p.baseAngle + tick*p.speed*10;
        var wob = Math.sin(tick*0.012 + p.wobbleSeed)*10;
        var r = baseR + wob + Math.sin(angle*3)*8;
        var x = cx + Math.cos(angle)*r;
        var y = cy + Math.sin(angle)*r*0.6;
        var depth = (Math.sin(angle)+1)/2;
        var alpha = 0.2 + depth*0.7;
        var col = p.warm ? '249,168,124' : (p.emerald ? '110,231,183' : '167,139,250');
        ctx.beginPath();
        ctx.fillStyle = 'rgba('+col+','+alpha+')';
        ctx.shadowColor = 'rgba('+col+',0.9)';
        ctx.shadowBlur = 4 + depth*10;
        ctx.arc(x, y, p.size*(0.6+depth), 0, Math.PI*2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
 
      var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR*0.5);
      grad.addColorStop(0, 'rgba(167,139,250,0.20)');
      grad.addColorStop(1, 'rgba(167,139,250,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, baseR*0.5, 0, Math.PI*2);
      ctx.fill();
    }
 
    var t = 0;
    var heroRafId = null;
    var heroVisible = true;
    function loop(){
      t += 1;
      drawFrame(t);
      if(heroVisible && !document.hidden){ heroRafId = requestAnimationFrame(loop); } else { heroRafId = null; }
    }
    if(reduced){
      drawFrame(0);
    } else {
      loop();
      document.addEventListener('visibilitychange', function(){
        if(!document.hidden && !heroRafId && heroVisible){ loop(); }
      });
      var heroIo = new IntersectionObserver(function(entries){
        entries.forEach(function(en){
          heroVisible = en.isIntersecting;
          if(heroVisible && !heroRafId && !document.hidden){ loop(); }
        });
      }, {threshold: 0});
      heroIo.observe(canvas);
    }
  })();
 
  function tilt(el, strength, lift){
    if(!el || reduced) return;
    strength = strength || 7;
    el.addEventListener('mousemove', function(e){
      var r = el.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - .5;
      var py = (e.clientY - r.top) / r.height - .5;
      el.style.transform = 'rotateY('+(px*strength)+'deg) rotateX('+(py*-strength)+'deg)' + (lift ? ' translateY(-10px)' : '');
    });
    el.addEventListener('mouseleave', function(){ el.style.transform = ''; });
  }
  tilt(document.getElementById('uiMockup'));
  document.querySelectorAll('.portfolio-card').forEach(function(card){ tilt(card, 5, true); });

  /* SPOTLIGHT — service cards track the cursor with a soft glow */
  document.querySelectorAll('.service-card').forEach(function(card){
    card.addEventListener('mousemove', function(e){
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX-r.left)/r.width*100)+'%');
      card.style.setProperty('--my', ((e.clientY-r.top)/r.height*100)+'%');
    });
  });

  /* COUNT-UP — animate numeric stats once they enter view */
  function animateCount(el){
    var raw = el.textContent.trim();
    var match = raw.match(/^([^\d]*)(\d+(?:\.\d+)?)(.*)$/);
    if(!match){ return; }
    var prefix = match[1], target = parseFloat(match[2]), suffix = match[3];
    var isFloat = match[2].indexOf('.') !== -1;
    if(reduced){ return; }
    var dur = 1200, start = null;
    function step(ts){
      if(!start) start = ts;
      var p = Math.min((ts-start)/dur, 1);
      var eased = 1 - Math.pow(1-p, 3);
      var val = target*eased;
      el.textContent = prefix + (isFloat ? val.toFixed(1) : Math.round(val)) + suffix;
      if(p < 1) requestAnimationFrame(step);
      else el.textContent = raw;
    }
    requestAnimationFrame(step);
  }
  var countEls = document.querySelectorAll('.stat b, .strip-item .big');
  var cio = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ animateCount(e.target); cio.unobserve(e.target); }
    });
  }, {threshold:.6});
  countEls.forEach(function(el){ cio.observe(el); });

  /* TEXT SCRAMBLE — nav links resolve from random glyphs on hover */
  var scrambleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&*';
  function scramble(el){
    if(reduced || el.dataset.scrambling) return;
    var original = el.textContent;
    var len = original.length;
    el.dataset.scrambling = '1';
    var frame = 0, maxFrames = 10;
    var iv = setInterval(function(){
      var out = '';
      for(var i=0;i<len;i++){
        if(i < (frame/maxFrames)*len){ out += original[i]; }
        else if(original[i] === ' '){ out += ' '; }
        else { out += scrambleChars[Math.floor(Math.random()*scrambleChars.length)]; }
      }
      el.textContent = out;
      frame++;
      if(frame > maxFrames){ el.textContent = original; clearInterval(iv); delete el.dataset.scrambling; }
    }, 28);
  }
  document.querySelectorAll('.nav-links a:not(.nav-cta)').forEach(function(a){
    a.addEventListener('mouseenter', function(){ scramble(a); });
  });

  /* RIPPLE — contact pills pulse outward from the click point */
  document.querySelectorAll('.contact-pill').forEach(function(pill){
    pill.addEventListener('click', function(e){
      var r = pill.getBoundingClientRect();
      var size = Math.max(r.width, r.height) * 1.6;
      var span = document.createElement('span');
      span.className = 'pill-ripple';
      span.style.width = span.style.height = size+'px';
      span.style.left = (e.clientX - r.left - size/2)+'px';
      span.style.top = (e.clientY - r.top - size/2)+'px';
      pill.appendChild(span);
      setTimeout(function(){ span.remove(); }, 700);
    });
  });
 
  document.querySelectorAll('[data-magnet]').forEach(function(el){
    if(reduced) return;
    el.addEventListener('mousemove', function(e){
      var r = el.getBoundingClientRect();
      var x = (e.clientX - r.left - r.width/2) * .25;
      var y = (e.clientY - r.top - r.height/2) * .35 - 3;
      el.style.transform = 'translate('+x+'px,'+y+'px)';
    });
    el.addEventListener('mouseleave', function(){ el.style.transform = ''; });
  });
 
  if(window.matchMedia('(hover:hover) and (pointer:fine)').matches){
    var dot = document.getElementById('c-dot');
    var ring = document.getElementById('c-ring');
    var mx=0,my=0,rx=0,ry=0;
    var ringRafId = null;
    function ringLoop(){
      rx += (mx-rx)*.15; ry += (my-ry)*.15;
      ring.style.left = rx+'px'; ring.style.top = ry+'px';
      if(Math.abs(mx-rx) > 0.4 || Math.abs(my-ry) > 0.4){
        ringRafId = requestAnimationFrame(ringLoop);
      } else {
        ringRafId = null;
      }
    }
    window.addEventListener('mousemove', function(e){
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx+'px'; dot.style.top = my+'px';
      if(!ringRafId){ ringRafId = requestAnimationFrame(ringLoop); }
    });
    document.querySelectorAll('a, button, [data-magnet]').forEach(function(el){
      el.addEventListener('mouseenter', function(){ ring.classList.add('hovering'); });
      el.addEventListener('mouseleave', function(){ ring.classList.remove('hovering'); });
    });
  }
 
  var hero = document.getElementById('home');
  if(hero && ambientEl && !reduced){
    hero.addEventListener('mousemove', function(e){
      ambientMouseX = (e.clientX/window.innerWidth - .5)*18;
      ambientMouseY = (e.clientY/window.innerHeight - .5)*18;
      applyAmbientTransform();
    });
    hero.addEventListener('mouseleave', function(){
      ambientMouseX = 0; ambientMouseY = 0;
      applyAmbientTransform();
    });
  }

  /* TESTIMONIALS 3D SCROLL-JACK — pins the section full-screen and converts
     vertical scroll into horizontal motion through a coverflow of cards,
     then releases back to normal vertical scrolling once the cards end. */
  (function(){
    var wrap = document.getElementById('t3dWrap');
    var track = document.getElementById('t3dTrack');
    var progFill = document.getElementById('t3dProgFill');
    if(!wrap || !track) return;

    var isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    if(isTouch || reduced){
      wrap.classList.add('t3d-static');
      return;
    }

    var cards = Array.prototype.slice.call(track.querySelectorAll('.t3d-card'));
    var cardData = [];
    var extra = 0;

    function measure(){
      track.style.transform = 'translateX(0px)';
      var trackWidth = track.scrollWidth;
      extra = Math.max(trackWidth - window.innerWidth, 0);
      wrap.style.height = (window.innerHeight + extra) + 'px';
      cardData = cards.map(function(c){
        return { el: c, left: c.offsetLeft, width: c.offsetWidth };
      });
      update();
    }

    var ticking = false;
    function update(){
      ticking = false;
      var rect = wrap.getBoundingClientRect();
      var scrolled = -rect.top;
      var progress = extra > 0 ? Math.min(Math.max(scrolled / extra, 0), 1) : 0;
      var tx = -progress * extra;
      track.style.transform = 'translateX(' + tx + 'px)';
      if(progFill) progFill.style.width = (progress * 100) + '%';

      var vw = window.innerWidth;
      var center = vw / 2;
      cardData.forEach(function(d){
        var cardCenter = d.left + d.width / 2 + tx;
        var delta = cardCenter - center;
        var norm = Math.max(-1, Math.min(1, delta / (vw * 0.55)));
        var scale = 1 - Math.abs(norm) * 0.18;
        var rotY = norm * -22;
        var tz = -Math.abs(norm) * 140;
        var op = Math.max(1 - Math.abs(norm) * 0.6, 0.22);
        d.el.style.transform = 'rotateY(' + rotY + 'deg) translateZ(' + tz + 'px) scale(' + scale + ')';
        d.el.style.opacity = op;
        d.el.classList.toggle('is-centered', Math.abs(norm) < 0.12);
      });
    }
    function onScroll(){
      if(!ticking){ requestAnimationFrame(update); ticking = true; }
    }
    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', measure);
    measure();
  })();

  /* PORTFOLIO SPHERE — a single featured card blooms into a spinning 3D
     sphere of cards, rotates to its exact antipode, then expands and
     vanishes to reveal the full case-study grid. */
  (function(){
    var wrap = document.getElementById('pf3dWrap');
    var heroCard = document.getElementById('pf3dHeroCard');
    var sphere = document.getElementById('pf3dSphere');
    var ofMany = document.getElementById('pf3dOfMany');
    var progFill = document.getElementById('pf3dProgFill');
    if(!wrap || !sphere || !heroCard) return;

    function map(v,a,b,c,d){ return c + (v-a)/(b-a)*(d-c); }
    function clamp01(v){ return Math.max(0, Math.min(1, v)); }

    var isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    if(isTouch || reduced){
      wrap.classList.add('pf3d-static');
      heroCard.style.opacity = 1;
      if(ofMany){ ofMany.style.opacity = 1; ofMany.style.transform = 'none'; }
      return;
    }

    var R = 210;
    var realCards = [
      { src:'pizzax.PNG', label:'PizzaX — Restaurant' },
      { src:'pulsefit.PNG', label:'PulseFit — Fitness' },
      { src:'pets-paw.PNG', label:'PetPaws — Veterinary' }
    ];
    var nodesData = [];
    nodesData.push({ x:0, y:0, z:R, real: realCards[0] });   // front: same card as the hero
    nodesData.push({ x:0, y:0, z:-R, real: realCards[1] });  // exact antipode
    nodesData.push({ x:R, y:0, z:0, real: realCards[2] });   // third real project, on the equator

    var placeholderCount = 15;
    var offset = 2 / placeholderCount;
    var increment = Math.PI * (3 - Math.sqrt(5));
    for(var i=0;i<placeholderCount;i++){
      var yv = ((i*offset) - 1) + (offset/2);
      var rad = Math.sqrt(Math.max(0, 1 - yv*yv));
      var phi = i * increment;
      var xv = Math.cos(phi) * rad;
      var zv = Math.sin(phi) * rad;
      if(Math.abs(zv) > 0.9 || (Math.abs(xv) > 0.9 && Math.abs(yv) < 0.1)) continue;
      nodesData.push({ x: xv*R, y: yv*R, z: zv*R, real: null });
    }

    var nodeEls = nodesData.map(function(d){
      var el = document.createElement('div');
      el.className = 'sphere-node' + (d.real ? '' : ' placeholder');
      el.innerHTML = d.real
        ? '<img src="'+d.real.src+'" alt="" loading="lazy" decoding="async"><span class="sn-label">'+d.real.label+'</span>'
        : '<i class="fa-solid fa-image"></i>';
      sphere.appendChild(el);
      return { el: el, x: d.x, y: d.y, z: d.z };
    });

    var scrollRange = 0;
    function measure(){
      scrollRange = wrap.offsetHeight - window.innerHeight;
    }
    measure();
    window.addEventListener('resize', measure);

    var ticking = false;
    function render(){
      ticking = false;
      var rect = wrap.getBoundingClientRect();
      var scrolled = -rect.top;
      var p = scrollRange > 0 ? clamp01(scrolled / scrollRange) : 0;
      if(progFill) progFill.style.width = (p*100) + '%';

      var heroP = clamp01(map(p, 0, 0.14, 1, 0));
      heroCard.style.opacity = heroP;
      heroCard.style.transform = 'translate(-50%,-50%) scale(' + (0.4 + heroP*0.6) + ')';
      heroCard.style.pointerEvents = heroP > 0.5 ? 'auto' : 'none';

      var sphereInP = clamp01(map(p, 0.10, 0.30, 0, 1));
      var ofManyP = clamp01(map(p, 0.12, 0.24, 0, 1));
      if(ofMany){ ofMany.style.opacity = ofManyP; ofMany.style.transform = 'translateX(' + (10 - 10*ofManyP) + 'px)'; }

      var theta = clamp01(map(p, 0.30, 0.78, 0, 1)) * Math.PI;
      var expandP = clamp01(map(p, 0.80, 1.0, 0, 1));
      var expandScale = 1 + expandP*4.5;
      var expandFade = 1 - expandP;

      var cosT = Math.cos(theta), sinT = Math.sin(theta);
      nodeEls.forEach(function(n){
        var rx = n.x*cosT + n.z*sinT;
        var rz = -n.x*sinT + n.z*cosT;
        var depth = (rz + R) / (2*R);
        var scale = (0.55 + depth*0.65) * sphereInP * expandScale;
        n.el.style.transform = 'translate3d(' + rx + 'px,' + n.y + 'px,' + rz + 'px) scale(' + scale + ')';
        n.el.style.opacity = Math.max(0.15, depth) * sphereInP * expandFade;
        n.el.style.zIndex = Math.round(rz + 1000);
      });
    }
    function onScroll(){
      if(!ticking){ requestAnimationFrame(render); ticking = true; }
    }
    window.addEventListener('scroll', onScroll, {passive:true});
    render();
  })();
})();
