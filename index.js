// SERVER

import express from 'express';
const app = express();
const port = 8080;

app.use(express.static('public'));

app.listen(port, () => {
  console.log(`Sokoban server listening on port ${port}`)
});
