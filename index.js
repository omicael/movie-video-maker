const robots = {
    settings: require('./settings/general-settings.json'),
    //userInput: require('./robots/user-input.js'),
    fetchMoviesList: require('./robots/fetch-movies-list.js'),
    state: require('./robots/state.js')
}


function start() {
    const moviesContent = []

    if (!robots.state.fileExists(robots.settings.moviesListFilePath)) {
        robots.fetchMoviesList(moviesContent, function(moviesContent) {  
            robots.state.save(moviesContent, robots.settings.moviesListFilePath)
            orchestrator(moviesContent)
        })
    } 
    else {
        orchestrator(robots.state.load(robots.settings.moviesListFilePath))
    }

    function orchestrator(moviesContent) {
        console.log(moviesContent)
    }
    
}

start()