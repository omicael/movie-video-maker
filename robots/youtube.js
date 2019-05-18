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

async function authenticateOnYoutube() {
    credentials()
    return

    await authenticateWithOAuth()
    
    async function authenticateWithOAuth() {
        const webServer = await startWebServer()
        const OAuthClient = await createOAuthClient()
        requestUserConsent(OAuthClient)
        const authorizationToken = await waitForGoogleCallback(webServer)
        await requestGoogleForAccessTokens(OAuthClient, authorizationToken)
        await setGlobalGoogleAuthentication(OAuthClient)
        await stopWebServer(webServer)

        async function startWebServer() {
            return new Promise((resolve, reject) => {
                const port = 5000
                const app = express()

                const server = app.listen(port, () => {
                    console.log(`> Listening on http://localhost:${port}`)

                    resolve({
                        app,
                        server
                    })
                })
            })
        }

        async function createOAuthClient() {
            const credentials = require('../credentials/google-youtube/marcela.jordana.porora-MusicJolt.json')

            const OAuthClient = new OAuth2(
                credentials.web.client_id,
                credentials.web.client_secret,
                credentials.web.redirect_uris[0]
            )

            return OAuthClient
        }

        function requestUserConsent(OAuthClient) {
            const consentUrl = OAuthClient.generateAuthUrl({
                access_type: 'offline',
                scope: ['https://www.googleapis.com/auth/youtube']
            })

            console.log(`> Please give your consent...`)
            opn(consentUrl, {app: ['chrome', '--incognito']}).then(cp => cp.unref())
        }

        async function waitForGoogleCallback(webServer) {
            return new Promise((resolve, reject) => {
                console.log(`> Waiting for user consent...`)

                webServer.app.get('/oauth2callback', (req, res) => {
                    const authCode = req.query.code
                    console.log(`> Consent given: ${authCode}`)
                    
                    res.send('<h1>Thank you!</h1><p>Now close this tab.</p>')
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

                    console.log(`> Access tokens received:`)
                    console.log(tokens)

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

async function uploadToYoutube(movieContent) {
    const videoInformation = await uploadVideo(movieContent)
    await uploadThumbnail(videoInformation, movieContent)

    async function uploadVideo(movieContent) {
        const videoFilePath = path.normalize(`${__dirname}/../${settings.moviesPath}${movieContent.id}/video-youtube.mp4`)
        const videoFileSize = fs.statSync(videoFilePath).size
        const videoTitle = `Titulo do vídeo ${movieContent.title}`
        const videoTags = ['a', 'b', 'c', 'd']
        const videoDescription = `Descricao: ${movieContent.overview}`

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

        console.log(youtubeResponse)
        console.log(`> Video available at: https://youtu.be/${youtubeResponse.data.id}`)
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


    async function uploadThumbnail(videoInformation, movieContent) {
        const videoId = videoInformation.id
        const videoThumbnailFilePath = path.normalize(`${__dirname}/../${settings.moviesPath}${movieContent.id}/images/thumbnail-0.jpg`)

        const requestParameters = {
            videoId: videoId,
            media: {
                mimeType: 'image/jpeg',
                body: fs.createReadStream(videoThumbnailFilePath)
            }
        }

        const youtubeResponse = await youtube.thumbnails.set(requestParameters)
        console.log(`> Thumbnail uploaded!`)
    }
}

module.exports = {
    authenticateOnYoutube,
    uploadToYoutube
}