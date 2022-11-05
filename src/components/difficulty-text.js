// Unique difficulty naming.
AFRAME.registerComponent('difficulty-text', {
  schema: {
    difficulty: {value: 'Easy'}
  },

  update: function () {
    let text = '';
    switch (this.data.difficulty) {
      case 'All': {
        text = 'ALL';
        break;
      }
      case 'Easy': {
        text = 'EASY';
        break;
      }
      case 'Normal': {
        text = 'NORMAL';
        break;
      }
      case 'Hard': {
        text = 'HARD';
        break;
      }
      case 'Expert': {
        text = 'EXPERT';
        break;
      }
      case 'ExpertPlus': {
        text = 'EXPERT PLUS';
        break;
      }
      default: {
        text = 'SUPERNOVA';
      }
    }
    this.el.setAttribute('text', 'value', text);
  }
});
