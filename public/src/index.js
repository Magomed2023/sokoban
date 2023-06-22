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

    async function loadLevel(levelId) {
        const response = await fetch(`/api/levels/${levelId}`);
        const level = await response.json();

        const playfield = document.getElementById('playfield');

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

    const level = await loadLevel(2);

    document.addEventListener('keydown', (event) => {
        console.log(event);

        switch (event.code) { //move player
            case 'ArrowUp':
            case 'KeyW':
                level.player.y -= 1;
                level.player.tile.style.top = `${level.player.y * TILE_SIZE}px`; 
                break;

            case 'ArrowDown':
            case 'KeyS':
                level.player.y += 1;
                level.player.tile.style.top = `${level.player.y * TILE_SIZE}px`; 
                break;

            case 'ArrowLeft':
            case 'KeyA':
                level.player.x -= 1;
                level.player.tile.style.left = `${level.player.x * TILE_SIZE}px`; 
                break;

            case 'ArrowRight':
            case 'KeyD':
                level.player.x += 1;
                level.player.tile.style.left = `${level.player.x * TILE_SIZE}px`; 
                break;

            default:
                break;
        }
    });
}