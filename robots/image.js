const imageDownloader = require('image-downloader')
const settings = require('../settings/general-settings.json')
const fs = require('fs')
const path = require('path')

async function robot(movieContent) {
    await creatingFolder(path.normalize(__dirname + '/../' + settings.moviesPath + movieContent.id + '/images/'))
    console.log('< - acabou a funcao')
    await downloadAllImages(movieContent)
    
    async function creatingFolder(filePath) {
        await new Promise((resolve, reject) => { 
            fs.mkdir(filePath.substring(0, filePath.lastIndexOf('/')), { recursive: true }, (err) => {
                if (err) {
                    if (err.code == 'EEXIST') {
                        /* pasta ja existia */
                        console.log('< - pasta existia')
                        resolve()
                    }
                    else {
                        console.log('erro na criação da pasta images')
                        console.log(err)
                        throw err
                        reject()
                    }
                }
                else {
                    console.log('< - pasta criada')
                    resolve()
                }
            });
        })
    }

    async function downloadAllImages(movieContent) {
        console.log('> Downloading images')

        /* trata se não encontrar nenhuma imagem */
        if (movieContent.images.length == 0) {
            movieContent.images.push(settings.video.blackImage)
        }


        for (let imageIndex = 0; imageIndex < settings.quantityOfImages; imageIndex++){
            const baseImageUrl = (movieContent.images[imageIndex % movieContent.images.length][0] == '/') ? settings.TMDBimagePath : ''
            const imageUrl = baseImageUrl + movieContent.images[imageIndex % movieContent.images.length]
            
            var erro = true
            for (let tentativa = 0; tentativa < 11 && erro; tentativa++) {
                try {
                    await downloadAndSave(imageUrl, settings.moviesPath + movieContent.id + '/images/' + imageIndex + '-original.png')
                    erro = false
                } catch (error) {
                    console.log(`> [${imageIndex}] Erro ao baixar (${movieContent.images[imageIndex % movieContent.images.length]}): ${error} - Tentativa [${tentativa}]`)
                    tentativa++
                }
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