#!/usr/bin/env node

// needed to make our command available globally using
//     $ npm link
// or  $ npm install -g
// This will also work on Windows, as npm will helpfully
// install a cmd wrapper alongside your script.

const fs = require('fs');
const readline = require('readline');

const gui = require('./lib/gui');
const util = require('./lib/util');
const youtube = require('./lib/youtube');

gui.start('YT Download');

const argv = require('minimist')(process.argv.slice(2));

// Usage:
// $ youtube-download [videos.txt] [--out=out-folder] [--format=mp3]

const concurrency = argv['queue'] || 3;
const format = argv['format'] || 'mp4';
const inFileName = argv._[0] || (format === 'mp3' ? 'music.txt' : 'videos.txt');
const outDirName = argv['out'] || (format === 'mp3' ? 'music' : 'videos');

const inFile = util.getInFile(inFileName);
const outDir = util.getOutDir(outDirName);

const downloader = youtube.createDownloader(outDir, concurrency, format);

const rl = readline.createInterface({
    input: fs.createReadStream(inFile),
});
rl.on('line', (line) => {
    gui.showStatus(line, `Queued ${line}`);
    downloader.get(line, function (error, result) {
        if (error) {
            gui.showStatus(line, `Failed to download ${line}`, { error: true });
            return;
        }

        if (result.started) {
            gui.showStatus(line, `...Processing ${line}`);
        } else if (result.ended) {
            gui.showStatus(line, `Finished download ${line}`, { success: true });
        } else if (result.info) {
            gui.startProgressStatus(line, `Downloading ${line} - ${result.info.title}`);
        }
    });
});


