const algoliasearch = require('algoliasearch/lite');
const debounce = require('lodash.debounce');

const BeatSaverAPI = require('beatsaver-api');
const beatsaver = new BeatSaverAPI({
  AppName: 'Lenas moonrider',
  Version: '0.1.0'
});

const client = algoliasearch('QULTOY3ZWU', 'be07164192471df7e97e6fa70c1d041d');
const algolia = client.initIndex('beatsaver');

const topSearch = require('../lib/search.json');

const filters = [];

/**
 * Search (including the initial list of popular searches).
 * Attached to super-keyboard.
 */
AFRAME.registerComponent('search', {
  schema: {
    difficultyFilter: {default: 'All'},
    genre: {default: ''},
    playlist: {default: ''},
    query: {default: ''}
  },

  init: function () {
    this.eventDetail = {query: '', results: topSearch};
    this.keyboardEl = document.getElementById('keyboard');
    this.popularHits = topSearch;
    shuffle(this.popularHits);
    this.queryObject = {hitsPerPage: 0, query: ''};
    this.el.sceneEl.addEventListener('searchclear', () => { this.search(''); });
  },

  update: function (oldData) {
    if (!this.popularHits) { return; }  // First load.

    this.search(this.data.query);

    // Clear keyboard.
    if (oldData.query && !this.data.query) {
      this.keyboardEl.components['super-keyboard'].data.value = '';
      this.keyboardEl.components['super-keyboard'].updateTextInput('');
    }

    this.debouncedSearch = debounce(this.search.bind(this), 1000);
  },

  play: function () {
    // Pre-populate top.
    this.el.sceneEl.emit('searchresults', this.eventDetail);

    // Populate popular.
    this.search('');
  },

  events: {
    superkeyboardchange: function (evt) {
      if (evt.target !== this.el) { return; }
      this.debouncedSearch(evt.detail.value);
    }
  },

  search: function (query) {
    // Use cached for popular hits.
    if (!query && this.data.difficultyFilter === 'All' && !this.data.genre &&
        !this.data.playlist && this.popularHits) {
      this.eventDetail.results = this.popularHits;
      this.eventDetail.query = '';
      console.log("about to emit searchresult: ", this.eventDetail);
      this.el.sceneEl.emit('searchresults', this.eventDetail);
      return;
    }

    this.eventDetail.query = query;
    this.queryObject.query = query;
    this.queryObject.hitsPerPage = query ? 30 : 150;

    // Favorites.
    if (this.data.playlist === 'favorites') {
      this.eventDetail.results = JSON.parse(localStorage.getItem('favorites'));
      this.el.sceneEl.emit('searchresults', this.eventDetail);
      return;
    }

    if (this.data.difficultyFilter || this.data.genre || this.data.playlist) {
      filters.length = 0;

      // Difficulty filter.
      if (this.data.difficultyFilter && this.data.difficultyFilter !== 'All') {
        filters.push(`difficulties:"${this.data.difficultyFilter}"`);
      }

      // Genre filter.
      if (this.data.genre === 'Video Games') {
        filters.push(`genre:"Video Game" OR genre:"Video Games"`);
      } else if (this.data.genre) {
        filters.push(`genre:"${this.data.genre}"`);
      }

      // Playlist filter.
      if (this.data.playlist) {
        filters.push(`playlists:"${this.data.playlist}"`);
      }

      this.queryObject.filters = filters.join(' AND ');
    } else {
      delete this.queryObject.filters;
    }

    if (query && query.length < 3) { return; }

    const maps = [];
    this.eventDetail.results = maps;
    this.el.sceneEl.emit('searchresults', this.eventDetail);
    this.performSearch(query, 0);
  },

  performSearch: function(query, page) {
    const searchPromise = beatsaver.searchMaps({
      sortOrder: 'Rating',
      q: query
    }, page);
  
    const queryLc = query.toLowerCase();
  
    searchPromise.then(response => {
      console.log("beatsaver results: ", response.docs);
      const maps = response.docs.filter(map =>
          map.metadata.songAuthorName.toLowerCase().includes(queryLc) ||
          map.metadata.songName.toLowerCase().includes(queryLc) ||
          map.metadata.songSubName.toLowerCase().includes(queryLc)
      );
  
      for (let map of maps) {
        map.songName = map.metadata.songName;
        map.songSubName = map.metadata.songAuthorName || map.metadata.songSubName;
        if (map.metadata.songAuthorName && map.metadata.songSubName) {
          map.songSubName = map.metadata.songAuthorName + " - " + map.metadata.songSubName;
        }
        map.bpm = map.metadata.bpm;
        map.author = map.metadata.levelAuthorName;
        map.songDuration = map.metadata.duration;
  
        map.difficulties = [];
        map.numBeats = {};
  
        let latestVersion = map.versions[map.versions.length - 1];
  
        map.key = latestVersion.key;
        map.coverURL = latestVersion.coverURL;
        map.previewURL = latestVersion.previewURL;
        map.downloadURL = latestVersion.downloadURL;
  
        for (let diff of latestVersion.diffs) {
          map.difficulties.push(diff.difficulty);
          map.numBeats[diff.difficulty] = diff.notes;
        }
      }
      this.eventDetail.results.push(...maps);

      let boolCompare = function(a, b) {
        if(a && !b) {
          return -1;
        }
        if(!a && b) {
          return 1;
        }
        return 0;
      }

      // Exact artist matches first
      // Then partial artist matches
      // Then unmatching artists
      // Within each artist, sort by song name
      this.eventDetail.results.sort((a,b) => (
        boolCompare(a.songSubName.toLowerCase() == queryLc, b.songSubName.toLowerCase() == queryLc) ||
        boolCompare(a.songSubName.toLowerCase().includes(queryLc), b.songSubName.toLowerCase().includes(queryLc)) ||
        ("" + a.songSubName.toLowerCase()).localeCompare(b.songSubName.toLowerCase()) || 
        ("" + a.songName.toLowerCase()).localeCompare(b.songName.toLowerCase())
      ));

      console.log("cleaned up beatsaver results: ", this.eventDetail.results);
      this.el.sceneEl.emit('searchresults', this.eventDetail);

      if (response.docs.length == 20 && page < 5) {
        this.performSearch(query, page + 1);
      }
    }).catch(error => {
      this.el.sceneEl.emit('searcherror', null, false);
      console.error(error);
      return;
    });
  }  
});

/**
 * Click listener for search result.
 */
AFRAME.registerComponent('search-result-list', {
  init: function () {
    const obv = new MutationObserver(mutations => {
      for (let i = 0; i < mutations.length; i++) {
        if (mutations[i].attributeName === 'data-index') {
          this.refreshLayout();
        }
      }
    });
    obv.observe(this.el, {attributes: true, childList: false, subtree: true});
  },

  events: {
    click: function (evt) {
      this.el.sceneEl.emit(
        'menuchallengeselect',
        evt.target.closest('.searchResult').dataset.id,
        false);
    }
  },

  refreshLayout: function () {
    this.el.emit('layoutrefresh', null, false);
  }
});

function shuffle (array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}