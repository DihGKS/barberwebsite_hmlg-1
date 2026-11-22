===============================================================
BARBEARIA HEBREUS - CONTROLE DE CACHE DO CSS
Referencia rapida para as proximas atualizacoes do site
GKS Dev
===============================================================

VERSAO ATUAL DO CSS: v=10
(aplicada em 22/11/2026: botao "Ver Todos os Servicos" do Bloco 4 (index) mais largo, ocupando o espaco entre as setas; marcador .anchor-target para o sitelink #agendar; a v=9, de 20/11/2026, trouxe: botao "Ver Todos os Servicos" do Bloco 4 (index) centralizado entre as setas do carrossel; a v=8, do mesmo dia, trouxe: todos os botoes com icone do WhatsApp passam a usar o verde #25D366 do botao flutuante (hover #1EBE5A, halo do pulso verde); a v=7 trouxe, em 06/11/2026: botao "Candidate-se agora" do hero do Trabalhe
 Conosco com o mesmo tamanho e icone do WhatsApp das demais paginas; a v=6 trouxe: pulso nos demais botoes do site (menu, servicos,
 "Ver todos os servicos", Trabalhe Conosco) e icone do WhatsApp no botao do
 Recrutamento; a v=5 trouxe: pulso no botao "Ver planos e preços" e icone do
 WhatsApp nos botoes dos planos do Hebreus VIP; a v=4 trouxe o pulso nos
 botoes "Assine Agora" do Hebreus VIP;
 a v=3, do mesmo dia, trouxe os blocos da Landing Page: Prova Social,
 Depoimentos e botoes de agendamento)

VERSOES ATUAIS DOS JS:
 script.js                 -> v=2 (5 paginas)
 carousel-depoimentos.js   -> v=1 (somente index.html)
Mesma regra do CSS: mexeu no JS -> incrementa o numero so naquele arquivo.


---------------------------------------------------------------
1. POR QUE ISSO EXISTE
---------------------------------------------------------------

O navegador guarda o style.css em cache. Se voce sobe um CSS novo
mas o link no HTML continua igual, quem ja visitou o site continua
usando a versao antiga do arquivo, as vezes por dias.

O resultado e o pior cenario possivel: HTML novo + CSS velho.
O layout quebra so para quem ja conhecia o site, e no seu navegador
(que voce limpou) parece que esta tudo certo.

A solucao e o "cache busting": mudar o endereco do arquivo a cada
versao. O conteudo depois do "?" nao altera qual arquivo o servidor
entrega, mas o navegador enxerga como um endereco novo e baixa de
novo, obrigatoriamente.


---------------------------------------------------------------
2. O QUE FAZER NA PROXIMA VEZ QUE MEXER NO style.css
---------------------------------------------------------------

REGRA: mexeu no style.css -> incrementa o numero nas 5 paginas.

Passo 1. Abra as 5 paginas:

           index.html
           servicos.html
           hebreus_vip.html
           sobre_nos.html
           trabalhe_conosco.html

Passo 2. Em cada uma, localize a linha (fica dentro do <head>):

           <link rel="stylesheet" href="style.css?v=2">

Passo 3. Troque o numero para o proximo (2 -> 3 -> 4 ...):

           <link rel="stylesheet" href="style.css?v=3">

Passo 4. Suba as 5 paginas JUNTO com o style.css novo.

IMPORTANTE: as 5 paginas precisam ficar com o MESMO numero.
Se sobrar uma pagina em v=2 e as outras em v=3, o visitante vai
baixar o CSS duas vezes e uma das paginas pode quebrar.


---------------------------------------------------------------
3. ATALHO PARA TROCAR TUDO DE UMA VEZ
---------------------------------------------------------------

No VS Code:
  Ctrl+Shift+F (busca em todos os arquivos)
  Buscar:      style.css?v=2
  Substituir:  style.css?v=3
  Clicar em "Replace All"

No terminal (Linux / Git Bash / WSL), dentro da pasta do site:
  sed -i 's|style.css?v=2|style.css?v=3|' *.html

Depois confira se pegou nas 5:
  grep -n "style.css" *.html


---------------------------------------------------------------
4. E O script.js?
---------------------------------------------------------------

Mesma logica, mesmo problema. Hoje ele esta sem versao porque nao
foi alterado. Se um dia voce mexer no script.js, aplique o mesmo
padrao nas 5 paginas:

           <script src="script.js?v=2"></script>

Use numeracao independente da do CSS - um nao precisa acompanhar
o outro.


---------------------------------------------------------------
5. E AS IMAGENS?
---------------------------------------------------------------

Nao precisa versionar. O padrao adotado no projeto e usar nome de
arquivo novo quando a imagem muda (foi o que fizemos com as fotos
profissionais). Nome diferente ja e endereco diferente, entao o
cache nunca atrapalha.

So tome cuidado com o caso contrario: se voce sobrescrever uma
imagem MANTENDO o mesmo nome, o visitante antigo pode continuar
vendo a foto velha. Nesse caso, renomeie o arquivo.


---------------------------------------------------------------
6. CHECKLIST DE PUBLICACAO NA HOSTGATOR
---------------------------------------------------------------

[ ] Backup: no Gerenciador de Arquivos, selecionar os arquivos que
    serao sobrescritos e usar "Compactar" para gerar um .zip.
    Esse zip e o seu ponto de rollback.

[ ] Subir as imagens em public_html/img_hebreus/

[ ] Subir style.css e os HTML em public_html/

[ ] Se o plano tiver LiteSpeed Cache ativo no cPanel, limpar o cache

[ ] Testar com Ctrl+Shift+R (recarrega ignorando o cache)

[ ] Testar em um CELULAR DE VERDADE, nao so no modo responsivo do
    navegador

[ ] Confirmar que o layout esta certo antes de apagar arquivos antigos


===============================================================
HISTORICO DE VERSOES DO CSS
===============================================================

v=1  (implicito, sem parametro)
     Versao original publicada.

v=2  05/08/2026
     Entrada das fotos profissionais. Bloco novo no fim do
     style.css: classe .foto-integral, que faz as fotos do
     Clube VIP (9/16, ate 768px) e do Recrutamento (4/5, ate
     860px) aparecerem sem recorte no mobile.

v=3  (proxima alteracao - anotar data e o que mudou)

===============================================================


===============================================================
RASTREAMENTO GOOGLE ADS (site institucional) - aplicado em 22/11/2026
===============================================================

ARQUIVOS NOVOS (na raiz, junto do style.css)
  tracking.js?v=1  -> dispara a conversao a cada clique em botao de WhatsApp
  ancoras.js?v=1   -> reposiciona a rolagem quando a URL tem #ancora

ONDE ENTRA EM CADA PAGINA (index, servicos, hebreus_vip, sobre_nos,
trabalhe_conosco)
  <head>  : tag do Google (gtag.js + gtag('config','AW-443396693'))
  fim do <body>, logo apos script.js : tracking.js e ancoras.js

CONTA / ACAO DE CONVERSAO (mesmas da Landing Page)
  Tag: AW-443396693 | Rotulo: uGmbCLmqoKkcENXkttMB
  Valor por lead: R$ 15,00 (BRL) - ajustar em tracking.js > CONFIG

COMO O DISPARO FUNCIONA
  Todo link de WhatsApp que deve converter tem data-cta="pagina-local".
  Sem data-cta = nao converte. Ha protecao contra duplo clique (1,5 s).
  Nomes: home-*, servicos-*, vip-*, sobre-*, trabalhe-*
  Exemplos: home-hero-agendar | vip-plano-vip-total-corte-barba |
            servicos-servico-corte-masculino-clube | sobre-float-agendar

  72 botoes convertem; 2 NAO convertem de proposito (Trabalhe Conosco:
  "Candidate-se agora" no hero e na secao de Recrutamento), porque sao
  candidatura a vaga e nao agendamento - contaria lead falso no Google Ads.

NOVO BOTAO DE WHATSAPP NO FUTURO
  Inclua data-cta="pagina-local" no <a>, mantendo target="_blank".

PARA DESLIGAR TUDO: remova as <script src="tracking.js"> (e, se quiser, o
bloco gtag do <head>) das paginas. Nada mais depende deles.

VALIDACAO NO NAVEGADOR: em tracking.js troque DEBUG:false por DEBUG:true,
abra o site, clique num botao de WhatsApp e veja "[tracking] CONVERSAO
ENVIADA" no console (F12). Volte para false antes de publicar.

ANCORAS PARA SITELINKS (URLs finais sugeridas)
  Paginas : /servicos.html  /hebreus_vip.html  /sobre_nos.html
            /trabalhe_conosco.html
  Na home : /#numeros  /#clube  /#servicos  /#depoimentos  /#agendar
            (#agendar = bloco Localizacao, onde esta o botao Agendar Agora)
  Na VIP  : /hebreus_vip.html#planos  #faq
  Sobre   : /sobre_nos.html#valores  #localizacao
  As ancoras #numeros, #depoimentos e #agendar mantem os mesmos nomes que
  a Landing Page usava.

