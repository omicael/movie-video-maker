const fs = require('fs')

async function save(content, filepath) {
    const contentString = JSON.stringify(content)
    const folderpath = filepath.substring(0, filepath.lastIndexOf('/'))

    await new Promise((resolve, reject) => { 
        fs.mkdir(folderpath, { recursive: true }, (err) => {
            if (err) {
                if (err.code == 'EEXIST') {
                    resolve()
                }
                else {
                    console.log(`< - erro na criacao da pasta ${folderpath}`)
                    console.log(err);
                    reject()
                }
            }
            else {
                resolve()
            }
        });
    })

    return await new Promise((resolve, reject) => {
        fs.writeFile(filepath, contentString, 'utf-8', (err) => {
            if (err) {
                console.log(`< - erro em salvar o arquivo ${filepath}`)
                console.log(err)
                reject()
            }
            else {
                resolve()
            }
        })
    })
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