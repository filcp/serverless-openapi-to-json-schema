import toJsonSchema from "@openapi-contrib/openapi-schema-to-json-schema";
import Serverless from "serverless";
import $RefParser, { JSONSchema } from "@apidevtools/json-schema-ref-parser";

type FunctionEvent = {
    http: {
        path: string;
        schemaPath?: string;
        request?: any;
    };
};

class OpenApiToJsonSchemaPlugin {
    public serverless: Serverless;
    public hooks: any;
    private functionsNames: string[];

    constructor(serverless: Serverless) {
        this.serverless = serverless;
        this.functionsNames = serverless.service.getAllFunctions();
        this.hooks = {
            "before:package:initialize": this.beforeDeploy.bind(this),
        };

        serverless.configSchemaHandler.defineFunctionEventProperties("aws", "http", {
            properties: {
                schemaPath: { type: "string" },
            },
        });
    }

    public async beforeDeploy(): Promise<void> {
        await Promise.all(
            this.functionsNames.map(async (functionName: any): Promise<void> => {
                await Promise.all(await this.addSchemas(functionName));
            }),
        );
    }

    private async resolveSchemaRefs(schemaPath: string): Promise<JSONSchema> {
        return $RefParser.dereference(schemaPath);
    }

    private convertOpenApiToJsonSchema(openApiSchema: JSONSchema): JSONSchema {
        return toJsonSchema(openApiSchema);
    }

    private async addSchemas(functionName: string): Promise<Serverless.Event[]> {
        const functionEvents = this.serverless.service.getAllEventsInFunction(functionName) as FunctionEvent[];
        return functionEvents.map(async (event: FunctionEvent): Promise<void> => {
            const { path, schemaPath } = event?.http || {};

            if (!schemaPath) return;

            try {
                if (typeof schemaPath !== "string") throw new Error("schemaPath must be a string");

                this.serverless.cli.log(`Converting schema for ${path}`);

                const resolvedSchema = await this.resolveSchemaRefs(schemaPath);
                const jsonSchema = this.convertOpenApiToJsonSchema(resolvedSchema);

                event.http.request = { schema: { "application/json": jsonSchema } };
            } catch (error) {
                this.serverless.cli.log(`Error converting schema for ${path}`, undefined, { color: "orange" });
                throw error;
            }
        });
    }
}

export = OpenApiToJsonSchemaPlugin;
