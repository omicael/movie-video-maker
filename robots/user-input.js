const readline = request('readline-sync')

function robot(moviesList) {
    operation.quantityOfMovies = askAndReturnQuantityOfMovies()
    operation.quantityOfImages = askAndReturnQuantityOfImages()
    
    
    function askAndReturnQuantityOfMovies(){
        return readline.questionInt('Type the quantity of movies you want to make: ')
    }

    function askAndReturnQuantityOfImages(){
        return readline.questionInt('Type the quantity of images: ')
    }
}

module.exports = robot