const path = require('path')
const fs = require('fs')
const settings = require('../settings/general-settings.json')
const state = require('./state.js')


async function getCredentialJsonFile(neededCredits, currentCredential = null) {
    const credentialsList = state.load(__dirname + '/../credentials/google-youtube/credentialsCounter.json')
    await refreshCredentialsList(credentialsList)

    if (currentCredential != null && settings.youtubeApi.quota - verifyCredentialCreditsUsed(currentCredential) > neededCredits) {
        return currentCredential
    } 
    else {
        let nextCredential
        do {
            if (credentialsList.length > 0) {
                nextCredential = credentialsList.splice(0, 1)[0]
            }
            else 
                return null
        } while(settings.youtubeApi.quota - verifyCredentialCreditsUsed(nextCredential) < neededCredits)

        return nextCredential
    }
}
    
async function refreshCredentialsList(credentialsList) {
    return new Promise((resolve, reject) => {
        fs.readdir(__dirname + '/../credentials/google-youtube/', async function (err, files) {
            if (err) {
                console.log(`Error on directory scanning: ${err}`)
                reject(err)
            }
            
            files.forEach((file) => {
                if (!fileIsOnCredentialsList(file, credentialsList) && file != 'credentialsCounter.json') {
                    credentialsList.push({
                        fileName: file,
                        requests: []
                    })
                }
            })
        
            await state.save(credentialsList, __dirname + '/../credentials/google-youtube/credentialsCounter.json')

            resolve()
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
    const credentialsList = await state.load(__dirname + '/../credentials/google-youtube/credentialsCounter.json')
    await refreshCredentialsList(credentialsList)

    credentialsList.forEach((credential) => {
        if (credential.fileName.toString() == usedCredential.fileName.toString()) {
            credential.requests.push({
                cost: usedCredits,
                date: new Date()
            })
        }
    })
    
    await state.save(credentialsList, __dirname + '/../credentials/google-youtube/credentialsCounter.json')
}

module.exports = {
    getCredentialJsonFile,
    insertRequestInCredential
}
