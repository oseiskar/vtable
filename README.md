# Virtual tabletop in the browser

## Development

    npm install

#### Node version:

    npm run server
    # go to http://localhost:3000

#### Single-player no-backend version

    BACKEND=single npm run watch
    # open build/index.html in the browser

#### Firebase version

    BACKEND=firebase npm run watch
    # open build/index.html in the browser

## Deployment

#### Firebase version

    BACKEND=firebase npm run build
    firebase deploy

#### Node version

    BACKEND=node npm run build
    # TODO
