
Fortune’s Segalla é um jogo estilo tigrinho feito em React que simula uma máquina caça-níquel com:
Símbolos especiais, incluindo WILD (💎).
Faixa animada com multiplicadores aleatórios (1x, 2x, 5x, 10x, 25x e 50x).
Evento especial dramático com mudança de cor e spins lentos (soltou cartinhakksksksks).
Sistema de AutoSpin com quantidades fixas de giros.

Funcionalidades principais
Grid 3x3 animado com símbolos aleatórios a cada spin.
Tabela de prêmios por símbolo, com WILD substituindo outros símbolos em linhas e diagonais.
Faixa de multiplicadores acima dos slots, sorteada a cada rodada.
Quando um número para exatamente no centro, três multiplicadores ficam visíveis e o ganho é multiplicado pelo número central.
Quando a faixa para entre dois números, apenas dois multiplicadores ficam visíveis e o ganho permanece sem multiplicação.
O carrossel desliza horizontalmente a partir da posição anterior e desacelera até parar: 1,6 segundo no modo normal e 0,7 segundo no Turbo. O prêmio só é calculado ao terminar o giro.
Com a preferência de movimento reduzido, o carrossel percorre menos números, preservando um deslizamento suave e as mesmas chances.
As chances de cada número são: 1x = 60%, 2x = 25%, 5x = 10%, 10x = 4%, 25x = 0,9% e 50x = 0,1%, configuráveis em MULTIPLIER_WEIGHTS (src/fortunessegalla/multiplierReel.js).
Há 50% de chance de parar no centro, configurável em MULTIPLIER_CENTER_CHANCE. Assim, a chance por rodada de ativar 25x é 0,45%, e de ativar 50x é 0,05%; é necessário haver um ganho para receber um prêmio.
A variável roundMultiplier guarda o número central ou null quando não há multiplicador. A regra também se aplica ao Turbo, AutoSpin e ao prêmio do evento especial.

-- "Soltar Cartinha" (5% de chance): --
Escolhe um símbolo alvo.
Fundo e card vão gradualmente do azul para o vermelho.
Símbolos giram devagar até no máximo 6 vezes.
Slots com o alvo ou WILD travam.
Se todos fecharem: prêmio total multiplicado por x10.
Se não: paga apenas o que formar em linhas/diagonais e encerra o evento.

AutoSpin com opções fixas: 10, 30, 80, 1000 giros.
Ao clicar em AUTO, o jogador escolhe a quantidade (via prompt).
Enquanto ativo, o botão SPIN mostra AUTO: N com giros restantes.
Clicar em SPIN enquanto há AutoSpin restante cancela o modo automático.

Apostas fixas (BET_VALUES): de 0,40 até 500,00, navegando com botões - e +.

Overlay de vitórias grandes:
BIG WIN, SUPER WIN, MEGA WIN dependendo do múltiplo da aposta.

Valor do prêmio sobe animado até o total.

UI inspirada em slots mobile e no Fortune Dragon:

Barra inferior curva com três botões: TURBO, SPIN e AUTO.

Cores vibrantes (azul, roxo, amarelo) e bordas circulares.

Tecnologias utilizadas
React (função componente + Hooks: useState, useEffect, useRef).
Tailwind CSS para layout e visual (gradientes, bordas, sombras, animações).
JavaScript puro para lógica de jogo, randomização e timers (setTimeout, requestAnimationFrame).

Estrutura principal do código
App.jsx

Estado do jogo: grid, balance, betIndex, lastWin, roundMultiplier, multiplierReel.
Controle de animações: isSpinning, turbo, specialEvent, winOverlay.
Lógica de AutoSpin: autoSpinRemaining + refs para evitar closures desatualizadas.

Funções principais:
spin() – controla um giro completo e decide se ativa o evento.
startSpecialFading() – fase de transição de cor e spins lentos contínuos.
runSpecialEventActive() – fase que trava símbolos alvo/WILD e tenta fechar em 6 giros.
calculateWinWithHighlights() – calcula payout por linhas e diagonais, marcando células vencedoras.
finishSpinWithPayout() – atualiza saldo, lastWin, overlays e agenda próximos AutoSpins.

Próximos updates(talvez, to pensanndo ainda)
Substituir o window.prompt do AutoSpin por um modal bonito com botões 10 / 30 / 80 / 1000.
Adicionar sons para spin, evento especial e vitórias grandes.
Adicionar algum mascote pro jogo
Persistir balance em localStorage para manter o progresso entre sessões. (não sei se é vantagem isso ou nn)
Adicionar painel de histórico de rodadas e estatísticas (RTP simulado, maior ganho etc.).
Adiconar funções que simulam depósito e saque de ganhos.

Validação local: npm test (sorteios, posições da faixa e cálculo dos multiplicadores) e npm run build.
