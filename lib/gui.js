const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');

require('draftlog').into(console);

const drafts = new Map();

module.exports = {
    start(banner) {
        clear();
        // log a fancy ASCII text banner
        console.log(chalk.yellow(figlet.textSync(banner,
            { horizontalLayout: 'full' })));
    },

    showError(error) {
        console.log(chalk.red(error));
    },

    showSuccess(result) {
        console.log(chalk.green(result));
    },


    updateLine(id, message) {
        let draft = drafts.get(id);
        if (!draft) {
           // create
            draft = console.draft(id, message);
           
           drafts.set(id, draft);
        } else {
            draft(message);
        }
    }
};