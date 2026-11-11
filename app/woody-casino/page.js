'use client';

import { useState } from 'react';
import WalletConnectPanel from '../app/WalletConnectPanel';
import styles from './WoodyMiniGames.module.css';

const STARTING_CREDITS = 1000;
const ICONS = ['🍒', '🍋', '🍇', '🍉', '⭐', '🌿'];
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
  const [reels, setReels] = useState(['🍒','⭐','🌿']);
  const [rouletteColor, setRouletteColor] = useState('red');
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [cards, setCards] = useState(null);
  const [message, setMessage] = useState('Alege un joc și încearcă-l cu credite demonstrative.');
  const [messageType, setMessageType] = useState('');

  const setNotice = (text, type = '') => { setMessage(text); setMessageType(type); };
  const setBet = amount => setWager(current => Math.max(5, Math.min(200, current + amount)));
  const beginRound = () => {
    if (credits < wager) { setNotice('Nu ai suficiente credite demo. Resetează jocul pentru a primi 1.000.', 'loss'); return false; }
    setCredits(current => current - wager);
    return true;
  };
  const pay = amount => setCredits(current => current + amount);
  const reset = () => { setCredits(STARTING_CREDITS); setWager(25); setCards(null); setSpinning(false); setWheelSpinning(false); setNotice('Demo resetat. Ai primit 1.000 de credite fictive.'); };

  const playSlots = () => {
    if (spinning || !beginRound()) return;
    setSpinning(true); setNotice('Rolele se învârt…');
    const result = Array.from({length:3}, () => ICONS[Math.floor(Math.random()*ICONS.length)]);
    window.setTimeout(() => {
      setReels(result); setSpinning(false);
      const counts = result.reduce((acc, icon) => (acc[icon] = (acc[icon] || 0) + 1, acc), {});
      const matches = Math.max(...Object.values(counts));
      if (matches === 3) { const prize = wager * 8; pay(prize); setNotice(`Trei simboluri potrivite! +${prize} credite demo.`, 'win'); }
      else if (matches === 2) { const prize = wager * 2; pay(prize); setNotice(`Două simboluri potrivite! +${prize} credite demo.`, 'win'); }
      else setNotice(`De data aceasta nu s-au potrivit. Ai folosit ${wager} credite demo.`, 'loss');
    }, 750);
  };

  const playWheel = () => {
    if (wheelSpinning || !beginRound()) return;
    setWheelSpinning(true); setNotice('Roata se învârte…');
    const outcome = ['red','black','red','black','green'][Math.floor(Math.random()*5)];
    window.setTimeout(() => {
      setWheelSpinning(false);
      if (outcome === rouletteColor) { const prize = wager * (outcome === 'green' ? 4 : 2); pay(prize); setNotice(`A ieșit ${outcome === 'red' ? 'ROȘU' : outcome === 'black' ? 'NEGRU' : 'VERDE'}! +${prize} credite demo.`, 'win'); }
      else setNotice(`A ieșit ${outcome === 'red' ? 'ROȘU' : outcome === 'black' ? 'NEGRU' : 'VERDE'}. Încearcă din nou.`, 'loss');
    }, 1250);
  };

  const finishBlackjack = (player, dealer, pushIfEqual = true) => {
    const playerTotal = handValue(player), dealerTotal = handValue(dealer);
    if (playerTotal > 21) { setCards({player, dealer, done:true}); setNotice(`Ai trecut de 21 (${playerTotal}).`, 'loss'); }
    else if (dealerTotal > 21 || playerTotal > dealerTotal) { const prize = wager * 2; pay(prize); setCards({player, dealer, done:true}); setNotice(`Ai câștigat runda: ${playerTotal} la ${dealerTotal}. +${prize} credite demo.`, 'win'); }
    else if (playerTotal === dealerTotal && pushIfEqual) { pay(wager); setCards({player, dealer, done:true}); setNotice(`Egalitate: ${playerTotal} la ${dealerTotal}. Miza demo revine.`, ''); }
    else { setCards({player, dealer, done:true}); setNotice(`Dealerul câștigă: ${playerTotal} la ${dealerTotal}.`, 'loss'); }
  };
  const startBlackjack = () => {
    if (cards && !cards.done || !beginRound()) return;
    const player = [randomCard(), randomCard()], dealer = [randomCard(), randomCard()];
    if (handValue(player) === 21) finishBlackjack(player, dealer);
    else { setCards({player, dealer, done:false}); setNotice('Trage o carte sau oprește-te.'); }
  };
  const hit = () => { if (!cards || cards.done) return; const player = [...cards.player, randomCard()]; if (handValue(player) > 21) finishBlackjack(player, cards.dealer); else { setCards({...cards, player}); setNotice('Trage o carte sau oprește-te.'); } };
  const stand = () => { if (!cards || cards.done) return; const dealer = [...cards.dealer]; while (handValue(dealer) < 17) dealer.push(randomCard()); finishBlackjack(cards.player, dealer); };

  const chooseGame = id => { setGame(id); setCards(null); setNotice('Alege miza demo și începe o rundă.'); setMessageType(''); };
  const play = () => game === 'slots' ? playSlots() : game === 'roulette' ? playWheel() : startBlackjack();
  const title = game === 'slots' ? 'Fructe norocoase' : game === 'roulette' ? 'Roata pădurii' : 'Blackjack';

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
            {game==='slots' && <div className={styles.reels}>{reels.map((icon,i)=><div key={i} className={`${styles.reel} ${spinning?styles.bounce:''}`}>{spinning?'✦':icon}</div>)}</div>}
            {game==='roulette' && <><span className={styles.pointer}>▼</span><div className={`${styles.wheel} ${wheelSpinning?styles.spin:''}`}><span>W</span></div><div className={styles.colors}>{[['red','RED'],['black','BLACK'],['green','GREEN']].map(([color,label])=><button key={color} onClick={()=>setRouletteColor(color)} className={`${styles.color} ${styles[color]} ${rouletteColor===color?styles.colorActive:''}`} aria-pressed={rouletteColor===color}>{label}</button>)}</div></>}
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
