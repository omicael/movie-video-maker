const imageDownloader = require('image-downloader')
const settings = require('../settings/general-settings.json')
const fs = require('fs')

async function robot(movieContent) {
    creatingFolder(settings.moviesPath + movieContent.id + '/images/')
    await downloadAllImages(movieContent)
    
    async function creatingFolder(filePath) {
        if (!fs.existsSync(filePath)) {
            await new Promise((resolve, reject) => { 
                fs.mkdir(filePath.substring(0, filePath.lastIndexOf('/')), { recursive: true }, (err) => {
                    if (err) {
                        console.log(err);
                        reject()
                    }
                    else {
                        resolve()
                    }
                });
            })
        }
    }

    async function downloadAllImages(movieContent) {
        console.log('> Downloading images')

        /* trata se não encontrar nenhuma imagem */
        if (movieContent.images.length == 0) {
            movieContent.images.push(settings.video.blackImage)
        }


        for (let imageIndex = 0; imageIndex < settings.quantityOfImages; imageIndex++){
            try {
                const baseImageUrl = (movieContent.images[imageIndex % movieContent.images.length][0] == '/') ? settings.TMDBimagePath : ''
                const imageUrl = baseImageUrl + movieContent.images[imageIndex % movieContent.images.length]

                await downloadAndSave(imageUrl, settings.moviesPath + movieContent.id + '/images/' + imageIndex + '-original.png')
            } catch (error) {
                console.log(`> [${imageIndex}] Erro ao baixar (${movieContent.images[imageIndex % movieContent.images.length]}): ${error}`)
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