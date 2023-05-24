# Assets Checker
A Github Action to Analyse your static image files on generating Pull Request and warns if the size increase the threshold size. It check for .jpg, .svg, .png, .gif, .jpeg files. 

## Install
```npm i```
or
```yarn install```

## Build
```
npm i @vercel/ncc -g
npm run build
```


## Output Stats

### Success - 
<img width="926" alt="Screenshot 2022-08-24 at 4 49 47 PM" src="https://user-images.githubusercontent.com/90181918/186406594-e63aadd4-90cd-47ef-a81c-55f3aa106b41.png">

### Failure - 

<img width="943" alt="Screenshot 2022-08-24 at 4 49 39 PM" src="https://user-images.githubusercontent.com/90181918/186406640-7766bf53-253d-4039-aa68-e244d40fd716.png">

### .assets-ignore file
Might be we have some images which size greater then the threshold we provided, in this case we can ignore these files by using .assets-ignore file.

#### .assets-ignore file must present inside the root directory of your repo :

<img width="300" alt="Screenshot 2022-08-24 at 4 49 39 PM" src="https://user-images.githubusercontent.com/61680562/240576818-7326f846-7d78-43e1-8b21-db96b9cb27a0.png">

#### The ignore assets name must be add as full path and separate - separate lines:
<img width="400" alt="Screenshot 2022-08-24 at 4 49 39 PM" src="https://user-images.githubusercontent.com/61680562/240576944-fdba0c9f-f349-4a1b-b9d5-adf569d73601.png">

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
