const robots = {
    settings: require('./settings/general-settings.json'),
    //userInput: require('./robots/user-input.js'),
    fetchMoviesList: require('./robots/fetch-movies-list.js'),
    state: require('./robots/state.js'),
    movieRobot: require('./robots/movie-robot.js')
}


function start() {
    const moviesList = []

    if (!robots.state.fileExists(robots.settings.moviesPath + robots.settings.moviesListFilePath)) {
        robots.fetchMoviesList(moviesList, function(moviesList) {  
            robots.state.save(moviesList, robots.settings.moviesPath + robots.settings.moviesListFilePath)
            orchestrator(moviesList)
        })
    } 
    else {
        orchestrator(robots.state.load(robots.settings.moviesPath + robots.settings.moviesListFilePath))
    }

    async function orchestrator(moviesList) {
        const movieContent = await robots.movieRobot.fetchMovieInTMDB(moviesList[1].id)
        robots.movieRobot.saveMovieData(movieContent)
        
        console.log(movieContent)     
    }
    
}

start()