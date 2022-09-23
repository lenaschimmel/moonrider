// loads and registers immers-hud custom element
import 'immers-client/dist/ImmersHUD.bundle';
import { catchToken } from 'immers-client';
import DOMPurify from 'dompurify';

catchToken();

export function initImmers () {
  const hud = document.querySelector('immers-hud');
  // update state after user logs in
  hud.addEventListener('immers-hud-connected', evt => {
    document.body.classList.add('immersConnected');
    scene().emit('login');
    findChessMatch(hud.immersClient);
  }, { once: true });
  document.querySelector('#loginNotice')
    .addEventListener('click', () => hud.login());
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
      if (activity.object?.type === 'ChessGame') {
        chessState = activity;
        break;
      }
    }
  }
  if (!chessState) {
    // TODO: set error state
    return;
  }
  console.log('finished chess state search', chessState);

  const returnLink = chessState.object.context.url;
  const { black, white } = chessState.object;
  const opponent = black === immersClient.profile.id ? white : black;
  const board = chessState.summary;
  scene().emit('chessGameState', { returnLink, opponent, board });
  document.getElementById('subscribeForm').style.display = 'block';
  document.getElementById('chessBoardDisplay').innerHTML = DOMPurify.sanitize(board);
}

let sceneEl;
function scene () {
  if (sceneEl) {
    return sceneEl;
  }
  return (sceneEl = document.querySelector('a-scene'));
}
