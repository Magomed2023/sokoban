// SERVER

import express from 'express';
import fs from 'node:fs/promises';

const levels = [];

const levelData = await fs.readFile('./assets/levels.txt', 'utf8');
// console.log(levelData);

function readLevelData() {
    
    // Schritt 1: levelData in einzelne Levels zerlegen

    const splitLevelData = levelData.split("\n\n");
    

    // Schritt 2: für jedes Level die Daten zeichen für zeichen durchgehen


    // und in gewünschte Struktur übertragen

    for (let singleLevelData of splitLevelData) {
        const level = {
            level: [],
            player: {},
            boxes: [],
        };

        const lines = singleLevelData.split('\n');
        for (let y = 0; y < lines.length; y += 1) {
            const line = [];
            for (let x = 0; x < lines[y].length; x += 1) {
                const char = lines[y][x];

                switch (char) {
                    case '@':
                        line.push('-');
                        level.player.x = x;
                        level.player.y = y;
            
                        break;

                    case '+':
                        line.push('.');
                        level.player.x = x;
                        level.player.y = y;
                        break;

                    case '$':
                        line.push('-');
                        level.boxes.push({x, y});
                        break;

                    case '*':
                        line.push('.');
                        level.boxes.push({x, y});
                        break;

                    default: //# . - _
                        line.push(char);
                        break;
                }
            }
            level.level.push(line);
        }
        levels.push(level);
    }
}
readLevelData();
console.log(levels[0]);

const app = express();
const port = 8080;

app.use(express.json());

app.get('/api/levels', (req, res) => {
    res.send({count: levels.length});
});

app.get('/api/levels/:levelId', (req, res) => {
    const levelId = req.params.levelId;
    res.send(levels[levelId]);
});

app.use(express.static('public'));

app.listen(port, () => {
  console.log(`Sokoban server listening on port ${port}`)
});
