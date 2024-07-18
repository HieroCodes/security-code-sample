import Express, { json } from "express";
import { createServer, Server } from "http";
import swaggerUi from "swagger-ui-express";
import { DefaultErrorHandler } from "./middleware/error-handler.middleware";
import { RegisterRoutes } from './routes/routes';
import { Log } from "./utility/Logging/Log";
import { requestLogMiddleware } from "./utility/Logging/log.middleware";
import mysql from 'mysql2';

// Créer la connexion à la base de données
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT || '3306', 10)  // Convertir en nombre
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database.');
});

export const StartServer = async () => {
  const PORT = process.env.PORT || 5055;
  const app = Express();

  app.use(json());
  app.use(requestLogMiddleware('req'));

  RegisterRoutes(app);

  app.use(Express.static("public"));
  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(undefined, {
      swaggerOptions: {
        url: "/swagger.json",
      },
    })
  );

  app.use(DefaultErrorHandler);

  // Endpoint pour retourner des informations du serveur
  app.get('/info', (req, res) => {
    res.json({
      title: "Security Code Samples API",
      familyName: "SONNA",
    });
  });

  // Endpoint pour obtenir des utilisateurs de la base de données
  app.get('/user', (req, res) => {
    db.query('SELECT * FROM user', (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(results);
    });
  });

  return new Promise<Server>(
    (resolve) => {
      const server = createServer(app);
      server.listen(PORT, () => {
        Log(`API Listening on port ${PORT}`);
        resolve(server);
      });
    }
  );
}

export const StopServer = async (server: Server | undefined) => {
  if (!server) { return; }
  return new Promise<void>(
    (resolve, reject) => {
      server.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    }
  );
}
