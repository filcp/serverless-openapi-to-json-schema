# Serverless OpenApi to Json Schema

Aws provides a really nice feature on API Gateways that allows us to validate requests using a json schema. This gives us the possibility of using the same json schema that we use for OpenAPI documentation as a base for this request validation. However, while AWS supports most of the OpenAPI 2.0 and 3.0 specifications, there are still some exceptions. For example, it doesn't support a few tags like example and nullable. Also, if you want to use a schema that references another file using json refs, it won't work.

This is a plugin meant to address some of these exceptions. 

**Requeriments**
- AWS provider
- Serverless v2.52.x or higher
- [serverless-reqvalidator-plugin](https://github.com/RafPe/serverless-reqvalidator-plugin#readme). This is because you need to tell api gateway to validate the body requests. Even though serverless-reqvalidator-plugin says the serverless-aws-documentation is required, using this plugin here will work the same way.

## How it works
During serverless deployment it will grab the schema selected for that endpoint, resolve any json refenrences and strip the schemas from unsupported tags. 

## Installation
Install via npm in the root of your Serverless service:

```
npm install --save-dev serverless-openapi-to-json-schema
```

Add the plugin to the plugins array in your Serverless serverless.yaml:

```yaml
plugins:
  - serverless-openapi-to-json-schema
```
## Usage

When you create an endpoint, inside the `http` object, just add the `schemaPath` property and add the path to the schema you want to be used to validate any requests coming via that endpoint.

```yaml
functions:
  sampleFunction:
    events:
      - http:
          schemaPath: path/to/schema/sample-file.yaml
```
