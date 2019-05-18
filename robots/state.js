const fs = require('fs')

async function save(content, filepath) {
    const contentString = JSON.stringify(content)
    const folderpath = filepath.substring(0, filepath.lastIndexOf('/'))
    if (!fileExists(folderpath)) {
        await new Promise((resolve, reject) => { 
            fs.mkdir(folderpath, { recursive: true }, (err) => {
                if (err) {
                    throw err;
                    reject()
                }
                else {
                    resolve()
                }
            });
        })
    }
    return fs.writeFileSync(filepath, contentString)
}

function load(filepath) {
    const fileBuffer = fs.readFileSync(filepath, 'utf-8')
    const contentJson = JSON.parse(fileBuffer)
    return contentJson
}

function fileExists(filepath) {
    if (fs.existsSync(filepath))
        return true
    else 
        return false
}

module.exports = {
    save,
    load,
    fileExists
}