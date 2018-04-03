const fs = require('fs');
const path = require('path');

const queue = require('async').queue;
const ytdl = require('ytdl-core');

const options = { filter: (format) => format.container === 'mp4' };

class Downloader {
    constructor(outDir, concurrency) {
        this._outDir = outDir;

        // create a queue object with concurrency
        this._queue = queue(this._runTask.bind(this), concurrency);
    }

    /**
     * Executes a given task.
     * @param {{String, Function}} task to execute - it has an YouTube id and attached listener/callback to be calls for events
     * @param {Function} next queue's 'next' callback - should be called when the task has finished (successfully or not)
     */
    _runTask({ id, listener }, next) {
        listener(null, { started: true });

        ytdl.getInfo(ytdl.getVideoID(id))
            .then(info => {
                listener(null, { info });
                const output = path.resolve(this._outDir, `${info.title}.mp4`);

                const stream = ytdl.downloadFromInfo(info, options);
                stream.pipe(fs.createWriteStream(output));

                stream.on('error', error => {
                    console.log(2, error);
                    listener(error);
                    next(error);
                });
                stream.on('end', () => {
                    listener(null, { ended: true });
                    next();
                });
                stream.on('progress', progress => listener(null, { progress }));
            })
            .catch(error => {
                listener(error);
                next(error);
            });
    }

    get(id, listener) {
        this._queue.push({ id, listener });
    }
}

module.exports = {
    createDownloader(outDir, concurrency = 3) {
        return new Downloader(outDir, concurrency);
    }
};

