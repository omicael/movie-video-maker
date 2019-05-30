const readline = require('readline-sync')
const rp = require('request-promise')
const cheerio = require('cheerio')
const state = require('./state.js')
const settings = require('../settings/general-settings.json')
const path = require('path')

async function fetchAndAskMovieLinks(movieContent) {
    const linksFromSearch = await getListOfLinksFromSearch(movieContent.title)
    let portugueseLanguageLink = await askAndReturnLinkForMovie(linksFromSearch, 'portuguese')
    let originalLanguageLink = await askAndReturnLinkForMovie(linksFromSearch, 'original')

    portugueseLanguageLink = (portugueseLanguageLink != null) ? portugueseLanguageLink : 'http://ofilme.org'
    originalLanguageLink = (originalLanguageLink != null) ? originalLanguageLink : 'http://ofilme.org'

    const movieLinks = { links: { portuguese: portugueseLanguageLink, original: originalLanguageLink } }
    await saveMovieLinks(movieContent, movieLinks)

    async function getListOfLinksFromSearch(movieTitle) {
        const baseUrl = `http://ofilme.org`
        const searchUrl = `/?s=${movieTitle}`

        console.log(`> searching links on ofilme.org for ${movieTitle}`)

        const html = await rp(baseUrl + searchUrl)

        if (html.indexOf('<div class="no-result ') != -1){
            return ['http://ofilme.org']
        }
        else {
            const resultMovieLinksMap = cheerio('#contenedor > div.module > div.content.csearch > div > div.result-item', html).map(async (index, element) => {
                const resultSearchLink = element.children[0].children[1].children[0].children[0].attribs.href
                return resultSearchLink
            }).get()

            return Promise.all(resultMovieLinksMap)
        }
    }

    function askAndReturnLinkForMovie(linksFromSearch, language = 'portuguese') {
        const selectedLinkForMovieIndex = readline.keyInSelect(linksFromSearch, `> choose the link for movie language in ${language.toUpperCase()}`)
        const selectedLinkForMovie = linksFromSearch[selectedLinkForMovieIndex]

        return selectedLinkForMovie
    }

    async function saveMovieLinks(movieContent, movieLinks) {
        try {
            const originalMovieLinksList = await state.load(settings.moviesPath + settings.moviesLinksFilePath)
            const originalMovieLinks = originalMovieLinksList[movieContent.id]
            
            if (originalMovieLinks == null) {
                originalMovieLinksList[movieContent.id] = movieLinks
            }
            else {
                originalMovieLinks.links.portuguese = movieLinks.links.portuguese
                originalMovieLinks.links.original = movieLinks.links.original
            }
            
            await state.save(originalMovieLinksList, path.normalize(settings.moviesPath + settings.moviesLinksFilePath))
        }
        catch (err){
            if (err.code == 'ENOENT') {
                const movieLinksList = {}
                movieLinksList[movieContent.id] = movieLinks

                await state.save(movieLinksList, path.normalize(settings.moviesPath + settings.moviesLinksFilePath))
            }
            else {
                console.log(err)
            }
        }
    }
}

async function getMovieLinks(movieContent) {
    try {
        const movieLinksList = await state.load(settings.moviesPath + settings.moviesLinksFilePath)
        const movieLinks = movieLinksList[movieContent.id]
        
        return movieLinks
    }
    catch (err){
        if (err.code == 'ENOENT') {
            const defaultLinks = { links: { portuguese: `http://ofilme.org`, original: `http://ofilme.org` } }
        
            return defaultLinks
        }
        else {
            console.log(err)
        }
    }

}

module.exports = {
    fetchAndAskMovieLinks,
    getMovieLinks
}