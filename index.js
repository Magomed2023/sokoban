window.onload = async function() {
    const TILE_SIZE = 64;
    // prepare image urls as object to allow easy mapping
    const IMAGES = {
        '#': 'url(/assets/flat/wall.png)',
        '-': 'url(/assets/flat/floor.png)',
        '_': 'url(/assets/flat/grass.png)',
        '.': 'url(/assets/flat/target.png)',
        player: 'url(/assets/flat/player.png)',
        box: 'url(/assets/flat/box.png)',
    };

    // get select field so we cann fill it with options
    const levelSelect = document.getElementById('levelSelect');

    // get level count from API
    const levelsResponse = await fetch('/api/levels');
    const levels = await levelsResponse.json();

    for (let i = 0; i < levels.count; i += 1) {
        const option = document.createElement('option');
        option.value = i;
        option.innerText = `Level ${i + 1}`;
        levelSelect.appendChild(option);
    }

    // set initial value for level selector
    levelSelect.value = 0;

    // function to load a level
    async function loadLevel(levelId) {
        // get level from the server
        const response = await fetch(`/api/levels/${levelId}`);
        //  get json body from response
        const level = await response.json();

        // get playfield DOM element where we can insert level tiles
        const playfield = document.getElementById('playfield');

        // reserve space for the playfield so other elements will not overlap
        playfield.style.width = `${level.level[0].length * TILE_SIZE}px`;

        // clear playfield from previously loaded levels
        playfield.innerHTML = '';

        // function to draw a tile
        function drawTile(image, x, y) {
            // create div element
            const tile = document.createElement('div');
            // add class name for some basic styles
            tile.className = 'tile';
            // set size and position
            tile.style.width = `${TILE_SIZE}px`;
            tile.style.height = `${TILE_SIZE}px`;
            tile.style.top = `${y * TILE_SIZE}px`;
            tile.style.left = `${x * TILE_SIZE}px`;

            // set background image
            tile.style.backgroundImage = IMAGES[image];

            // add the tile to the DOM
            playfield.appendChild(tile);
            // return reference to the tile so it can be accessed later (e.g. to change the position)
            return tile;
        }

        // iterate over level lines
        for (let y = 0; y < level.level.length; y += 1) {
            // iterate over level characters
            for (let x = 0; x < level.level[y].length; x += 1) {
                // get character
                const char = level.level[y][x];

                // draw corresponding tile
                drawTile(char, x, y);
            }
        }

        // add player tile and store the reference
        level.player.tile = drawTile('player', level.player.x, level.player.y);

        // iterate over boxes, add their tiles and store references
        for (let box of level.boxes) {
            box.tile = drawTile('box', box.x, box.y);
        }

        // return modified level object so we can access positions, level data and tiles later
        return level;
    }

    // load a level and store a reference to a variable
    let level = await loadLevel(levelSelect.value);
    let score = 0;
    let scoreWithInvalidMoves = 0;
    let won = false;
    console.log(level);

    async function loadAndDisplayHighscores(scores) {
        let scoresToDisplay = scores;
        if (!scoresToDisplay) {
            const response = await fetch(`/api/scores/${levelSelect.value}`);
            scoresToDisplay = await response.json();
        }
        console.log('scoresToDisplay', scoresToDisplay);
        const scoresEl = document.getElementById('scores');
        scoresEl.innerHTML = '';
        scoresToDisplay.forEach((entry, i) => {
            const scoreEl = document.createElement('div');
            scoreEl.innerHTML = `<div>${i + 1}. ${entry.name}</div><div>${entry.score}</div>`;
            scoresEl.appendChild(scoreEl);
        });
    }

    loadAndDisplayHighscores();

    // event listener for level selector
    levelSelect.addEventListener('change', async () => {
        // load newly selected level and overwrite current level variable
        level = await loadLevel(levelSelect.value);
        loadAndDisplayHighscores();
        // reset scores
        score = 0;
        scoreWithInvalidMoves = 0;
        won = false;
        // reset html for scores and win message
        document.getElementById('score').innerText = score;
        document.getElementById('scoreWithInvalidMoves').innerText = scoreWithInvalidMoves;
        document.getElementById('winMessage').innerHTML = '';

        // make sure level selector looses focus, so we do not have to click away after changing level
        levelSelect.blur();
    });

    function checkAllTargetsHaveBoxes() {
        // iterate over level lines
        for (let y = 0; y < level.level.length; y += 1) {
            // iterate over level characters
            for (let x = 0; x < level.level[y].length; x += 1) {
                // get character
                const char = level.level[y][x];

                // check if char is a target
                if (char === '.') {
                    // search for a box at target
                    const box = level.boxes.find((element) => {
                        return element.x === x && element.y === y;
                    });
                    // if no box is found, level is not won
                    if (!box) {
                        return false;
                    }
                }
            }
        }
        // if we did not not find boxes at targets, level is won
        return true;
    }

    function checkAllBoxesOnTarget() {
        // iterate over all boxes
        for (const box of level.boxes) {
            // check level at box position if it is not target
            if (level.level[box.y][box.x] !== '.') {
                // when its not target, level is not won
                return false;
            }
        }
        // if targets were found at all box positions, level is won
        return true;
    }

    async function checkAndMovePlayer(target, potentialBoxTarget) {
        if (won) return;
        // inccrease score with invalid moves before checking anything
        scoreWithInvalidMoves += 1;
        // display score in html
        document.getElementById('scoreWithInvalidMoves').innerText = scoreWithInvalidMoves;

        // check if player can be moved
        if (level.level[target.y][target.x] === '#') {
            return;
        }

        // find a box at the player target position (if it exists)
        const box = level.boxes.find((element) => {
            return element.x === target.x && element.y === target.y;
        });

        // if we find a box, we have to check if it can be moved
        if (box) {
            // if there is a wall at the box target, we can not move
            if (level.level[potentialBoxTarget.y][potentialBoxTarget.x] === '#') {
                return;
            }

            // find another box at our box target
            const boxAtBoxTarget = level.boxes.find((element) => {
                return element.x === potentialBoxTarget.x && element.y === potentialBoxTarget.y;
            });

            // if there is another box behind our box, we can not move
            if (boxAtBoxTarget) {
                return;
            }

            // set new box position
            box.x = potentialBoxTarget.x;
            box.y = potentialBoxTarget.y;

            // update html element of box
            box.tile.style.left = `${box.x * TILE_SIZE}px`;
            box.tile.style.top = `${box.y * TILE_SIZE}px`;

            // check if player has won
            if (checkAllTargetsHaveBoxes() || checkAllBoxesOnTarget()) {
                won = true;
                document.getElementById('winMessage').innerHTML = 'You won!';
            }
        }

        // set new player position
        level.player.x = target.x;
        level.player.y = target.y;

        // update html element of player
        level.player.tile.style.left = `${level.player.x * TILE_SIZE}px`;
        level.player.tile.style.top = `${level.player.y * TILE_SIZE}px`;

        // increase score when movement was valid
        score += 1;
        // display score in html
        document.getElementById('score').innerText = score;

        if (won) {
            const response = await fetch(`/api/scores/${levelSelect.value}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: document.getElementById('username').value || 'Anonymous',
                    score,
                }),
            });

            const scores = await response.json();

            loadAndDisplayHighscores(scores);
            console.log(scores);
        }
    }

    document.getElementById('username').addEventListener('keydown', (event) => {
        event.stopPropagation();
    });

    // add keyboard event listener to handle user input
    document.addEventListener('keydown', (event) => {
        // move player depending on pressed key
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                checkAndMovePlayer(
                    { x: level.player.x, y: level.player.y - 1 }, // player target
                    { x: level.player.x, y: level.player.y - 2 }, // potential box target (if a box is in front of player)
                );
                break;
            case 'ArrowDown':
            case 'KeyS':
                checkAndMovePlayer(
                    { x: level.player.x, y: level.player.y + 1 },
                    { x: level.player.x, y: level.player.y + 2 },
                );
                break;
            case 'ArrowLeft':
            case 'KeyA':
                checkAndMovePlayer(
                    { x: level.player.x - 1, y: level.player.y },
                    { x: level.player.x - 2, y: level.player.y },
                );
                break;
            case 'ArrowRight':
            case 'KeyD':
                checkAndMovePlayer(
                    { x: level.player.x + 1, y: level.player.y },
                    { x: level.player.x + 2, y: level.player.y },
                );
                break;
            default:
                break;
        }
    });
}