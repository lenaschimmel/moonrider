var window = self;

import ZipLoader from 'zip-loader';
const difficulties = [];
const xhrs = {};

// Fetch and unzip.
addEventListener('message', function (evt) {
  const url = evt.data.url;

  // Abort.
  if (evt.data.abort && xhrs[url]) {
    xhrs[url].abort();
    delete xhrs[url];
    return;
  }

  // Unzip.
  const loader = new ZipLoader(url);

  loader.on('error', err => {
    postMessage({message: 'error'});
  });

  loader.on('progress', evt => {
    postMessage({message: 'progress', progress: evt.loaded / evt.total, version: url});
  });

  loader.on('load', () => {
    let imageBlob;
    let songBlob;

    const data = {audio: null, beats: {}};

    let info;
    Object.keys(loader.files).forEach(filename => {
        console.log("Found file: ", filename);
      if (!filename.toLocaleLowerCase().endsWith('info.json') && !filename.toLowerCase().endsWith('info.dat')) { return; }
      info = loader.extractAsJSON(filename);
    });

    console.log("Read info from zip: ", info);

    let diffForFilename = {};

    // Get difficulties from info.json.
    difficulties.length = 0;
    if (info.difficultyLevels) {
        for (let i = 0; i < info.difficultyLevels.length; i++) {
            difficulties.push(info.difficultyLevels[i].difficulty);
        }
    } else if (info._difficultyBeatmapSets) {
        for (let set of info._difficultyBeatmapSets) {
            if (set._beatmapCharacteristicName == "Standard") {
                for (let beatmap of set._difficultyBeatmaps) {
                    let difficulty = beatmap._difficulty;
                    difficulties.push(difficulty);
                    diffForFilename[beatmap._beatmapFilename.toLowerCase()] = difficulty;
                }
            }
        }
    }

    // Extract files needed (beats and image).
    Object.keys(loader.files).forEach(filename => {
      let filenameLc = filename.toLowerCase();
      for (let i = 0; i < difficulties.length; i++) {
        let difficulty = difficulties[i];
        if (filenameLc.endsWith(`${difficulty.toLowerCase()}.json`)) {
          data.beats[difficulty] = loader.extractAsJSON(filename);
        }
        if (diffForFilename[filenameLc]) {
            data.beats[diffForFilename[filenameLc]] = loader.extractAsJSON(filename);
            data.beats[diffForFilename[filenameLc]]._beatsPerMinute = info._beatsPerMinute;
        }
      }

      if (filenameLc.endsWith('.ogg') || filenameLc.endsWith('.egg')) {
        data.audio = loader.extractAsBlobUrl(filename, 'audio/ogg');
      }
    });

    console.log("Finished parsing zip: ", data);

    postMessage({message: 'load', data: data, version: url});
    delete xhrs[url];
  });

  loader.load();
  xhrs[url] = loader.xhr;
});