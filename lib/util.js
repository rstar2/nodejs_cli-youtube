const fs = require('fs');
const path = require('path');

module.exports = {
    /**
     * Get file name relative to the current working directory (CWD)
     */
    getFile(pathName) {
        const file = path.resolve(process.cwd(), pathName);
        if (!fs.statSync(file).isFile())
            throw new Error(`Output path ${pathName} is already existing and is not a directory`);
        return file;
    },

    /**
     * Get folder name relative the current working directory (CWD)
     */
    getDir(pathName) {
        const dir = path.resolve(process.cwd(), pathName);
        if (fs.existsSync(dir)) {
            if (!fs.statSync(dir).isDirectory())
                throw new Error(`Output path ${pathName} is already existing and is not a directory`);
        } else {
            fs.mkdirSync(dir);
        }
        return dir;
    },
};