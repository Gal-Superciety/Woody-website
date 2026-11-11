'use client';

import { useState } from 'react';
import WalletConnectPanel from '../app/WalletConnectPanel';
import styles from './WoodyMiniGames.module.css';

const STARTING_CREDITS = 1000;
const ICONS = ['🍒', '🍋', '🍇', '🍉', '⭐', '🌿'];
const SLOT_PAYLINES = [[0,1,2],[3,4,5],[6,7,8],[0,4,8],[2,4,6]];
const ROULETTE_SECTORS = ['red','black','red','black','green','red','black','red','black','green','red','black'];
const CARD_SUITS = ['♠', '♥', '♦', '♣'];
const randomCard = () => ({ rank: ['A','2','3','4','5','6','7','8','9','10','J','Q','K'][Math.floor(Math.random()*13)], suit: CARD_SUITS[Math.floor(Math.random()*4)] });
const cardPoints = card => card.rank === 'A' ? 11 : ['J','Q','K'].includes(card.rank) ? 10 : Number(card.rank);
function handValue(hand) {
  let total = hand.reduce((sum, card) => sum + cardPoints(card), 0);
  let aces = hand.filter(card => card.rank === 'A').length;
  while (total > 21 && aces-- > 0) total -= 10;
  return total;
}

export default function WoodyMiniGames() {
  const [credits, setCredits] = useState(STARTING_CREDITS);
  const [wager, setWager] = useState(25);
  const [game, setGame] = useState('slots');
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState(['🍒','⭐','🌿','🍋','🍒','🍉','🌿','⭐','🍒']);
  const [winningCells, setWinningCells] = useState([]);
  const [rouletteColor, setRouletteColor] = useState('red');
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [wheelTurn, setWheelTurn] = useState(0);
  const [cards, setCards] = useState(null);
  const [message, setMessage] = useState('Choose a game and try it with demo credits.');
  const [messageType, setMessageType] = useState('');

  const setNotice = (text, type = '') => { setMessage(text); setMessageType(type); };
  const setBet = amount => setWager(current => Math.max(5, Math.min(200, current + amount)));
  const beginRound = () => {
    if (credits < wager) { setNotice('Not enough demo credits. Reset the game to receive 1,000 more.', 'loss'); return false; }
    setCredits(current => current - wager);
    return true;
  };
  const pay = amount => setCredits(current => current + amount);
  const reset = () => { setCredits(STARTING_CREDITS); setWager(25); setCards(null); setSpinning(false); setWheelSpinning(false); setWinningCells([]); setNotice('Demo reset. You received 1,000 fictional credits.'); };

  const playSlots = () => {
    if (spinning || !beginRound()) return;
    setSpinning(true); setWinningCells([]); setNotice('The reels are spinning…');
    const result = Array.from({length:9}, () => ICONS[Math.floor(Math.random()*ICONS.length)]);
    window.setTimeout(() => {
      setReels(result); setSpinning(false);
      const winningLines = SLOT_PAYLINES.filter(([a,b,c]) => result[a] === result[b] && result[b] === result[c]);
      const winners = [...new Set(winningLines.flat())];
      setWinningCells(winners);
      if (winningLines.length) {
        const prize = wager * 5 * winningLines.length;
        pay(prize);
        setNotice(`${winningLines.length} ${winningLines.length === 1 ? 'line' : 'lines'} winning! +${prize} demo credits.`, 'win');
      } else setNotice(`No winning line. You used ${wager} demo credits.`, 'loss');
    }, 750);
  };

  const playWheel = () => {
    if (wheelSpinning || !beginRound()) return;
    setWheelSpinning(true); setNotice('The wheel is spinning…');
    const sectorIndex = Math.floor(Math.random() * ROULETTE_SECTORS.length);
    const outcome = ROULETTE_SECTORS[sectorIndex];
    const targetAngle = (360 - (sectorIndex * 30 + 15)) % 360;
    setWheelTurn(current => {
      const currentAngle = ((current % 360) + 360) % 360;
      const alignment = (targetAngle - currentAngle + 360) % 360;
      return current + 360 * 7 + alignment;
    });
    window.setTimeout(() => {
      setWheelSpinning(false);
      const colorName = outcome === 'red' ? 'RED' : outcome === 'black' ? 'BLACK' : 'GREEN';
      if (outcome === rouletteColor) { const prize = wager * (outcome === 'green' ? 4 : 2); pay(prize); setNotice(`It landed on ${colorName}! +${prize} demo credits.`, 'win'); }
      else setNotice(`It landed on ${colorName}. Try again.`, 'loss');
    }, 3500);
  };

  const finishBlackjack = (player, dealer, pushIfEqual = true) => {
    const playerTotal = handValue(player), dealerTotal = handValue(dealer);
    if (playerTotal > 21) { setCards({player, dealer, done:true}); setNotice(`You went over 21 (${playerTotal}).`, 'loss'); }
    else if (dealerTotal > 21 || playerTotal > dealerTotal) { const prize = wager * 2; pay(prize); setCards({player, dealer, done:true}); setNotice(`You won the round: ${playerTotal} to ${dealerTotal}. +${prize} demo credits.`, 'win'); }
    else if (playerTotal === dealerTotal && pushIfEqual) { pay(wager); setCards({player, dealer, done:true}); setNotice(`Push: ${playerTotal} to ${dealerTotal}. Your demo bet is returned.`, ''); }
    else { setCards({player, dealer, done:true}); setNotice(`Dealer wins: ${playerTotal} to ${dealerTotal}.`, 'loss'); }
  };
  const startBlackjack = () => {
    if (cards && !cards.done || !beginRound()) return;
    const player = [randomCard(), randomCard()], dealer = [randomCard(), randomCard()];
    if (handValue(player) === 21) finishBlackjack(player, dealer);
    else { setCards({player, dealer, done:false}); setNotice('Hit or stand.'); }
  };
  const hit = () => { if (!cards || cards.done) return; const player = [...cards.player, randomCard()]; if (handValue(player) > 21) finishBlackjack(player, cards.dealer); else { setCards({...cards, player}); setNotice('Hit or stand.'); } };
  const stand = () => { if (!cards || cards.done) return; const dealer = [...cards.dealer]; while (handValue(dealer) < 17) dealer.push(randomCard()); finishBlackjack(cards.player, dealer); };

  const chooseGame = id => { setGame(id); setCards(null); setWinningCells([]); setNotice('Choose a demo bet and start a round.'); setMessageType(''); };
  const play = () => game === 'slots' ? playSlots() : game === 'roulette' ? playWheel() : startBlackjack();
  const title = game === 'slots' ? 'Lucky Fruits' : game === 'roulette' ? 'Forest Wheel' : 'Blackjack';

  return <>
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.breadcrumb}><span>WOODY ARCADE</span><span>/</span><strong>MINI GAMES</strong></div>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <div className={styles.kicker}><span className={styles.dot} /> A NEW WOODY EXPERIENCE</div>
            <h1>MINI GAMES<br/><em>IN THE FOREST.</em></h1>
            <p>Take a break between adventures. Try the games with demo credits and see what the WOODY arcade could become.</p>
            <a className={styles.cta} href="#games">CHOOSE A GAME <span>↓</span></a>
          </div>
          <div className={styles.heroArt} aria-hidden="true"><div className={styles.orbitOne}/><div className={styles.orbitTwo}/><div className={styles.moon}/><div className={styles.mascot}><span>W</span></div><i>✦</i><b>+25</b></div>
          <div className={styles.creditCard}><span>DEMO CREDITS</span><strong>◉ {credits.toLocaleString('en-US')}</strong><small>Fictional · no real value</small></div>
        </section>

        <section className={styles.walletSection}>
          <div className={styles.sectionHeader}><div><div className={styles.kicker}>MULTIVERSX MAINNET</div><h2>Your WOODY wallet</h2></div><span>LIVE TOKEN BALANCE</span></div>
          <div className="dashboard-section wallet-section"><WalletConnectPanel /></div>
          <p className={styles.walletNote}>Connecting displays your real balance only. The demo games above still use fictional credits; real-token bets need a dedicated, audited game contract.</p>
        </section>

        <section id="games" className={styles.games}>
          <div className={styles.sectionHeader}><div><div className={styles.kicker}>PICK YOUR NEXT MOVE</div><h2>Games in the woods</h2></div><span>03 GAMES · DEMO MODE</span></div>
          <div className={styles.gameGrid}>
            {[['slots','🍒','Lucky Fruits','Match the symbols.'],['roulette','◎','Forest Wheel','Pick a color and spin.'],['blackjack','♠','Blackjack','Get close to 21.']].map(([id,icon,name,desc])=><button key={id} onClick={()=>chooseGame(id)} className={`${styles.gameCard} ${game===id?styles.active:''}`} aria-pressed={game===id}><span className={styles.gameIcon}>{icon}</span><strong>{name}</strong><small>{desc}</small><span className={styles.playLabel}>PLAY ↗</span></button>)}
          </div>
        </section>

        <section className={styles.table} aria-live="polite">
          <header className={styles.tableHeader}><div><div className={styles.kicker}>NOW PLAYING</div><h2>{title}</h2></div><span className={styles.live}><i/> DEMO</span></header>
          <div className={styles.playArea}>
            {game==='slots' && <><div className={styles.slotFrame}><div className={`${styles.reels} ${spinning?styles.reelsSpinning:''}`}>{reels.map((icon,i)=><div key={i} className={`${styles.reel} ${spinning?styles.bounce:''} ${winningCells.includes(i)?styles.winningReel:''}`}>{spinning?'✦':icon}</div>)}</div></div><div className={styles.paylineLabel}>5 WIN LINES <span>3 × 3</span></div></>}
            {game==='roulette' && <><span className={`${styles.pointer} ${wheelSpinning?styles.pointerActive:''}`}>▼</span><div className={styles.wheel} style={{transform:`rotate(${wheelTurn}deg)`}}><span>W</span></div><div className={styles.colors}>{[['red','RED'],['black','BLACK'],['green','GREEN']].map(([color,label])=><button key={color} onClick={()=>setRouletteColor(color)} className={`${styles.color} ${styles[color]} ${rouletteColor===color?styles.colorActive:''}`} aria-pressed={rouletteColor===color}>{label}</button>)}</div></>}
            {game==='blackjack' && cards && <div className={styles.hands}><div><small>YOU <b>{handValue(cards.player)}</b></small><div className={styles.cardRow}>{cards.player.map((card,i)=><PlayingCard card={card} key={i}/>)}</div></div><span>VS</span><div><small>DEALER <b>{cards.done?handValue(cards.dealer):'?'}</b></small><div className={styles.cardRow}>{cards.dealer.map((card,i)=><PlayingCard card={card} hidden={i===1&&!cards.done} key={i}/>)}</div></div></div>}
            {game==='blackjack' && !cards && <div className={styles.blackjackIntro}><span>♠</span><b>21</b><small>Deal yourself in.</small></div>}
            <div className={`${styles.message} ${messageType==='win'?styles.messageWin:messageType==='loss'?styles.messageLoss:''}`}>{message}</div>
            <div className={styles.controls}><span className={styles.betLabel}>DEMO BET</span><div className={styles.betControl}><button onClick={()=>setBet(-5)} aria-label="Decrease demo bet">−</button><strong>{wager}</strong><button onClick={()=>setBet(5)} aria-label="Increase demo bet">+</button></div>{game==='blackjack'&&cards&&!cards.done?<><button className={styles.secondaryButton} onClick={hit}>HIT</button><button className={styles.secondaryButton} onClick={stand}>STAND</button></>:<button className={styles.primaryButton} onClick={play} disabled={spinning||wheelSpinning||Boolean(cards&&!cards.done)}>{spinning||wheelSpinning?'PLAYING…':'PLAY ROUND'}</button>}</div>
          </div>
        </section>

        <aside className={styles.notice}><span>✳</span><div><strong>Just a demo</strong><p>Credits are fictional, stay in your browser and cannot be purchased, transferred or withdrawn. No wallet or real WOODY tokens are connected.</p></div><button onClick={reset}>RESET DEMO</button></aside>
        <footer className={styles.footer}><span>WOODY ARCADE / MINI GAMES</span><a href="/forest-adventure">PLAY FOREST ADVENTURE ↗</a></footer>
      </div>
    </main>
  </>;
}

function PlayingCard({card,hidden=false}) {
  return <div className={`${styles.playingCard} ${['♥','♦'].includes(card.suit)?styles.redCard:''} ${hidden?styles.hiddenCard:''}`}>{hidden?<span/>:<><span>{card.rank}</span><span className={styles.suit}>{card.suit}</span></>}</div>;
}
