const robots = {
    settings: require('./settings/general-settings.json'),
    fetchMoviesList: require('./robots/fetch-movies-list.js'),
    fetchMovieLinks: require('./robots/fetch-movie-links.js'),
    state: require('./robots/state.js'),
    movie: require('./robots/movie.js'),
    image: require('./robots/image.js'),
    video: require('./robots/video.js'),
    youtube: require('./robots/youtube.js')
}


function start() {
    const moviesList = []
    const limits = {}
    const youtubeUser = {}

    /* gets limits from args */
    process.argv.length > 2 ? (limits.bottom = Math.ceil(process.argv[2])) : (limits.bottom = 0)
    process.argv.length > 3 ? (limits.upper = Math.ceil(process.argv[3])) : (limits.upper = Math.ceil(limits.bottom) + 1000)
    process.argv.length > 4 ? (youtubeUser.email = process.argv[4]) : (console.log('> enter with an email address'))

    if (!robots.state.fileExists(robots.settings.moviesPath + robots.settings.moviesListFilePath)) {
        console.log('> fetching movies list')
        robots.fetchMoviesList(moviesList, function(moviesList) {  
            robots.state.save(moviesList, robots.settings.moviesPath + robots.settings.moviesListFilePath)
            orchestrator(moviesList)
        })
    } 
    else {
        console.log('> loading movies list')
        orchestrator(robots.state.load(robots.settings.moviesPath + robots.settings.moviesListFilePath))
    }

    async function orchestrator(moviesList) {
        for(let cont = limits.bottom; cont < limits.upper; cont++) {
            console.log(`\n> movie nº ${cont}`)
            
            const movieContent = await robots.movie.fetchMovieInTMDB(moviesList[cont].id)
            //const movieContent = robots.movie.loadMovieData(moviesList[cont].id)
            await robots.fetchMovieLinks.fetchAndAskMovieLinks(movieContent)
            //await robots.image(movieContent)
            //await robots.video(movieContent)
            //await robots.youtube.uploadToYoutube(movieContent, youtubeUser)

            console.log('> done')
        }
    }
    
}

showOrDisableLogMessages(robots.settings.showLogMessages)
start()

function showOrDisableLogMessages (show) {
    if (!show)
        console.log = function () {}
}