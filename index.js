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

const inFileName = argv._[0];
if (!inFileName) {
    gui.showError('Resource file with YouTube videos must be provided!');
    process.exit(1);
}
const inFile = util.getInFile(inFileName);
const outDir = util.getOutDir(argv['out'] || 'youtube');

const rl = readline.createInterface({
    input: fs.createReadStream(inFile),
});
const downloader = youtube.createDownloader(outDir);

require('draftlog').into(console);

rl.on('line', (id) => {

    gui.updateLine(id, 'Start');
    setTimeout(()=> gui.updateLine(id, 'Finish ' + id), 2000);

    // downloader.get(id, (error, result) => {
    //     if (error) return gui.showError(`Failed to download video ${id}`);

    //     if (result.end) {
    //         gui.showSuccess(`Download video ${id} - ${result}`);
    //     } else if (result.info) {

    //     } else if (result.progress) {

    //     }

    // });
});


