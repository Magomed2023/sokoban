window.onload = async function () {

    const TILE_SIZE = 32;
    const IMAGES = {
        '#': 'url(/assets/flat/wall.png)',
        '-': 'url(/assets/flat/floor.png)',
        '_': 'url(/assets/flat/grass.png)',
        '.': 'url(/assets/flat/target.png)',
        player: 'url(/assets/flat/player.png)',
        box: 'url(/assets/flat/box.png)',
    }


    const levelSelect = document.getElementById('levelSelect');

    const levelResponse = await fetch('/api/levels');
    const levels = await levelResponse.json();

    for (let i = 0; i < levels.count; i += 1) {
        const option = document.createElement('option');
        option.value = i;
        option.innerText = `level ${i + 1}`;
        levelSelect.appendChild(option);
    }

    levelSelect.value = 1;

    

    async function loadLevel(levelId) {
        const response = await fetch(`/api/levels/${levelId}`);
        const level = await response.json();

        const playfield = document.getElementById('playfield');
        playfield.innerHTML = '';

        playfield.style.width = `${level.level[0].length * TILE_SIZE}px`;

        function drawTile(image, x, y) {

            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.style.width = `${TILE_SIZE}px`;
            tile.style.height = `${TILE_SIZE}px`;
            tile.style.top = `${y * TILE_SIZE}px`;
            tile.style.left = `${x * TILE_SIZE}px`;

            tile.style.backgroundImage = IMAGES[image];

            playfield.appendChild(tile);
            return tile;
        }

        for (let y = 0; y < level.level.length; y += 1) {
            for (let x = 0; x < level.level[y].length; x += 1) {
                const char = level.level[y][x];

                drawTile(char, x, y);
            }
        }

        level.player.tile = drawTile('player', level.player.x, level.player.y);

        for (let box of level.boxes) {
            box.tile = drawTile('box', box.x, box.y);
        }

        console.log(level);
        return level;
    }

    

    let level = await loadLevel(levelSelect.value);
    let score = 0;
    let scoreWithInvalidMoves = 0;
    console.log(level);

    levelSelect.addEventListener('change', async () => {
       console.log(levelSelect.value);
       level = await loadLevel(levelSelect.value);
       score = 0;
       scoreWithInvalidMoves = 0;
       document.getElementById('score').innerText = score;
       document.getElementById('scoreWithInvalidMoves').innerText = scoreWithInvalidMoves;
       document.getElementById('winMessage').innerHTML = '';

       levelSelect.blur();

    });

    function checkAllTargetHaveBoxes() {
        for (let y = 0; y < level.level.length; y += 1) {
            for (let x = 0; x < level.level[y].length; x += 1) {
                const char = level.level[y][x];

                if (char === '.') {
                    const box = level.boxes.find((element) => {
                        return element.x === x && element.y === y;
                    });
                    if (!box) {
                        return false;
                    }
                    
                }
            }
        }
        return true;
    }

    function checkAllBoxesOnTarget() {
        for (const box of level.boxes) {
            if (level.level[box.y][box.x] !== '.') {
                return false
            }
        }
        return true;
    }

    function checkAndMovePlayer(target, potentialBoxTarget) {

        scoreWithInvalidMoves += 1;
        document.getElementById('scoreWithInvalidMoves').innerText = scoreWithInvalidMoves;

        // check if player can be moved
        if (level.level[target.y][target.x] === '#') {

            return;
        }

        const box = level.boxes.find((element) => {
            return element.x === target.x && element.y === target.y;
        });


        if (box) {
            if (level.level[potentialBoxTarget.y][potentialBoxTarget.x] === '#') {
                return;
            }

            const boxAtBoxTarget = level.boxes.find((element) => {
                return element.x === potentialBoxTarget.x && element.y === potentialBoxTarget.y;

            });

            if (boxAtBoxTarget) {
                return;
            }

            box.x = potentialBoxTarget.x;
            box.y = potentialBoxTarget.y;
            
        
            box.tile.style.left = `${box.x * TILE_SIZE}px`;
            box.tile.style.top = `${box.y * TILE_SIZE}px`;

            // check if player has won
            if (checkAllTargetHaveBoxes() || checkAllBoxesOnTarget()) {
                document.getElementById('winMessage').innerHTML = 'You won';
            }
            
            
        }

        checkAllBoxesOnTarget();
        checkAllTargetHaveBoxes();

        // set new player position
        level.player.x = target.x;
        level.player.y = target.y;
        
        // update html element of player
        level.player.tile.style.left = `${level.player.x * TILE_SIZE}px`;
        level.player.tile.style.top = `${level.player.y * TILE_SIZE}px`;

        score += 1;
        document.getElementById('score').innerText = score;
    }

    document.addEventListener('keydown', (event) => {
        console.log(event);

        switch (event.code) { //move player
            case 'ArrowUp':
            case 'KeyW':
                checkAndMovePlayer(
                    {x: level.player.x, y: level.player.y - 1},
                    {x: level.player.x, y: level.player.y - 2},
                    );
                break;

            case 'ArrowDown':
            case 'KeyS':
                checkAndMovePlayer(
                    {x: level.player.x, y: level.player.y + 1},
                    {x: level.player.x, y: level.player.y + 2},
                    );
                break;

            case 'ArrowLeft':
            case 'KeyA':
                checkAndMovePlayer(
                    {x: level.player.x - 1, y: level.player.y },
                    {x: level.player.x - 2, y: level.player.y },
                    ); 
                break;

            case 'ArrowRight':
            case 'KeyD':
                checkAndMovePlayer(
                    {x: level.player.x + 1, y: level.player.y },
                    {x: level.player.x + 2, y: level.player.y },
                    ); 
                break;

            default:
                break;
        }
    });
    
}