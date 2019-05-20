const path = require('path')
const fs = require('fs')
const settings = require('../settings/general-settings.json')
const state = require('./state.js')


async function getCredentialJsonFile(neededCredits, currentCredential = null) {
    const credentialsList = state.load(__dirname + '/../credentials/google-youtube/credentialsCounter.json')
    await refreshCredentialsList(credentialsList)

    if (currentCredential != null && settings.youtubeApi.quota - verifyCredentialCreditsUsed(currentCredential) < neededCredits) {
        return currentCredential
    } 
    else {
        let randomCredential
        do {
            if (credentialsList.length > 0) {
                const randomNumber = Math.floor(Math.random() * (credentialsList.length))
                randomCredential = credentialsList.splice(randomNumber, 1)[0]
            }
            else 
                return null
        } while(settings.youtubeApi.quota - verifyCredentialCreditsUsed(randomCredential) < neededCredits)

        return randomCredential
    }
}
    
async function refreshCredentialsList(credentialsList) {
    return new Promise((resolve, reject) => {
        fs.readdir(__dirname + '/../credentials/google-youtube/', function (err, files) {
            if (err) {
                console.log(`Error on directory scanning: ${err}`)
                return reject(err)
            }
            
            files.forEach((file) => {
                if (!fileIsOnCredentialsList(file, credentialsList) && file != 'credentialsCounter.json') {
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

function fileIsOnCredentialsList(file, credentialsList) {
    for (let credentialNumber = 0; credentialNumber < credentialsList.length; credentialNumber++) {
        if (credentialsList[credentialNumber].fileName == file)
            return true
    }

    return false
}

function verifyCredentialCreditsUsed(credential) {
    let sumOfCosts = 0

    if (credential.requests) {
        credential.requests.forEach((request) => {
            const lastQuotaResets = new Date()
            if (lastQuotaResets.getHours() < settings.youtubeApi.timeQuotaResets) {
                lastQuotaResets.setDate(lastQuotaResets.getDate() - 1)
            }
            lastQuotaResets.setHours(04, 00, 00, 000)

            if (new Date(request.date) - lastQuotaResets > 0)
                sumOfCosts += request.cost
        })
    }

    return sumOfCosts
}

async function insertRequestInCredential(usedCredential, usedCredits) {
    const credentialsList = state.load(__dirname + '/../credentials/google-youtube/credentialsCounter.json')
    await refreshCredentialsList(credentialsList)

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

module.exports = {
    getCredentialJsonFile,
    insertRequestInCredential
}