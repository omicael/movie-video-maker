const robots = {
    settings: require('./settings/general-settings.json'),
    //userInput: require('./robots/user-input.js'),
    fetchMoviesList: require('./robots/fetch-movies-list.js'),
    state: require('./robots/state.js'),
    movie: require('./robots/movie.js'),
    image: require('./robots/image.js'),
    video: require('./robots/video.js'),
    youtube: require('./robots/youtube.js')
}


function start() {
    const moviesList = []
    const limits = {}

    /* gets limits from args */
    process.argv.length > 2 ? (limits.bottom = Math.ceil(process.argv[2])) : (limits.bottom = 0)
    process.argv.length > 3 ? (limits.upper = Math.ceil(process.argv[3])) : (limits.upper = Math.ceil(limits.bottom) + 1000)

    if (!robots.state.fileExists(robots.settings.moviesPath + robots.settings.moviesListFilePath)) {
        console.log('\nFetching movies list')
        robots.fetchMoviesList(moviesList, function(moviesList) {  
            robots.state.save(moviesList, robots.settings.moviesPath + robots.settings.moviesListFilePath)
            orchestrator(moviesList)
        })
    } 
    else {
        console.log('\nLoading movies list')
        orchestrator(robots.state.load(robots.settings.moviesPath + robots.settings.moviesListFilePath))
    }

    async function orchestrator(moviesList) {
        // for(let cont = limits.bottom; cont < limits.upper; cont++) {
        //     console.log(`\nMovie nº ${cont}`)
            
        //     const movieContent = await robots.movie.fetchMovieInTMDB(moviesList[cont].id)
        //     //const movieContent = robots.movie.loadMovieData(moviesList[cont].id)
        //     await robots.image(movieContent)
        //     await robots.video(movieContent)
        //     //await robots.youtube(movieContent)
        // }
        const movieContent = robots.movie.loadMovieData(moviesList[2].id)
        const authorizationToken = await robots.youtube.authenticateOnYoutube()
        await robots.youtube.uploadToYoutube(movieContent)

        console.log('trying again')

        const movieContent2 = robots.movie.loadMovieData(moviesList[1].id)
        await robots.youtube.uploadToYoutube(movieContent2)

        await robots.youtube.uploadToYoutube(movieContent)
        await robots.youtube.uploadToYoutube(movieContent2)
        await robots.youtube.uploadToYoutube(movieContent)
        await robots.youtube.uploadToYoutube(movieContent2)
        await robots.youtube.uploadToYoutube(movieContent)
        await robots.youtube.uploadToYoutube(movieContent2)

        //console.log(movieContent)
    }
    
}

showOrDisableLogMessages(robots.settings.showLogMessages)
start()

function showOrDisableLogMessages (show) {
    if (!show)
        console.log = function () {}
}