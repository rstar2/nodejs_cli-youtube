import { toUnicode } from 'punycode';

const fs = require('fs');
const path = require('path');

const queue = require('async').queue;
const ytdl = require('ytdl-core');

const options = { filter: (format) => format.container === 'mp4' };

class Downloader {
    constructor(outDir, concurrency = 3) {
        this.outDir = outDir;
        // TODO: use a max concurrency queue
        this.concurrency = concurrency;
    }

    get(id, callback) {
        id = ytdl.getVideoID(id);
        ytdl.getInfo(id).then(info => {
            callback(null, { info });
            const output = path.resolve(this.outDir, `${info.title}.mp4`);

            const stream = ytdl.downloadFromInfo(info, options);
            stream.pipe(fs.createWriteStream(output));

            stream.on('end', () => callback(null, { end: true }));
            stream.on('progress', (progress) => callback(null, { progress }));
            stream.on('error', (error) => callback(error));
        }).catch(error => callback(error));
    }
}

module.exports = {
    createDownloader(outDir) {
        return new Downloader(outDir);
    }
};

