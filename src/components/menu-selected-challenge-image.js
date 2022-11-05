import utils from '../utils';

AFRAME.registerComponent('menu-selected-challenge-image', {
  schema: {
    selectedChallenge: {type: 'string'}
  },

  update: function () {
    const el = this.el;
    if (!this.data.selectedChallengeId) { 
      return; 
    }
    // Copy from challenge store populated from search results.
    let challenge = state.menuSelectedChallenge;
    try {
      el.setAttribute('material', 'src', utils.getImageUrl(challenge));
    } catch(e) {
    }
  }
});
