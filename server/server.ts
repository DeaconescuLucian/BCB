import express, { Request, Response } from 'express';
import axios, { AxiosResponse } from 'axios';

const cors = require('cors');
const app = express();
const port = 5000; 

app.use(express.json());

const corsOptions = {
  origin: 'http://localhost:3000',
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type'
};

app.use(cors(corsOptions));


async function fetchTokens(): Promise<any> {
  try {
    const response = await axios.get<any>('https://api.coincap.io/v2/assets', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios Error:', error.message);
    } else {
      console.error('Unexpected Error:', error);
    }
    throw error;
  }
}
app.get('/tokens', async (req: Request, res: Response) => {
  try {
    const tokens = await fetchTokens();
    res.json(tokens);
  } catch (error) {
    res.status(500).send('Failed to fetch tokens');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});