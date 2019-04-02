const imageDownloader = require('image-downloader')
const settings = require('../settings/general-settings.json')
const fs = require('fs')

async function robot(movieContent) {
    creatingFolder(settings.moviesPath + movieContent.id + '/images/')
    await downloadAllImages(movieContent)
    console.log('> download das imagens concluido')

    function creatingFolder(filePath) {
        if (!fs.existsSync(filePath)) {
            fs.mkdir(filePath.substring(0, filePath.lastIndexOf('/')), { recursive: true }, (err) => {
                if (err) throw err;
            });
            console.log('pasta criada')
        }
    }

    async function downloadAllImages(movieContent) {
        for (let imageIndex = 0; imageIndex < movieContent.images.length; imageIndex++){
            try {
                await downloadAndSave(settings.TMDBimagePath + movieContent.images[imageIndex], settings.moviesPath + movieContent.id + '/images/' + imageIndex + '-original.png')
            } catch (error) {
                console.log(`> [${imageIndex}] Erro ao baixar (${movieContent.images[imageIndex]}): ${error}`)
            }
        }
    }

    async function downloadAndSave(url, fileName) {
        return imageDownloader.image({
            url, url,
            dest: fileName
        })
    }
}

module.exports = robot