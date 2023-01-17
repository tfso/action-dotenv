# tfso/action-dotenv
A action for reading DotEnv file and expose the variables as environment variables. Ready to be used by your Github Actions

## Usage
Example of usage:

```yaml
- uses: tfso/action-dotenv@v1

- shell: bash
  run:
    echo ${{ env.MY-VAR-IN-DOTENV-FILE }}
```

### inputs
|name|required|default|description|
|---|---|---|---|
|path|false|.env|Path to the DotEnv file

### outputs
The output is dynamic related to the structure of the dotenv file
