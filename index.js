import express from 'express';
import bodyParser from 'body-parser';
import { statsRoute, activityRoute } from './lib/routes';

const PORT = 3000;

let app = express();
app.use(bodyParser.json());
app.get('/stats', statsRoute);
app.post('/activity', activityRoute);

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
