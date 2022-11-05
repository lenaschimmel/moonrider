var utils = require('../utils');

const PREVIEW_VOLUME = 0.5;

/**
 * Song previews.
 */
AFRAME.registerComponent('song-preview-system', {
  schema: {
    previewStartTime: {type: 'int'},
    selectedChallengeId: {type: 'string'}
  },

  init: function () {
    this.audio = document.createElement('audio');
    this.audio.volume = PREVIEW_VOLUME;
  },

  update: function (oldData) {
    const data = this.data;

    this.audio.pause();

    if (data.selectedChallengeId && oldData.selectedChallengeId !== data.selectedChallengeId) {
      // Copy from challenge store populated from search results.
      let challenge = state.menuSelectedChallenge;
      let audioUrl = utils.getAudioUrl(challenge);
      this.audio.setAttribute('src', audioUrl);
      this.audio.currentTime = data.previewStartTime;
      this.audio.play();
    }
  },
});
