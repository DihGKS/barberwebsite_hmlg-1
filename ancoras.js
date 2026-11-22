/* ════════════════════════════════════════════════════════════════
   REANCORAGEM — SITELINKS DO GOOGLE ADS (todas as páginas)
   O navegador pula para o #ancora antes das fontes e imagens
   terminarem de carregar. Se alguma delas mudar de altura depois,
   o usuário fica alguns pixels fora do bloco certo. Este trecho
   reposiciona a rolagem quando tudo já está estável.
   Só age quando a URL tem #hash. Arquivo isolado: remover a tag
   <script src="ancoras.js"> desfaz tudo.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var hash = window.location.hash;
  if (!hash || hash.length < 2) return;

  function reancorar() {
    try {
      var alvo = document.querySelector(hash);
      if (alvo) alvo.scrollIntoView({ behavior: 'instant', block: 'start' });
    } catch (e) { /* hash inválido como seletor: ignora */ }
  }

  window.addEventListener('load', function () {
    reancorar();
    setTimeout(reancorar, 350); // margem para o swap das fontes
  });
})();
