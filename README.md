
Fortune’s Segalla é um jogo estilo tigrinho feito em React que simula uma máquina caça-níquel com:
Símbolos especiais, incluindo WILD (💎).
Multiplicadores aleatórios (x2, x5, x10).
Evento especial dramático com mudança de cor e spins lentos (soltou cartinhakksksksks).
Sistema de AutoSpin com quantidades fixas de giros.

Funcionalidades principais
Grid 3x3 animado com símbolos aleatórios a cada spin.
Tabela de prêmios por símbolo, com WILD substituindo outros símbolos em linhas e diagonais.
Multiplicador aleatório por rodada (x1, x2, x5, x10).

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

Estado do jogo: grid, balance, betIndex, lastWin, multiplier.
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

Testes são feitos pelo link do vercel. (67 linhas de readme 6767676767)
