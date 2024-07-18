import Express, { json } from "express";
import { createServer, Server } from "http";
import { hostname, platform, type } from 'os';
import swaggerUi from "swagger-ui-express";
import { DefaultErrorHandler } from "./middleware/error-handler.middleware";
import { RegisterRoutes } from './routes/routes';
import { Log } from "./utility/Logging/Log";
import { requestLogMiddleware } from "./utility/Logging/log.middleware";

export const StartServer = async () => {
  // Récupérer le port des variables d'environnement ou préciser une valeur par défaut
  const PORT = process.env.PORT || 5055;

  // Créer l'objet Express
  const app = Express();

  // L'appli parse le corps du message entrant comme du json
  app.use(json());

  // Utiliser un middleware pour créer des logs
  app.use(requestLogMiddleware('req'));

  RegisterRoutes(app);

  // Ajouter une route qui sert la documentation swagger
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

  // Ajouter un handler pour les erreurs
  app.use(DefaultErrorHandler);

  // Demo endpoint pour retourner des infos du serveur
  app.get('/info', (req, res) => {
    res.json({
      title: "Security Code Samples API",
      host: hostname(),
      platform: platform(),
      type: type()
    });
  });

  app.get('/info', (req, res) => {
    res.json({
      title: "Security Code Samples API",
      familyName: "SONNA",
    });
  });

  // Lancer le serveur
  return new Promise<Server>(
    (resolve) => {
      const server = createServer(app);
      server.listen(PORT, () => {
        Log(`API Listening on port ${PORT}`)
        resolve(server);
      })
    }
  );
}

export const StopServer = async (server: Server | undefined) => {
  if (!server) { return; }
  return new Promise<void>(
    (resolve, reject) => {
      server.close(
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      )
    }
  );
}
