const robots = {
    settings: require('./settings/general-settings.json'),
    //userInput: require('./robots/user-input.js'),
    fetchMoviesList: require('./robots/fetch-movies-list.js'),
    state: require('./robots/state.js'),
    movieRobot: require('./robots/movie-robot.js'),
    imageRobot: require('./robots/image.js')
}


function start() {
    const moviesList = []

    if (!robots.state.fileExists(robots.settings.moviesPath + robots.settings.moviesListFilePath)) {
        console.log('\nBuscando lista de filmes')
        robots.fetchMoviesList(moviesList, function(moviesList) {  
            robots.state.save(moviesList, robots.settings.moviesPath + robots.settings.moviesListFilePath)
            orchestrator(moviesList)
        })
    } 
    else {
        console.log('\nLendo lista de filmes')
        orchestrator(robots.state.load(robots.settings.moviesPath + robots.settings.moviesListFilePath))
    }

    async function orchestrator(moviesList) {
        cont = 1
        console.log('\nFilme nº ' + cont++)
        
        //const movieContent = await robots.movieRobot.fetchMovieInTMDB(moviesList[1].id)
        const movieContent = robots.movieRobot.loadMovieData(moviesList[1].id)
        await robots.imageRobot(movieContent)

        
    }
    
}

start()