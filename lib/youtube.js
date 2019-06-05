const fs = require('fs');
const path = require('path');

const { queue }= require('async');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');

const sanitize = require('sanitize-filename');

// NOT if MP3 format is selected in order the 'fluent-ffmpeg' to work it's needed
// to have installed FFMPEG on the machine and thus have 'ffmpeg' and 'ffprobe'
// executables in the PATH env variable

class Downloader {

    /**
     * TODO: Make Downloader inherit EventEmitter and don't use the 'listener'
     * @param {String} outDir 
     * @param {Function} listener listener/callback to be calls for events
     * @param {Number} concurrency 
     * @param {String} format 
     */
    constructor(outDir, listener, concurrency, format) {
        this._outDir = outDir;

        this._listener = listener;

        // create a queue object with concurrency
        this._queue = queue(this._runTask.bind(this), concurrency);

        // assign a drain/finished callback
        this._queue.drain(function() {
            console.log('all items have been processed');
        });

        // assign an error callback
        this._queue.error(function(err, task) {
            console.error('task experienced an error', err, task);
        });

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
     * 
     * @param {{String}} task to execute - it has an YouTube id and attached
     * @param {Function} next queue's 'next' callback - should be called when the task has finished (successfully or not)
     */
    _runTask({ id }, next) {
        this._listener(id, { started: true });

        let isCalledFinish = false;
        const finish = (error) => {
            if (!isCalledFinish) {
                this._listener(id, { error, ended: true });
                setImmediate(() => next(error));
                isCalledFinish = true;
            }
        };

        ytdl.getInfo(ytdl.getVideoID(id))
            .then(info => {
                this._listener(id, { info });

                const output = path.resolve(this._outDir, sanitize(`${info.title}.${this._format}`));
                const outputStream = fs.createWriteStream(output);

                let stream = ytdl.downloadFromInfo(info, this._options);

                let stream1;
                if (this._format === 'mp3') {
                    stream1 = ffmpeg(stream)
                        .format('mp3')
                        .audioBitrate(128)
                        .stream(); //this will create a pipe-able PassThrough stream
                }

                stream.on('error', error => {
                    finish(error);
                });

                stream1.on('error', error => {
                    finish(error);
                })
                    //.on('progress', progress => listener(null, { progress }))
                    .on('end', () => {
                        finish(null);
                    });

                outputStream.on('error', error => {
                    finish(error);
                });    

                stream1.pipe(outputStream);
            })
            .catch(error => {
                finish(error);
            });
    }

    get(id) {
        this._queue.push({ id });
    }
}

module.exports = {
    createDownloader(outDir, listener, concurrency = 3, format = 'mp4') {
        return new Downloader(outDir, listener, concurrency, format);
    }
};

