const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');

require('draftlog').into(console);

const drafts = new Map();

const createError = chalk.red;
const createSuccess = chalk.green;

const spinner = {
    'interval': 130,
    'frames': ['-', '\\', '|', '/']
};

module.exports = {
    start(banner) {
        clear();
        // log a fancy ASCII text banner
        console.log(chalk.yellow(figlet.textSync(banner,
            { horizontalLayout: 'full' })));
    },

    showError(error) {
        console.log(createError(error));
    },

    showSuccess(result) {
        console.log(createSuccess(result));
    },

    showStatus(id, message, opts = {}) {
        if (opts.error === true) message = createError(message);
        else if (opts.success === true) message = createSuccess(message);

        let draft = drafts.get(id);
        if (!draft) {
            // create
            draft = console.draft();

            drafts.set(id, draft);
        }

        // stop current progress if already a simple message is to be shown
        // or if a new progress is started
        if (draft.interval) {
            if (!opts.interval || draft.interval !== opts.interval) {
                clearInterval(draft.interval);
                delete draft.interval;
            }
        }
        draft.interval = opts.interval;


        draft(message);
    },

    startProgressStatus(id, message) {
        let frame = 0;
        const progress = () => {
            frame = ++frame % spinner.frames.length;
            this.showStatus(id, spinner.frames[frame] + ' ' + message, { interval });
        };

        const interval = setInterval(progress, spinner.interval);

        // we have to call the progress immediately also in order the interval to be saved
        // and thus to be able to be clearer on error if the error happens before the first setInterval() tick
        progress();
    }
};