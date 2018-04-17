const fs = require('fs');
const path = require('path');

const queue = require('async').queue;
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');

class Downloader {
    constructor(outDir, concurrency, format) {
        this._outDir = outDir;

        // create a queue object with concurrency
        this._queue = queue(this._runTask.bind(this), concurrency);

        this._format = format;
        if (format === 'mp3') {
            this._options = {
                quality: 'highestaudio',
                // filter: 'audioonly',
            };
        } else {
            this._options = {
                filter: (format) => format.container === this._format
            };
        }
    }

    /**
     * Executes a given task.
     * TODO: Make Downloader inherit EventEmitter and don't use the 'listener'
     * @param {{String, Function}} task to execute - it has an YouTube id and attached listener/callback to be calls for events
     * @param {Function} next queue's 'next' callback - should be called when the task has finished (successfully or not)
     */
    _runTask({ id, listener }, next) {
        listener(null, { started: true });

        ytdl.getInfo(ytdl.getVideoID(id))
            .then(info => {
                listener(null, { info });


                const output = path.resolve(this._outDir, `${info.title}.${this._format}`);


                const stream = ytdl.downloadFromInfo(info, this._options);

                // TODO: implement
                // ffmpeg(stream)
                //     .audioBitrate(128)
                //     .save(`${__dirname}/${id}.mp3`)
                //     .on('progress', (p) => {
                //     })
                //     .on('end', () => {
                        
                stream
                .pipe(fs.createWriteStream(output))
                .on('error', error => {
                    console.log(2, error);
                    listener(error);
                    next(error);
                })
                .on('progress', progress => listener(null, { progress }))
                .on('end', () => {
                    listener(null, { ended: true });
                    next();
                });
                
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
    createDownloader(outDir, concurrency = 3, format = 'mp4') {
        return new Downloader(outDir, concurrency, format);
    }
};

