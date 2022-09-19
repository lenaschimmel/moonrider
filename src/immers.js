// loads and registers immers-hud custom element
import 'immers-client/dist/ImmersHUD.bundle';
import { catchToken } from 'immers-client';
catchToken();

export function initImmers () {
  const hud = document.querySelector('immers-hud');
  // update state after user logs in
  hud.addEventListener('immers-hud-connected', evt => {
    document.body.classList.add('immersConnected');
    scene().emit('login');
    findChessMatch(hud.immersClient);
  }, { once: true });
}

export function postScoreToImmers (score, challenge) {
  const to = [];
  const chessOpponent = scene().systems.state.state.chessGame.opponent;
  if (chessOpponent) {
    to.push(chessOpponent);
  }
  const client = document.querySelector('immers-hud').immersClient;
  const song = `<strong>${challenge.songName}</strong> <em>${challenge.songSubName}</em> by ${challenge.author}`;
  const description = `${client.profile.displayName} scored ` +
    `${score.score.toFixed(0)} points (rank ${score.rank}) ` +
    `on ${song} ` +
    `- ${challenge.difficulty} mode`;
  client.activities.create({
    type: 'Score',
    summary: description,
    points: score.score,
    rank: score.rank,
    difficulty: challenge.difficulty,
    songId: challenge.id,
    song
  }, to, 'public', description);
}

/**
 * @param  {import('immers-client').ImmersClient} immersClient
 */
async function findChessMatch (immersClient) {
  let chessState;
  let page;
  while (!chessState && (page = await immersClient.activities.outbox())) {
    for (const activity of page.orderedItems) {
      if (activity.object?.type === 'ChessGameState') { // TODO confirm object type
        chessState = activity;
        break;
      }
    }
  }
  if (!chessState) {
    // TODO: set error state
    return;
  }

  const returnLink = chessState.context.url;
  const opponent = chessState.object.opponent;
  scene().emit('chessGameState', { returnLink, opponent });
}

let sceneEl;
function scene () {
  if (sceneEl) {
    return sceneEl;
  }
  return (sceneEl = document.querySelector('a-scene'));
}
