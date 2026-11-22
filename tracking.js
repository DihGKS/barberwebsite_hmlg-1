/* ════════════════════════════════════════════════════════════════
   TRACKING — Barbearia Hebreus | SITE INSTITUCIONAL (todas as páginas)
   Dispara conversão no Google Ads a cada clique em CTA de WhatsApp.
   Mesma conta, mesma ação de conversão e mesma lógica da Landing Page.

   COMO FUNCIONA
   • Todo link/botão de WhatsApp que deve converter leva o atributo
     data-cta="<pagina>-<local>" (ex.: data-cta="home-hero-agendar").
   • Este arquivo escuta os cliques (delegação de evento) e dispara a
     conversão para quem tem data-cta. Quem NÃO tem data-cta não converte
     (de propósito: ver "Candidate-se agora", que é vaga de emprego).
   • A tag do Google (gtag) fica no <head> de cada página.

   NOVO BOTÃO DE WHATSAPP? Basta incluir data-cta="..." no <a>.
   PROBLEMA? Remova a <script src="tracking.js"> da página: o site volta
   ao estado anterior, sem nenhum efeito colateral.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─── CONFIGURAÇÃO ─── */
  var CONFIG = {
    // ID da tag do Google (Google Ads > Ferramentas > Gerenciador de tags de dados)
    ADS_ID: 'AW-443396693',

    // Rótulo da ação de conversão "Agendamento WhatsApp"
    LABEL_AGENDAMENTO: 'uGmbCLmqoKkcENXkttMB',

    // Valor médio atribuído a um lead de agendamento
    VALOR: 15.0,
    MOEDA: 'BRL',

    // true = imprime logs no console para validação. Desligar em produção.
    DEBUG: false
  };

  /* ─── UTILITÁRIOS ─── */
  function log() {
    if (CONFIG.DEBUG && window.console) {
      console.log.apply(console, ['[tracking]'].concat([].slice.call(arguments)));
    }
  }

  function pronto() {
    return typeof window.gtag === 'function';
  }

  /* ─── CAPTURA DO GCLID ───
     Guarda o identificador do clique no anúncio. Como o site tem várias
     páginas, o valor fica em sessionStorage e acompanha a navegação na aba.
     Necessário caso o cliente queira importar conversões offline. */
  (function capturaGclid() {
    try {
      var gclid = new URLSearchParams(window.location.search).get('gclid');
      if (gclid) {
        sessionStorage.setItem('hebreus_gclid', gclid);
        log('gclid capturado:', gclid);
      }
    } catch (e) { /* navegador sem suporte: ignora silenciosamente */ }
  })();

  /* ─── DISPARO DA CONVERSÃO ─── */
  var ultimoDisparo = 0;

  function dispararConversao(origem) {
    var agora = Date.now();
    // Evita duplicidade em duplo-clique / toque acidental (janela de 1,5s)
    if (agora - ultimoDisparo < 1500) {
      log('disparo ignorado (duplicado):', origem);
      return;
    }
    ultimoDisparo = agora;

    if (!pronto()) {
      log('ERRO: gtag indisponível. Verifique a tag do Google no <head>.');
      return;
    }

    window.gtag('event', 'conversion', {
      send_to: CONFIG.ADS_ID + '/' + CONFIG.LABEL_AGENDAMENTO,
      value: CONFIG.VALOR,
      currency: CONFIG.MOEDA,
      transaction_id: 'wa-' + agora + '-' + Math.random().toString(36).slice(2, 8)
    });

    log('CONVERSÃO ENVIADA — origem:', origem);

    // Meta Pixel: só dispara se o pixel estiver ativo no <head>
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'Contact', { content_name: origem });
      log('Meta Pixel: evento Contact enviado');
    }
  }

  /* ─── LIGAÇÃO COM OS BOTÕES ───
     Delegação de evento: funciona inclusive para CTAs que entram no DOM
     depois (ex.: carrossel de depoimentos). */
  document.addEventListener('click', function (e) {
    var alvo = e.target.closest('[data-cta]');
    if (!alvo) return;

    var origem = alvo.getAttribute('data-cta') || 'desconhecido';
    dispararConversao(origem);
  }, true);

  log('módulo carregado. ID:', CONFIG.ADS_ID);
})();
