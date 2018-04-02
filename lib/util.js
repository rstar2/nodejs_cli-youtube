const fs = require('fs');
const path = require('path');

module.exports = {
    /**
     * Get the name of the current working directory (CWD)
     */
    getInFile(pathName) {
        const inFile = path.resolve(process.cwd(), pathName);
        if (!fs.statSync(inFile).isFile())
            throw new Error(`Output path ${pathName} is already existing and is not a directory`);
        return inFile;
    },

    /**
     * Get the name of the current working directory (CWD)
     */
    getOutDir(pathName) {
        const outDir = path.resolve(process.cwd(), pathName);
        if (fs.existsSync(outDir)) {
            if (!fs.statSync(outDir).isDirectory())
                throw new Error(`Output path ${pathName} is already existing and is not a directory`);
        } else {
            fs.mkdirSync(outDir);
        }
        return outDir;
    },
};