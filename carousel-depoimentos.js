/* ════════════════════════════════════════════════════════════════
   CARROSSEL DE DEPOIMENTOS — Barbearia Hebreus (home do site institucional)
   v4 — o movimento contínuo agora é dirigido por animação CSS
   (@keyframes), não por JavaScript escrevendo transform a cada
   quadro. Esse era o motivo da travada que persistia mesmo depois de
   translate3d, backface-visibility e redução do trabalho por quadro:
   um loop em requestAnimationFrame amarra a suavidade do movimento à
   thread principal do navegador estar sempre livre no instante exato
   de cada quadro — e no celular real (ao contrário de um servidor de
   teste rápido) qualquer outra coisa acontecendo nessa mesma thread
   (coleta de lixo, decodificação de imagem, o próprio toque sendo
   processado) causa engasgo visível. Animação CSS roda na thread de
   composição (GPU), imune a isso.

   O JavaScript só assume o controle direto do transform em dois
   momentos, ambos curtos:
     • durante um arraste (o dedo dita a posição, quadro a quadro,
       mas só enquanto o dedo está na tela — não para sempre);
     • durante o salto ao clicar numa bolinha — e mesmo esse salto
       agora usa uma TRANSIÇÃO CSS (também na GPU), não um tween
       calculado a mão.
   Fora desses dois momentos, quem move o carrossel é o navegador.

   Entrega:
     • esteira sempre em movimento, velocidade constante, sem pausa
       entre um depoimento e outro (mobile e desktop) — item 2.1,
       agora dirigido por CSS para ficar realmente fluido;
     • loop infinito, sem "salto" visível ao voltar ao início;
     • no toque, arrastar move a esteira acompanhando o dedo; o
       movimento automático PARA assim que o dedo encosta e volta a
       rodar pouco depois de soltar, exatamente de onde parou —
       item 2.2;
     • bolinhas (dots) de paginação — clicar leva até o depoimento
       escolhido com uma transição suave e retoma o movimento contínuo
       a partir dali.

   Por que não há conflito com o script.js:
   o initResponsiveCarousel() só assume o bloco se encontrar os botões
   .carousel-btn-prev / .carousel-btn-next. Como as setas foram
   removidas do HTML, aquela função sai logo na primeira verificação e
   deixa o bloco livre para este módulo.

   Arquivo isolado: removendo a tag <script> do index.html, o carrossel
   volta a ser uma grade estática de cards — nada mais quebra.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var NOME_KEYFRAME = 'hebreusCarrosselLoop';

  /* ─── CONFIGURAÇÃO ─── */
  var CONFIG = {
    // Tempo médio (segundos) para 1 card atravessar a tela. Controla a
    // velocidade do movimento contínuo — quanto menor, mais rápido.
    // Recalculada por breakpoint (1, 2 ou 3 cards por tela), então o
    // "ritmo" de leitura fica parecido em qualquer tamanho de tela.
    SEGUNDOS_POR_CARD: 5,

    // Pausa (ms) depois que o usuário solta o dedo, antes do
    // movimento automático contínuo voltar a rodar.
    RETOMADA: 300,

    // Duração (ms) da transição suave ao clicar numa bolinha (dot).
    SALTO_MS: 550,

    // De quanto em quanto tempo (ms) verificar qual bolinha deve
    // ficar marcada como ativa durante o movimento ambiente. Não
    // precisa ser por quadro — poucas vezes por segundo já é
    // imperceptível para o usuário e não compete com a animação.
    INTERVALO_CHECAGEM_DOT: 150,

    // true = imprime no console o que o carrossel está fazendo. Serve
    // para confirmar, em produção, que o arquivo realmente carregou.
    // Desligar depois de validar.
    DEBUG: false
  };

  function log() {
    if (CONFIG.DEBUG && window.console) {
      console.log.apply(console, ['[carrossel]'].concat([].slice.call(arguments)));
    }
  }

  // Módulo sempre positivo (o % nativo do JS pode devolver negativo).
  function mod(n, m) {
    return ((n % m) + m) % m;
  }

  function iniciar() {
    var wrapper = document.getElementById('carouselDepoimentos');
    if (!wrapper) return;

    var track = wrapper.querySelector('.carousel-track');
    var dotsBox = wrapper.querySelector('.carousel-dots');
    if (!track) return;

    var originais = Array.prototype.slice.call(track.children)
      .filter(function (el) { return el.nodeType === 1; });

    var total = originais.length;
    if (total === 0) return;

    log('cards encontrados:', total);

    /* ─── LOOP INFINITO ───
       Duplica a lista inteira no fim da esteira. O keyframe anda de
       translate3d(0) até translate3d(-1 ciclo) — como o conjunto
       clonado é idêntico ao original, o instante em que a animação
       reinicia (infinite) é visualmente imperceptível. */
    originais.forEach(function (card) {
      var clone = card.cloneNode(true);
      clone.classList.add('is-clone');
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });

    track.style.transition = 'none';

    /* ─── MEDIDAS ───
       offsets[i]   = posição (px) do início do card i dentro de 1 ciclo
       ciclo        = largura total de 1 ciclo (todos os cards + gaps)
       duracaoTotal = tempo (s) para percorrer 1 ciclo inteiro —
                      total de cards × segundos por card. */
    var medidas = { offsets: [], ciclo: 0, duracaoTotal: 0 };

    function medir() {
      var cs = getComputedStyle(track);
      var gap = parseFloat(cs.columnGap || cs.gap || '0') || 0;
      var offsets = [];
      var acc = 0;
      originais.forEach(function (card) {
        offsets.push(acc);
        acc += card.getBoundingClientRect().width + gap;
      });
      medidas.offsets = offsets;
      medidas.ciclo = acc;
      medidas.duracaoTotal = total * CONFIG.SEGUNDOS_POR_CARD;
      track.style.setProperty('--carrossel-ciclo', acc + 'px');
    }

    function indiceAtivo(posMod) {
      var EPS = 0.5;
      if (posMod >= medidas.ciclo - EPS) return 0;
      var ativo = 0;
      for (var i = 0; i < medidas.offsets.length; i++) {
        if (medidas.offsets[i] <= posMod + EPS) ativo = i;
        else break;
      }
      return ativo;
    }

    var ultimoAtivo = -1;
    function marcarDotAtivo(posMod) {
      if (!dotsBox || medidas.ciclo <= 0) return;
      var ativo = indiceAtivo(posMod);
      if (ativo === ultimoAtivo) return;
      ultimoAtivo = ativo;
      Array.prototype.forEach.call(dotsBox.children, function (dot, i) {
        var sel = i === ativo;
        dot.classList.toggle('active', sel);
        dot.setAttribute('aria-selected', sel ? 'true' : 'false');
      });
    }

    /* Lê a posição X atual DIRETO do que o navegador está renderizando
       neste exato instante — funciona tanto durante a animação CSS
       ambiente quanto durante uma transição de salto, porque
       getComputedStyle sempre devolve o valor interpolado "ao vivo",
       não o valor final de destino. É assim que o JS sabe onde a
       esteira está sem precisar calcular isso sozinho a cada quadro. */
    function lerPosicaoAtualPx() {
      var t = getComputedStyle(track).transform;
      if (t === 'none') return 0;
      var m = t.match(/matrix3d\(([^)]+)\)/);
      if (m) {
        var p3 = m[1].split(',');
        return -parseFloat(p3[12]);
      }
      m = t.match(/matrix\(([^)]+)\)/);
      if (m) {
        var p2 = m[1].split(',');
        return -parseFloat(p2[4]);
      }
      return 0;
    }

    /* ─── MOVIMENTO AMBIENTE (animação CSS) — item 2.1 ───
       Desligado para quem pediu menos movimento no sistema operacional
       (prefers-reduced-motion). */
    var semMovimento = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // "Reaplicar" a animação (removê-la e recriá-la) é a forma padrão
    // de fazer uma @keyframes "pular" para um ponto específico do seu
    // percurso: um animation-delay NEGATIVO faz o navegador already
    // renderizar como se aquele tempo já tivesse se passado. É assim
    // que o carrossel retoma o movimento exatamente de onde o dedo
    // soltou, em vez de voltar para o início.
    function iniciarAmbiente(posInicial) {
      if (semMovimento || medidas.ciclo <= 0) return;
      var pos = mod(posInicial || 0, medidas.ciclo);
      var fracao = pos / medidas.ciclo;
      var atraso = -(fracao * medidas.duracaoTotal);

      track.style.transition = 'none';
      track.style.animation = 'none';
      void track.offsetWidth; // força o navegador a "esquecer" a animação anterior antes de reaplicar
      track.style.animation =
        NOME_KEYFRAME + ' ' + medidas.duracaoTotal.toFixed(4) + 's linear ' +
        atraso.toFixed(4) + 's infinite';

      log('movimento ambiente iniciado a partir de', pos.toFixed(1), 'px');
      iniciarPollDots();
    }

    function pararAmbiente() {
      track.style.animation = 'none';
      pararPollDots();
    }

    // Pausa "de verdade" (sem remover a animação) para quando a aba
    // fica em segundo plano — mais barato, e não precisamos escrever
    // no transform nesse meio tempo, então não há motivo para recriar
    // a animação do zero ao voltar.
    function pausarAmbienteSimples() {
      track.style.animationPlayState = 'paused';
      pararPollDots();
    }
    function retomarAmbienteSimples() {
      if (semMovimento) return;
      track.style.animationPlayState = 'running';
      iniciarPollDots();
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) pausarAmbienteSimples();
      else retomarAmbienteSimples();
    });

    /* ─── CHECAGEM DA BOLINHA ATIVA ───
       Sem uma variável de posição mantida pelo JS a cada quadro (essa
       é justamente a mudança que resolve a travada), a forma mais
       simples e barata de saber qual card está em destaque é
       perguntar ao navegador de vez em quando — não precisa ser 60
       vezes por segundo, poucas já bastam para parecer instantâneo. */
    var pollDotsTimer = null;
    function iniciarPollDots() {
      if (pollDotsTimer || !dotsBox) return;
      pollDotsTimer = setInterval(function () {
        marcarDotAtivo(mod(lerPosicaoAtualPx(), medidas.ciclo));
      }, CONFIG.INTERVALO_CHECAGEM_DOT);
    }
    function pararPollDots() {
      clearInterval(pollDotsTimer);
      pollDotsTimer = null;
    }

    var retomadaTimer = null;
    function agendarRetomada(posFinal) {
      clearTimeout(retomadaTimer);
      retomadaTimer = setTimeout(function () {
        iniciarAmbiente(posFinal);
      }, CONFIG.RETOMADA);
    }

    /* ─── SALTO (clique numa bolinha) — transição CSS, não JS ───
       Sempre anda para a FRENTE — mesmo sentido do movimento contínuo,
       nunca "recua" — para não quebrar a sensação de esteira sempre
       andando no mesmo sentido. */
    var aoTerminarSalto = null;
    var saltoFallbackTimer = null;

    function limparListenerSalto() {
      if (aoTerminarSalto) {
        track.removeEventListener('transitionend', aoTerminarSalto);
        aoTerminarSalto = null;
      }
      clearTimeout(saltoFallbackTimer);
    }

    function irParaCard(i) {
      if (medidas.ciclo <= 0) return;
      var atualMod = mod(lerPosicaoAtualPx(), medidas.ciclo);
      var alvo = medidas.offsets[i];
      var delta = mod(alvo - atualMod, medidas.ciclo);
      if (delta < 1) return; // já é o card ativo

      clearTimeout(retomadaTimer);
      limparListenerSalto();
      pararAmbiente();

      if (semMovimento) {
        track.style.transition = 'none';
        track.style.transform = 'translate3d(-' + (atualMod + delta) + 'px,0,0)';
        marcarDotAtivo(alvo);
        agendarRetomada(alvo);
        return;
      }

      // Trava visualmente na posição atual ANTES de ligar a transição
      // — sem isso, o navegador poderia interpretar a primeira escrita
      // como o próprio ponto de partida e "pular" direto pro destino
      // sem animar.
      track.style.transition = 'none';
      track.style.transform = 'translate3d(-' + atualMod + 'px,0,0)';
      void track.offsetWidth; // força o navegador a registrar o ponto de partida

      track.style.transition = 'transform ' + (CONFIG.SALTO_MS / 1000) +
        's cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      track.style.transform = 'translate3d(-' + (atualMod + delta) + 'px,0,0)';

      aoTerminarSalto = function (e) {
        if (e.target !== track || e.propertyName !== 'transform') return;
        limparListenerSalto();
        track.style.transition = 'none';
        marcarDotAtivo(alvo);
        agendarRetomada(alvo);
      };
      track.addEventListener('transitionend', aoTerminarSalto);

      // Rede de segurança: se por algum motivo o transitionend não
      // disparar (aba em segundo plano no meio da transição, etc.), o
      // carrossel não fica travado esperando para sempre.
      saltoFallbackTimer = setTimeout(function () {
        limparListenerSalto();
        track.style.transition = 'none';
        marcarDotAtivo(alvo);
        agendarRetomada(alvo);
      }, CONFIG.SALTO_MS + 300);
    }

    /* ─── BOLINHAS (DOTS) ─── */
    if (dotsBox) {
      for (var i = 0; i < total; i++) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel-dot';
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', 'Depoimento ' + (i + 1) + ' de ' + total);
        (function (alvo) {
          dot.addEventListener('click', function () { irParaCard(alvo); });
        })(i);
        dotsBox.appendChild(dot);
      }
    }

    /* ─── ARRASTE — Touch Events com listeners no DOCUMENT (item 2.2) ───
       touchstart fica no WRAPPER (#carouselDepoimentos), não no track.
       Motivo: o track é um flex container com overflow:visible — a
       caixa DELE MESMO só cobre, na prática, a largura de ~1 card; os
       demais cards "vazam" visualmente para fora dela (overflow), e
       cada card continua recebendo toque normalmente porque é um
       elemento próprio. Mas os pequenos respiros (gap) ENTRE os cards
       que também caem fora dessa caixa não têm nenhum elemento ali —
       o toque nessas frestas nunca chegava ao listener. O wrapper, por
       ter overflow:hidden, tem uma caixa própria que cobre 100% da
       área visível do carrossel, sem frestas.

       touchmove/touchend/touchcancel continuam sendo ouvidos no
       DOCUMENT (não no wrapper) assim que um arraste começa, e
       removidos assim que ele termina — garante que o gesto continue
       sendo acompanhado mesmo que o dedo saia da área do carrossel
       durante o arraste.

       Durante o arraste, a animação CSS é totalmente removida (não
       apenas pausada) para o transform escrito à mão pelo JS assumir
       o controle — uma animação apenas pausada continua "dona" da
       propriedade transform e ignoraria a escrita direta. Ao soltar,
       a animação volta com o atraso calculado para continuar
       exatamente de onde o dedo deixou. */
    var arrastando = false;
    var eixo = null;
    var touchId = null;
    var inicioX = 0, inicioY = 0, posicaoNoInicio = 0, posicaoArraste = 0;

    function pegarToque(e) {
      var lista = e.changedTouches || e.touches;
      for (var i = 0; i < lista.length; i++) {
        if (lista[i].identifier === touchId) return lista[i];
      }
      return null;
    }

    function comecarArraste(e) {
      if (e.touches.length !== 1) return; // ignora pinça / multi-toque
      if (arrastando) return;

      var t = e.touches[0];
      touchId = t.identifier;
      inicioX = t.clientX;
      inicioY = t.clientY;
      arrastando = true;
      eixo = null;

      clearTimeout(retomadaTimer);
      limparListenerSalto();

      posicaoNoInicio = mod(lerPosicaoAtualPx(), medidas.ciclo);
      posicaoArraste = posicaoNoInicio;

      pararAmbiente();
      track.style.transition = 'none';
      track.style.transform = 'translate3d(-' + posicaoNoInicio + 'px,0,0)'; // trava exatamente onde estava

      document.addEventListener('touchmove', moverArraste, { passive: false });
      document.addEventListener('touchend', soltarArraste);
      document.addEventListener('touchcancel', soltarArraste);
    }

    function moverArraste(e) {
      if (!arrastando) return;
      var t = pegarToque(e);
      if (!t) return;

      var dx = t.clientX - inicioX;
      var dy = t.clientY - inicioY;

      // Trava o eixo no primeiro movimento significativo: se o dedo
      // desceu mais do que andou de lado, o gesto é rolagem da página.
      if (eixo === null) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        eixo = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (eixo === 'y') {
          soltarArraste();
          return;
        }
      }

      posicaoArraste = mod(posicaoNoInicio - dx, medidas.ciclo);
      track.style.transform = 'translate3d(-' + Math.round(posicaoArraste) + 'px,0,0)';
      marcarDotAtivo(posicaoArraste);

      if (e.cancelable) e.preventDefault(); // impede a rolagem lateral da página
    }

    function soltarArraste() {
      if (!arrastando) return;
      arrastando = false;
      touchId = null;

      document.removeEventListener('touchmove', moverArraste, { passive: false });
      document.removeEventListener('touchend', soltarArraste);
      document.removeEventListener('touchcancel', soltarArraste);

      agendarRetomada(posicaoArraste);
    }

    // Listener no WRAPPER (não no track) — ver comentário acima.
    wrapper.addEventListener('touchstart', comecarArraste, { passive: true });

    /* ─── RESIZE ───
       A largura do card muda nos breakpoints (992px e 640px). Guarda
       em que fração do ciclo a esteira estava ANTES de remedir, e
       reaplica a mesma fração nas medidas novas — evita um "salto"
       visível no giro da tela. */
    var timerResize;
    window.addEventListener('resize', function () {
      clearTimeout(timerResize);
      timerResize = setTimeout(function () {
        if (arrastando) return; // durante um arraste ativo, a próxima soltura já remedirá se precisar
        var cicloAntigo = medidas.ciclo;
        var fracao = cicloAntigo > 0 ? mod(lerPosicaoAtualPx(), cicloAntigo) / cicloAntigo : 0;
        medir();
        iniciarAmbiente(fracao * medidas.ciclo);
      }, 120);
    });

    /* ─── ENTRADA DOS CARDS ───
       Os cards nascem com a classe .reveal (opacidade 0). O observador
       do script.js só os revela quando entram na tela — mas os cards
       fora da área visível da esteira nunca entram por conta própria, e
       os clones sequer existiam quando aquele observador foi montado.
       Aqui todos são revelados de uma vez, assim que o bloco aparece. */
    function revelarTudo() {
      Array.prototype.forEach.call(track.children, function (card) {
        card.classList.add('visible');
      });
    }

    medir();
    track.style.transform = 'translate3d(0,0,0)';

    /* Navegador sem IntersectionObserver: revela e parte imediatamente,
       em vez de deixar o carrossel invisível e parado para sempre. */
    if (!('IntersectionObserver' in window)) {
      revelarTudo();
      iniciarAmbiente(0);
      log('sem IntersectionObserver: iniciado direto');
      return;
    }

    var revelador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        revelarTudo();
        revelador.disconnect();
        iniciarAmbiente(0);
      });
    }, { threshold: 0.15 });

    revelador.observe(wrapper);

    /* ─── PARTIDA ─── */
    window.addEventListener('load', function () {
      medir();
      if (!arrastando) iniciarAmbiente(mod(lerPosicaoAtualPx(), medidas.ciclo || 1));
    });

    if (CONFIG.DEBUG) {
      window.__carrosselDebug = {
        lerPosicaoAtualPx: lerPosicaoAtualPx,
        getMedidas: function () { return medidas; },
        indiceAtivo: indiceAtivo
      };
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
