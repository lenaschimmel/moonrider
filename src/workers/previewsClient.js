var window = self;

const difficulties = [];

// Fetch and unzip.
addEventListener('message', function (evt) {
  console.log("zip.js gets data: ", evt.data);
  const difficulties = JSON.parse(evt.data.difficulties);
  const version = evt.data.version;

  const [short] = version.split('-');
  const requests = difficulties.map(diff =>
    fetch(`https://previews.moonrider.xyz/${short}-${diff}.json`).then(res => res.json())
  );

  Promise.all(requests).then(values => {
    const data = {
      audio: `https://previews.moonrider.xyz/${short}-song.ogg`,
      beats: {}
    };

    difficulties.forEach((diff, i) => {
      data.beats[diff] = values[i];
    });

    postMessage({message: 'load', data: data, version: version});
  });
});

// data: {audio url, beats { difficulty JSONs },
