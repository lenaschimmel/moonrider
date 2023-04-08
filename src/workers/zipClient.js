var window = self;

// that `zip-loader` is the npm module and has nothing to do with our 
// `zip-loader.js` which loads this worker and sends messages to it.
import ZipLoader from 'zip-loader';
const difficulties = [];
const xhrs = {};

// Fetch and unzip.
addEventListener('message', function (evt) {
  const url = evt.data.url;

  // Abort.
  if (evt.data.abort && xhrs[url]) {
    console.log("Try to abort xhrs for " + url);
    xhrs[url].abort();
    console.log("Succeeded to abort xhrs for " + url);
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

    console.log("Found difficulties in info: ", difficulties);
    console.log("Found filenames in info: ", diffForFilename);

    // Extract files needed (beats and image).
    Object.keys(loader.files).forEach(filename => {
      let filenameLc = filename.toLowerCase();
      for (let i = 0; i < difficulties.length; i++) {
        let difficulty = difficulties[i];
        if (filenameLc.endsWith(`${difficulty.toLowerCase()}.json`)) {
          data.beats[difficulty] = loader.extractAsJSON(filename);
          console.log("Loaded difficulty " + difficulty + " via name pattern matching.");
        }
        if (diffForFilename[filenameLc] == difficulty) {
            data.beats[diffForFilename[filenameLc]] = loader.extractAsJSON(filename);
            data.beats[diffForFilename[filenameLc]]._beatsPerMinute = info._beatsPerMinute;
            console.log("Loaded difficulty " + difficulty + " via mapped name.");
        }
      }

      if (filenameLc.endsWith('.ogg') || filenameLc.endsWith('.egg')) {
        data.audio = loader.extractAsBlobUrl(filename, 'audio/ogg');
        console.log("Loaded audio");
      }
    });

    console.log("Finished parsing zip: ", data);

    postMessage({message: 'load', data: data, version: url});
    delete xhrs[url];
  });

  loader.load();
  xhrs[url] = loader.xhr;
});