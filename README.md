# assets-checker
A Github Action to Analyse your static image files and warns if the size increase the threshold size. It check for .jpg, .svg, .png, .gif, .jpeg files. 


## Output Stats

### Success - 

### Failure - 


## Usage:

Checkout [action.yml](./action.yml)

Please check the below code for detailed usage:
```yaml
steps:
      - uses: bharatpe/assets-checker@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          target_folder: src/assets
          thrashold_size: 100
```

By default github actions work on `node 12`.For a specific node version use:

```yaml
- uses: actions/setup-node@v1
        with:
          node-version: '16.16.0'
```

**Ex:**
```yaml
steps:
      - uses: actions/setup-node@v1
        with:
          node-version: '16.16.0'
      - uses: bharatpe/assets-checker@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          target_folder: src/assets
          thrashold_size: 100

```

Also check [Demo.yml](./demo.yml) for complete configuration(on using github actions)

## License
The scripts and documentation in this project are released under the [MIT License](./LICENSE)
