window.onload = function() {

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

            for (let y = 0; y < level.level.length; y += 1) {
                for (let x = 0; x < level.level[y].length; x += 1) {
                    const char = level.level[y][x];

                    const tile = document.createElement('div');
                    tile.className = 'tile';
                    tile.style.width = `${TILE_SIZE}px`;
                    tile.style.height = `${TILE_SIZE}px`;
                    tile.style.top = `${y * TILE_SIZE}px`;
                    tile.style.left = `${x * TILE_SIZE}px`;

                    tile.style.backgroundImage = IMAGES[char];

                    playfield.appendChild(tile);
                }
            }

            console.log(level);
    }

    loadLevel(2);

}