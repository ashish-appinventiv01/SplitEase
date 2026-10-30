
import "dotenv/config";
import { App } from "./app";
import { configuration } from "./config/configuration";

class Server {
  private readonly application: App;

  constructor() {
    this.application = new App();
  }

  public start(): void {
    this.application.app.listen(configuration.PORT, () => {
      console.log(
        `SplitEase API running on http://localhost:${configuration.PORT}`
      );
    });
  }
}

const server = new Server();
server.start();
