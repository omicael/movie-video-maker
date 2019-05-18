const path = require('path')
const fs = require('fs')
const settings = require('../settings/general-settings.json')
const state = require('./state.js')


async function robot() {
    const credentialsList = state.load(__dirname + '/../credentials/google-youtube/credentialsCounter.json')
    await refreshListCredentials()
    
    async function refreshListCredentials() {
        return new Promise((resolve, reject) => {
            fs.readdir(__dirname + '/../credentials/google-youtube/', function (err, files) {
                if (err) {
                    console.log(`Error on directory scanning: ${err}`)
                    return reject(err)
                }
                
                files.forEach((file) => {
                    if (!fileIsOnCredentialsList(file) && file != 'credentialsCounter.json') {
                        credentialsList.push({
                            fileName: file,
                            requests: []
                        })
                    }
                })
            
                state.save(credentialsList, __dirname + '/../credentials/google-youtube/credentialsCounter.json')

                return resolve()
            })
        })
    }

    function fileIsOnCredentialsList(file) {
        for (let credentialNumber = 0; credentialNumber < credentialsList.length; credentialNumber++) {
            if (credentialsList[credentialNumber].fileName == file)
                return true
        }

        return false
    }


    async function getCredentialJsonFile(neededCredits) {
        let randomCredential
        do {
            if (credentialsList.length > 0) {
                const randomNumber = Math.floor(Math.random() * (credentialsList.length))
                randomCredential = credentialsList.splice(randomNumber, 1)
                console.log(`credencial sorteada: ${randomNumber} - ${randomCredential}`)
            }
            else 
                return 0
        } while(settings.youtubeApi.quota - verifyCredentialCreditsUsed(randomCredential) < neededCredits)

        return randomCredential
    }

    function verifyCredentialCreditsUsed(credential) {
        let sumOfCosts = 0
        if (credential.requests) {
            credential.requests.forEach((request) => {
                if (new Date(request.date).getHours() >= settings.youtubeApi.timeQuotaResets)
                    sumOfCosts += request.cost
            })
        }

        return sumOfCosts
    }

    function insertRequestInCredential(usedCredential, usedCredits) {
        credentialsList.forEach((credential) => {
            if (credential.fileName.toString() == usedCredential.fileName.toString()) {
                credential.requests.push({
                    cost: usedCredits,
                    date: new Date()
                })
            }
        })

        state.save(credentialsList, __dirname + '/../credentials/google-youtube/credentialsCounter.json')
    }
}

module.exports = robot