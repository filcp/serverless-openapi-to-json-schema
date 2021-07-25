# Serverlerss OpenApi to Json Schema

This is a plugin meant to tackle the limitation AWS has when using schemas for body validation. It will resolve json Refs and strip the schema from unsupported tags like example, nullabble, etc.

To use it, just add your schema path to a function event under the `schemaPath` property.

```yaml
functions:
  sampleFunction:
    events:
      - http:
          schemaPath: path/to/schema/sample-file.yaml
```
