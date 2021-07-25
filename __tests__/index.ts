import OpenApiToJsonSchemaPlugin from "../lib/index";
import Serverless from "serverless";

const serverless = new Serverless();
serverless.cli = {
    log: jest.fn(),
};

describe("OpenApiToJsonSchemaPlugin", () => {
    describe("Happy Path", () => {
        serverless.service.functions = {
            testFunction: {
                name: "testFunction",
                handler: "handler",
                events: [
                    {
                        http: {
                            path: "/endpoint/test/1",
                        },
                    },
                    {
                        http: {
                            path: "/endpoint/test/2",
                            schemaPath: "__tests__/samples/person.yml",
                        },
                    },
                    {
                        http: {
                            path: "/endpoint/test/3",
                            schemaPath: "__tests__/samples/schemaWithRef.yml",
                        },
                    },
                ],
            },
        };

        const openApiToJsonSchema = new OpenApiToJsonSchemaPlugin(serverless);
        let events: any[];
        let simpleSchema: any;
        let schemaWithRef: any;

        beforeEach(async () => {
            await openApiToJsonSchema.beforeDeploy();
            events = serverless.service.getAllEventsInFunction("testFunction");
            simpleSchema = events[1]?.http?.request?.schema
                ? events[1].http.request.schema["application/json"]
                : undefined;
            schemaWithRef = events[2]?.http?.request?.schema
                ? events[2].http.request.schema["application/json"]
                : undefined;
        });

        it("Should hook main method to before package initialization", async () => {
            expect(openApiToJsonSchema.hooks).toMatchObject({
                "before:package:initialize": openApiToJsonSchema.beforeDeploy(),
            });
        });

        it("Should skip events with no schemaPath property", () => {
            const eventWithNoSchema: any = events[0];
            expect(eventWithNoSchema.http.request).toBeUndefined();
        });

        it("Should parse and add simple schema to event request", () => {
            expect(simpleSchema).toBeDefined();
            expect(typeof simpleSchema).toBe("object");
        });

        it("Should remove unsupported tags", () => {
            const {
                properties: { firstName, middleName, lastName, birthDate },
            } = simpleSchema;
            expect(firstName.example).toBeUndefined();
            expect(middleName.example).toBeUndefined();
            expect(lastName.example).toBeUndefined();
            expect(birthDate.example).toBeUndefined();
            expect(middleName.nullable).toBeUndefined();
        });

        it("Should parse and resolve json refs", () => {
            expect(schemaWithRef).toBeDefined();
            expect(typeof simpleSchema).toBe("object");
            expect(schemaWithRef.properties.person.properties.firstName).toBeDefined();
        });
    });

    describe("Exceptions", () => {
        it("Should throw when schemaPath is not a string", async () => {
            serverless.service.functions.testFunction.events = [
                {
                    http: {
                        path: "/endpoint/test",
                        schemaPath: {},
                    },
                },
            ];
            const openApiToJsonSchema = new OpenApiToJsonSchemaPlugin(serverless);
            await expect(openApiToJsonSchema.beforeDeploy()).rejects.toThrowError("schemaPath must be a string");
        });

        it("Should throw when file defined in schemaPath doesn't exist", async () => {
            serverless.service.functions.testFunction.events = [
                {
                    http: {
                        path: "/endpoint/test",
                        schemaPath: "path/to/nowhere.yml",
                    },
                },
            ];
            const openApiToJsonSchema = new OpenApiToJsonSchemaPlugin(serverless);
            await expect(openApiToJsonSchema.beforeDeploy()).rejects.toThrowError(
                `Error opening file "${process.env.PWD}/path/to/nowhere.yml"`,
            );
        });
    });
});
