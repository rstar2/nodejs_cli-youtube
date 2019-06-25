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
        // console.log(`Task ${id} starts`);
        this._listener(id, { started: true });

        let ffmpegCommand, streamPassThrough, outputStream;
        let isCalledFinish = false;
        const finish = (error) => {
            if (!isCalledFinish) {
                // console.log(`Task ${id} ${error ? 'failed' : 'finished'}`);
                this._listener(id, { error, ended: true });
                setImmediate(() => next(error));
                isCalledFinish = true;

                if (ffmpegCommand) {
                    ffmpegCommand.kill();
                }
                if (streamPassThrough) {
                    streamPassThrough.end();
                    streamPassThrough.unpipe(outputStream);
                }
                if (outputStream) {
                    outputStream.destroy();
                }
            }
        };

        ytdl.getInfo(ytdl.getVideoID(id))
            .then(info => {
                this._listener(id, { info });

                const output = path.resolve(this._outDir, sanitize(`${info.title}.${this._format}`));
                outputStream = fs.createWriteStream(output);

                // this will create a new pipe-able PassThrough stream
                streamPassThrough = ytdl.downloadFromInfo(info, this._options);
                streamPassThrough.on('error', error => {
                    // console.error('In-stream failed', error);
                    finish(error);
                });

                if (this._format === 'mp3') {
                    // console.error('Fmpeg start');
                    ffmpegCommand = ffmpeg(streamPassThrough)
                        .format('mp3')
                        .audioBitrate(128);
                    ffmpegCommand.on('error', error => {
                        // console.error('FFmpeg failed', error);
                        finish(error);
                    });
                    // this will create a new pipe-able PassThrough stream
                    streamPassThrough = ffmpegCommand.stream();
                        
                    streamPassThrough.on('error', error => {
                        // console.error('Stream failed', error);
                        finish(error);
                    });
                }
                
                //.on('progress', progress => listener(null, { progress }))
                streamPassThrough.on('end', () => {
                    // console.error('Stream ended');
                    finish(null);
                });

                outputStream.on('error', error => {
                    // console.error('Out-stream ended');
                    finish(error);
                });    

                streamPassThrough.pipe(outputStream);
            })
            .catch(error => {
                // console.error('YTDL error', error);
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

