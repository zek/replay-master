import type { ServiceSchema } from "moleculer";
import type { ApiSettingsSchema } from "moleculer-web";
import ApiGateway from "moleculer-web";

const ApiService: ServiceSchema<ApiSettingsSchema> = {
  name: "api",
  mixins: [ApiGateway],

  // More info about settings: https://moleculer.services/docs/0.14/moleculer-web.html
  settings: {
    // Exposed port
    port: process.env.PORT != null ? Number(process.env.PORT) : 3000,

    // Exposed IP
    ip: "0.0.0.0",

    // Global Express middlewares. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Middlewares
    use: [],

    routes: [
      {
        path: "/api",

        whitelist: ["**"],

        // Route-level Express middlewares. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Middlewares
        use: [],

        // Enable/disable parameter merging method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Disable-merging
        mergeParams: true,

        // Enable authentication. Implement the logic into `authenticate` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authentication
        authentication: false,

        // Enable authorization. Implement the logic into `authorize` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authorization
        authorization: false,

        // The auto-alias feature allows you to declare your route alias directly in your services.
        // The gateway will dynamically build the full routes from service schema.
        autoAliases: true,

        aliases: {},

        /**
         * Before call hook. You can check the request.
         *
         onBeforeCall(
         ctx: Context<unknown, Meta>,
         route: Route,
         req: IncomingRequest,
         res: GatewayResponse,
         ): void {
         // Set request headers to context meta
         ctx.meta.userAgent = req.headers["user-agent"];
         }, */

        /**
         * After call hook. You can modify the data.
         *
         onAfterCall(
         ctx: Context,
         route: Route,
         req: IncomingRequest,
         res: GatewayResponse,
         data: unknown,
         ): unknown {
         // Async function which return with Promise
         // return this.doSomething(ctx, res, data);
         return data;
         }, */

        // Calling options. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Calling-options
        callOptions: {},

        bodyParsers: {
          json: {
            strict: false,
            limit: "1MB",
          },
          urlencoded: {
            extended: true,
            limit: "1MB",
          },
        },

        // Mapping policy setting. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Mapping-policy
        mappingPolicy: "all", // Available values: "all", "restrict"

        // Enable/disable logging
        logging: true,
      },
    ],

    // Do not log client side errors (does not log an error response when the error.code is 400<=X<500)
    log4XXResponses: false,
    // Logging the request parameters. Set to any log level to enable it. E.g. "info"
    logRequestParams: null,
    // Logging the response data. Set to any log level to enable it. E.g. "info"
    logResponseData: null,

    // Serve assets from "public" folder. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Serve-static-files
    assets: {
      folder: "public",

      // Options to `server-static` module
      options: {},
    },
  },

  methods: {},
};

export default ApiService;
