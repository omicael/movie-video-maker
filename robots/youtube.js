const express = require('express')
const google = require('googleapis').google
const youtube = google.youtube({ version: 'v3' })
const OAuth2 = google.auth.OAuth2
const state = require('./state.js')
const fs = require('fs')
const path = require('path')
const settings = require('../settings/general-settings.json')
const opn = require('opn')
const credentials = require('./credentials.js')
const Nightmare = require('nightmare')
const youtubeAccountPassword = require('../credentials/google-youtube.json').password

async function uploadToYoutube(movieContent, youtubeUser) {
    let credentialForUse = { credential: null }
    await authenticateOnYoutube('uploadVideo', credentialForUse, youtubeUser)
    const videoInformation = await uploadVideo(movieContent, credentialForUse)
    await authenticateOnYoutube('uploadThumbnail', credentialForUse, youtubeUser)
    await uploadThumbnail(videoInformation, movieContent, credentialForUse)

    async function authenticateOnYoutube(service, credentialForUse, youtubeUser) {
        await authenticateWithOAuth(service, credentialForUse, youtubeUser)
        
        async function authenticateWithOAuth(service, credentialForUse, youtubeUser) {
            const webServer = await startWebServer()
            const OAuthClient = await createOAuthClient(service, credentialForUse)
            requestUserConsent(OAuthClient, youtubeUser)
            const authorizationToken = await waitForGoogleCallback(webServer)
            await requestGoogleForAccessTokens(OAuthClient, authorizationToken)
            await setGlobalGoogleAuthentication(OAuthClient)
            await stopWebServer(webServer)

            async function startWebServer() {
                return new Promise((resolve, reject) => {
                    const port = 5000
                    const app = express()

                    const server = app.listen(port, () => {
                        console.log(`> listening on http://localhost:${port}`)

                        resolve({
                            app,
                            server
                        })
                    })
                })
            }

            async function createOAuthClient(service, credentialForUse) {
                const neededCredits = settings.youtubeApi.neededCredits[service]
                credentialForUse.credential = await credentials.getCredentialJsonFile(neededCredits)
                if (credentialForUse.credential == null) {
                    console.log('< there is no more credentials available')
                    throw 'there is no more credentials available'
                }

                const credentialData = await state.load(path.normalize(`${__dirname}/../credentials/google-youtube/${credentialForUse.credential.fileName}`))
                
                const OAuthClient = new OAuth2(
                    credentialData.web.client_id,
                    credentialData.web.client_secret,
                    credentialData.web.redirect_uris[0]
                )

                return OAuthClient
            }

            function requestUserConsent(OAuthClient, youtubeUser) {
                const consentUrl = OAuthClient.generateAuthUrl({
                    access_type: 'offline',
                    scope: ['https://www.googleapis.com/auth/youtube']
                })
                
                console.log(`> please give your consent...`)
                loginAndConsent(consentUrl, youtubeUser)
                //opn(consentUrl, {app: ['chrome', '--incognito']}).then(cp => cp.unref())
            }

            async function loginAndConsent(consentUrl, youtubeUser) {
                const nightmare = Nightmare({ show: true, waitTimeout: 10000 })
                await nightmare
                        .goto(consentUrl)
                        .wait("#identifierId")
                        .type("#identifierId", youtubeUser.email)
                        .wait("#identifierNext")
                        .click("#identifierNext")
                        .wait("input[name='password']")
                        .wait(2000)
                        .type("input[name='password']", youtubeAccountPassword)
                        .wait("#passwordNext")
                        .click("#passwordNext")

                try {
                    await nightmare.wait("#thanks") //espera carregar a página localhost:5000/oauth2callback, se nao carregar é porque é a primeira vez que eu acesso com essa conta, então entro no catch
                    await nightmare.end()
                }
                catch (err) {
                    nightmare
                        .wait("div[data-custom-id='oauthScopeDialog-allow']")
                        .exists("div[data-custom-id='oauthScopeDialog-allow']")
                        .then((result) => {
                            if (result) {
                                return nightmare
                                    .click("div[data-custom-id='oauthScopeDialog-allow']")
                                    .wait("#submit_approve_access")
                                    .exists("#submit_approve_access")
                                    .then((result) => {
                                        if (result) {
                                            return nightmare
                                                .click("#submit_approve_access")
                                                .wait(2000)
                                                .end()
                                        }
                                    })
                            }
                            else {
                                return nightmare
                                    .end()
                            }    
                        })
                }
            }

            async function waitForGoogleCallback(webServer) {
                return new Promise((resolve, reject) => {
                    console.log(`> waiting for user consent...`)

                    webServer.app.get('/oauth2callback', (req, res) => {
                        const authCode = req.query.code
                        console.log(`> consent given: ${authCode}`)
                        
                        res.send('<h1 id="thanks">Thank you!</h1><p>Now close this tab.</p>')
                        resolve(authCode)
                    })
                })
            }

            async function requestGoogleForAccessTokens(OAuthClient, authorizationToken) {
                return new Promise((resolve, reject) => {
                    OAuthClient.getToken(authorizationToken, (error, tokens) => {
                        if (error) {
                            return reject(error)
                        }

                        console.log(`> access tokens received`)
                        
                        OAuthClient.setCredentials(tokens)
                        resolve()
                    })
                })
            }

            function setGlobalGoogleAuthentication(OAuthClient) {
                google.options({
                    auth: OAuthClient
                })
            }

            async function stopWebServer(webServer) {
                return new Promise((resolve, reject) => {
                    webServer.server.close(() => {
                        resolve()
                    })
                })
            }
        }
    }
   

    async function uploadVideo(movieContent, credentialForUse) {
        let videoFilePath = path.normalize(`${__dirname}/../${settings.moviesPath}${movieContent.id}/video-youtube.mp4`) // se não achar nenhum video longo continua nesse

        fs.readdirSync(path.normalize(`${__dirname}/../${settings.moviesPath}${movieContent.id}/`)).forEach(file => {
            if (file.indexOf('MOV') != -1 && file.indexOf('-youtube.mp4') != -1) {
                videoFilePath = path.normalize(`${__dirname}/../${settings.moviesPath}${movieContent.id}/${file}`)
            }
        })
        
        const videoFileSize = fs.statSync(videoFilePath).size
        const videoTitle = `FILME ${movieContent.genres[0].name.toUpperCase()} ${movieContent.title.toUpperCase()}`
        const videoTags = []
        const videoDescription = `Para assistir o FILME COMPLETO acesse o site: http://www.ofilme.org/ \n\n` +
                                  `Filme completo dublado e legendado em Full HD\n\n` +
                                  `Descricao: ${movieContent.overview}`

        const requestParameters = {
            part: 'snippet, status',
            requestBody: {
                snippet: {
                    title: videoTitle,
                    description: videoDescription,
                    tags: videoTags
                },
                status: {
                    privacyStatus: 'public'
                }
            },
            media: {
                body: fs.createReadStream(videoFilePath)
            }
        }

        const youtubeResponse = await youtube.videos.insert(requestParameters, {
            onUploadProgress: onUploadProgress
        })

        const neededCredits = settings.youtubeApi.neededCredits['uploadVideo']
        await credentials.insertRequestInCredential(credentialForUse.credential, neededCredits)
        removeVideoFile(videoFilePath)
        console.log(`> video available at: https://youtu.be/${youtubeResponse.data.id}`)
        return youtubeResponse.data

        function onUploadProgress(event) {
            const progress = Math.round( (event.bytesRead / videoFileSize) * 100 )
            if (process.stdout.isTTY) {
                process.stdout.clearLine()
                process.stdout.cursorTo(0)
                process.stdout.write(`> ${progress}% completed`)
            }
        }

    }

    function removeVideoFile(videoFile) {
        return new Promise((resolve, reject) => {
            fs.unlinkSync(videoFile, function (err) {
              if (err) {
                reject()
              }
            })
            resolve()
        })
    }

    async function uploadThumbnail(videoInformation, movieContent, credentialForUse) {
        const videoId = videoInformation.id
        const videoThumbnailFilePath = path.normalize(`${__dirname}/../${settings.moviesPath}${movieContent.id}/images/thumbnail-0.jpg`)

        const requestParameters = {
            videoId: videoId,
            media: {
                mimeType: 'image/jpeg',
                body: fs.createReadStream(videoThumbnailFilePath)
            }
        }

        const neededCredits = settings.youtubeApi.neededCredits['uploadThumbnail']
        await credentials.insertRequestInCredential(credentialForUse.credential, neededCredits)
        const youtubeResponse = await youtube.thumbnails.set(requestParameters)
        console.log(`> thumbnail uploaded!`)
    }
}

module.exports = {
    uploadToYoutube
}