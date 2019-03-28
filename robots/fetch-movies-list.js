const mysql = require('mysql')
const database = require('../credentials/database.json')

function robot(moviesContent, func) {
    const connection = mysql.createConnection(database)
    
    fetchMoviesListInDatabase(connection, func)
    

    function fetchMoviesListInDatabase(conn, func) {
        conn.query("SELECT id FROM movies ORDER BY popularity DESC", function(err, results, fields) {
            if (err) {
                console.log(err)
                return
            }

            conn.end()
            results.forEach((result) => {
                moviesContent.push({
                    id: result.id
                })
            })
            func(moviesContent)
        })
    }
}

module.exports = robot