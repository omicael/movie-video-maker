const fs = require('fs')

function save(content, filepath) {
    const contentString = JSON.stringify(content)
    fs.mkdir(filepath.substring(0, filepath.lastIndexOf('/')), { recursive: true }, (err) => {
        if (err) throw err;
    });
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