const gm = require('gm').subClass({imageMagick: true})  
const path = require('path')
const settings = require('../settings/general-settings.json')
const os = require('os')
const state = require('../robots/state.js')
const fs = require('fs')
const spawn = require('child_process').spawn

async function robot(movieContent) {
    await convertAllImages(movieContent)
    await createAllSentenceImages(movieContent)
    await createAllYouTubeThumbnails(movieContent)
    await createVideos(movieContent)
    await joinVideoWithVideoAfterMovie(movieContent)
    
    
    async function convertAllImages(movieContent) {
        for (let imageIndex = 0; imageIndex < settings.quantityOfImages; imageIndex++) {
            await convertImage(imageIndex, movieContent.id)
            await removeOriginalImage(imageIndex, movieContent.id)
        }
    }

    async function convertImage(imageIndex, movieId) {
        return new Promise((resolve, reject) => {
            const inputFile = path.normalize(`${__dirname}/../${settings.moviesPath}${movieId}/images/${imageIndex}-original.png[0]`)
            const outputFile = path.normalize(`${__dirname}/../${settings.moviesPath}${movieId}/images/${imageIndex}-converted.jpg`)
            const width = settings.video.videoSize.width
            const height = settings.video.videoSize.height

            gm()
              .in(inputFile)
            
              /* (i) - fundo borrado*/
              .out('(')
                  .out('-clone')
                  .out('0')
                  .out('-background', 'white')
                  .out('-blur', '0x9')
                  .out('-resize', `${width}x${height}^`)
              .out(')')

              /* (ii) - parte da frente com a resolucao normal*/
              .out('(')
                  .out('-clone')
                  .out('0')
                  .out('-background', 'white')
                  .out('-resize', `${width}x${height}`)
              .out(')')

              /* (iii) - juncao (i) e (ii) */
              .out('-delete', '0')
              .out('-gravity', 'center')
              .out('-compose', 'over')
              .out('-composite')
              .out('-extent', `${width}x${height}`)

              /* salva a imagem */
              .write(outputFile, (error) => {
              if (error) {
                  console.log(error)
                  return reject(error)
              }
              console.log(`> image converted: ${inputFile}`)
              resolve()
              })
        })
    }

    async function removeOriginalImage(imageIndex, movieId) {
        return new Promise((resolve, reject) => {
            fs.unlinkSync(path.normalize(`${__dirname}/../${settings.moviesPath}${movieId}/images/${imageIndex}-original.png`), function (err) {
              if (err) {
                reject()
              }
            })
            resolve()
        })
    }

    async function createAllSentenceImages(movieContent) {
        for (let imageIndex = 0; imageIndex < settings.quantityOfImages; imageIndex++) {
            await createSentenceImage(imageIndex, movieContent.id, 'youtube')
            await createSentenceImage(imageIndex, movieContent.id, 'twitch')
        }
    }

    async function createSentenceImage(imageIndex, movieId, service) {
        return new Promise((resolve, reject) => {
            const inputFile = path.normalize(`${__dirname}/../${settings.moviesPath}${movieId}/images/${imageIndex}-converted.jpg[0]`)
            const captionModel = path.normalize(`${__dirname}/../content/caption-model-${service}.png`)
            const outputFile = path.normalize(`${__dirname}/../${settings.moviesPath}${movieId}/images/${imageIndex}-sentence-${service}.jpg`)
            
            const width = settings.video.videoSize.width
            const height = settings.video.videoSize.height
            

            gm()
              
              /* (i) - imagem do filme */
              .out('(')
                .out(`${inputFile}`)
              .out(')')

              /* (ii) - imagem da legenda com fundo transparente */
              .out('(')
                .out(`${captionModel}`)
                .out('-background', 'transparent')
              .out(')')
              
              /* (iii) - juncao (i) e (ii) */
              .out('-gravity', 'center')
              .out('-compose', 'over')
              .out('-composite')
              .out('-extent', `${width}x${height}`)

              .write(outputFile, (error) => {
                if (error) {
                  return reject(error)
              }

              console.log(`> sentence image created: ${outputFile}`)
              resolve()
            })
        })
    }

    async function createAllYouTubeThumbnails(movieContent) {
      const thumbnailModels = [
        path.normalize(`${__dirname}/../content/thumbnail-model-0.png`),
        path.normalize(`${__dirname}/../content/thumbnail-model-1.png`)
      ]

      for (let thumbnailId = 0; thumbnailId < thumbnailModels.length; thumbnailId++) {
          await createYouTubeThumbnail(movieContent.id, thumbnailId, thumbnailModels[thumbnailId])
      }
    }

    async function createYouTubeThumbnail(movieId, thumbnailId, thumbnailModel) {
        return new Promise((resolve, reject) => {
          const inputFile = path.normalize(`${__dirname}/../${settings.moviesPath}${movieId}/images/0-converted.jpg[0]`)
          const outputFile = path.normalize(`${__dirname}/../${settings.moviesPath}${movieId}/images/thumbnail-${thumbnailId}.jpg`)

          const width = settings.video.thumbnailSize.width
          const height = settings.video.thumbnailSize.height
          
          gm()
            
            /* (i) - imagem do filme */
            .out('(')
              .out(`${inputFile}`)
            .out(')')

            /* (ii) - imagem da legenda com fundo transparente */
            .out('(')
              .out(`${thumbnailModel}`)
              .out('-background', 'transparent')
            .out(')')
            
            /* (iii) - juncao (i) e (ii) */
            .out('-gravity', 'center')
            .out('-compose', 'over')
            .out('-composite')
            .out('-extent', `${width}x${height}`)

            .write(outputFile, (error) => {
              if (error) {
                return reject(error)
              }

              console.log(`> thumbnail image created: ${outputFile}`)
              resolve()
            })
         })
      }

    async function createVideos(movieContent) {
      const services = [
        'youtube',
        'twitch'
      ]

      for (let serviceId = 0; serviceId < services.length; serviceId++) {
        await createVideoWithFfmpeg(movieContent, services[serviceId])
      }
    }

    async function createVideoWithFfmpeg(movieContent, service) {
      return new Promise((resolve, reject) => {
        const inputFiles = path.normalize(`${__dirname}/../${settings.moviesPath}${movieContent.id}/images/%d-sentence-${service}.jpg`)
        const outputFile = path.normalize(`${__dirname}/../${settings.moviesPath}${movieContent.id}/video-${service}.mp4`)
        

        /* comando: ffmpeg -y -framerate 1/7 -i %20d-sentence-youtube.jpg -r 25 -pix_fmt yuv420p video-youtube.mp4 */

        console.log(`> starting FFMPEG for ${service}`)

        const render = spawn('ffmpeg', [
          '-y',
          '-framerate', `1/${settings.video.imageDuration}`,
          '-i', `${inputFiles}`,
          '-r', `${settings.video.frameRate}`,
          '-pix_fmt', 'yuv420p',
          `${outputFile}`
        ])

        render.stdout.on('data', (data) => {
          process.stdout.write(data)
        })

        /* 
        render.stderr.on('data', (data) => {
          console.log(`stderr: ${data}`);
        });
        */
  
        render.on('close', () => {
          console.log('> FFMPEG closed')
          resolve()
        })
      })
    }

    async function joinVideoWithVideoAfterMovie(movieContent) {
      if (!state.fileExists(path.normalize(`${__dirname}/../content/video-after-movie.mp4`))){
        await createVideoAfterMovie()
      } 
      
      const services = [
        'youtube',
        //'twitch'
      ]

      for (let serviceId = 0; serviceId < services.length; serviceId++) {
        await createTextFileWithVideoFiles(movieContent, services[serviceId])
        await joinVideos(movieContent, services[serviceId])
      }
    }

    async function createVideoAfterMovie() {
      return new Promise((resolve, reject) => {
        const inputFile = path.normalize(`${__dirname}/../content/caption-image-after.jpg`)
        const outputFile = path.normalize(`${__dirname}/../content/video-after-movie.mp4`)

        console.log(inputFile)
        

        /* comando: ffmpeg -y -framerate 1/120 -i ../content/caption-image-after.jpg -r 25 -pix_fmt yuv420p ../content/video-after-movie.mp4 */

        console.log(`> starting FFMPEG for video-after-movie`)

        const render = spawn('ffmpeg', [
          '-y',
          '-framerate', `1/63`,
          '-i', `${inputFile}`,
          '-r', `${settings.video.frameRate}`,
          '-pix_fmt', 'yuv420p',
          `${outputFile}`
        ])

        render.stdout.on('data', (data) => {
          process.stdout.write(data)
        })

        /*
        render.stderr.on('data', (data) => {
          console.log(`stderr: ${data}`);
        });
        */
        
  
        render.on('close', () => {
          console.log('> FFMPEG closed')
          resolve()
        })
      })
    }

    async function createTextFileWithVideoFiles(movieContent, service) {
      const brk = os.platform().substring(0,3).toLowerCase() === 'win' ? '\r\n' : '\n'
      var data = ''
      
      for (let i = 0; i < 2; i++){
        data += `file '${path.normalize(`${__dirname}/../${settings.moviesPath}${movieContent.id}/video-${service}.mp4`)}'${brk}`
      }

      const min = 131 /* +/- duas horas e 18 minutos */
      const max = 156 /* +/- duas horas e 42 minutos */
      const duration = Math.floor(Math.random() * (max - min) + min)
      
      for (let i = 0; i < duration; i++) {
        data += `file '${path.normalize(`${__dirname}/../content/video-after-movie.mp4`)}'${brk}` 
      }
      
      fs.writeFileSync(path.normalize(`${__dirname}/../content/files-to-join.txt`), data)
    }

    async function joinVideos(movieContent, service) {
      return new Promise((resolve, reject) => {
        const inputFile = path.normalize(`${__dirname}/../content/files-to-join.txt`)
        const outputFile = path.normalize(`${__dirname}/../${settings.moviesPath}${movieContent.id}/MOV-${randomString(10, 'aA#')}-${service}.mp4`)

        /* comando: ffmpeg -f concat -safe 0 -i files-to-join.txt -c copy video-final.mp4 */

        console.log(`> starting FFMPEG for join videos for ${service}`)

        const render = spawn('ffmpeg', [
          '-y',
          '-f', 'concat',
          '-safe', '0',
          '-i', `${inputFile}`,
          '-c', 'copy',
          `${outputFile}`
        ])

        render.stdout.on('data', (data) => {
          process.stdout.write(data)
        })

         /*
        render.stderr.on('data', (data) => {
          console.log(`stderr: ${data}`);
        });
        */
        
  
        render.on('close', () => {
          console.log('> FFMPEG closed')
          resolve()
        })
      })
    }

    function randomString(length, chars) {
      var mask = '';
      if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
      if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      if (chars.indexOf('#') > -1) mask += '0123456789';
      if (chars.indexOf('!') > -1) mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
      var result = '';
      for (var i = length; i > 0; --i) result += mask[Math.floor(Math.random() * mask.length)];
      return result;
    }

}

module.exports = robot