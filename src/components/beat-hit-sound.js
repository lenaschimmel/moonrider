import { loadSounds, context } from '../lib/BufferLoader'

var sourceCreatedCallback;

const LAYER_BOTTOM = 'bottom';
const LAYER_MIDDLE = 'middle';
const LAYER_TOP = 'top';
const VOLUME = 0.185;

/**
 * Beat hit sound using positional audio and audio buffer source.
 */
AFRAME.registerComponent('beat-hit-sound', {
  directionsToSounds: {
    up: '',
    down: '',
    upleft: 'left',
    upright: 'right',
    downleft: 'left',
    downright: 'right',
    left: 'left',
    right: 'right'
  },

  init: function () {
    this.context = new AudioContext();
    this.sounds = [];

    let soundSources = {};
    for (let i = 1; i <= 10; i++) {
      soundSources[`hitSound${i}`] = `/assets/sounds/hit${i}.ogg`;
      soundSources[`hitSound${i}left`] = `/assets/sounds/hit${i}left.ogg`;
      soundSources[`hitSound${i}right`] = `/assets/sounds/hit${i}right.ogg`;
    }

    loadSounds(this.sounds, soundSources, () => { console.log("loadSounds finished"); });
  },

  play: function () {
    // nothing to do here
  },

  playSound: function (beatEl, position, cutDirection) {
    const rand = 1 + Math.floor(Math.random() * 10);
    const dir = this.directionsToSounds[cutDirection || 'up'];
    const soundName = `hitSound${rand}${dir}`;
    console.log("Play sound", this.sounds, soundName);

    var source = context.createBufferSource();
    source.buffer = this.sounds[soundName];
    let layer = this.getLayer(position.y)
    if (layer === LAYER_BOTTOM) {
      source.playbackRate.value = 0.8;
    } else if (layer === LAYER_TOP) {
      source.playbackRate.value = 1.2;
    }
    source.playbackRate.value += Math.random() * 0.075;

    const gainNode = context.createGain();
    gainNode.gain.value = 0.3;
    source.connect(gainNode).connect(context.destination);

    source.start(0);
  },

  /**
   * Set audio stuff before playing.
   */
  processSound: function (audio) {
    //audio.detune = 0;
  },

  /**
   * Function callback to process source buffer once created.
   * Set detune for pitch and inflections.
   */
  sourceCreatedCallback: function (source) {
    // // Pitch based on layer.
    // const layer = this.getLayer(this.currentBeatEl.object3D.position.y);
    // if (layer === LAYER_BOTTOM) {
    //   source.detune.setValueAtTime(-400, 0);
    // } else if (layer === LAYER_TOP) {
    //   source.detune.setValueAtTime(200, 0);
    // }

    // // Inflection on strike down or up.
    // if (this.currentCutDirection === 'down') {
    //   source.detune.linearRampToValueAtTime(-400, 1);
    // }
    // if (this.currentCutDirection === 'up') {
    //   source.detune.linearRampToValueAtTime(400, 1);
    // }
	},

  /**
   * Get whether beat is on bottom, middle, or top layer.
   */
  getLayer: function (y) {
    if (y === 1) { return LAYER_BOTTOM; }
    if (y === 1.70) { return LAYER_TOP; }
    return LAYER_MIDDLE;
  }
});
