var maze;
var start = true, end = true;

var edge_map = [];

// generates the visual board in html
function generate_board(dim) {
    // create the maze in memory
    maze = new Maze(dim);
    make_edge_Map(dim);

    $("#board").empty();
    var current_wall = 0;
    var current_square = 0;

    for(var i = 0; i < dim; i++) {
        // This is the div to hold the row of spacers and walls
        var wall_row = $("<div>", {class: "row row-walls"});

        for (var j = 0; j < dim; j++) {
            if (i === 0) {
                // if it's the very first row, then these need to be all red
                $(wall_row).append($("<div>", {class: "spacer"}), $("<div>", {class: "wall wall-horizontal red"}));
            } else {
                // otherwise the walls are grey, are assigned an ID, and get the function attached if they are clicked
                var wall = $("<div>", {class: "wall wall-horizontal", id: current_wall}).click(toggle);
                $(wall_row).append($("<div>", {class: "spacer"}), wall);
                current_wall++;
            }
        }
        // final spacer is added
        $(wall_row).append($("<div>", {class: "spacer"}));

        // This is the div to hold the row of walls and squares
        var wall_square = $("<div>", {class: "row row-squares"});

        for (var j = 0; j < dim; j++) {
            if (j === 0 && i === 0) {
                // The very first square defaults to start
                var square = $("<div>", {class: "square start", id: "s"+current_square}).click(toggle);
                $(wall_square).append($("<div>", {class: "wall wall-vertical red"}), square);                   

            } else if (j === 0) {
                // Otherwise just make sure the far left wall is red
                var square = $("<div>", {class: "square", id: "s"+current_square}).click(toggle)
                $(wall_square).append($("<div>", {class: "wall wall-vertical red"}), square);

            } else if (j === dim - 1 && i === dim - 1) {
                // The very last square defaults to exit
                var wall = $("<div>", {class: "wall wall-vertical", id: current_wall}).click(toggle);
                var square = $("<div>", {class: "square end", id: "s"+current_square}).click(toggle)
                $(wall_square).append(wall, square);
                current_wall++;

            } else {
                // Otherwise walls need to be grey, assigned an ID, and get the fucntion attached if they are clicked
                var wall = $("<div>", {class: "wall wall-vertical", id: current_wall}).click(toggle);
                var square = $("<div>", {class: "square", id: "s"+current_square}).click(toggle)
                $(wall_square).append(wall, square);
                current_wall++;
            }
            current_square++;
        }
        // final wall, it's perma red and non-clickable
        $(wall_square).append($("<div>", {class: "wall wall-vertical red"}));

        // add the two rows to the board
        $("#board").append(wall_row, wall_square)
    }

    // final row of spacers and walls here, identical to the very first row
    var final_row = $("<div>", {class: "row row-walls"});
    for(var i = 0; i < dim; i++) {
        $(final_row).append($("<div>", {class: "spacer"}), $("<div>", {class: "wall wall-horizontal red"}));
    }
    $(final_row).append($("<div>", {class: "spacer"}));
    $("#board").append(final_row);
}

// This function will handle all the clicks on the HTML elements
function toggle(event) {
    var target = event.currentTarget;
    var id = $(target).attr("id")

    if ($(target).hasClass("square")) {

        var index = parseInt(id.slice(1));

        if ($(target).hasClass("start")) {
            $(target).removeClass("start");
            start = false;

            maze.removeStart();

        } else if ($(target).hasClass("end")) {
            $(target).removeClass("end");
            end = false;

            maze.removeEnd();

        } else if (!start) {
            $(target).addClass("start");
            start = true;

            maze.addStart(index);

        } else if (!end) {
            $(target).addClass("end");
            end = true;

            maze.addEnd(index);

        } else {
            return;
        }
    } else {
        var index = parseInt(id);

        if ($(target).hasClass("red")) {
            $(target).removeClass("red");

            // add edge
            maze.addEdge(edge_map[index].a, edge_map[index].b);
        } else {
            $(target).addClass("red");

            // remove edge
            maze.removeEdge(edge_map[index].a, edge_map[index].b);
        }
    }
    console.log(maze.verify());
    if(maze.verify()) {
        toggle_ready_button(true);
    } else {
        toggle_ready_button(false);
    }
}

function Square(id) {

    // This holds the references to it's neighbors, we're going to start
    // with this not sorted in any way
    this.neighbors = new Array();
    var end = false;
    var start = false;

    // Creates an edge
    this.addNeighbor = function(neighbor) {
        this.neighbors.push(neighbor);
    }

    // Removes the edges, after checking if it exists
    this.removeNeighbor = function(neighbor) {
        var index = this.neighbors.indexOf(neighbor);
        if (index > -1) {
            this.neighbors.splice(index, 1);
        } else {
            console.log("danger!");
        }
    }

    // Returns true if there is an edge, false otherwise
    this.hasEdge = function(otherSquare) {
        return (this.neighbors.indexOf(otherSquare) > -1);
    }

    // Simple getter for the ID
    this.getId = function() {
        return id;
    }

    this.makeEnd = function() {
        end = true;
    }

    this.makeStart = function() {
        start = true;
    }

    this.removeEnd = function() {
        end = false;
    }

    this.removeStart = function() {
        start = false;
    }

    this.isEnd = function() {
        return end;
    }

    this.isStart = function() {
        return start;
    }
}

function Maze(dim) {
    // Maze object

    // Size refers to the how tall/wide it will be. I'm just going to assume
    // it will be a square for now
    var size = parseInt(dim);
    // console.log(size);
    var squares = new Array(size*size);
    var current;
    var start, end;


    // First, create each square object
    for (var i = 0; i < size*size; i++) {
        squares[i] = new Square(i);

        // Defaults for start and end square.
        if (i === 0) {
            squares[i].makeStart();
            start = squares[i];
        }
        if (i === (size*size)-1) {
            squares[i].makeEnd();
            end = squares[i];
        }
    }

    // Now we go through and set up the initial edges
    // Since each square starts off adjacent to each neighbor 
    for (var i = 0; i < size*size; i++) {

        // Check if the edge is on the right edge, as they don't have a friend to
        // their right if so
        if ((i+1) % size !== 0) {
            squares[i].addNeighbor(squares[i+1]);
            squares[i+1].addNeighbor(squares[i]);
        }

        // Check if the edge is on the bottom edge
        if (i < size*(size-1)) {
            squares[i].addNeighbor(squares[i+size]);
            squares[i+size].addNeighbor(squares[i]);
        }
    }

    this.removeStart = function() {
        start.removeStart();
        start = null;
    }

    this.removeEnd = function() {
        end.removeEnd();
        end = null;
    }

    this.addStart = function(index) {
        start = squares[index];
        start.makeStart();
    }

    this.addEnd = function(index) {
        end = squares[index];
        end.makeEnd();
    }

    this.removeEdge = function(a, b) {
        squares[a].removeNeighbor(squares[b]);
        squares[b].removeNeighbor(squares[a]);
    }

    this.addEdge = function(a, b) {
        squares[a].addNeighbor(squares[b]);
        squares[b].addNeighbor(squares[a]);
    }

    this.verify = function() {

        if (start === null || end === null) {
            return false;
        }

        var visited = new Array();
        for (var i = 0; i < size*size; i++) {
            visited[i] = false;
        }

        var stack = new Array();
        stack.push(start);

        while (stack.length > 0) {
            var current = stack.pop();
            visited[current.getId()] = true;

            if (current === end) {
                return true;
            }
            
            for (var i = 0; i < current.neighbors.length; i++) {
                if (!visited[current.neighbors[i].getId()]) {
                    stack.push(current.neighbors[i]);
                }
            }
        }
        return false;
    }
}

function make_edge_Map(dim) {
    var size = parseInt(dim);
    var total = 2 * (size * (size - 1));

    for (var i = 0; i < total; i++) {
        if (i < size - 1) {
            edge_map[i] = {a: i, b: i+1};
        } else {
            var row = parseInt((i - size + 1)/(size+size-1));
            var n = (i - size + 1)%(size+size-1);

            if (n < size) {
                edge_map[i] = {a: (row*size)+n, b: ((row+1)*size)+n};
            } else {
                var m = n - size;
                edge_map[i] = {a: ((row+1)*size)+m, b: ((row+1)*size)+m+1};
            }
        }
    }
}