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

let argv = require('minimist')(process.argv.slice(2));

// Usage:
// $ youtube-download 'videos.txt' out='youtube'

const inFileName = argv._[0] || 'videos.txt';
const inFile = util.getInFile(inFileName);
const outDir = util.getOutDir(argv['out'] || 'youtube');
const concurrency = argv['queue'] || 3;

const rl = readline.createInterface({
    input: fs.createReadStream(inFile),
});
const downloader = youtube.createDownloader(outDir, concurrency);

rl.on('line', (line) => {
    gui.showStatus(line, `Queued video ${line}`);
    downloader.get(line, function (error, result) {
        if (error) {
            gui.showStatus(line, `Failed to download video ${line}`, { error: true });
            return;
        }

        if (result.started) {
            gui.showStatus(line, `...Processing video ${line}`);
        } else if (result.ended) {
            gui.showStatus(line, `Finished download video ${line}`, { success: true });
        } else if (result.info) {
            gui.startProgressStatus(line, `Downloading video ${line} - ${result.info.title}`);
        }
    });
});


