const fs = require('fs');
const path = require('path');

const ytdl = require('ytdl-core');
// https://github.com/fent/node-ytdl-core

const options = { filter: (format) => format.container === 'mp4' };

class Downloader {
    constructor(outDir) {
        this.outDir = outDir;
    }

    get(id, callback) {
        console.log('Download', id)

        id = ytdl.getVideoID(id);
        ytdl.getInfo(id).then(info => {
            callback(null, { info });
            const output = path.resolve(this.outDir, `${info.title}`);

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

