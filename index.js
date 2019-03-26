const readline = require('readline-sync')

function start() {
    const operation = {}
    const content = {}

    operation.quantityOfMovies = askAndReturnQuantityOfMovies()
    operation.quantityOfImages = askAndReturnQuantityOfImages()
    

    
    function askAndReturnQuantityOfMovies(){
        return readline.questionInt('Type the quantity of movies you want to make: ')
    }

    function askAndReturnQuantityOfImages(){
        return readline.questionInt('Type the quantity of images: ')
    }

    console.log(operation)
}

start()